<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { get, post } from '@/utils/request';

interface Config {
  id: number;
  configKey: string;
  configValue: string;
  description: string;
  group: string;
  sort: number;
}

const configs = ref<Config[]>([]);
const loading = ref(false);
const saving = ref(false);
const activeGroup = ref('system');

const groups = [
  { key: 'system', label: '系统设置' },
  { key: 'business', label: '业务设置' },
  { key: 'finance', label: '财务设置' },
  { key: 'notification', label: '通知设置' },
];

onMounted(async () => {
  await loadConfigs();
});

async function loadConfigs() {
  loading.value = true;
  try {
    configs.value = await get<Config[]>('/system/configs', { params: { group: activeGroup.value } });
  } finally {
    loading.value = false;
  }
}

function setGroup(group: string) {
  activeGroup.value = group;
  loadConfigs();
}

async function saveConfigs() {
  saving.value = true;
  try {
    const updateData = configs.value.map(c => ({
      id: c.id,
      configKey: c.configKey,
      configValue: c.configValue,
    }));
    await post('/system/configs/batch', { configs: updateData });
    ElMessage.success('保存成功');
  } catch {
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
  }
}

function updateValue(index: number, value: string) {
  configs.value[index].configValue = value;
}
</script>

<template>
  <div class="system-view">
    <div class="page-header">
      <div>
        <div class="page-title">系统配置</div>
        <div class="page-desc">管理系统运行参数与业务规则</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" :disabled="saving" @click="saveConfigs">
          {{ saving ? '保存中...' : '保存配置' }}
        </button>
      </div>
    </div>

    <div class="status-tabs">
      <button
        v-for="g in groups"
        :key="g.key"
        :class="['status-tab', { active: activeGroup === g.key }]"
        @click="setGroup(g.key)"
      >{{ g.label }}</button>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">配置项列表</div>
        <span class="text-muted">{{ configs.length }} 项</span>
      </div>
      <div class="card-body" style="padding: 0;">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30%;">配置键</th>
                <th style="width: 40%;">配置值</th>
                <th style="width: 30%;">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="configs.length === 0">
                <td colspan="3" style="text-align: center; padding: 48px 0; color: var(--ink-400);">暂无配置项</td>
              </tr>
              <tr v-for="(item, idx) in configs" :key="item.id">
                <td>
                  <span class="cell-main mono">{{ item.configKey }}</span>
                </td>
                <td>
                  <input
                    :value="item.configValue"
                    class="input"
                    style="width: 100%; min-width: 0;"
                    @input="updateValue(idx, ($event.target as HTMLInputElement).value)"
                  />
                </td>
                <td>
                  <span class="text-muted">{{ item.description || '--' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.system-view { min-height: 100%; }
</style>