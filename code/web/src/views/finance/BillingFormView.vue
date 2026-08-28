<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createInvoice } from '@/api/finance';

const router = useRouter();

const form = reactive({
  applySource: '',
  buyerName: '',
  buyerTaxNo: '',
  amountWithTax: 0,
  invoiceType: 'normal',
  remark: '',
});
const submitting = ref(false);

async function submit() {
  submitting.value = true;
  try {
    const taxRate = 0.06;
    const amountWithTax = Number(form.amountWithTax);
    const amountWithoutTax = Math.round((amountWithTax / (1 + taxRate)) * 100) / 100;
    const taxAmount = Math.round((amountWithTax - amountWithoutTax) * 100) / 100;
    await createInvoice({
      applySource: form.applySource,
      buyerName: form.buyerName,
      buyerTaxNo: form.buyerTaxNo || undefined,
      amountWithoutTax,
      taxAmount,
      amountWithTax,
      remark: form.remark,
    });
    ElMessage.success('开票申请已提交');
    router.push('/finance/billing');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">开票申请</div>
        <div class="page-desc">提交发票申请</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/finance/billing')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">提交</button>
      </div>
    </div>

    <div class="card">
      <el-form :model="form" label-width="90px">
        <el-form-item label="开票项目" required>
          <el-input v-model="form.applySource" />
        </el-form-item>
        <el-form-item label="开票对象">
          <el-input v-model="form.buyerName" />
        </el-form-item>
        <el-form-item label="纳税人识别号">
          <el-input v-model="form.buyerTaxNo" />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="form.amountWithTax" :min="0" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="发票类型">
          <el-radio-group v-model="form.invoiceType">
            <el-radio label="normal">普票</el-radio>
            <el-radio label="special">专票</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.form-page { min-height: 100%; }
</style>