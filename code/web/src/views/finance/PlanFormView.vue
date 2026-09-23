<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createPaymentPlan, getPaymentPlanForEdit, updatePaymentPlan, type PaymentPlan } from '@/api/finance';

const router = useRouter();
const route = useRoute();
const editId = computed(() => Number(route.params.id) || 0);
const isEdit = computed(() => editId.value > 0);
const loading = ref(false);

const form = reactive<Partial<PaymentPlan>>({
  planType: 'income', billingCategory: '', reason: '', totalPeriods: 1, totalAmount: 0,
});
const submitting = ref(false);

onMounted(async () => {
  if (!isEdit.value) return;
  loading.value = true;
  try { Object.assign(form, await getPaymentPlanForEdit(editId.value)); }
  catch { router.replace('/finance/plan'); }
  finally { loading.value = false; }
});

async function submit() {
  if (!form.planType) return ElMessage.warning('请选择计划类型');
  if (!form.billingCategory?.trim() && !form.reason?.trim()) return ElMessage.warning('请填写款项种类或原因');
  if (!form.totalPeriods || Number(form.totalPeriods) <= 0 || !form.totalAmount || Number(form.totalAmount) <= 0) return ElMessage.warning('总期数和总金额必须大于 0');
  submitting.value = true;
  try {
    if (isEdit.value) await updatePaymentPlan(editId.value, form);
    else await createPaymentPlan(form);
    ElMessage.success(isEdit.value ? '保存成功' : '创建成功');
    router.push('/finance/plan');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">{{ isEdit ? '编辑收支计划' : '新增收支计划' }}</div>
        <div class="page-desc">{{ isEdit ? '维护应收应支计划' : '创建应收应支计划' }}</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/finance/plan')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card" v-loading="loading">
      <el-form :model="form" label-width="90px">
        <el-form-item label="类型">
          <el-radio-group v-model="form.planType">
            <el-radio value="income">应收</el-radio>
            <el-radio value="expense">应支</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="款项种类">
          <el-input v-model="form.billingCategory" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="form.reason" />
        </el-form-item>
        <el-form-item label="总期数">
          <PlainNumberInput v-model="form.totalPeriods" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="总金额">
          <PlainNumberInput v-model="form.totalAmount" :min="0" :precision="2" style="width: 100%;" /><MoneyUppercase :value="form.totalAmount" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.form-page { min-height: 100%; }
</style>
