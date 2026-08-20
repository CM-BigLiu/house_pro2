<script setup lang="ts">
defineProps<{
  title: string;
  value: string | number;
  label?: string;
  icon?: any;
  color?: string;
}>();
</script>

<template>
  <div class="large-card">
    <div class="large-icon" :style="{ background: color || 'var(--primary-soft)' }">
      <component :is="icon" v-if="icon" :size="24" :color="color ? '#fff' : 'var(--primary)'" />
    </div>
    <div class="large-body">
      <div class="large-value">{{ value }}</div>
      <div class="large-title">{{ title }}</div>
      <div v-if="label" class="large-label">{{ label }}</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.large-card {
  background: #fff;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius);
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: var(--shadow-sm);
}
.large-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.large-body {
  flex: 1;
}
.large-value {
  font-family: var(--font-num);
  font-size: 22px;
  font-weight: 700;
  color: var(--ink-900);
}
.large-title {
  font-size: 12.5px;
  color: var(--ink-500);
  margin-top: 3px;
}
.large-label {
  font-size: 11px;
  color: var(--ink-400);
  margin-top: 6px;
}
</style>
