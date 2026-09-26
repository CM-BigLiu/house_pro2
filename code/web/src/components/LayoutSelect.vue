<script setup lang="ts">
import { computed, ref } from 'vue';
import { COMMON_LAYOUT_OPTIONS } from '@/utils/layout-options';

const props = withDefaults(defineProps<{
  modelValue?: string;
  placeholder?: string;
  storageKey?: string;
  validate?: (value: string) => boolean;
}>(), {
  modelValue: '',
  placeholder: '请选择或输入户型',
  storageKey: 'house_custom_layouts',
  validate: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  invalid: [value: string];
}>();

function readCustomOptions() {
  try {
    const value = JSON.parse(localStorage.getItem(props.storageKey) || '[]');
    return Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.trim()) : [];
  } catch {
    return [];
  }
}

const customOptions = ref<string[]>(readCustomOptions());
const options = computed(() => Array.from(new Set([
  ...COMMON_LAYOUT_OPTIONS,
  ...customOptions.value,
  ...(props.modelValue?.trim() ? [props.modelValue.trim()] : []),
])));

function rememberCustomOption(value: string) {
  if (!value || COMMON_LAYOUT_OPTIONS.includes(value) || customOptions.value.includes(value)) return;
  customOptions.value.push(value);
  try {
    localStorage.setItem(props.storageKey, JSON.stringify(customOptions.value));
  } catch {
    // 浏览器禁用本地存储时仍允许本次表单选择，不阻断业务录入。
  }
}

function handleChange(rawValue: string) {
  const value = rawValue?.trim() || '';
  if (props.validate && !props.validate(value)) {
    emit('invalid', value);
    return;
  }
  rememberCustomOption(value);
  emit('update:modelValue', value);
  emit('change', value);
}
</script>

<template>
  <div class="layout-select">
    <el-select
      :model-value="modelValue"
      filterable
      allow-create
      default-first-option
      clearable
      :placeholder="placeholder"
      style="width: 100%;"
      @change="handleChange"
    >
      <el-option v-for="item in options" :key="item" :label="item" :value="item" />
    </el-select>
    <span class="layout-select__hint">没有合适选项时，可输入新户型并按回车添加</span>
  </div>
</template>

<style scoped>
.layout-select { width: 100%; }
.layout-select__hint {
  display: block;
  margin-top: 5px;
  color: var(--ink-400);
  font-size: 11.5px;
  line-height: 1.4;
}
</style>
