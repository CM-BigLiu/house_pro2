<script setup lang="ts">
import { computed } from 'vue';
import { formatRmbUppercase } from '@/utils/sale-form';

const props = defineProps<{ value: unknown }>();

const uppercase = computed(() => {
  if (props.value === null || props.value === undefined || String(props.value).trim() === '') return '';
  return formatRmbUppercase(props.value);
});
</script>

<template>
  <div v-if="uppercase" class="money-uppercase" aria-live="polite">
    大写金额：人民币{{ uppercase }}
  </div>
</template>

<style scoped>
.money-uppercase {
  width: 100%;
  margin-top: 4px;
  color: var(--ink-600);
  font-size: 12px;
  line-height: 1.5;
}
</style>
