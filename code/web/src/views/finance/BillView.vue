<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getBills, type Bill } from '@/api/finance';
import { useDictStore } from '@/stores/dict';
import { formatMoney } from '@/utils/format';

const router = useRouter();
const dictStore = useDictStore();
const list = ref<Bill[]>([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const query = reactive({
  keyword: '',
  status: '',
  category: '',
  storeId: '',
  userId: '',
  dateStart: '',
  dateEnd: '',
});
const activeTab = ref('');

// 状态标签配置
const statusTabs = [
  { key: '', label: '全部', count: 0 },
  { key: 'pending', label: '待缴' },
  { key: 'paid', label: '已缴' },
  { key: 'overdue', label: '逾期' },
  { key: 'cancelled', label: '已作废' },
];

// 账单类型选项
const categoryOptions = [
  { label: '全部', value: '' },
  { label: '租金', value: 'rent' },
  { label: '物业费', value: 'property' },
  { label: '水费', value: 'water' },
  { label: '电费', value: 'electricity' },
  { label: '燃气费', value: 'gas' },
  { label: '其他', value: 'other' },
];

// 模拟的汇总统计
const summaryStats = computed(() => {
  const items = list.value;
  const totalReceivable = items.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalReceived = items.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0);
  const pending = items.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount || 0), 0);
  const overdue = items.filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.amount || 0), 0);
  return { totalReceivable, totalReceived, pending, overdue };
});

onMounted(async () => {
  await dictStore.ensureLoaded(['billing_category']);
  await load();
});

async function load() {
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: pageSize.value };
    if (query.keyword) params.keyword = query.keyword;
    if (activeTab.value) params.status = activeTab.value;
    if (query.category) params.category = query.category;
    if (query.storeId) params.storeId = query.storeId;
    if (query.userId) params.userId = query.userId;
    if (query.dateStart) params.dateStart = query.dateStart;
    if (query.dateEnd) params.dateEnd = query.dateEnd;
    const res = await getBills(params);
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function onTabChange(tabKey: string) {
  activeTab.value = tabKey;
  page.value = 1;
  load();
}

function onSearch() {
  page.value = 1;
  load();
}

function onReset() {
  query.keyword = '';
  query.category = '';
  query.storeId = '';
  query.userId = '';
  query.dateStart = '';
  query.dateEnd = '';
  activeTab.value = '';
  page.value = 1;
  load();
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    pending: 'pill-orange',
    paid: 'pill-green',
    overdue: 'pill-red',
    cancelled: 'pill-gray',
  };
  return map[status] || 'pill-gray';
}

const statusLabelMap: Record<string, string> = {
  pending: '待缴',
  paid: '已缴',
  overdue: '逾期',
  cancelled: '已作废',
};

function goPage(p: number) {
  page.value = p;
  load();
}

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));

const pageNumbers = computed(() => {
  const pages: number[] = [];
  const tp = totalPages.value;
  const cp = page.value;
  let start = Math.max(1, cp - 2);
  let end = Math.min(tp, cp + 2);
  if (end - start < 4) {
    if (start === 1) end = Math.min(tp, start + 4);
    else start = Math.max(1, end - 4);
  }
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});
</script>

<template>
  <div class="finance-view">
    <div class="page-header">
      <div>
        <div class="page-title">账单管理</div>
        <div class="page-desc">应收应付账单管理、收款核销、作废</div>
      </div>
      <div class="page-actions">
        <button v-permission="['finance:bill:modify']" class="btn btn-primary" @click="router.push('/finance/bill/create')">新增账单</button>
        <el-button v-permission="['finance:export']">导出</el-button>
      </div>
    </div>

    <!-- 状态标签 -->
    <div class="status-tabs">
      <button
        v-for="tab in statusTabs"
        :key="tab.key"
        :class="['status-tab', { active: activeTab === tab.key }]"
        @click="onTabChange(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">账单类型</span>
        <select v-model="query.category" class="select" @change="onSearch">
          <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">门店</span>
        <select v-model="query.storeId" class="select" @change="onSearch">
          <option value="">全部</option>
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">业务员</span>
        <select v-model="query.userId" class="select" @change="onSearch">
          <option value="">全部</option>
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">日期</span>
        <input v-model="query.dateStart" type="date" class="input input-sm" @change="onSearch" />
        <span style="color: var(--ink-300);">~</span>
        <input v-model="query.dateEnd" type="date" class="input input-sm" @change="onSearch" />
      </div>
      <input
        v-model="query.keyword"
        class="input"
        placeholder="搜索租客/房号/合同编号"
        @keyup.enter="onSearch"
      />
      <button class="btn btn-primary btn-sm" @click="onSearch">筛选</button>
      <button class="btn btn-default btn-sm" @click="onReset">重置</button>
    </div>

    <!-- 汇总条 -->
    <div class="summary-row">
      <span class="summary-chip">本月应收 <strong>{{ formatMoney(summaryStats.totalReceivable) }}</strong></span>
      <span class="summary-chip">本月已收 <strong>{{ formatMoney(summaryStats.totalReceived) }}</strong></span>
      <span class="summary-chip">待缴 <strong>{{ formatMoney(summaryStats.pending) }}</strong></span>
      <span class="summary-chip">逾期 <strong>{{ formatMoney(summaryStats.overdue) }}</strong></span>
    </div>

    <!-- 数据表格 -->
    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>账单编号</th>
              <th>租客</th>
              <th>房源</th>
              <th>费用类型</th>
              <th>应收金额</th>
              <th>实收金额</th>
              <th>账单日期</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody v-if="list.length > 0">
            <tr v-for="row in list" :key="row.id">
              <td>
                <div class="cell-main">{{ row.title }}</div>
                <div class="cell-sub">#{{ row.id }}</div>
              </td>
              <td>{{ row.tenantName || '-' }}</td>
              <td>{{ row.houseTitle || '-' }}</td>
              <td>{{ dictStore.getLabel('billing_category', row.category) || '-' }}</td>
              <td class="mono num-neg">{{ formatMoney(row.amount) }}</td>
              <td class="mono num-pos">{{ formatMoney(row.paidAmount || 0) }}</td>
              <td>{{ row.billDate || row.createdAt?.slice(0, 10) || '-' }}</td>
              <td>
                <span :class="['pill', statusClass(row.status)]">{{ statusLabelMap[row.status] || row.status }}</span>
              </td>
              <td>
                <div class="operation-cell">
                  <button v-permission="['finance:bill:modify']" class="btn btn-ghost btn-sm">编辑</button>
                  <button v-permission="['finance:bill:cancel']" class="btn btn-ghost btn-sm">作废</button>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td :colspan="9" style="text-align: center; padding: 48px 0; color: var(--ink-400);">
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="table-footer">
        <span class="text-muted">共 {{ total }} 条</span>
        <div class="pagination">
          <button class="page-btn" :disabled="page <= 1" @click="goPage(1)">&laquo;</button>
          <button class="page-btn" :disabled="page <= 1" @click="goPage(page - 1)">&lsaquo;</button>
          <button
            v-for="p in pageNumbers"
            :key="p"
            :class="['page-btn', { active: p === page }]"
            @click="goPage(p)"
          >
            {{ p }}
          </button>
          <button class="page-btn" :disabled="page >= totalPages" @click="goPage(page + 1)">&rsaquo;</button>
          <button class="page-btn" :disabled="page >= totalPages" @click="goPage(totalPages)">&raquo;</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.finance-view { min-height: 100%; }
</style>