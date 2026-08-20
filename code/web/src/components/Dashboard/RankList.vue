<script setup lang="ts">
defineProps<{
  title: string;
  items: { name: string; value: number; unit?: string }[];
  color?: 'blue' | 'green' | 'orange' | 'purple';
}>();
</script>

<template>
  <div class="rank-card">
    <div class="rank-title">{{ title }}</div>
    <div class="rank-list">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="rank-item"
      >
        <div class="rank-left">
          <span class="rank-no" :class="{ top: index < 3 }">{{ index + 1 }}</span>
          <span class="rank-name">{{ item.name }}</span>
        </div>
        <div class="rank-value" :class="`color-${color || 'blue'}`">
          {{ item.value }}<span v-if="item.unit" class="rank-unit">{{ item.unit }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.rank-card {
  background: #fff;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow-sm);
}
.rank-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-900);
  margin-bottom: 12px;
}
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rank-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.rank-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rank-no {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-500);
  background: var(--ink-100);
  &.top {
    background: var(--primary);
    color: #fff;
  }
}
.rank-name {
  font-size: 13px;
  color: var(--ink-700);
}
.rank-value {
  font-family: var(--font-num);
  font-size: 14px;
  font-weight: 700;
  &.color-blue { color: var(--primary); }
  &.color-green { color: var(--success); }
  &.color-orange { color: var(--warning); }
  &.color-purple { color: var(--purple); }
}
.rank-unit {
  font-size: 11px;
  font-weight: 500;
  color: var(--ink-400);
  margin-left: 2px;
}
</style>
