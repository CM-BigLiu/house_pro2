<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { getRentIncreases, createRentIncrease, type RentIncrease } from '@/api/finance-report';
import { ElMessage } from 'element-plus';

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent]);

const list = ref<RentIncrease[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const form = reactive<Partial<RentIncrease>>({
  roomCode: '', year: new Date().getFullYear(), month: new Date().getMonth() + 1,
  lastRent: 0, currentRent: 0, status: 'active',
});
const query = reactive({ year: new Date().getFullYear(), keyword: '' });

const chartOption = ref({});
const stats = ref([
  { label: '本年涨价房源', value: 0, unit: '套' },
  { label: '平均涨幅', value: 0, unit: '%' },
  { label: '涨价金额合计', value: 0, prefix: '¥' },
  { label: '待涨价房源', value: 0, unit: '套' },
]);

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const res = await getRentIncreases(query);
    list.value = res.list || [];
    buildChart();
    computeStats();
  } finally {
    loading.value = false;
  }
}

function buildChart() {
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
  const currentYear = query.year;
  const lastYear = currentYear - 1;
  const grouped = new Map<number, { current: number; last: number }[]>();
  for (let i = 1; i <= 12; i++) grouped.set(i, []);
  list.value.forEach((item) => {
    if (item.year === currentYear) grouped.get(item.month)?.push({ current: Number(item.currentRent), last: 0 });
    if (item.year === lastYear) grouped.get(item.month)?.push({ current: 0, last: Number(item.lastRent) });
  });
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  chartOption.value = {
    tooltip: { trigger: 'axis' },
    legend: { data: [`${lastYear}年租金`, `${currentYear}年租金`], bottom: 0 },
    grid: { left: 12, right: 12, top: 24, bottom: 32, containLabel: true },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: '#e4e9f0' } },
      axisLabel: { color: '#64748b' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f4f9' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      { name: `${lastYear}年租金`, type: 'bar', data: months.map((_, i) => avg(grouped.get(i + 1)!.map((x) => x.last))), itemStyle: { color: '#cbd5e1', borderRadius: [4, 4, 0, 0] }, barWidth: '30%' },
      { name: `${currentYear}年租金`, type: 'bar', data: months.map((_, i) => avg(grouped.get(i + 1)!.map((x) => x.current))), itemStyle: { color: '#2e6bf0', borderRadius: [4, 4, 0, 0] }, barWidth: '30%' },
    ],
  };
}

function computeStats() {
  const current = list.value.filter((x) => x.year === query.year);
  const count = current.length;
  const totalIncrease = current.reduce((sum, x) => sum + Number(x.increaseAmount), 0);
  const avgRate = count ? current.reduce((sum, x) => sum + Number(x.increaseRate), 0) / count : 0;
  stats.value[0].value = count;
  stats.value[1].value = Number(avgRate.toFixed(2));
  stats.value[2].value = totalIncrease;
  stats.value[3].value = Math.max(0, 120 - count);
}

function openCreate() {
  Object.assign(form, {
    roomCode: '', year: query.year, month: new Date().getMonth() + 1,
    lastRent: 0, currentRent: 0, status: 'active',
  });
  dialogVisible.value = true;
}

async function submit() {
  await createRentIncrease(form);
  ElMessage.success('创建成功');
  dialogVisible.value = false;
  await load();
}

function formatStat(v: number, prefix?: string, unit?: string) {
  const str = v.toLocaleString('zh-CN');
  if (prefix) return `${prefix}${str}`;
  return `${str}${unit || ''}`;
}
</script>

<template>
  <div class="finance-view">
    <div class="page-header">
      <div>
        <div class="page-title">涨价统计</div>
        <div class="page-desc">对比历年租金变化，分析涨价趋势与空间</div>
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="openCreate">新增涨价</el-button>
        <el-button v-permission="['finance:export']">导出</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-date-picker v-model="query.year" type="year" value-format="YYYY" placeholder="年份" @change="load" />
      <el-input v-model="query.keyword" placeholder="房号" clearable @keyup.enter="load" />
      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <div class="stat-row">
      <div v-for="(s, idx) in stats" :key="idx" class="stat-card">
        <div class="stat-label">{{ s.label }}</div>
        <div class="stat-value">
          {{ formatStat(s.value, s.prefix, s.unit) }}
        </div>
      </div>
    </div>

    <div class="card chart-card">
      <div class="card-title">月度租金对比</div>
      <VChart class="chart" :option="chartOption" autoresize />
    </div>

    <el-table :data="list" v-loading="loading" class="card" style="margin-top: 16px;">
      <el-table-column prop="roomCode" label="房间" />
      <el-table-column prop="year" label="年份" width="90" />
      <el-table-column prop="month" label="月份" width="70" />
      <el-table-column prop="lastRent" label="上年租金" />
      <el-table-column prop="currentRent" label="本年租金" />
      <el-table-column prop="increaseAmount" label="涨额" />
      <el-table-column prop="increaseRate" label="涨幅%" />
    </el-table>

    <el-dialog v-model="dialogVisible" title="新增涨价记录" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="房间">
          <el-input v-model="form.roomCode" />
        </el-form-item>
        <el-form-item label="年份">
          <el-input-number v-model="form.year" :min="2000" :max="2100" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="月份">
          <el-input-number v-model="form.month" :min="1" :max="12" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="上年租金">
          <el-input-number v-model="form.lastRent" :min="0" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="本年租金">
          <el-input-number v-model="form.currentRent" :min="0" controls-position="right" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.finance-view { min-height: 100%; }
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.stat-card {
  background: #fff;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow-sm);
}
.stat-label {
  font-size: 12.5px;
  color: var(--ink-500);
  margin-bottom: 8px;
}
.stat-value {
  font-family: var(--font-num);
  font-size: 22px;
  font-weight: 700;
  color: var(--ink-900);
}
.chart-card {
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
  height: 320px;
}
@media (max-width: 992px) {
  .stat-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 576px) {
  .stat-row { grid-template-columns: 1fr; }
}
</style>
