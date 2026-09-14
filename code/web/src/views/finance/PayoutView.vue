<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { batchPayPayouts, getPayouts, type Payout } from '@/api/finance';
import { useUserStore } from '@/stores/user';
import { formatMoney } from '@/utils/format';
import { downloadCsv } from '@/utils/csv';

const router = useRouter();
void useUserStore;
const rows = ref<Payout[]>([]);
const loading = ref(false);
const query = reactive({ keyword: '', type: '', dateStart: '', dateEnd: '' });

const typeOptions = [
  { label: '全部', value: '' },
  { label: '拿房成本', value: 'rent_cost' },
  { label: '装修成本', value: 'decorate' },
  { label: '物业费', value: 'property' },
  { label: '能源费用', value: 'energy' },
  { label: '其他', value: 'other' },
];

// 汇总统计
const summaryData = computed(() => {
  const items = rows.value;
  const totalAmount = items.reduce((s, i) => s + Number(i.payoutAmount || 0), 0);
  const pendingCount = items.filter(i => i.status !== 'paid' && i.status !== 'done').length;
  const paidCount = items.filter(i => i.status === 'paid' || i.status === 'done').length;
  return { totalAmount, pendingCount, paidCount, totalCount: items.length };
});

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    const res = await getPayouts(query);
    rows.value = res.list || [];
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  loadData();
}

function onReset() {
  query.keyword = '';
  query.type = '';
  query.dateStart = '';
  query.dateEnd = '';
  loadData();
}

async function batchPay() {
  const ids = rows.value.filter(row => row.status === 'pending').map(row => row.id);
  if (!ids.length) return ElMessage.info('当前结果没有待支付记录');
  await ElMessageBox.confirm(`确认支付当前结果中的 ${ids.length} 笔待支付记录？`, '批量支付', { type: 'warning' });
  const result = await batchPayPayouts(ids);
  ElMessage.success(`已完成 ${result.count} 笔支付`);
  await loadData();
}

function exportCurrent() {
  downloadCsv('代付管理.csv', [
    ['批次号', '收款人', '银行', '卡号', '应付金额', '实付金额', '操作日期', '状态'],
    ...rows.value.map(row => [row.batchNo, row.accountName, row.bankName, row.bankCardNo, row.payableAmount, row.actualAmount, row.operateDate, statusLabel(row.status)]),
  ]);
  ElMessage.success('已导出当前结果');
}

function showDetails(row: Payout) {
  ElMessageBox.alert(`收款人：${row.accountName}\n银行：${row.bankName}\n卡号：${row.bankCardNo || '-'}\n应付：${formatMoney(row.payableAmount)}\n实付：${formatMoney(row.actualAmount)}`, row.batchNo || '代付详情');
}

function statusClass(status: string) {
  return status === 'paid' || status === 'done' ? 'pill-green' : 'pill-orange';
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待支付',
    downloaded: '已下载',
    paid: '已支付',
    done: '已完成',
  };
  return map[status] || status;
}
</script>

<template>
  <div class="finance-view">
    <div class="page-header">
      <div>
        <div class="page-title">支出管理</div>
        <div class="page-desc">租金成本、装修、物业等各项支出记录管理</div>
      </div>
      <div class="page-actions">
        <button v-permission="['finance:payout:create']" class="btn btn-primary" @click="router.push('/finance/payout/create')"><i data-lucide="plus"></i> 新增支出</button>
        <button v-permission="['finance:payout:batch']" class="btn btn-default" @click="batchPay"><i data-lucide="layers"></i> 批量支付</button>
        <button v-permission="['finance:export']" class="btn btn-default" @click="exportCurrent"><i data-lucide="download"></i> 导出</button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">日期范围</span>
        <input v-model="query.dateStart" type="date" class="input input-sm" @change="onSearch" />
        <span class="range-sep">~</span>
        <input v-model="query.dateEnd" type="date" class="input input-sm" @change="onSearch" />
      </div>
      <div class="filter-group">
        <span class="filter-label">类型</span>
        <select v-model="query.type" class="select" @change="onSearch">
          <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <div class="filter-group">
        <input v-model="query.keyword" class="input" placeholder="收款人/银行" @keyup.enter="onSearch" />
      </div>
      <div class="filter-group filter-actions">
        <button class="btn btn-primary btn-sm" @click="onSearch"><i data-lucide="search"></i> 筛选</button>
        <button class="btn btn-default btn-sm" @click="onReset"><i data-lucide="rotate-ccw"></i> 重置</button>
      </div>
    </div>

    <!-- 汇总条 -->
    <div class="summary-row">
      <span class="summary-chip">总支出 <strong>{{ formatMoney(summaryData.totalAmount) }}</strong></span>
      <span class="summary-chip">待支付 <strong>{{ summaryData.pendingCount }}</strong> 笔</span>
      <span class="summary-chip">已支付 <strong>{{ summaryData.paidCount }}</strong> 笔</span>
    </div>

    <!-- 数据表格 -->
    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>收款人</th>
              <th>银行</th>
              <th>卡号</th>
              <th>支出金额</th>
              <th>计划付款日</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody v-if="rows.length > 0">
            <tr v-for="row in rows" :key="row.id">
              <td>
                <div class="cell-main">{{ row.accountName || '-' }}</div>
              </td>
              <td>{{ row.bankName || '-' }}</td>
              <td>
                <span class="mono">{{ row.bankCardNo ? row.bankCardNo.slice(0,4) + '****' + row.bankCardNo.slice(-4) : '-' }}</span>
              </td>
              <td class="mono num-neg">{{ formatMoney(row.payoutAmount || 0) }}</td>
              <td>{{ row.operateDate || '-' }}</td>
              <td>
                <span :class="['pill', statusClass(row.status)]">{{ statusLabel(row.status) }}</span>
              </td>
              <td>
                <div class="operation-cell">
                  <button class="btn btn-ghost btn-sm" @click="showDetails(row)">查看</button>
                  <button class="btn btn-ghost btn-sm" @click="showDetails(row)">明细</button>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td :colspan="7" style="text-align: center; padding: 48px 0; color: var(--ink-400);">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.finance-view { min-height: 100%; }
.expense { color: var(--danger); font-weight: 700; }
</style>
