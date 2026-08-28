<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createPayout, type Payout } from '@/api/finance';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const form = reactive({
  accountName: '',
  bankCardNo: '',
  bankName: '',
  payoutAmount: 0,
  operateDate: '',
});
const submitting = ref(false);

async function submit() {
  submitting.value = true;
  try {
    const payload: Partial<Payout> = {
      ...form,
      storeId: userStore.userInfo?.storeIds?.[0] || 1,
      cardType: 'debit',
      payableAmount: form.payoutAmount,
      actualAmount: form.payoutAmount,
    };
    await createPayout(payload);
    ElMessage.success('支出记录已创建');
    router.push('/finance/payout');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">新增支出</div>
        <div class="page-desc">创建支出记录</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/finance/payout')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card">
      <el-form :model="form" label-width="100px">
        <el-form-item label="收款户名" required>
          <el-input v-model="form.accountName" />
        </el-form-item>
        <el-form-item label="收款银行" required>
          <el-input v-model="form.bankName" />
        </el-form-item>
        <el-form-item label="收款卡号">
          <el-input v-model="form.bankCardNo" />
        </el-form-item>
        <el-form-item label="支出金额" required>
          <el-input-number v-model="form.payoutAmount" :min="0" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="计划付款日" required>
          <el-date-picker v-model="form.operateDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.form-page { min-height: 100%; }
</style>