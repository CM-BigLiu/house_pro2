<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';

import KpiCard from '@/components/Dashboard/KpiCard.vue';
import WarningCardCmp from '@/components/Dashboard/WarningCard.vue';
import LargeCard from '@/components/Dashboard/LargeCard.vue';
import RankListCmp from '@/components/Dashboard/RankList.vue';
import type { RankEntry } from '@/components/Dashboard/RankList.vue';

use([CanvasRenderer, LineChart, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent]);

const router = useRouter();
const loading = ref(true);

// ─── Mock Data ──────────────────────────────────────────────
// Product-requirement-specified static mock data matching the UI spec (01-home.png)

const activeTab = ref<'今日' | '本周' | '本月' | '上月'>('今日');
const tabOptions: Array<'今日' | '本周' | '本月' | '上月'> = ['今日', '本周', '本月', '上月'];
const userName = ref('代建伟');
const userStore = ref('优居上海-张江店');
const userRole = ref('综合经纪人');
const userPhone = ref('137****6208');

// Per-tab KPI data
interface KpiItem {
  label: string; value: number | string; unit: string; trend: number;
  color: 'pink' | 'yellow' | 'green' | 'blue' | 'purple';
  spark: number[];
}
const allKpiData: Record<string, KpiItem[]> = {
  '今日': [
    { label: '收房', value: 0, unit: '套', trend: 0, color: 'pink' as const, spark: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { label: '收客', value: 1, unit: '人', trend: 100, color: 'yellow' as const, spark: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] },
    { label: '带看', value: 3, unit: '次', trend: 50, color: 'green' as const, spark: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3] },
    { label: '应收', value: '0.85', unit: '万', trend: 0, color: 'blue' as const, spark: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.4, 0.85] },
    { label: '实收', value: '0.60', unit: '万', trend: 0, color: 'purple' as const, spark: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.6] },
  ],
  '本周': [
    { label: '收房', value: 1, unit: '套', trend: 0, color: 'pink' as const, spark: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] },
    { label: '收客', value: 5, unit: '人', trend: 25, color: 'yellow' as const, spark: [0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 5] },
    { label: '带看', value: 8, unit: '次', trend: 14, color: 'green' as const, spark: [0, 0, 0, 0, 0, 0, 0, 1, 3, 5, 6, 8] },
    { label: '应收', value: '3.20', unit: '万', trend: 8, color: 'blue' as const, spark: [0, 0, 0, 0, 0, 0, 0.5, 1.0, 1.8, 2.2, 2.8, 3.2] },
    { label: '实收', value: '2.45', unit: '万', trend: 12, color: 'purple' as const, spark: [0, 0, 0, 0, 0, 0, 0.3, 0.8, 1.4, 1.8, 2.2, 2.45] },
  ],
  '本月': [
    { label: '收房', value: 3, unit: '套', trend: 12, color: 'pink' as const, spark: [30, 42, 38, 50, 45, 55, 52, 60, 58, 65, 62, 70] },
    { label: '收客', value: 12, unit: '人', trend: 8, color: 'yellow' as const, spark: [20, 28, 25, 35, 30, 40, 38, 45, 42, 50, 48, 55] },
    { label: '带看', value: 8, unit: '次', trend: -3, color: 'green' as const, spark: [15, 18, 14, 22, 20, 28, 25, 30, 26, 22, 18, 20] },
    { label: '应收', value: '9.75', unit: '万', trend: 5, color: 'blue' as const, spark: [10, 18, 14, 22, 20, 28, 25, 32, 30, 35, 33, 38] },
    { label: '实收', value: '7.56', unit: '万', trend: 10, color: 'purple' as const, spark: [8, 12, 10, 16, 14, 20, 18, 24, 22, 28, 26, 30] },
  ],
  '上月': [
    { label: '收房', value: 2, unit: '套', trend: -33, color: 'pink' as const, spark: [25, 35, 30, 42, 38, 48, 44, 52, 50, 55, 52, 58] },
    { label: '收客', value: 10, unit: '人', trend: -17, color: 'yellow' as const, spark: [18, 24, 22, 30, 28, 35, 32, 40, 36, 42, 40, 45] },
    { label: '带看', value: 10, unit: '次', trend: 25, color: 'green' as const, spark: [12, 15, 13, 18, 16, 22, 20, 25, 22, 18, 16, 18] },
    { label: '应收', value: '8.50', unit: '万', trend: -8, color: 'blue' as const, spark: [8, 15, 12, 18, 16, 22, 20, 28, 25, 30, 28, 32] },
    { label: '实收', value: '6.80', unit: '万', trend: -5, color: 'purple' as const, spark: [6, 10, 8, 14, 12, 18, 16, 22, 20, 25, 24, 28] },
  ],
};

