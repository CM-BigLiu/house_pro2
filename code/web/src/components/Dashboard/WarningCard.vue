<script setup lang="ts">
defineProps<{
  title: string;
  value: number;
  label: string;
  color: 'red' | 'orange' | 'blue' | 'green';
}>();

const colorClass: Record<string, string> = {
  red: 'pill-red',
  orange: 'pill-orange',
  blue: 'pill-blue',
  green: 'pill-green',
};
</script>

<template>
  <div class="warning-card">
    <div class="warning-title">{{ title }}</div>
    <div class="warning-main">
      <span class="warning-value">{{ value }}</span>
      <span :class="['pill', colorClass[color]]">{{ label }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.warning-card {
  background: #fff;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow-sm);
}
.warning-title {
  font-size: 12.5px;
  color: var(--ink-500);
  margin-bottom: 10px;
}
.warning-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.warning-value {
  font-family: var(--font-num);
  font-size: 24px;
  font-weight: 700;
  color: var(--ink-900);
}
</style>
