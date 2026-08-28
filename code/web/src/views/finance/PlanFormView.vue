<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createPaymentPlan, type PaymentPlan } from '@/api/finance';

const router = useRouter();

const form = reactive<Partial<PaymentPlan>>({
  planType: 'income', billingCategory: '', reason: '', totalPeriods: 1, totalAmount: 0,
});
const submitting = ref(false);

async function submit() {
  submitting.value = true;
  try {
    await createPaymentPlan(form);
    ElMessage.success('创建成功');
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
        <div class="page-title">新增收支计划</div>
        <div class="page-desc">创建应收应支计划</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/finance/plan')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card">
      <el-form :model="form" label-width="90px">
        <el-form-item label="类型">
          <el-radio-group v-model="form.planType">
            <el-radio label="income">应收</el-radio>
            <el-radio label="expense">应支</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="款项种类">
          <el-input v-model="form.billingCategory" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="form.reason" />
        </el-form-item>
        <el-form-item label="总期数">
          <el-input-number v-model="form.totalPeriods" :min="1" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="总金额">
          <el-input-number v-model="form.totalAmount" :min="0" :precision="2" controls-position="right" style="width: 100%;" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.form-page { min-height: 100%; }
</style>