const kpiData = computed(() => allKpiData[activeTab.value]);

// 6 tenant warning cards + 6 landlord warning cards
const tenantWarnings = [
  { title: '目前已到期应收(元)', value: '¥7067.53万', meta: '租客逾期应收藏', borderColor: 'red' as const, overThreshold: true },
  { title: '未来30天到期租客', value: 4, meta: '即将到期租客数', borderColor: 'blue' as const },
  { title: '未来应支', value: '4天 ¥5.40万', meta: '未来应付房东', borderColor: 'orange' as const },
  { title: '今日租客到期', value: 0, meta: '今日到期合同', borderColor: 'green' as const, zero: true },
  { title: '已逾期租客欠款(元)', value: '¥0.00元', meta: '逾期欠款总额', borderColor: 'green' as const, zero: true },
  { title: '目前租客已到期(个)', value: 204, meta: '已到期租客总数', borderColor: 'red' as const, overThreshold: true },
];

const landlordWarnings = [
  { title: '目前已到期应支(元)', value: '¥3036.93万', meta: '房东逾期应支款', borderColor: 'red' as const, overThreshold: true },
  { title: '未来应收', value: '4天 ¥6530.00元', meta: '未来应收租客款', borderColor: 'blue' as const },
  { title: '未来30天到期房东', value: 5, meta: '即将到期房东数', borderColor: 'orange' as const },
  { title: '今日房东到期', value: 0, meta: '今日到期合同', borderColor: 'green' as const, zero: true },
  { title: '已逾期房东欠款(元)', value: '¥0.00元', meta: '逾期欠款总额', borderColor: 'green' as const, zero: true },
  { title: '已逾期未续房东', value: 151, meta: '逾期未续约房东', borderColor: 'red' as const, overThreshold: true },
];

// Ranking
const rankingData: RankEntry[] = [
  { rank: 1, name: '梁成肖', teamName: '建外SOHO店A组', score: 97515 },
  { rank: 2, name: '李阳', teamName: '建外SOHO店B组', score: 75629 },
  { rank: 3, name: '王芳', teamName: '北辛安店', score: 58420 },
  { rank: 4, name: '张伟', teamName: '张江店', score: 48900 },
  { rank: 5, name: '刘思思', teamName: '浦东店', score: 42100 },
  { rank: 6, name: '陈明', teamName: '陆家嘴店', score: 38500 },
  { rank: 7, name: '赵丽', teamName: '静安寺店', score: 35200 },
];

// Monthly income/expense chart
const monthlyOption = ref({
  tooltip: { trigger: 'axis' as const },
  legend: { data: ['收入', '支出'], bottom: 0, itemWidth: 12, itemHeight: 8 },
  grid: { left: 40, right: 16, top: 16, bottom: 36 },
  xAxis: { type: 'category' as const, data: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
    axisLine: { lineStyle: { color: '#e4e9f0' } }, axisLabel: { color: '#64748b', fontSize: 11 } },
  yAxis: { type: 'value' as const, splitLine: { lineStyle: { color: '#f1f4f9' } }, axisLabel: { color: '#64748b', fontSize: 11, formatter: (v: number) => v + '万' } },
  series: [
    { name: '收入', type: 'bar', data: [86, 92, 78, 104, 96, 112, 108, 124, 118, 132, 126, 140],
      itemStyle: { color: '#3b82f6', borderRadius: [4,4,0,0] }, barWidth: '28%' },
    { name: '支出', type: 'line', data: [42, 38, 45, 50, 44, 52, 48, 56, 50, 60, 54, 62],
      itemStyle: { color: '#ef4444' }, smooth: true, lineStyle: { width: 2 } },
  ],
});

// ─── 18 Large Cards (6 groups x 3 cards each) ──────────────

