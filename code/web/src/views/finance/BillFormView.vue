<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createBill, getBillForEdit, updateBill, type Bill } from '@/api/finance';
import { useDictStore } from '@/stores/dict';

const route = useRoute();
const router = useRouter();
const dictStore = useDictStore();
const submitting = ref(false);
const loading = ref(false);
const editId = computed(() => Number(route.params.id) || 0);
const isEdit = computed(() => editId.value > 0);
const form = reactive<Partial<Bill>>({
  bizType: 'rent', bizId: '', billSource: '', payer: '', payee: '', dueDate: '', amount: 0,
  paymentCount: '', billPeriod: '', overdueFee: 0, roomCode: '',
});

onMounted(async () => {
  await dictStore.ensureLoaded(['billing_category', 'biz_type']);
  if (isEdit.value) {
    loading.value = true;
    try { Object.assign(form, await getBillForEdit(editId.value)); }
    catch { router.push('/finance/bill'); }
    finally { loading.value = false; }
  }
});

async function submit() {
  if (!form.bizType || !form.billSource || !form.dueDate || !form.amount || Number(form.amount) <= 0) return ElMessage.warning('请填写业务类型、款项种类、到期日和有效金额');
  submitting.value = true;
  try {
    if (isEdit.value) await updateBill(editId.value, form);
    else await createBill(form);
    ElMessage.success(isEdit.value ? '保存成功' : '创建成功');
    router.push('/finance/bill');
  } finally { submitting.value = false; }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div><div class="page-title">{{ isEdit ? '编辑账单' : '新增账单' }}</div><div class="page-desc">字段与账单数据模型一致；收付款状态不在编辑页直接变更</div></div>
      <div class="page-actions"><button class="btn btn-default" @click="router.push('/finance/bill')">返回</button><button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button></div>
    </div>
    <div class="card" v-loading="loading" style="padding: 24px;">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="业务类型" required><el-select v-model="form.bizType" style="width: 100%;"><el-option label="租房" value="rent" /><el-option label="售房" value="sale" /><el-option label="其他" value="other" /></el-select></el-form-item></el-col><el-col :span="12"><el-form-item label="业务编号"><el-input v-model="form.bizId" placeholder="合同/业务编号" /></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="款项种类" required><el-select v-model="form.billSource" style="width: 100%;"><el-option v-for="item in dictStore.getItems('billing_category')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col><el-col :span="12"><el-form-item label="房间编号"><el-input v-model="form.roomCode" /></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="付款方"><el-input v-model="form.payer" /></el-form-item></el-col><el-col :span="12"><el-form-item label="收款方"><el-input v-model="form.payee" /></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="金额" required><el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%;" /></el-form-item></el-col><el-col :span="12"><el-form-item label="逾期费"><el-input-number v-model="form.overdueFee" :min="0" :precision="2" style="width: 100%;" /></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="到期日" required><el-date-picker v-model="form.dueDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" /></el-form-item></el-col><el-col :span="12"><el-form-item label="账期"><el-input v-model="form.billPeriod" placeholder="如：2026-09" /></el-form-item></el-col></el-row>
        <el-form-item label="期次"><el-input v-model="form.paymentCount" placeholder="如：第1期/共12期" /></el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>.form-page { min-height: 100%; }</style>
