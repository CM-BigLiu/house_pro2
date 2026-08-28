<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCheckouts, confirmCheckout, type Checkout } from '@/api/checkout';
import { useDictStore } from '@/stores/dict';
import { formatMoney, formatDate } from '@/utils/format';

const dictStore = useDictStore();
const list = ref<Checkout[]>([]);
const total = ref(0);
const loading = ref(false);
const query = reactive({ keyword: '', status: '', startDate: '', endDate: '', page: 1, pageSize: 20 });

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '已完成', value: 'completed' },
];

onMounted(async () => {
  await dictStore.ensureLoaded([]);
  await load();
});

async function load() {
  loading.value = true;
  try {
    const res = await getCheckouts(query);
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

const summary = computed(() => {
  const pending = list.value.filter((i: Checkout) => i.status === 'pending').length;
  const confirmed = list.value.filter((i: Checkout) => i.status === 'confirmed').length;
  const completed = list.value.filter((i: Checkout) => i.status === 'completed').length;
  return { total: list.value.length, pending, confirmed, completed };
});

function handleStatusTab(val: string) {
  query.status = val;
  query.page = 1;
  load();
}

function handleSearch() {
  query.page = 1;
  load();
}

async function handleConfirm(item: Checkout) {
  await ElMessageBox.confirm(`确认退租「${item.contractCode}」？`, '退租确认', { type: 'warning' });
  await confirmCheckout(item.id);
  ElMessage.success('已确认退租');
  await load();
}

function handleDetail(item: Checkout) {
  ElMessage.info(`查看退租详情: ${item.contractCode}`);
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    pending: 'pill-orange',
    confirmed: 'pill-blue',
    completed: 'pill-green',
  };
  return map[status] || 'pill-gray';
}
</script>

<template>
  <div class="house-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-title">退租管理</div>
        <div class="page-desc">管理租客退租登记、确认与费用清算</div>
      </div>
      <div class="page-actions">
        <el-button v-permission="['checkout:export']">导出</el-button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="status-tabs">
        <span
          v-for="opt in statusOptions"
          :key="opt.value"
          :class="['status-tab', { active: query.status === opt.value }]"
          @click="handleStatusTab(opt.value)"
        >{{ opt.label }}</span>
      </div>

      <el-input v-model="query.keyword" placeholder="合同编号/租客" clearable @keyup.enter="handleSearch" class="filter-input" />
      <el-date-picker v-model="query.startDate" type="date" placeholder="开始日期" class="filter-range" value-format="YYYY-MM-DD" />
      <span class="range-sep">-</span>
      <el-date-picker v-model="query.endDate" type="date" placeholder="结束日期" class="filter-range" value-format="YYYY-MM-DD" />
      <el-button type="primary" @click="handleSearch">查询</el-button>
    </div>

    <!-- Summary Row -->
    <div class="summary-row">
      <span class="summary-chip">共 <strong>{{ summary.total }}</strong> 条退租记录</span>
      <span class="summary-sep">·</span>
      <span class="summary-chip">待确认 <strong>{{ summary.pending }}</strong></span>
      <span class="summary-sep">·</span>
      <span class="summary-chip">已确认 <strong>{{ summary.confirmed }}</strong></span>
      <span class="summary-sep">·</span>
      <span class="summary-chip">已完成 <strong>{{ summary.completed }}</strong></span>
    </div>

    <!-- Data Table -->
    <div class="card table-wrap">
      <el-table :data="list" v-loading="loading" class="data-table" style="width: 100%">
        <el-table-column prop="contractCode" label="合同编号" min-width="140">
          <template #default="{ row }">
            <span class="cell-main">{{ row.contractCode }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="tenantName" label="租客" min-width="100" />
        <el-table-column prop="houseInfo" label="房源" min-width="160" show-overflow-tooltip />
        <el-table-column prop="checkoutDate" label="退租日期" min-width="110">
          <template #default="{ row }">
            <span class="mono">{{ formatDate(row.checkoutDate) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="退租原因" min-width="160" show-overflow-tooltip />
        <el-table-column prop="settlementAmount" label="费用清算" min-width="120" align="right">
          <template #default="{ row }">
            <span :class="['mono', (row.settlementAmount || 0) >= 0 ? 'num-pos' : 'num-neg']">
              {{ formatMoney(row.settlementAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="90">
          <template #default="{ row }">
            <span :class="['pill', statusClass(row.status)]">{{ dictStore.getLabel('checkout_status', row.status) || row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="130" fixed="right">
          <template #default="{ row }">
            <div class="operation-cell">
              <el-button
                size="small"
                type="primary"
                plain
                :disabled="row.status !== 'pending'"
                @click="handleConfirm(row)"
              >确认</el-button>
              <el-button size="small" plain @click="handleDetail(row)">详情</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-footer">
        <span class="table-total">共 {{ total }} 条</span>
        <div class="pagination">
          <el-pagination
            v-model:current-page="query.page"
            v-model:page-size="query.pageSize"
            :total="total"
            layout="prev, pager, next"
            small
            @change="load"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.house-view { min-height: 100%; }

/* ---- Filter Bar ---- */
.filter-bar {
  background: #fff;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
}
.status-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 0;
}
.status-tab {
  border: 1px solid var(--ink-200);
  background: #fff;
  border-radius: 999px;
  padding: 5px 13px;
  font-size: 12px;
  color: var(--ink-600);
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: var(--shadow-xs);
  &:hover { border-color: var(--primary); color: var(--primary); }
  &.active {
    border-color: var(--primary);
    color: #fff;
    background: linear-gradient(180deg, #3d7bff, #2e6bf0);
    box-shadow: 0 3px 8px -2px rgba(46, 107, 240, 0.4);
    font-weight: 600;
  }
}
.filter-input { width: 200px; }
.filter-range { width: 140px; }
.range-sep { color: var(--ink-400); font-size: 12px; }

/* ---- Summary Row ---- */
.summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--ink-600);
  background: var(--ink-50);
  border-radius: var(--radius);
  padding: 10px 16px;
}
.summary-chip {
  strong { color: var(--ink-900); font-weight: 700; font-size: 14px; }
}
.summary-sep { color: var(--ink-300); margin: 0 4px; }

/* ---- Table ---- */
.table-wrap {
  border-radius: var(--radius);
  overflow: hidden;
}
.data-table {
  :deep(.el-table__header th) {
    background: var(--ink-50);
    color: var(--ink-500);
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.2px;
  }
  :deep(.el-table__body tr:hover td) {
    background: var(--primary-softer);
  }
  :deep(.el-table__body td) {
    color: var(--ink-700);
    font-size: 13px;
  }
}
.cell-main {
  font-weight: 600;
  color: var(--ink-800);
}
.mono {
  font-family: var(--font-num);
}
.num-pos {
  color: var(--success);
  font-weight: 600;
}
.num-neg {
  color: var(--danger);
  font-weight: 600;
}
.operation-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* ---- Table Footer ---- */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: #fff;
  border-top: 1px solid var(--ink-100);
}
.table-total {
  font-size: 13px;
  color: var(--ink-500);
}
.pagination {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-input, .filter-range { width: 100%; }
}
</style>