// Group 1: 房源相关 (Housing Overview)
const housingCards = [
  { title: '房源概况', type: 'overview' as const,
    stats: [
      { label: '有效', value: '904间', color: '#10b981' },
      { label: '冻结', value: '2间', color: '#ef4444' },
      { label: '租房', value: 152, color: '#3b82f6' },
      { label: '售房', value: 364, color: '#8b5cf6' },
      { label: '储备', value: 388, color: '#f59e0b' },
    ]},
  { title: '平均租差 / 续约率', type: 'stats' as const,
    stats: [
      { label: '总平均租差', value: '¥1,205.20', color: '#1e293b' },
      { label: '整租续约率', value: '82.4%', color: '#10b981' },
      { label: '合租续约率', value: '76.1%', color: '#f59e0b' },
    ]},
  { title: '当前出租率 / 空置率', type: 'rate' as const, rate: 31.75,
    stats: [
      { label: '总出租率', value: '31.75%' },
      { label: '月空置率', value: '68.25%' },
      { label: '租房', value: '30.2%' },
      { label: '储备', value: '35.1%' },
    ]},
  { title: '房间状态', type: 'stats' as const,
    stats: [
      { label: '未租', value: 561, color: '#f59e0b' },
      { label: '已租', value: 287, color: '#10b981' },
      { label: '配置', value: 12, color: '#3b82f6' },
      { label: '脏房', value: 8, color: '#ef4444' },
      { label: '已到期', value: 204, color: '#64748b' },
    ]},
];

// Group 2: 财务相关 (Finance)
const financeCards = [
  { title: '财务流水', type: 'stats' as const,
    stats: [
      { label: '今日待出纳', value: '¥0.00', color: '#94a3b8' },
      { label: '收入', value: '¥86,400', color: '#10b981' },
      { label: '支出', value: '¥32,100', color: '#ef4444' },
      { label: '未出纳', value: '0笔', color: '#64748b' },
      { label: '终审待审', value: '0笔', color: '#3b82f6' },
    ]},
  { title: '押金统计', type: 'stats' as const,
    stats: [
      { label: '房东押金', value: '¥10.83万', color: '#3b82f6' },
      { label: '租客押金', value: '¥51.40万', color: '#8b5cf6' },
      { label: '押金差', value: '-¥40.57万', color: '#ef4444' },
    ]},
  { title: '剩余价值 / 负债', type: 'stats' as const,
    stats: [
      { label: '剩余价值', value: '¥1,480.14万', color: '#1e293b' },
      { label: '租房', value: '¥980.20万', color: '#3b82f6' },
      { label: '储备', value: '¥499.94万', color: '#f59e0b' },
    ]},
];

// Group 3: 合同相关 (Contract)
const contractCards = [
  { title: '合同管理', type: 'stats' as const,
    stats: [
      { label: '待签字', value: 170, color: '#f59e0b' },
      { label: '在租中', value: 287, color: '#10b981' },
      { label: '将到期', value: 4, color: '#ef4444' },
      { label: '已到期', value: 204, color: '#64748b' },
    ]},
  { title: '行政审批', type: 'stats' as const,
    stats: [
      { label: '待我处理', value: 0, color: '#94a3b8' },
      { label: '我发起的', value: 0, color: '#94a3b8' },
      { label: '平均耗时', value: '4.2h', color: '#3b82f6' },
    ]},
  { title: '业务审批', type: 'stats' as const,
    stats: [
      { label: '待我处理', value: 136, color: '#ef4444' },
      { label: '我发起的', value: 167, color: '#3b82f6' },
      { label: '总数', value: 303, color: '#1e293b' },
    ]},
];

// Group 4: 风险预警 (Risk Warning)
const riskCards = [
  { title: '空置预警', type: 'vacancy' as const, totalVacant: 561,
    items: [
      { label: '0-7天', value: 82, color: '#3b82f6' },
      { label: '8-15天', value: 66, color: '#3b82f6' },
      { label: '16-30天', value: 94, color: '#3b82f6' },
      { label: '31-90天', value: 201, color: '#3b82f6' },
      { label: '90天以上', value: 118, color: '#ef4444' },
    ]},
  { title: '智能设备', type: 'stats' as const,
    stats: [
      { label: '在线', value: 4, color: '#10b981' },
      { label: '离线', value: 0, color: '#94a3b8' },
      { label: '低电量', value: 0, color: '#94a3b8' },
      { label: '门锁', value: 2, color: '#3b82f6' },
      { label: '水表', value: 2, color: '#8b5cf6' },
    ]},
];

// Group 5: 房东相关 (Landlord)
const landlordCards = [
  { title: '房东缺失统计', type: 'stats' as const,
    stats: [
      { label: '无装修图', value: 152, color: '#ef4444' },
      { label: '无证件', value: 151, color: '#ef4444' },
      { label: '无合同照', value: 152, color: '#ef4444' },
      { label: '无房产证', value: 150, color: '#ef4444' },
    ]},
  { title: '房东状态', type: 'stats' as const,
    stats: [
      { label: '冻结', value: 0, color: '#94a3b8' },
      { label: '已到期', value: 77, color: '#f59e0b' },
    ]},
];

