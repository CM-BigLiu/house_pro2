<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { calendarMonths, durationDays, durationParts, type DurationParts } from '@/utils/rental-schedule';
const props = defineProps<{ modelValue: number[]; start?: string }>();
const emit = defineEmits<{ 'update:modelValue': [number[]] }>();
const editing = ref(false), draft = ref<DurationParts[]>([]);
const total = computed(() => props.modelValue.reduce((sum, days) => sum + Number(days || 0), 0));
const yearStart = (year: number) => props.start ? calendarMonths(props.start, year * 12) : '';
const yearDays = (year: number) => props.start ? durationDays({ years: 1, months: 0, days: 0 }, yearStart(year)) : 366;
function edit() {
  draft.value = Array.from({ length: 5 }, (_, year) => durationParts(props.modelValue[year] || 0, yearStart(year)));
  editing.value = true;
}
function save() {
  const days = draft.value.map((parts, year) => durationDays(parts, yearStart(year)));
  if (days.some((value, year) => !Number.isInteger(value) || value < 0 || value > yearDays(year))) {
    ElMessage.warning('免租期不能超过对应合同年的实际天数');
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
    <p class="hint">年、月按真实日历换算，免租从对应合同年度的开始日期计算。请先填写租赁开始日期。</p>
    <div v-for="(parts, year) in draft" :key="year" class="free-year">
      <span>第{{ year + 1 }}年</span>
      <label><el-input-number v-model="parts.years" :min="0" :max="1" :precision="0" controls-position="right" />年</label>
      <label><el-input-number v-model="parts.months" :min="0" :max="11" :precision="0" controls-position="right" />月</label>
      <label><el-input-number v-model="parts.days" :min="0" :max="366" :precision="0" controls-position="right" />天</label>
      <small>{{ durationDays(parts, yearStart(year)) }}天</small>
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
