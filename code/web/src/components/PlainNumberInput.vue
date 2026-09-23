<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  modelValue?: unknown;
  min?: number;
  max?: number;
  precision?: number;
  step?: number;
  disabled?: boolean;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: number | undefined] }>();

const asText = (value: unknown) => value === null || value === undefined ? '' : String(value);
const text = ref(asText(props.modelValue));
const inputStep = computed(() => props.step ?? (props.precision === undefined ? 'any' : 10 ** -props.precision));

watch(() => props.modelValue, (value) => {
  const next = asText(value);
  // Keep an in-progress decimal such as "1." while the numeric model is already 1.
  if (text.value === next || (next !== '' && text.value.trim() !== '' && Number(text.value) === Number(value))) return;
  text.value = next;
});

function onInput(value: string) {
  text.value = value;
  const number = value.trim() === '' ? NaN : Number(value);
  emit('update:modelValue', Number.isFinite(number) ? number : undefined);
}

function onBlur() {
  if (text.value.trim() === '') {
    emit('update:modelValue', undefined);
    return;
  }
  let number = Number(text.value);
  if (!Number.isFinite(number)) {
    text.value = '';
    emit('update:modelValue', undefined);
    return;
  }
  if (props.min !== undefined) number = Math.max(props.min, number);
  if (props.max !== undefined) number = Math.min(props.max, number);
  if (props.precision !== undefined) number = Number(number.toFixed(props.precision));
  text.value = String(number);
  emit('update:modelValue', number);
}
</script>

<template>
  <el-input
    class="plain-number-input"
    :model-value="text"
    type="number"
    :min="min"
    :max="max"
    :step="inputStep"
    :disabled="disabled"
    @update:model-value="onInput"
    @blur="onBlur"
  />
</template>

<style scoped>
.plain-number-input :deep(input[type='number']) {
  appearance: textfield;
  -moz-appearance: textfield;
}
.plain-number-input :deep(input[type='number']::-webkit-inner-spin-button),
.plain-number-input :deep(input[type='number']::-webkit-outer-spin-button) {
  appearance: none;
  margin: 0;
}
</style>
