<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { DurationParts } from '@/utils/rental-schedule';
const props = defineProps<{ modelValue: number[]; start?: string }>();
const emit = defineEmits<{ 'update:modelValue': [number[]] }>();
/** 免租期统一按每月30天、每年360天折算，不随自然月长短变化。 */
const DAYS_PER_MONTH = 30, DAYS_PER_YEAR = 360;
const toDays = (parts: DurationParts) => (parts.years || 0) * DAYS_PER_YEAR + (parts.months || 0) * DAYS_PER_MONTH + (parts.days || 0);
const toParts = (value: number): DurationParts => {
  const days = Math.max(0, Math.floor(Number(value) || 0));
  return { years: Math.floor(days / DAYS_PER_YEAR), months: Math.floor((days % DAYS_PER_YEAR) / DAYS_PER_MONTH), days: days % DAYS_PER_MONTH };
};
const editing = ref(false), draft = ref<DurationParts[]>([]);
const total = computed(() => props.modelValue.reduce((sum, days) => sum + Number(days || 0), 0));
function edit() {
  draft.value = Array.from({ length: 5 }, (_, year) => toParts(props.modelValue[year] || 0));
  editing.value = true;
}
function save() {
  const days = draft.value.map(parts => toDays(parts));
  if (days.some(value => !Number.isInteger(value) || value < 0 || value > DAYS_PER_YEAR)) {
    ElMessage.warning('免租期每年最多360天（每月按30天计算）');
    return;
  }
  emit('update:modelValue', days);
  editing.value = false;
}
</script>
<template>
  <el-form-item label="累计免租期">
    <div class="free-summary">
      <span>分摊每年</span><strong>{{ total }} 天</strong>
      <el-button type="primary" :disabled="!start" @click="edit">编辑</el-button>
    </div>
  </el-form-item>
  <el-dialog v-model="editing" title="编辑年度免租期" width="min(620px,94vw)" append-to-body :close-on-click-modal="false">
    <p class="hint">每月按30天、每年按360天折算，免租从对应合同年度的开始日期计算。请先填写租赁开始日期。</p>
    <div v-for="(parts, year) in draft" :key="year" class="free-year">
      <span>第{{ year + 1 }}年</span>
      <label><el-input-number v-model="parts.years" :min="0" :max="1" :precision="0" controls-position="right" />年</label>
      <label><el-input-number v-model="parts.months" :min="0" :max="11" :precision="0" controls-position="right" />月</label>
      <label><el-input-number v-model="parts.days" :min="0" :max="360" :precision="0" controls-position="right" />天</label>
      <small>{{ toDays(parts) }}天</small>
    </div>
    <template #footer><el-button @click="editing = false">取消</el-button><el-button type="primary" @click="save">保存免租期</el-button></template>
  </el-dialog>
</template>
<style scoped>
.free-summary { display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
.free-summary > span { color:var(--ink-500); }
.free-year { display:flex; gap:12px; align-items:center; margin:18px 0; flex-wrap:wrap; }
.free-year label { display:flex; align-items:center; gap:5px; }
.free-year :deep(.el-input-number) { width:90px; }
.free-year small,.hint { color:var(--ink-500); }
</style>
