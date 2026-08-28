<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useDictStore } from '@/stores/dict';
import { getInvoices, updateInvoice, type Invoice } from '@/api/finance';

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

async function approve(row: Invoice) {
  await updateInvoice(row.id, { status: 'done' });
  ElMessage.success('审批通过');
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
        <el-button v-permission="['finance:export']">导出</el-button>
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
          <el-button v-permission="['finance:ticket:approve']" size="small" type="primary" plain @click="approve(row)">审批</el-button>
          <el-button size="small">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.finance-view { min-height: 100%; }
.income { color: var(--success); font-weight: 700; }
</style>