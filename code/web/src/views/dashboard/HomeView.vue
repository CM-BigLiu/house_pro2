<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';

import KpiCard from '@/components/Dashboard/KpiCard.vue';
import WarningCardCmp from '@/components/Dashboard/WarningCard.vue';
import RankListCmp, { type RankEntry } from '@/components/Dashboard/RankList.vue';
import {
  getOverview,
  getRankings,
  getTodos,
  getWarnings,
  getKpiDetails,
  type KpiItem,
  type KpiDetailRow,
  type OverviewData,
  type RankItem,
  type TodoItem,
  type WarningCard,
} from '@/api/dashboard';
import { useUserStore } from '@/stores/user';
import { formatMoney } from '@/utils/format';

use([CanvasRenderer, BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent]);

const router = useRouter();
const userStore = useUserStore();
const loading = ref(true);
const errorMessage = ref('');
const overview = ref<OverviewData | null>(null);
const warnings = ref<WarningCard[]>([]);
const rankings = ref<Record<string, RankItem[]>>({});
const todos = ref<TodoItem[]>([]);
const detailVisible = ref(false), detailLoading = ref(false), detailError = ref(false);
const detailItem = ref<KpiItem | null>(null), detailRows = ref<KpiDetailRow[]>([]);
const detailPage = ref(1), detailTotal = ref(0), detailAmount = ref(0);
let detailGeneration = 0;
const financialDetail = computed(() => ['receivable', 'received'].includes(detailItem.value?.key || ''));
async function showDetail(item: KpiItem) { detailItem.value = item; detailPage.value = 1; detailVisible.value = true; await loadDetail(); }
async function loadDetail() {
  const key = detailItem.value?.key;
  if (!key) return;
  const generation = ++detailGeneration;
  detailLoading.value = true; detailError.value = false; detailRows.value = [];
  try {
    const data = await getKpiDetails(key, detailPage.value);
    if (generation !== detailGeneration) return;
    detailRows.value = data.list; detailTotal.value = data.total; detailAmount.value = data.totalAmount;
  } catch { if (generation === detailGeneration) detailError.value = true; }
  finally { if (generation === detailGeneration) detailLoading.value = false; }
}
const statusName = (status?: string) => ({ vacant: '空置', rented: '已出租', checkout: '退房中', pending: '待缴', paid: '已缴', published: '已发布', sold: '已售', pre_publish: '待发布', received: '已收', partial: '部分缴费' } as Record<string, string>)[status || ''] || status || '—';

const permissions = computed(() => userStore.permissions);
const can = (code: string) => permissions.value.includes('*') || permissions.value.includes(code);
const canViewFinance = computed(() => permissions.value.includes('*') || permissions.value.some((code) => code.startsWith('finance:')));
const canAddRent = computed(() => can('renting:add'));
const canAddSale = computed(() => can('sale:add'));
const hasQuickAction = computed(() => canAddRent.value || canAddSale.value);

const userName = computed(() => userStore.userInfo?.name || overview.value?.greetingName || '用户');
const maskedMobile = computed(() => {
  const mobile = userStore.userInfo?.mobile || '';
  return mobile.length >= 7 ? `${mobile.slice(0, 3)}****${mobile.slice(-4)}` : mobile;
});
const scopeLabel = computed(() => ({
  self: '本人数据',
  group: '本组数据',
  store: '本店数据',
  assigned: '指定门店数据',
  custom: '自定义数据',
  company: '全公司数据',
}[userStore.userInfo?.dataScope || overview.value?.role || 'self'] || '本人数据'));

const colorMap: Record<string, 'pink' | 'yellow' | 'green' | 'blue' | 'purple'> = {
  red: 'pink',
  orange: 'yellow',
  green: 'green',
  blue: 'blue',
  purple: 'purple',
};

const kpis = computed(() => (overview.value?.kpis || []).filter(item => item.label !== '客户总数').map((item, index) => ({
  ...item,
  key: item.key || ({ 在管房源: 'properties', 在租房间: 'rented', 空房间: 'vacant', 本月应收: 'receivable', 本月实收: 'received' } as Record<string, string>)[item.label],
  color: colorMap[(item as { color?: string }).color || ''] || (['blue', 'green', 'yellow', 'purple', 'blue', 'green'][index] as 'blue'),
})));

const rankEntries = computed<RankEntry[]>(() => (rankings.value.performance || []).map((item, index) => ({
  rank: index + 1,
  name: item.name,
  score: item.value,
})));
const maxRankScore = computed(() => Math.max(1, ...rankEntries.value.map((item) => Number(item.score))));

