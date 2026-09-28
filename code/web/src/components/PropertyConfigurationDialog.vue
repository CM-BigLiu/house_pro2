<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  getPropertyConfiguration,
  savePropertyConfiguration,
  type ConfigurationItem,
} from '@/api/business';
const props = defineProps<{
  visible: boolean;
  propertyId: number | null;
  propertyName?: string;
}>();
const emit = defineEmits(['update:visible', 'completed']);
const busy = ref(false),
  loading = ref(false),
  failed = ref(false);
const labels: Record<string, string> = {
  cleaning: '保洁',
  repair: '维修',
  renovation: '装修',
  furniture: '家具',
  appliance: '家电',
  collection_bonus: '收房奖',
  rental_bonus: '出房奖',
};
const items = reactive<ConfigurationItem[]>([]);
let generation = 0;
watch(
  () => [props.visible, props.propertyId],
  async () => {
    const current = ++generation;
    if (!props.visible || !props.propertyId) return;
    loading.value = true;
    failed.value = false;
    items.splice(
      0,
      items.length,
      ...Object.keys(labels).map((type) => ({
        type,
        amount: 0,
        recipient: '',
        channel: 'cash',
        remark: '',
      })),
    );
    try {
      const result = await getPropertyConfiguration(props.propertyId);
      if (current === generation)
        result.items.forEach((item) =>
          Object.assign(
            items.find((row) => row.type === item.type) || {},
            item,
          ),
        );
    } catch {
      if (current === generation) failed.value = true;
    } finally {
      if (current === generation) loading.value = false;
    }
  },
);
async function submit() {
  if (busy.value || loading.value || !props.propertyId || failed.value) return;
  if (items.some((row) => row.amount < 0 || !Number.isFinite(row.amount)))
    return ElMessage.warning('配置金额必须为非负数');
  if (
    items.some(
      (row) =>
        row.type.endsWith('_bonus') && row.amount > 0 && !row.recipient.trim(),
    )
  )
    return ElMessage.warning('请填写获奖人');
  busy.value = true;
  try {
    await savePropertyConfiguration(props.propertyId, items);
    ElMessage.success('配置已同步到房管房与业绩核算');
    emit('completed');
    emit('update:visible', false);
  } catch {
    /* 请求层展示错误，保留录入内容。 */
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <el-dialog
    :model-value="visible"
    :title="`房管房配置 · ${propertyName || ''}`"
    width="min(850px,94vw)"
    :close-on-click-modal="false"
    :show-close="!busy"
    :close-on-press-escape="!busy"
    @update:model-value="
      (value: boolean) => {
        if (!busy) emit('update:visible', value);
      }
    "
  >
    <el-alert
      v-if="failed"
      title="配置加载失败，请关闭后重试"
      type="error"
      :closable="false"
    />
    <el-form v-loading="loading" label-position="top">
      <section v-for="item in items" :key="item.type" class="configuration-row">
        <h3>{{ labels[item.type] }}</h3>
        <el-row :gutter="12">
          <el-col :xs="24" :sm="8"
            ><el-form-item label="金额（元）"
              ><el-input-number
                v-model="item.amount"
                :min="0"
                :precision="2" /></el-form-item
          ></el-col>
          <template v-if="item.type.endsWith('_bonus')"
            ><el-col :xs="24" :sm="8"
              ><el-form-item label="奖给谁"
                ><el-input
                  v-model="item.recipient"
                  maxlength="100" /></el-form-item></el-col
            ><el-col :xs="24" :sm="8"
              ><el-form-item label="发放渠道"
                ><el-select v-model="item.channel"
                  ><el-option label="现金" value="cash" /><el-option
                    label="转账"
                    value="transfer" /><el-option
                    label="微信"
                    value="wechat" /></el-select></el-form-item></el-col
          ></template>
          <el-col :span="24"
            ><el-form-item label="备注"
              ><el-input v-model="item.remark" maxlength="500" /></el-form-item
          ></el-col>
        </el-row>
      </section>
    </el-form>
    <p>费用计入配置保存月份的房管房收益；配置提交不代表资金已经支付。</p>
    <template #footer
      ><el-button :disabled="busy" @click="emit('update:visible', false)"
        >取消</el-button
      ><el-button
        type="primary"
        :loading="busy"
        :disabled="loading || failed"
        @click="submit"
        >直接提交</el-button
      ></template
    >
  </el-dialog>
</template>
<style scoped>
.configuration-row {
  border-bottom: 1px solid var(--ink-200);
  margin-bottom: 16px;
}
h3 {
  font-size: 14px;
}
p {
  font-size: 12px;
  color: var(--ink-500);
}
</style>
