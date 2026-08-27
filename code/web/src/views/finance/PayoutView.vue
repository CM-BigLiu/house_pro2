<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { getPayouts, createPayout, type Payout } from '@/api/finance';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const rows = ref<Payout[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const form = reactive({
  accountName: '',
  bankCardNo: '',
  bankName: '',
  payoutAmount: 0,
  operateDate: '',
});

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    const res = await getPayouts();
    rows.value = res.list || [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, { accountName: '', bankCardNo: '', bankName: '', payoutAmount: 0, operateDate: '' });
  dialogVisible.value = true;
}

async function submit() {
  const payload: Partial<Payout> = {
    ...form,
    storeId: userStore.userInfo?.storeIds?.[0] || 1,
    cardType: 'debit',
    payableAmount: form.payoutAmount,
    actualAmount: form.payoutAmount,
  };
  await createPayout(payload);
  ElMessage.success('代付任务已创建');
  dialogVisible.value = false;
  await loadData();
}

function batchPay() {
  ElMessage.success('批量代付任务已提交');
}

function maskCard(no?: string) {
  if (!no || no.length < 8) return no;
  return `${no.slice(0, 4)}****${no.slice(-4)}`;
}

function statusClass(status: string) {
  return status === 'paid' || status === 'done' ? 'pill-green' : 'pill-orange';
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待代付',
    downloaded: '已下载',
    paid: '已代付',
    done: '已代付',
  };
  return map[status] || status;
}
</script>

<template>
  <div class="finance-view">
    <div class="page-header">
      <div>
        <div class="page-title">代付管理</div>
        <div class="page-desc">房东、供应商批量代付任务管理</div>
      </div>
      <div class="page-actions">
        <el-button v-permission="['finance:payout:create']" type="primary" @click="openCreate">新增代付</el-button>
        <el-button v-permission="['finance:payout:batch']" type="primary" @click="batchPay">批量代付</el-button>
        <el-button v-permission="['finance:export']">导出</el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="rows" class="card">
      <el-table-column prop="accountName" label="代付任务" />
      <el-table-column prop="bankName" label="收款银行" />
      <el-table-column prop="bankCardNo" label="收款卡号">
        <template #default="{ row }">{{ maskCard(row.bankCardNo) }}</template>
      </el-table-column>
      <el-table-column prop="payoutAmount" label="代付金额">
        <template #default="{ row }">
          <span class="expense">¥{{ Number(row.payoutAmount).toLocaleString() }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="operateDate" label="计划付款日" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <span :class="['pill', statusClass(row.status)]">{{ statusLabel(row.status) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{}">
          <el-button size="small" type="primary" plain>明细</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="新增代付" width="520px">
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
        <el-form-item label="代付金额" required>
          <el-input-number v-model="form.payoutAmount" :min="0" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="计划付款日" required>
          <el-date-picker v-model="form.operateDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.finance-view { min-height: 100%; }
.expense { color: var(--danger); font-weight: 700; }
</style>
