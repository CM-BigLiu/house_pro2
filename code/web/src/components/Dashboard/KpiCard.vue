<script setup lang="ts">
withDefaults(defineProps<{
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  color?: 'pink' | 'yellow' | 'green' | 'blue' | 'purple';
  sparkline?: number[];
}>(), { color: 'blue' });

const colorMap: Record<string, { bg: string; bar: string; grad: string }> = {
  pink:  { bg: '#fff0f5', bar: '#f472b6', grad: 'linear-gradient(180deg, #fce7f3 0%, #fff0f5 100%)' },
  yellow:{ bg: '#fffbeb', bar: '#f59e0b', grad: 'linear-gradient(180deg, #fef3c7 0%, #fffbeb 100%)' },
  green: { bg: '#ecfdf5', bar: '#10b981', grad: 'linear-gradient(180deg, #d1fae5 0%, #ecfdf5 100%)' },
  blue:  { bg: '#eff6ff', bar: '#3b82f6', grad: 'linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%)' },
  purple:{ bg: '#f5f3ff', bar: '#8b5cf6', grad: 'linear-gradient(180deg, #ede9fe 0%, #f5f3ff 100%)' },
};

function slPoints(d: number[], w: number, h: number): string {
  const len = d.length;
  if (len < 2) return '';
  return d.map((v, i) => `${(i * w) / (len - 1)},${h - (v / 100) * (h - 4)}`).join(' ');
}
</script>

<template>
  <div class="kpi-card" :style="{ background: colorMap[color].grad }">
    <div class="kpi-bar" :style="{ background: colorMap[color].bar }"></div>
    <div class="kpi-label">{{ label }}</div>
    <div class="kpi-value">
      {{ value }}<span v-if="unit" class="kpi-unit">{{ unit }}</span>
    </div>
    <div v-if="trend !== undefined" class="kpi-trend" :class="trend >= 0 ? 'up' : 'down'">
      {{ trend >= 0 ? '↑' : '↓' }}{{ Math.abs(trend) }}%
      <span v-if="trendLabel" class="kpi-trend-label">{{ trendLabel }}</span>
    </div>
    <svg v-if="sparkline && sparkline.length > 0" class="kpi-spark" viewBox="0 0 120 28" width="120" height="28">
      <defs>
        <linearGradient :id="'sg-' + color" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="colorMap[color].bar" stop-opacity="0.25"/>
          <stop offset="100%" :stop-color="colorMap[color].bar" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polyline :points="slPoints(sparkline, 120, 28)" fill="none" :stroke="colorMap[color].bar" stroke-width="2" stroke-linecap="round"/>
      <polygon :points="slPoints(sparkline, 120, 28) + ' 120 28 0 28'" :fill="'url(#sg-' + color + ')'"/>
    </svg>
  </div>
</template>

<style scoped>
.kpi-card {
  position: relative;
  border-radius: 8px;
  padding: 16px 16px 12px;
  min-height: 108px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.kpi-bar {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; border-radius: 0 3px 3px 0;
}
.kpi-label {
  font-size: 12px; color: #64748b;
  margin-bottom: 4px; padding-left: 4px;
}
.kpi-value {
  font-family: var(--font-num);
  font-size: 22px; font-weight: 700;
  color: #1e293b;
  line-height: 1.2; padding-left: 4px;
}
.kpi-unit {
  font-size: 12px; color: #94a3b8;
  font-weight: 500; margin-left: 3px;
}
.kpi-trend {
  font-size: 11px; font-weight: 600;
  margin-top: 2px; padding-left: 4px;
}
.kpi-trend.up { color: #10b981; }
.kpi-trend.down { color: #ef4444; }
.kpi-trend-label { color: #94a3b8; font-weight: 400; margin-left: 4px; }
.kpi-spark {
  margin-top: auto; flex: none;
  align-self: flex-end; margin-right: -4px;
  opacity: 0.7;
}
</style>