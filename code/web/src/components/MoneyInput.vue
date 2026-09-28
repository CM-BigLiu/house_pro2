<script setup lang="ts">
import { ref, watch } from 'vue';
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ modelValue: number; unit?: string }>(), { unit: '元' });
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();
const text = ref('');
const valid = (value: string) => /^\d+(\.\d{1,2})?$/.test(value) && Number(value) <= 999999999999.99;
watch(() => props.modelValue, value => {
  if (Number.isFinite(value) && (!text.value || Number(text.value) !== value)) text.value = value.toFixed(2);
}, { immediate: true });
// 保留非法输入供表单提示，不能把负数或科学计数法静默改成其他金额。
function update(value: string) {
  text.value = value;
  emit('update:modelValue', valid(value) ? Number(value) : Number.NaN);
}
function blur() { if (valid(text.value)) text.value = Number(text.value).toFixed(2); }
</script>
<template>
  <el-input v-bind="$attrs" :model-value="text" inputmode="decimal" placeholder="0.00" maxlength="16"
    :aria-invalid="!!text && !valid(text)" @update:model-value="update" @blur="blur">
    <template #append>{{ unit }}</template>
  </el-input>
  <span v-if="text && !valid(text)" class="money-error" role="alert">请输入非负数字，最多两位小数</span>
</template>
<style scoped>
.money-error { color: var(--el-color-danger); font-size: 12px; line-height: 20px; }
</style>