// Group 6: 我的工作 (My Work)
const workCards = [
  { title: '我的待办', type: 'todo' as const, count: 38,
    todos: [
      { text: '审批：租客合同续签申请', priority: 'high' as const },
      { text: '巡房：建外SOHO 3-501逾期', priority: 'urgent' as const },
      { text: '反馈：租客报修已回复', priority: 'medium' as const },
      { text: '审批：房源信息变更申请', priority: 'low' as const },
      { text: '巡房：张江店A栋拟到期巡检', priority: 'medium' as const },
    ]},
  { title: '最新公告', type: 'announcement' as const,
    announcements: [
      { text: '关于开展2026年第三季度房源盘点工作的通知', date: '2026-08-25', tag: '公告' as const },
      { text: '平台战略合作单位招募通知', date: '2026-08-22', tag: '活动' as const },
    ]},
];

const vacancyMax = 201;

// ─── Lifecycle ─────────────────────────────────────────────
onMounted(() => {
  setTimeout(() => { loading.value = false; }, 300);
});
</script>

<template>
  <div class="dashboard" :class="{ loading }">
    <div v-if="loading" class="dash-loading">加载中...</div>
    <template v-else>
      <!-- ═══ Top Row: User Card + Banner + Quick Access ═══ -->
      <div class="dash-top-row">
        <!-- User Greeting Card -->
        <div class="user-card">
          <div class="uc-avatar">{{ userName[0] }}</div>
          <div class="uc-info">
            <div class="uc-greeting">{{ userName }}, 下午好~</div>
            <div class="uc-detail">{{ userStore }} · {{ userRole }} · {{ userPhone }}</div>
            <div class="uc-actions">
              <button class="uc-btn" @click="router.push('/house/wizard')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5v14"/></svg>
                录入租房
              </button>
              <button class="uc-btn" @click="router.push('/house/wizard?sale=1')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5v14"/></svg>
                录入售房
              </button>
              <button class="uc-btn" @click="router.push('/house/wizard?type=reserve')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5v14"/></svg>
                录入储备
              </button>
            </div>
          </div>
        </div>

        <!-- CMS Banner -->
        <div class="cms-banner">
          <div class="banner-bg"></div>
          <div class="banner-content">
            <div class="banner-title">平台战略合作单位 · 月度排行榜 · 活动方案</div>
            <div class="banner-desc">8 类合作渠道与联系方式，内容由 CMS 配置</div>
            <button class="banner-btn">查看合作渠道</button>
          </div>
        </div>

        <!-- Quick Access -->
        <div class="quick-access">
          <div class="qa-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            <span class="qa-title">快捷入口</span>
            <a class="qa-edit" href="#">编辑</a>
          </div>
          <div class="qa-grid">
            <button class="qa-item" @click="router.push('/workflow/todo')">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.8"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
              待办审批
            </button>
            <button class="qa-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              系统公告
            </button>
            <button class="qa-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="1.8"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9z"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9z"/><path d="M4 22h16"/><path d="M10 22V2l4 4-4 4"/></svg>
              业绩排行榜
            </button>
          </div>
        </div>
      </div>

      <!-- ═══ Middle Row: KPI 5-card + Ranking ═══ -->
      <div class="dash-mid-row">
        <div class="section-card data-overview">
          <div class="section-header-custom">
            <div class="sh-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              数据概览 · 我的数据
            </div>
            <div class="sh-tabs">
              <button v-for="tab in tabOptions" :key="tab" class="sh-tab" :class="{ active: activeTab === tab }" @click="activeTab = tab">{{ tab }}</button>
            </div>
          </div>
          <div class="kpi-grid">
            <KpiCard
              v-for="(k, i) in kpiData" :key="i"
              :label="k.label" :value="k.value" :unit="k.unit"
              :trend="k.trend" :color="k.color" :sparkline="k.spark"
            />
          </div>
        </div>
        <RankListCmp :items="rankingData" :max-score="100000" />
      </div>

      <!-- ═══ Financial Warning Section ═══ -->
      <div class="dash-section">
        <div class="section-header-custom">
          <div class="sh-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            财务到期预警 · 租客
          </div>
          <span class="sh-meta">实时刷新 ≤ 5min</span>
        </div>
        <div class="warning-grid">
          <WarningCardCmp
            v-for="(w, i) in tenantWarnings" :key="'t-'+i"
            :title="w.title" :value="w.value" :meta="w.meta"
            :border-color="w.borderColor"
            :is-zero="w.zero || false"
            :is-over-threshold="w.overThreshold || false"
          />
        </div>
      </div>

      <div class="dash-section">
        <div class="section-header-custom">
          <div class="sh-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            财务到期预警 · 房东
          </div>
          <span class="sh-meta">零值灰显 / 超阈值标红</span>
        </div>
        <div class="warning-grid">
          <WarningCardCmp
            v-for="(w, i) in landlordWarnings" :key="'l-'+i"
            :title="w.title" :value="w.value" :meta="w.meta"
            :border-color="w.borderColor"
            :is-zero="w.zero || false"
            :is-over-threshold="w.overThreshold || false"
          />
        </div>
      </div>

      <!-- ═══ Large Cards Grid (6 groups) ═══ -->
      <div class="dash-section">
        <div class="section-header-custom">
          <div class="sh-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            房源相关（4 张）
          </div>
        </div>
        <div class="large-grid four-col">
          <!-- Housing Overview -->
          <LargeCard v-for="(card, i) in housingCards" :key="'h-'+i" :title="card.title">
            <!-- Type: overview -->
            <div v-if="card.type === 'overview'" class="stat-grid cols-3">
              <div v-for="(s, si) in card.stats" :key="si" class="stat-box">
                <div class="stat-value" :style="{color: s.color}">{{ s.value }}</div>
                <div class="stat-label">{{ s.label }}</div>
              </div>
            </div>
            <!-- Type: stats -->
            <div v-else-if="card.type === 'stats'" class="stat-grid" :class="'cols-' + card.stats.length">
              <div v-for="(s, si) in card.stats" :key="si" class="stat-box">
                <div class="stat-value" :style="{color: s.color || '#1e293b'}">{{ s.value }}</div>
                <div class="stat-label">{{ s.label }}</div>
              </div>
            </div>
            <!-- Type: rate (with donut indicator) -->
            <div v-else-if="card.type === 'rate'" class="rate-layout">
              <div class="rate-stats">
                <div v-for="(s, si) in card.stats" :key="si" class="stat-box">
                  <div class="stat-value">{{ s.value }}</div>
                  <div class="stat-label">{{ s.label }}</div>
                </div>
              </div>
              <div class="rate-ring">
                <svg width="80" height="80" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f4f9" stroke-width="3"/>
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#3b82f6" stroke-width="3"
                    stroke-dasharray="97.4" stroke-dashoffset="97.4 - 97.4 * {{ card.rate / 100 }}"
                    stroke-linecap="round" transform="rotate(-90 18 18)"/>
                </svg>
                <div class="rate-ring-text">
                  <span class="rate-ring-val">{{ card.rate }}%</span>
                  <span class="rate-ring-label">总出租率</span>
                </div>
              </div>
            </div>
          </LargeCard>
        </div>
      </div>

      <!-- Finance Group -->
      <div class="dash-section">
        <div class="section-header-custom">
          <div class="sh-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>
            财务相关（3 张）
          </div>
        </div>
        <div class="large-grid three-col">
          <LargeCard v-for="(card, i) in financeCards" :key="'f-'+i" :title="card.title">
            <div class="stat-grid" :class="'cols-' + card.stats.length">
              <div v-for="(s, si) in card.stats" :key="si" class="stat-box">
                <div class="stat-value" :style="{color: s.color || '#1e293b'}">{{ s.value }}</div>
                <div class="stat-label">{{ s.label }}</div>
              </div>
            </div>
          </LargeCard>
        </div>
      </div>

      <!-- Contract Group -->
      <div class="dash-section">
        <div class="section-header-custom">
          <div class="sh-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            合同相关（3 张）
          </div>
        </div>
        <div class="large-grid three-col">
          <LargeCard v-for="(card, i) in contractCards" :key="'c-'+i" :title="card.title">
            <div class="stat-grid" :class="'cols-' + card.stats.length">
              <div v-for="(s, si) in card.stats" :key="si" class="stat-box">
                <div class="stat-value" :style="{color: s.color || '#1e293b'}">{{ s.value }}</div>
                <div class="stat-label">{{ s.label }}</div>
              </div>
            </div>
          </LargeCard>
        </div>
      </div>

      <!-- Risk Warning Group + Chart Section -->
      <div class="dash-section">
        <div class="section-header-custom">
          <div class="sh-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            风险预警（2 张）
          </div>
        </div>
        <div class="large-grid two-col">
          <!-- Vacancy Warning -->
          <LargeCard :title="riskCards[0].title">
            <div class="vacancy-card">
              <div class="vacancy-total">
                <span class="vacancy-num">{{ riskCards[0].totalVacant }}</span>
                <span class="vacancy-label">累计空置</span>
              </div>
              <div class="vacancy-list">
                <div v-for="(item, vi) in riskCards[0].items" :key="vi" class="vacancy-row">
                  <span class="vacancy-name">{{ item.label }}</span>
                  <div class="vacancy-bar-track">
                    <div class="vacancy-bar-fill" :style="{ width: (item.value / vacancyMax * 100) + '%', background: item.color }"></div>
                  </div>
                  <span class="vacancy-val">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </LargeCard>

          <!-- Smart Devices -->
          <LargeCard :title="riskCards[1].title">
            <div class="stat-grid cols-5">
              <div v-for="(s, si) in riskCards[1].stats" :key="si" class="stat-box">
                <div class="stat-value" :style="{color: s.color}">{{ s.value }}</div>
                <div class="stat-label">{{ s.label }}</div>
              </div>
            </div>
          </LargeCard>
        </div>
      </div>

      <!-- Landlord Group -->
      <div class="dash-section">
        <div class="section-header-custom">
          <div class="sh-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            房东相关（2 张）
          </div>
        </div>
        <div class="large-grid two-col">
          <LargeCard v-for="(card, i) in landlordCards" :key="'ll-'+i" :title="card.title">
            <div class="stat-grid cols-4" v-if="i === 0">
              <div v-for="(s, si) in card.stats" :key="si" class="stat-box">
                <div class="stat-value" :style="{color: s.color}">{{ s.value }}<span class="stat-unit">间</span></div>
                <div class="stat-label">{{ s.label }}</div>
              </div>
            </div>
            <div class="stat-grid cols-2" v-else>
              <div v-for="(s, si) in card.stats" :key="si" class="stat-box">
                <div class="stat-value" :style="{color: s.color}">{{ s.value }}<span class="stat-unit">间</span></div>
                <div class="stat-label">{{ s.label }}</div>
              </div>
            </div>
          </LargeCard>
        </div>
      </div>

      <!-- My Work Group -->
      <div class="dash-section">
        <div class="section-header-custom">
          <div class="sh-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            我的工作（2 张）
          </div>
        </div>
        <div class="large-grid two-col">
          <!-- My Todos -->
          <LargeCard :title="'我的待办 (' + workCards[0].count + ')'">
            <div class="todo-list">
              <div v-for="(t, ti) in workCards[0].todos" :key="ti" class="todo-item">
                <span class="todo-priority" :class="t.priority"></span>
                <span class="todo-text">{{ t.text }}</span>
              </div>
              <a class="todo-more" href="#">查看全部 {{ workCards[0].count }} 项 &gt;</a>
            </div>
          </LargeCard>

          <!-- Announcements -->
          <LargeCard title="最新公告">
            <div class="announce-list">
              <div v-for="(a, ai) in workCards[1].announcements" :key="ai" class="announce-item">
                <span class="announce-tag" :class="a.tag === '公告' ? 'tag-blue' : 'tag-orange'">{{ a.tag }}</span>
                <div class="announce-content">
                  <div class="announce-title">{{ a.text }}</div>
                  <div class="announce-date">{{ a.date }}</div>
                </div>
              </div>
              <div class="announce-item">
                <span class="announce-tag tag-blue">公告</span>
                <div class="announce-content">
                  <div class="announce-title">关于优化门店巡检流程的通知</div>
                  <div class="announce-date">2026-08-20</div>
                </div>
              </div>
              <div class="announce-item">
                <span class="announce-tag tag-orange">活动</span>
                <div class="announce-content">
                  <div class="announce-title">2026年秋季房源推介会预告</div>
                  <div class="announce-date">2026-08-18</div>
                </div>
              </div>
              <a class="announce-more" href="#">查看更多 &gt;</a>
            </div>
          </LargeCard>
        </div>
      </div>

      <!-- ═══ Monthly Chart Section ═══ -->
      <div class="dash-section">
        <div class="section-header-custom">
          <div class="sh-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>
            月度收支趋势
          </div>
        </div>
        <div class="chart-card">
          <VChart class="dash-chart" :option="monthlyOption" autoresize />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