const chartOption = computed(() => {
  const monthly = overview.value?.charts?.monthly || [];
  return {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['收入', '支出'], bottom: 0 },
    grid: { left: 54, right: 20, top: 24, bottom: 44 },
    xAxis: {
      type: 'category' as const,
      data: monthly.map((item) => item.month),
      axisLabel: { color: '#64748b' },
      axisLine: { lineStyle: { color: '#e4e9f0' } },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: '#64748b', formatter: (value: number) => `${value / 10000}万` },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    series: [
      {
        name: '收入',
        type: 'bar',
        data: monthly.map((item) => item.income),
        itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: '支出',
        type: 'line',
        smooth: true,
        data: monthly.map((item) => item.expense),
        itemStyle: { color: '#ef4444' },
      },
    ],
  };
});

async function loadDashboard() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const [overviewData, warningData, rankingData, todoData] = await Promise.all([
      getOverview(),
      getWarnings(),
      getRankings(),
      getTodos(),
    ]);
    overview.value = overviewData;
    warnings.value = warningData;
    rankings.value = rankingData;
    todos.value = todoData;
  } catch {
    errorMessage.value = '首页数据加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<template>
  <div class="dashboard">
    <div v-if="loading" class="state-card">正在加载真实业务数据...</div>
    <div v-else-if="errorMessage" class="state-card state-error">
      <span>{{ errorMessage }}</span>
      <button class="btn btn-primary btn-sm" @click="loadDashboard">重新加载</button>
    </div>
    <template v-else>
      <section class="hero-grid">
        <div class="panel user-card">
          <div class="avatar">{{ userName.charAt(0) }}</div>
          <div class="user-copy">
            <h1>{{ userName }}，欢迎回来</h1>
            <p>{{ scopeLabel }}<template v-if="maskedMobile"> · {{ maskedMobile }}</template></p>
          </div>
        </div>

        <div class="panel quick-card">
          <div class="panel-heading">
            <div>
              <h2>快捷录入</h2>
              <p>入口随当前账号操作权限展示</p>
            </div>
          </div>
          <div v-if="hasQuickAction" class="quick-actions">
            <button v-if="canAddRent" class="quick-btn" @click="router.push('/house/rent/create')">录入租房</button>
            <button v-if="canAddSale" class="quick-btn" @click="router.push('/house/sale/create')">录入售房</button>
          </div>
          <div v-else class="read-only-tip">当前账号为只读权限，无可用录入操作</div>
        </div>
      </section>

      <section class="panel section-panel">
        <div class="panel-heading">
          <div>
            <h2>经营概览</h2>
            <p>基于当前账号数据范围实时统计</p>
          </div>
          <button class="text-btn" @click="loadDashboard">刷新</button>
        </div>
        <div class="kpi-grid">
          <KpiCard
            v-for="item in kpis"
            :key="item.label"
            :label="item.label"
            :value="item.value"
            :unit="item.unit"
            :trend="item.trend"
            :trend-label="item.trendLabel"
            :color="item.color"
            :detail="!!item.key"
            @detail="showDetail(item)"
          />
        </div>
      </section>

      <section v-if="overview?.bigCards?.length" class="metric-grid">
        <article v-for="item in overview.bigCards" :key="item.title" class="panel metric-card">
          <span>{{ item.title }}</span>
          <strong>{{ item.value }}<small v-if="item.label"> {{ item.label }}</small></strong>
        </article>
      </section>

      <section v-if="canViewFinance && warnings.length" class="panel section-panel">
        <div class="panel-heading">
          <div>
            <h2>财务与到期预警</h2>
            <p>仅向拥有财务菜单权限的账号展示</p>
          </div>
        </div>
        <div class="warning-grid">
          <WarningCardCmp
            v-for="item in warnings"
            :key="item.title"
            :title="item.title"
            :value="item.value"
            :meta="item.label"
            :border-color="item.color"
            :is-zero="item.value === 0"
            :is-over-threshold="item.color === 'red'"
            @detail="router.push('/finance/arrears')"
          />
        </div>
      </section>

      <section class="content-grid" :class="{ 'without-finance': !canViewFinance }">
        <div v-if="canViewFinance" class="panel section-panel chart-panel">
          <div class="panel-heading">
            <div>
              <h2>近六个月收支</h2>
              <p>已完成流水汇总</p>
            </div>
          </div>
          <VChart v-if="overview?.charts?.monthly?.length" class="finance-chart" :option="chartOption" autoresize />
          <div v-else class="empty-tip">暂无收支数据</div>
        </div>
        <RankListCmp
          title="本月业绩排行"
          subtitle="当前数据权限范围"
          :items="rankEntries"
          :max-score="maxRankScore"
        />
      </section>

      <section class="panel section-panel">
        <div class="panel-heading">
          <div>
            <h2>我的待办</h2>
            <p>租约到期与账单催收提醒</p>
          </div>
          <button class="text-btn" @click="router.push('/home/todos')">查看全部</button>
        </div>
        <div v-if="todos.length" class="todo-list">
          <div v-for="item in todos" :key="item.id" class="todo-row">
            <span :class="['priority-dot', `priority-${item.priority}`]"></span>
            <span class="todo-title">{{ item.title }}</span>
            <time>{{ item.date || '-' }}</time>
          </div>
        </div>
        <div v-else class="empty-tip">暂无待办事项</div>
      </section>
    </template>
    <el-dialog v-if="detailVisible" v-model="detailVisible" :title="`${detailItem?.label || ''}详情`" width="min(960px,94vw)" append-to-body>
      <div v-loading="detailLoading" class="detail-content">
        <el-alert v-if="detailError" title="详情加载失败，请重试" type="error" :closable="false" />
        <p v-else-if="detailLoading" class="detail-note">正在加载详细数据…</p>
        <template v-else>
          <p class="detail-note">当前账号数据范围 · 共 {{ detailTotal }} 条<template v-if="financialDetail"> · 合计 {{ formatMoney(detailAmount) }}</template></p>
          <el-table :data="detailRows" border stripe max-height="420" row-key="id" empty-text="暂无详细数据">
            <el-table-column v-if="!financialDetail" prop="propertyCode" label="房源编号" min-width="110" />
            <el-table-column prop="propertyName" label="房源 / 项目" min-width="200" show-overflow-tooltip />
            <template v-if="financialDetail">
              <el-table-column prop="date" label="日期" width="115" /><el-table-column prop="source" label="来源" min-width="145" />
              <el-table-column prop="reference" label="关联单据" min-width="180" show-overflow-tooltip />
              <el-table-column label="金额" width="125" align="right"><template #default="{ row }">{{ formatMoney(row.amount) }}</template></el-table-column>
              <el-table-column v-if="detailItem?.key === 'receivable'" label="已缴" width="110" align="right"><template #default="{ row }">{{ formatMoney(row.settledAmount) }}</template></el-table-column>
            </template>
            <template v-else-if="detailItem?.key !== 'properties'">
              <el-table-column prop="roomNo" label="房号" width="85" />
              <el-table-column label="月租" width="115" align="right"><template #default="{ row }">{{ formatMoney(row.rent) }}</template></el-table-column>
              <el-table-column prop="leaseEnd" label="租约到期" width="120" />
            </template>
            <el-table-column v-else prop="type" label="类型" width="115" />
            <el-table-column v-if="detailItem?.key !== 'received'" label="状态" width="100"><template #default="{ row }">{{ statusName(row.status) }}</template></el-table-column>
          </el-table>
          <el-pagination v-model:current-page="detailPage" :page-size="10" :total="detailTotal" layout="prev, pager, next, total" @current-change="loadDetail" />
        </template>
      </div>
      <template #footer><el-button v-if="detailError" @click="loadDetail">重试</el-button><el-button @click="detailVisible = false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.detail-content { min-height: 140px; }
.detail-note { margin: 0 0 14px; color: #64748b; }
.detail-content :deep(.el-pagination) { margin-top: 16px; justify-content: flex-end; }

.panel,
.state-card {
  background: #fff;
  border: 1px solid #e4e9f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.state-card {
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #64748b;
}

.state-error { color: #dc2626; }

.hero-grid {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(340px, 1.4fr);
  gap: 16px;
}

.user-card {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
}

.user-copy h1,
.panel-heading h2 {
  margin: 0;
  color: #1e293b;
}

.user-copy h1 { font-size: 18px; }
.user-copy p,
.panel-heading p {
  margin: 5px 0 0;
  color: #94a3b8;
  font-size: 12px;
}

.quick-card,
.section-panel { padding: 18px; }

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-heading h2 { font-size: 15px; }

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.quick-btn {
  min-height: 42px;
  border: 1px solid #bfdbfe;
  border-radius: 9px;
  background: #eff6ff;
  color: #2563eb;
  cursor: pointer;
  font-weight: 600;
}

.quick-btn:hover { background: #dbeafe; }
.read-only-tip,
.empty-tip { color: #94a3b8; font-size: 13px; padding: 12px 0; }

.text-btn {
  border: 0;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
}

.metric-card { padding: 16px; }
.metric-card span { display: block; color: #64748b; font-size: 12px; }
.metric-card strong { display: block; margin-top: 7px; color: #0f172a; font-size: 22px; }
.metric-card small { color: #94a3b8; font-size: 12px; font-weight: 500; }

.warning-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(340px, 0.8fr);
  gap: 16px;
}
.content-grid.without-finance { grid-template-columns: minmax(340px, 680px); }
.finance-chart { height: 300px; }

.todo-list { display: flex; flex-direction: column; }
.todo-row {
  display: grid;
  grid-template-columns: 8px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 11px 0;
  border-top: 1px solid #f1f5f9;
}
.priority-dot { width: 7px; height: 7px; border-radius: 50%; background: #94a3b8; }
.priority-high { background: #ef4444; }
.priority-medium { background: #f59e0b; }
.priority-low { background: #3b82f6; }
.todo-title { color: #334155; font-size: 13px; }
.todo-row time { color: #94a3b8; font-size: 12px; }

@media (max-width: 960px) {
  .hero-grid,
  .content-grid { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .quick-actions { grid-template-columns: 1fr; }
}
</style>
