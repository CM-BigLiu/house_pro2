<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
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
  type OverviewData,
  type RankItem,
  type TodoItem,
  type WarningCard,
} from '@/api/dashboard';
import { useUserStore } from '@/stores/user';

use([CanvasRenderer, BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent]);

const router = useRouter();
const userStore = useUserStore();
const loading = ref(true);
const errorMessage = ref('');
const overview = ref<OverviewData | null>(null);
const warnings = ref<WarningCard[]>([]);
const rankings = ref<Record<string, RankItem[]>>({});
const todos = ref<TodoItem[]>([]);

const permissions = computed(() => userStore.permissions);
const can = (code: string) => permissions.value.includes('*') || permissions.value.includes(code);
const canViewFinance = computed(() => permissions.value.includes('*') || permissions.value.some((code) => code.startsWith('finance:')));
const canAddRent = computed(() => can('renting:add'));
const canAddSale = computed(() => can('sale:add'));
const canAddReserve = computed(() => can('reserve:house:add'));
const hasQuickAction = computed(() => canAddRent.value || canAddSale.value || canAddReserve.value);

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

const kpis = computed(() => (overview.value?.kpis || []).map((item, index) => ({
  ...item,
  color: colorMap[(item as { color?: string }).color || ''] || (['blue', 'green', 'yellow', 'purple', 'blue', 'green'][index] as 'blue'),
})));

const rankEntries = computed<RankEntry[]>(() => (rankings.value.performance || []).map((item, index) => ({
  rank: index + 1,
  name: item.name,
  score: item.value,
})));
const maxRankScore = computed(() => Math.max(1, ...rankEntries.value.map((item) => Number(item.score))));

const chartOption = computed(() => {
  const monthly = overview.value?.charts.monthly || [];
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

function openUnavailable(name: string) {
  ElMessage.info(`${name}暂未配置入口`);
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
            <button v-if="canAddReserve" class="quick-btn" @click="router.push('/house/reserve-house/create')">录入储备</button>
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
          />
        </div>
      </section>

      <section v-if="overview?.bigCards.length" class="metric-grid">
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
          <VChart class="finance-chart" :option="chartOption" autoresize />
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
          <button class="text-btn" @click="openUnavailable('待办中心')">查看全部</button>
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

      <section class="assist-links" aria-label="辅助入口">
        <button @click="openUnavailable('首页设置')">首页设置</button>
        <button @click="openUnavailable('帮助中心')">帮助中心</button>
        <button @click="openUnavailable('在线客服')">在线客服</button>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

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

.text-btn,
.assist-links button {
  border: 0;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
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

.assist-links {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  padding: 0 4px 8px;
}

@media (max-width: 960px) {
  .hero-grid,
  .content-grid { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .quick-actions { grid-template-columns: 1fr; }
}
</style>