/* ═══════════════════════════════════════════════════════════════
   Dashboard Layout - Matching UI Design (01-home.png)
   ═══════════════════════════════════════════════════════════════ */

.dashboard {
  padding-bottom: 32px;
}
.dash-loading {
  padding: 80px 0; text-align: center; color: #94a3b8;
}

/* ─── Top Row ─── */
.dash-top-row {
  display: grid;
  grid-template-columns: 1fr 1.2fr 0.8fr;
  gap: 14px;
  margin-bottom: 16px;
}

/* User Card */
.user-card {
  background: #fff;
  border: 1px solid #e4e9f0;
  border-radius: 10px;
  padding: 18px;
  display: flex;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(16,24,40,0.07);
}
.uc-avatar {
  width: 46px; height: 46px; border-radius: 50%;
  background: linear-gradient(135deg, #4d8bff, #2e6bf0);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700;
  flex: none;
  box-shadow: 0 4px 12px -2px rgba(46,107,240,0.4);
}
.uc-info { flex: 1; min-width: 0; }
.uc-greeting { font-size: 16px; font-weight: 700; color: #1e293b; }
.uc-detail { font-size: 12px; color: #64748b; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.uc-actions {
  display: flex; gap: 7px; margin-top: 10px;
}
.uc-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 12px; border-radius: 999px;
  font-size: 11.5px; font-weight: 600; color: #3b82f6;
  background: #eff6ff; border: 1px solid #bfdbfe;
  transition: all 0.15s;
}
.uc-btn:hover { background: #dbeafe; }

/* CMS Banner */
.cms-banner {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(135deg, #1a365d 0%, #1e4976 50%, #2563eb 100%);
  padding: 22px 24px;
  display: flex; flex-direction: column; justify-content: space-between;
}
.banner-bg { display: none; }
.banner-content { position: relative; z-index: 1; }
.banner-title { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.banner-desc { font-size: 12px; color: rgba(255,255,255,0.7); margin-bottom: 12px; }
.banner-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 16px; border-radius: 999px;
  font-size: 12px; font-weight: 600;
  background: rgba(255,255,255,0.15); color: #fff;
  border: 1px solid rgba(255,255,255,0.25);
  backdrop-filter: blur(4px);
  transition: all 0.15s;
}
.banner-btn:hover { background: rgba(255,255,255,0.25); }

/* Quick Access */
.quick-access {
  background: #fff;
  border: 1px solid #e4e9f0;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(16,24,40,0.07);
}
.qa-header {
  display: flex; align-items: center; gap: 7px;
  margin-bottom: 12px;
}
.qa-title { font-size: 14px; font-weight: 700; color: #1e293b; flex: 1; }
.qa-edit { font-size: 11px; color: #3b82f6; text-decoration: none; }
.qa-edit:hover { text-decoration: underline; }
.qa-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
}
.qa-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 14px 6px; border-radius: 8px; border: 1px solid #f1f4f9;
  background: #fafbfc; font-size: 11.5px; color: #475569; font-weight: 600;
  transition: all 0.15s;
}
.qa-item:hover { border-color: #bfdbfe; background: #eff6ff; color: #3b82f6; }

/* ─── Middle Row: Data Overview + Ranking ─── */
.dash-mid-row {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 14px;
  margin-bottom: 16px;
}

/* Section Header */
.section-header-custom {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.sh-title {
  display: flex; align-items: center; gap: 7px;
  font-size: 14px; font-weight: 700; color: #1e293b;
}
.sh-tabs {
  display: flex; gap: 6px;
}
.sh-tab {
  padding: 4px 14px; border-radius: 999px;
  font-size: 12px; color: #64748b; background: #fff;
  border: 1px solid #e4e9f0;
  transition: all 0.15s;
}
.sh-tab.active {
  background: linear-gradient(180deg, #3d7bff, #2e6bf0);
  color: #fff; border-color: transparent;
  font-weight: 600;
  box-shadow: 0 3px 8px -2px rgba(46,107,240,0.4);
}
.sh-tab:hover:not(.active) { border-color: #3b82f6; color: #3b82f6; }
.sh-meta { font-size: 11px; color: #94a3b8; }

/* Section card */
.section-card {
  background: #fff;
  border: 1px solid #e4e9f0;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(16,24,40,0.07);
}

/* KPI Grid (5 items) */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.data-overview .kpi-grid {
  // inside data-overview card
}

/* ─── Warning Grid (6 items) ─── */
.warning-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

/* ─── Sections ─── */
.dash-section {
  margin-bottom: 20px;
}

/* ─── Large Card Grids ─── */
.large-grid {
  display: grid;
  gap: 12px;
}
.large-grid.four-col {
  grid-template-columns: repeat(4, 1fr);
}
.large-grid.three-col {
  grid-template-columns: repeat(3, 1fr);
}
.large-grid.two-col {
  grid-template-columns: repeat(2, 1fr);
}

/* Stat Grid inside cards */
.stat-grid {
  display: grid;
  gap: 10px;
}
.stat-grid.cols-5 { grid-template-columns: repeat(5, 1fr); }
.stat-grid.cols-4 { grid-template-columns: repeat(4, 1fr); }
.stat-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
.stat-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }

.stat-box {
  text-align: center;
  padding: 6px 4px;
}
.stat-value {
  font-family: var(--font-num);
  font-size: 18px; font-weight: 700; color: #1e293b;
  line-height: 1.2;
}
.stat-unit { font-size: 11px; color: #94a3b8; font-weight: 500; margin-left: 2px; }
.stat-label { font-size: 11px; color: #94a3b8; margin-top: 2px; }

/* Rate layout (donut + stats) */
.rate-layout {
  display: flex; align-items: center; gap: 16px;
}
.rate-stats {
  flex: 1;
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.rate-ring {
  flex: none; position: relative;
  width: 80px; height: 80px;
}
.rate-ring-text {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.rate-ring-val {
  font-family: var(--font-num);
  font-size: 14px; font-weight: 700; color: #1e293b;
}
.rate-ring-label {
  font-size: 8px; color: #94a3b8; margin-top: 1px;
}

/* Vacancy Warning */
.vacancy-card {
  display: flex; flex-direction: column; gap: 10px;
}
.vacancy-total {
  display: flex; align-items: baseline; gap: 6px;
}
.vacancy-num {
  font-family: var(--font-num);
  font-size: 26px; font-weight: 700; color: #1e293b;
}
.vacancy-label { font-size: 12px; color: #64748b; }
.vacancy-list { display: flex; flex-direction: column; gap: 7px; }
.vacancy-row {
  display: flex; align-items: center; gap: 8px;
}
.vacancy-name { font-size: 11.5px; color: #64748b; width: 60px; flex: none; }
.vacancy-bar-track {
  flex: 1; height: 6px; background: #f1f4f9; border-radius: 3px; overflow: hidden;
}
.vacancy-bar-fill {
  height: 100%; border-radius: 3px; transition: width 0.4s ease;
}
.vacancy-val {
  font-family: var(--font-num);
  font-size: 12px; font-weight: 600; color: #1e293b;
  width: 30px; text-align: right;
}

/* Todo List */
.todo-list {
  display: flex; flex-direction: column; gap: 8px;
}
.todo-item {
  display: flex; align-items: center; gap: 8px;
  font-size: 12.5px; color: #475569;
  cursor: default;
}
.todo-priority {
  width: 6px; height: 6px; border-radius: 50%; flex: none;
}
.todo-priority.urgent { background: #ef4444; }
.todo-priority.high { background: #f59e0b; }
.todo-priority.medium { background: #3b82f6; }
.todo-priority.low { background: #94a3b8; }
.todo-text { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.todo-more {
  font-size: 11.5px; color: #3b82f6; text-decoration: none; margin-top: 4px; display: inline-block;
}
.todo-more:hover { text-decoration: underline; }

/* Announcement List */
.announce-list {
  display: flex; flex-direction: column; gap: 10px;
}
.announce-item {
  display: flex; gap: 8px; align-items: flex-start;
}
.announce-tag {
  padding: 2px 7px; border-radius: 4px;
  font-size: 10px; font-weight: 700; flex: none; margin-top: 1px;
}
.tag-blue { background: #eff6ff; color: #3b82f6; }
.tag-orange { background: #fffbeb; color: #f59e0b; }
.announce-content { flex: 1; min-width: 0; }
.announce-title {
  font-size: 12.5px; color: #334155; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.announce-date { font-size: 10.5px; color: #94a3b8; margin-top: 1px; }
.announce-more {
  font-size: 11.5px; color: #3b82f6; text-decoration: none; margin-top: 4px; display: inline-block;
}
.announce-more:hover { text-decoration: underline; }

/* Chart Card */
.chart-card {
  background: #fff; border: 1px solid #e4e9f0; border-radius: 10px;
  padding: 18px; box-shadow: 0 1px 3px rgba(16,24,40,0.07);
}
.dash-chart {
  width: 100%; height: 300px;
}
</style>