<script setup lang="ts">
withDefaults(defineProps<{
  title: string;
}>(), {});

// LargeCard is a container: renders header + default slot for stat grid content
</script>

<template>
  <div class="large-card">
    <div class="lc-header">
      <div class="lc-title">{{ title }}</div>
      <a class="lc-more" href="#">详情 &gt;</a>
    </div>
    <div class="lc-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.large-card {
  background: #fff;
  border: 1px solid #e4e9f0;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(16,24,40,0.07);
  display: flex;
  flex-direction: column;
}
.lc-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f1f4f9;
}
.lc-title {
  font-size: 14px; font-weight: 700; color: #1e293b;
}
.lc-more {
  font-size: 12px; color: #3b82f6; text-decoration: none;
}
.lc-more:hover { text-decoration: underline; }
.lc-body {
  padding: 14px 16px;
  flex: 1;
}
</style>