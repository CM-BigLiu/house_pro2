<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  delegateProperty,
  emptyContractDetails,
  validateContractDetails,
} from '@/api/business';
import ContractBusinessFields from './ContractBusinessFields.vue';
import { useDictStore } from '@/stores/dict';
const props = defineProps<{
  visible: boolean;
  property: {
    id: number;
    address?: string;
    title?: string;
    communityName?: string;
    code?: string;
  } | null;
}>();
const emit = defineEmits(['update:visible', 'completed']);
const dict = useDictStore(),
  busy = ref(false),
  error = ref('');
const form = reactive({
  leaseStart: '',
  leaseEnd: '',
  amount: 0,
  deposit: 0,
  paymentMethod: 'monthly',
  details: emptyContractDetails(),
});
watch(
  () => props.visible,
  (value) => {
    if (!value) return;
    error.value = '';
    Object.assign(form, {
      leaseStart: '',
      leaseEnd: '',
      amount: 0,
      deposit: 0,
      paymentMethod: 'monthly',
      details: emptyContractDetails(),
    });
    form.details.propertyAddress =
      props.property?.address ||
      props.property?.title ||
      props.property?.communityName ||
      props.property?.code ||
      '';
    void dict.ensureLoaded(['payment_method']);
  },
);
async function submit() {
  if (busy.value || !props.property) return;
  error.value = validateContractDetails(form.details, 'management');
  if (
    !form.leaseStart ||
    !form.leaseEnd ||
    form.leaseEnd < form.leaseStart ||
    form.amount <= 0
  )
    error.value = '请填写有效租赁期限及成交月租';
  if (error.value) return;
  busy.value = true;
  try {
    await delegateProperty(props.property.id, form);
    ElMessage.success('委托合同已提交，房管房与业绩已同步');
    emit('completed');
    emit('update:visible', false);
  } catch {
    /* 请求层展示校验错误，保留录入内容。 */
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <el-dialog
    :model-value="visible"
    title="房管房委托成交"
    width="min(800px,94vw)"
    :close-on-click-modal="false"
    :show-close="!busy"
    @update:model-value="
      (value: boolean) => {
        if (!busy) emit('update:visible', value);
      }
    "
  >
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <el-form :model="form" label-position="top"
      ><ContractBusinessFields :details="form.details" mode="management" />
      <el-form-item label="成交合同号"
        ><el-input disabled placeholder="电子编码提交后自动生成"
      /></el-form-item>
      <el-row :gutter="14"
        ><el-col :span="12"
          ><el-form-item label="租赁开始日期" required
            ><el-date-picker
              v-model="form.leaseStart"
              type="date"
              value-format="YYYY-MM-DD" /></el-form-item></el-col
        ><el-col :span="12"
          ><el-form-item label="租赁结束日期" required
            ><el-date-picker
              v-model="form.leaseEnd"
              type="date"
              value-format="YYYY-MM-DD" /></el-form-item></el-col
        ><el-col :span="12"
          ><el-form-item label="成交金额（元/月）" required
            ><el-input-number
              v-model="form.amount"
              :min="0.01"
              :precision="2" /></el-form-item></el-col
        ><el-col :span="12"
          ><el-form-item label="押金（元）"
            ><el-input-number
              v-model="form.deposit"
              :min="0"
              :precision="2" /></el-form-item></el-col
      ></el-row>
      <el-form-item label="付款方式" required
        ><el-select v-model="form.paymentMethod"
          ><el-option
            v-for="item in dict.getItems('payment_method')"
            :key="item.value"
            :value="item.value"
            :label="item.label" /></el-select
      ></el-form-item>
      <p class="hint">
        免租从各合同年度开始日计算；不足整月按合同月实际天数折算。提交后自动生成各期应付计划。
      </p>
    </el-form>
    <template #footer
      ><el-button :disabled="busy" @click="emit('update:visible', false)"
        >取消</el-button
      ><el-button type="primary" :loading="busy" @click="submit"
        >直接提交</el-button
      ></template
    >
  </el-dialog>
</template>
<style scoped>
.hint {
  color: var(--ink-500);
  font-size: 12px;
  line-height: 1.7;
}
</style>
