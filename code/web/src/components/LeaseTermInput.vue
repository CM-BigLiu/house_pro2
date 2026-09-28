<script setup lang="ts">
import { reactive, watch } from 'vue';
import { leaseDuration, leaseEnd } from '@/utils/rental-schedule';
const props = defineProps<{ start: string; end: string }>();
const emit = defineEmits<{ 'update:end': [string] }>();
const term = reactive({ years: 0, months: 0, days: 0 });
watch(() => [props.start, props.end], () => Object.assign(term, leaseDuration(props.start, props.end)), { immediate: true });
function update() { const end = leaseEnd(props.start, term); if (end) emit('update:end', end); }
function preset(years: number) { Object.assign(term, { years, months: 0, days: 0 }); update(); }
</script>
<template>
  <el-form-item label="合同期限">
    <div class="lease-term">
      <label><el-input-number v-model="term.years" :min="0" :max="10" :precision="0" controls-position="right" @change="update" />年</label>
      <label><el-input-number v-model="term.months" :min="0" :max="11" :precision="0" controls-position="right" @change="update" />月</label>
      <label><el-input-number v-model="term.days" :min="0" :max="31" :precision="0" controls-position="right" @change="update" />天</label>
      <el-button :disabled="!start" @click="preset(3)">3年</el-button><el-button :disabled="!start" @click="preset(5)">5年</el-button>
    </div>
  </el-form-item>
</template>
<style scoped>
.lease-term { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.lease-term label { display:flex; align-items:center; gap:5px; }
.lease-term :deep(.el-input-number) { width:88px; }
</style>
