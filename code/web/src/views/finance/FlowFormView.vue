<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createFlow, getFlowForEdit, updateFlow, type Flow } from '@/api/finance';
import { useDictStore } from '@/stores/dict';

const route = useRoute();
const router = useRouter();
const dictStore = useDictStore();
const editId = computed(() => Number(route.params.id) || 0);
const isEdit = computed(() => editId.value > 0);
const loading = ref(false);
const submitting = ref(false);
const form = reactive<Partial<Flow>>({ direction: 'income', amount: 0, paymentType: '', bizType: '', remark: '', occurredOn: '' });

onMounted(async () => {
  await dictStore.ensureLoaded(['payment_type', 'biz_type']);
  if (isEdit.value) {
    loading.value = true;
    try { Object.assign(form, await getFlowForEdit(editId.value)); }
    catch { router.push('/finance/daily-account'); }
    finally { loading.value = false; }
  }
});

async function submit() {
  if (!form.remark?.trim() || !form.direction || !form.amount || Number(form.amount) <= 0) return ElMessage.warning('请填写摘要、收支方向和有效金额');
  submitting.value = true;
  try {
    if (isEdit.value) await updateFlow(editId.value, form);
    else await createFlow(form);
    ElMessage.success(isEdit.value ? '保存成功' : '创建成功');
    router.push('/finance/daily-account');
  } finally { submitting.value = false; }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div><div class="page-title">{{ isEdit ? '编辑流水' : '记一笔' }}</div><div class="page-desc">仅未审核的待处理流水可编辑</div></div>
      <div class="page-actions"><button class="btn btn-default" @click="router.push('/finance/daily-account')">返回</button><button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button></div>
    </div>
    <div class="card" v-loading="loading" style="padding: 24px;">
      <el-form :model="form" label-width="90px">
        <el-form-item label="摘要" required><el-input v-model="form.remark" /></el-form-item>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="收支方向" required><el-radio-group v-model="form.direction"><el-radio value="income">收入</el-radio><el-radio value="expense">支出</el-radio></el-radio-group></el-form-item></el-col><el-col :span="12"><el-form-item label="业务类型"><el-select v-model="form.bizType" clearable style="width: 100%;"><el-option v-for="item in dictStore.getItems('biz_type')" :key="item.value" :label="item.label" :value="item.value" /><el-option label="房东租金" value="landlord_rent" /><el-option label="售房佣金" value="sale_commission" /><el-option label="押金" value="deposit" /><el-option label="其他" value="other" /></el-select></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="金额" required><el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%;" /></el-form-item></el-col><el-col :span="12"><el-form-item label="支付方式"><el-select v-model="form.paymentType" clearable style="width: 100%;"><el-option v-for="item in dictStore.getItems('payment_type')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col></el-row>
        <el-form-item label="发生日期"><el-date-picker v-model="form.occurredOn" type="date" value-format="YYYY-MM-DD" style="width: 100%;" /></el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>.form-page { min-height: 100%; }</style>
