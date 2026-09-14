<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useDictStore } from '@/stores/dict';
import { getInvoices, type Invoice } from '@/api/finance';
import { requestStatusChange } from '@/api/approval';
import { downloadCsv } from '@/utils/csv';
import { formatMoney } from '@/utils/format';

const router = useRouter();
const dictStore = useDictStore();
const rows = ref<Invoice[]>([]);
const loading = ref(false);

onMounted(async () => {
  await dictStore.ensureLoaded(['ticket_status']);
  await loadData();
});

async function loadData() {
  loading.value = true;
  try {
    const res = await getInvoices();
    rows.value = res.list || [];
  } finally {
    loading.value = false;
  }
}

async function submitApproval(row: Invoice) {
  await requestStatusChange('invoice', row.id, 'processing', row.remark);
  ElMessage.success('审批申请已提交，请到审批中心处理');
  await loadData();
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    pending: 'pill-orange',
    processing: 'pill-blue',
    done: 'pill-green',
    rejected: 'pill-red',
  };
  return map[status] || 'pill-gray';
}

function invoiceTypeLabel(row: Invoice) {
  return row.buyerTaxNo ? '专票' : '普票';
}

function exportCurrent() {
  downloadCsv('开票管理.csv', [
    ['开票项目', '开票对象', '税号', '不含税金额', '税额', '价税合计', '状态'],
    ...rows.value.map(row => [row.applySource, row.buyerName, row.buyerTaxNo, row.amountWithoutTax, row.taxAmount, row.amountWithTax, dictStore.getLabel('ticket_status', row.status)]),
  ]);
  ElMessage.success('已导出当前结果');
}

function showDetails(row: Invoice) {
  ElMessageBox.alert(`开票对象：${row.buyerName}\n价税合计：${formatMoney(row.amountWithTax)}\n税额：${formatMoney(row.taxAmount)}\n备注：${row.remark || '-'}`, `发票 #${row.id}`);
}
</script>

<template>
  <div class="finance-view">
    <div class="page-header">
      <div>
        <div class="page-title">开票管理</div>
        <div class="page-desc">发票申请、审批、开票状态跟踪</div>
      </div>
      <div class="page-actions">
        <button v-permission="['finance:ticket:apply']" class="btn btn-primary" @click="router.push('/finance/billing/create')">开票申请</button>
        <button type="button" class="btn btn-default" v-permission="['finance:export']" @click="exportCurrent">导出</button>
      </div>
    </div>

    <el-table v-loading="loading" :data="rows" class="card">
      <el-table-column prop="applySource" label="开票项目" />
      <el-table-column prop="buyerName" label="开票对象" />
      <el-table-column prop="amountWithTax" label="金额">
        <template #default="{ row }">
          <span class="income">¥{{ Number(row.amountWithTax).toLocaleString() }}</span>
        </template>
      </el-table-column>
      <el-table-column label="发票类型">
        <template #default="{ row }">{{ invoiceTypeLabel(row) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <span :class="['pill', statusClass(row.status)]">{{ dictStore.getLabel('ticket_status', row.status) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <button class="btn btn-ghost btn-sm" type="button"
            v-permission="['finance:ticket:approve']"
            :disabled="row.status !== 'pending'"
            @click="submitApproval(row)"
          >提交审批</button>
          <button type="button" class="btn btn-ghost btn-sm" @click="showDetails(row)">详情</button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.finance-view { min-height: 100%; }
.income { color: var(--success); font-weight: 700; }
</style>
