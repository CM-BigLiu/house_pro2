<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  title: string;
  value: string | number;
  meta: string;
  borderColor: 'red' | 'blue' | 'orange' | 'green';
  isZero?: boolean;
  isOverThreshold?: boolean;
}>(), { borderColor: 'blue', isZero: false, isOverThreshold: false });

const borderColorMap: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  orange: '#f59e0b',
  green: '#10b981',
};

const valueColor = computed(() => {
  if (props.isOverThreshold) return '#ef4444';
  if (props.isZero) return '#94a3b8';
  return '#1e293b';
});
</script>

<template>
  <div class="warning-card" :style="{ borderLeftColor: borderColorMap[borderColor] }">
    <div class="wc-title">{{ title }}</div>
    <div class="wc-value" :style="{ color: valueColor }">{{ value }}</div>
    <div class="wc-meta">{{ meta }}</div>
    <a class="wc-link" href="#">详情 &gt;</a>
  </div>
</template>

<style scoped>
.warning-card {
  background: #fff;
  border: 1px solid #e4e9f0;
  border-left: 3px solid #3b82f6;
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  transition: box-shadow 0.15s;
}
.warning-card:hover {
  box-shadow: 0 2px 8px rgba(16,24,40,0.08);
}
.wc-title {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wc-value {
  font-family: var(--font-num);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
}
.wc-meta {
  font-size: 11px;
  color: #94a3b8;
}
.wc-link {
  font-size: 11px;
  color: #3b82f6;
  margin-top: auto;
  text-decoration: none;
  align-self: flex-start;
}
.wc-link:hover {
  text-decoration: underline;
}
</style>