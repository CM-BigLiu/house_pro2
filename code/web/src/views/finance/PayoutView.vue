<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getPayouts, type Payout } from '@/api/finance';
import { useUserStore } from '@/stores/user';
import { formatMoney } from '@/utils/format';

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
    const res = await getPayouts();
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

function batchPay() {
  ElMessage.success('批量支付任务已提交');
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
        <button v-permission="['finance:export']" class="btn btn-default"><i data-lucide="download"></i> 导出</button>
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
                  <button class="btn btn-ghost btn-sm">查看</button>
                  <button class="btn btn-ghost btn-sm">明细</button>
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