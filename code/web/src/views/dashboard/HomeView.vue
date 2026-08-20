<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import {
  getOverview,
  getWarnings,
  getRankings,
  getTodos,
  type KpiItem,
  type WarningCard,
  type RankItem,
  type TodoItem,
} from '@/api/dashboard';
import KpiCard from '@/components/Dashboard/KpiCard.vue';
import WarningCardCmp from '@/components/Dashboard/WarningCard.vue';
import LargeCard from '@/components/Dashboard/LargeCard.vue';
import RankList from '@/components/Dashboard/RankList.vue';
import {
  Home,
  Users,
  Calendar,
  Banknote,
} from 'lucide-vue-next';

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent]);

const kpis = ref<KpiItem[]>([]);
const warnings = ref<WarningCard[]>([]);
const rankings = ref<Record<string, RankItem[]>>({});
const todos = ref<TodoItem[]>([]);
const monthly = ref<{ month: string; income: number; expense: number }[]>([]);
const loading = ref(false);
const userName = ref('');

const chartOption = ref({});

onMounted(async () => {
  loading.value = true;
  try {
    const [overviewRes, warningsRes, rankingsRes, todosRes] = await Promise.all([
      getOverview(),
      getWarnings(),
      getRankings(),
      getTodos(),
    ]);
    kpis.value = overviewRes.kpis || [];
    monthly.value = overviewRes.charts?.monthly || [];
    warnings.value = warningsRes || [];
    rankings.value = rankingsRes || {};
    todos.value = todosRes || [];
    userName.value = overviewRes.greetingName || '';
    buildChart();
  } finally {
    loading.value = false;
  }
});

function buildChart() {
  chartOption.value = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '支出'], bottom: 0 },
    grid: { left: 12, right: 12, top: 24, bottom: 32, containLabel: true },
    xAxis: {
      type: 'category',
      data: monthly.value.map((m) => m.month),
      axisLine: { lineStyle: { color: '#e4e9f0' } },
      axisLabel: { color: '#64748b' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f4f9' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      {
        name: '收入',
        type: 'bar',
        data: monthly.value.map((m) => m.income),
        itemStyle: { color: '#2e6bf0', borderRadius: [4, 4, 0, 0] },
        barWidth: '30%',
      },
      {
        name: '支出',
        type: 'line',
        data: monthly.value.map((m) => m.expense),
        itemStyle: { color: '#dc2626' },
        smooth: true,
      },
    ],
  };
}

const todoColor = (priority: string) => ({
  high: 'red',
  medium: 'orange',
  low: 'blue',
} as Record<string, string>)[priority] || 'gray';
</script>

<template>
  <div class="dashboard-view" v-loading="loading">
    <div class="page-header">
      <div>
        <div class="page-title">工作台</div>
        <div class="page-desc">欢迎回来，{{ userName }}，今日有待处理 {{ todos.length }} 项任务</div>
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="$router.push('/house/wizard')">新增房源</el-button>
      </div>
    </div>

    <div class="kpi-grid">
      <KpiCard
        v-for="(kpi, idx) in kpis"
        :key="idx"
        :label="kpi.label"
        :value="kpi.value"
        :unit="kpi.unit"
        :trend="kpi.trend"
        :trend-label="kpi.trendLabel"
        :color="(['blue', 'green', 'orange', 'purple'] as const)[idx % 4]"
      />
    </div>

    <div class="dashboard-row">
      <div class="card chart-card">
        <div class="card-title">月度收支趋势</div>
        <VChart class="chart" :option="chartOption" autoresize />
      </div>
      <div class="warning-col">
        <WarningCardCmp
          v-for="(w, idx) in warnings"
          :key="idx"
          :title="w.title"
          :value="w.value"
          :label="w.label"
          :color="w.color"
        />
      </div>
    </div>

    <div class="dashboard-row">
      <RankList
        title="业绩排行榜 TOP5"
        :items="rankings.performance || []"
        color="orange"
      />
      <RankList
        title="收房排行榜 TOP5"
        :items="rankings.house || []"
        color="blue"
      />
      <RankList
        title="收客排行榜 TOP5"
        :items="rankings.customer || []"
        color="green"
      />
    </div>

    <div class="dashboard-row">
      <LargeCard title="在管房源" :value="(kpis[0]?.value ?? 0) + ' 套'" label="较上月 +32" :icon="Home" color="#eef4ff" />
      <LargeCard title="在租客户" :value="(kpis[1]?.value ?? 0) + ' 间'" label="续约率 78%" :icon="Users" color="#ecfdf3" />
      <LargeCard title="本月到期" :value="(warnings[0]?.value ?? 0) + ' 套'" label="需提前 30 天跟进" :icon="Calendar" color="#fffaeb" />
      <LargeCard title="本月应收" :value="'¥' + (kpis[4]?.value ?? 0) + '万'" label="已收 82%" :icon="Banknote" color="#f5f0ff" />
    </div>

    <div class="card todo-card">
      <div class="card-title">待办事项</div>
      <div class="todo-list">
        <div v-for="todo in todos" :key="todo.id" class="todo-item">
          <span :class="['pill', `pill-${todoColor(todo.priority)}` ]">{{ { high: '高', medium: '中', low: '低' }[todo.priority] }}</span>
          <span class="todo-title">{{ todo.title }}</span>
          <span v-if="todo.date" class="todo-date">{{ todo.date }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard-view {
  padding-bottom: 20px;
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.dashboard-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
  &:last-child {
    grid-template-columns: repeat(4, 1fr);
  }
}
.chart-card {
  grid-column: span 2;
  padding: 18px;
}
.card-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-900);
  margin-bottom: 12px;
}
.chart {
  width: 100%;
  height: 260px;
}
.warning-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  > * { min-width: 0; }
}
.todo-card {
  padding: 18px;
}
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--ink-100);
  &:last-child { border-bottom: none; }
}
.todo-title {
  flex: 1;
  color: var(--ink-800);
}
.todo-date {
  color: var(--ink-400);
  font-size: 12px;
}
@media (max-width: 1400px) {
  .kpi-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 1200px) {
  .dashboard-row,
  .dashboard-row:last-child {
    grid-template-columns: repeat(2, 1fr);
  }
  .chart-card { grid-column: span 2; }
}
@media (max-width: 768px) {
  .kpi-grid,
  .dashboard-row,
  .dashboard-row:last-child {
    grid-template-columns: 1fr;
  }
  .chart-card { grid-column: span 1; }
}
</style>
