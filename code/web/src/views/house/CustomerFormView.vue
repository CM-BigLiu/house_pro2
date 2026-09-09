<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { createCustomer, getCustomerForEdit, updateCustomer, type Customer } from '@/api/customer';
import { checkBlacklist } from '@/api/blacklist';
import { useDictStore } from '@/stores/dict';

const route = useRoute();
const router = useRouter();
const dictStore = useDictStore();
const submitting = ref(false);
const loading = ref(false);
const editId = computed(() => Number(route.params.id) || 0);
const isEdit = computed(() => editId.value > 0);
const form = reactive<Partial<Customer>>({
  name: '', mobile: '', idCard: '', customerType: 'tenant', status: 'active',
  sourceChannel: '', relatedPropertyCode: '', contractEndDate: '', desiredDistrict: '',
  budgetMin: undefined, budgetMax: undefined, remark: '',
});

onMounted(async () => {
  await dictStore.ensureLoaded(['identity', 'source_channel']);
  if (isEdit.value) {
    loading.value = true;
    try { Object.assign(form, await getCustomerForEdit(editId.value)); }
    catch { router.push('/house/customer'); }
    finally { loading.value = false; }
  }
});

async function checkCustomerBlacklist() {
  if (!form.mobile || form.mobile.length < 7) return;
  const hit = ((await checkBlacklist(form.mobile, form.idCard || undefined)) || [])[0];
  if (hit) {
    ElMessageBox.confirm(`该客户命中黑名单：${hit.name}\n原因：${hit.reason}\n来源：${hit.source || '系统录入'}`, '黑名单预警', {
      confirmButtonText: '继续保存（需特批）', cancelButtonText: '取消', type: 'warning',
    }).catch(() => { form.mobile = ''; });
  }
}

async function submit() {
  if (!form.name?.trim() || !form.mobile?.trim() || !form.customerType) return ElMessage.warning('请填写姓名、电话和客户类型');
  if (form.budgetMin != null && form.budgetMax != null && Number(form.budgetMin) > Number(form.budgetMax)) return ElMessage.warning('最低预算不能高于最高预算');
  submitting.value = true;
  try {
    const payload = { ...form };
    if (!payload.contractEndDate) delete payload.contractEndDate;
    if (isEdit.value) await updateCustomer(editId.value, payload);
    else await createCustomer(payload);
    ElMessage.success(isEdit.value ? '保存成功' : '创建成功');
    router.push('/house/customer');
  } finally { submitting.value = false; }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div><div class="page-title">{{ isEdit ? '编辑客户' : '新增客源' }}</div><div class="page-desc">维护客户身份、联系信息和需求资料</div></div>
      <div class="page-actions"><button class="btn btn-default" @click="router.push('/house/customer')">返回</button><button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button></div>
    </div>
    <div class="card" style="padding: 24px;" v-loading="loading">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="姓名" required><el-input v-model="form.name" /></el-form-item></el-col><el-col :span="12"><el-form-item label="电话" required><el-input v-model="form.mobile" @blur="checkCustomerBlacklist" /></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="客户类型" required><el-select v-model="form.customerType" style="width: 100%;"><el-option label="租客" value="tenant" /><el-option label="买家" value="buyer" /><el-option label="业主" value="landlord" /></el-select></el-form-item></el-col><el-col :span="12"><el-form-item label="状态"><el-select v-model="form.status" style="width: 100%;"><el-option label="有效" value="active" /><el-option label="已成交" value="done" /><el-option label="已失效" value="invalid" /><el-option label="黑名单" value="blacklist" /></el-select></el-form-item></el-col></el-row>
        <el-form-item label="身份证"><el-input v-model="form.idCard" /></el-form-item>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="来源"><el-select v-model="form.sourceChannel" clearable style="width: 100%;"><el-option v-for="item in dictStore.getItems('source_channel')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col><el-col :span="12"><el-form-item label="期望区域"><el-input v-model="form.desiredDistrict" /></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="预算下限"><el-input-number v-model="form.budgetMin" :min="0" style="width: 100%;" /></el-form-item></el-col><el-col :span="12"><el-form-item label="预算上限"><el-input-number v-model="form.budgetMax" :min="0" style="width: 100%;" /></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="合同/房源编号"><el-input v-model="form.relatedPropertyCode" /></el-form-item></el-col><el-col :span="12"><el-form-item label="合同到期日"><el-date-picker v-model="form.contractEndDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" /></el-form-item></el-col></el-row>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>.form-page { min-height: 100%; }</style>
