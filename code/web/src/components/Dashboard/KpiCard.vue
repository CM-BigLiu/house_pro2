<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple';
}>();
</script>

<template>
  <div class="kpi-card">
    <div class="kpi-label">{{ label }}</div>
    <div class="kpi-value" :class="`color-${color || 'blue'}`">
      <span class="num">{{ value }}</span>
      <span v-if="unit" class="unit">{{ unit }}</span>
    </div>
    <div v-if="trend !== undefined" class="kpi-trend">
      <span :class="trend >= 0 ? 'up' : 'down'">{{ trend >= 0 ? '↑' : '↓' }} {{ Math.abs(trend) }}%</span>
      <span class="trend-label">{{ trendLabel }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kpi-card {
  background: #fff;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius);
  padding: 18px 18px 16px;
  box-shadow: var(--shadow-sm);
}
.kpi-label {
  font-size: 12.5px;
  color: var(--ink-500);
  margin-bottom: 8px;
}
.kpi-value {
  font-family: var(--font-num);
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  &.color-blue { color: var(--primary); }
  &.color-green { color: var(--success); }
  &.color-orange { color: var(--warning); }
  &.color-purple { color: var(--purple); }
  .unit {
    font-size: 13px;
    font-weight: 500;
    margin-left: 4px;
    color: var(--ink-500);
  }
}
.kpi-trend {
  margin-top: 8px;
  font-size: 12px;
  .up { color: var(--success); font-weight: 600; }
  .down { color: var(--danger); font-weight: 600; }
  .trend-label {
    color: var(--ink-400);
    margin-left: 6px;
  }
}
</style>
