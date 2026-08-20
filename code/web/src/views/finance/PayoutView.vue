<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

const rows = ref([
  { id: 1, title: '房东代付-7月', amount: 150000, count: 12, status: 'pending', payDate: '2026-08-05', bankCard: '6222********1234' },
  { id: 2, title: '供应商代付-6月', amount: 86000, count: 5, status: 'done', payDate: '2026-07-05', bankCard: '6225********5678' },
]);

function batchPay() {
  ElMessage.success('批量代付任务已提交');
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
        <el-button v-permission="['finance:payout:batch']" type="primary" @click="batchPay">批量代付</el-button>
        <el-button v-permission="['finance:export']">导出</el-button>
      </div>
    </div>

    <el-table :data="rows" class="card">
      <el-table-column prop="title" label="代付任务" />
      <el-table-column prop="count" label="笔数" />
      <el-table-column prop="amount" label="代付金额">
        <template #default="{ row }">
          <span class="expense">¥{{ row.amount.toLocaleString() }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="bankCard" label="收款卡号" />
      <el-table-column prop="payDate" label="计划付款日" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <span :class="['pill', row.status === 'done' ? 'pill-green' : 'pill-orange']">{{ row.status === 'done' ? '已代付' : '待代付' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{}">
          <el-button size="small" type="primary" plain>明细</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.finance-view { min-height: 100%; }
.expense { color: var(--danger); font-weight: 700; }
</style>
