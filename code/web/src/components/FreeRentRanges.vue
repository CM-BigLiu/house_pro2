<script setup lang="ts">
import { computed } from 'vue';
import { freeRentDays, freeRentDiscount, type FreeRentRange } from '@/utils/free-rent';
import { formatDate } from '@/utils/rental-schedule';
import { formatMoney } from '@/utils/format';
const props = withDefaults(defineProps<{ modelValue?: FreeRentRange[]; start?: string; end?: string; rent?: number; label?: string; formProp?: string }>(), { modelValue: () => [], label: '免租期', formProp: 'freeRentRanges' });
const emit = defineEmits<{ 'update:modelValue': [FreeRentRange[]] }>();
const rows = computed(() => props.modelValue?.length ? props.modelValue : [{ start: '', end: '' }]);
const days = computed(() => freeRentDays(rows.value));
const discount = computed(() => freeRentDiscount(rows.value, props.start || '', props.end || '', Number(props.rent)));
function update(index: number, value: [string, string] | null) {
  const next = rows.value.map(range => ({ ...range }));
  next[index] = { start: value?.[0] || '', end: value?.[1] || '' }; emit('update:modelValue', next);
}
function add() { emit('update:modelValue', [...rows.value.map(range => ({ ...range })), { start: '', end: '' }]); }
function remove(index: number) { emit('update:modelValue', rows.value.filter((_range, i) => i !== index)); }
function disabledDate(date: Date) { const value = formatDate(date); return !!((props.start && value < props.start) || (props.end && value > props.end)); }
</script>
<template>
  <el-form-item :label="label" :prop="formProp" class="free-rent-field">
    <div class="free-rent-ranges">
      <div v-for="(range, index) in rows" :key="index" class="free-range-row">
        <el-date-picker :model-value="range.start && range.end ? [range.start, range.end] : null" type="daterange" value-format="YYYY-MM-DD"
          range-separator="至" start-placeholder="免租开始日期" end-placeholder="免租结束日期" :aria-label="`第${index + 1}段免租日期`" :disabled-date="disabledDate" @update:model-value="(value: [string, string] | null) => update(index, value)" />
        <el-button v-if="index === 0" plain type="primary" :disabled="rows.length >= 100" @click="add">＋ 添加区间</el-button>
        <el-button v-if="rows.length > 1 || range.start" link type="danger" :aria-label="`删除第${index + 1}段免租日期`" @click="remove(index)">删除</el-button>
      </div>
      <p class="free-rent-hint">起止日均免租，重叠日期只计算一次。<template v-if="days">累计 {{ days }} 天<template v-if="Number.isFinite(rent)">，预计减免 {{ formatMoney(discount) }}</template>。</template></p>
    </div>
  </el-form-item>
</template>
<style scoped>
.free-rent-ranges { width:100%; }
.free-range-row { display:flex; gap:10px; align-items:center; margin-bottom:10px; flex-wrap:wrap; }
.free-range-row :deep(.el-date-editor) { flex:1; min-width:280px; max-width:480px; }
.free-rent-hint { margin:0; font-size:12px; color:var(--ink-500); line-height:1.6; }
</style>
