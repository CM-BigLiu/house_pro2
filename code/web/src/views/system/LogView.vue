<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { get } from '@/utils/request';

interface Log {
  id: number;
  createdAt: string;
  module: string;
  actionType: string;
  operator: string;
  ip: string;
  detail: string;
  target?: string;
  status?: string;
}

const logs = ref<Log[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

const query = reactive({
  dateRange: [] as string[],
  module: '' as string,
  operator: '',
  keyword: '',
});

const moduleOptions = ['全部模块', '租房管理', '售房管理', '财务管理', '系统管理', '人员管理', '字典管理'];

onMounted(async () => {
  await loadLogs();
});

async function loadLogs() {
  loading.value = true;
  try {
    const params: Record<string, any> = { page: currentPage.value, pageSize: pageSize.value };
    if (query.dateRange.length === 2) {
      params.startDate = query.dateRange[0];
      params.endDate = query.dateRange[1];
    }
    if (query.module && query.module !== '全部模块') params.module = query.module;
    if (query.operator) params.operator = query.operator;
    if (query.keyword) params.keyword = query.keyword;
    const res = await get<{ list: Log[]; total: number }>('/system/logs', { params });
    logs.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  query.dateRange = [];
  query.module = '';
  query.operator = '';
  query.keyword = '';
  currentPage.value = 1;
  loadLogs();
}

function actionClass(type: string) {
  const map: Record<string, string> = {
    '新增': 'pill-green',
    '编辑': 'pill-blue',
    '删除': 'pill-red',
    '导出': 'pill-purple',
    '导入': 'pill-orange',
    '登录': 'pill-cyan',
    '审批': 'pill-blue',
  };
  return map[type] || 'pill-gray';
}
</script>

<template>
  <div class="system-view">
    <div class="page-header">
      <div>
        <div class="page-title">操作日志</div>
        <div class="page-desc">查看系统操作记录和审计信息</div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">日期</span>
        <input v-model="query.dateRange[0]" class="input input-sm" type="date" />
        <span class="range-sep">至</span>
        <input v-model="query.dateRange[1]" class="input input-sm" type="date" />
      </div>
      <div class="filter-group">
        <span class="filter-label">模块</span>
        <select v-model="query.module" class="select" @change="loadLogs">
          <option v-for="m in moduleOptions" :key="m" :value="m === '全部模块' ? '' : m">{{ m }}</option>
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">操作人</span>
        <input
          v-model="query.operator"
          class="input input-sm"
          placeholder="操作人姓名"
          @keyup.enter="loadLogs"
        />
      </div>
      <div class="filter-group">
        <span class="filter-label">关键词</span>
        <input
          v-model="query.keyword"
          class="input input-sm"
          placeholder="搜索详情"
          @keyup.enter="loadLogs"
        />
      </div>
      <button class="btn btn-primary" @click="loadLogs">查询</button>
      <button class="btn btn-default" @click="resetFilters">重置</button>
    </div>

    <div class="summary-row">
      <span class="summary-chip">共 <strong>{{ total }}</strong> 条日志</span>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 150px;">时间</th>
              <th style="width: 100px;">模块</th>
              <th style="width: 90px;">操作类型</th>
              <th style="width: 90px;">操作人</th>
              <th style="width: 120px;">IP地址</th>
              <th>详情</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="logs.length === 0">
              <td colspan="6" style="text-align: center; padding: 48px 0; color: var(--ink-400);">暂无日志记录</td>
            </tr>
            <tr v-for="row in logs" :key="row.id">
              <td><span class="mono">{{ row.createdAt }}</span></td>
              <td>{{ row.module }}</td>
              <td>
                <span :class="['pill', actionClass(row.actionType)]">{{ row.actionType }}</span>
              </td>
              <td>{{ row.operator }}</td>
              <td><span class="mono">{{ row.ip }}</span></td>
              <td style="max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <span class="text-muted">{{ row.detail }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-footer">
        <span class="text-muted">共 {{ total }} 条</span>
        <div class="pagination">
          <button
            class="page-btn"
            :disabled="currentPage <= 1"
            @click="currentPage > 1 && (currentPage--, loadLogs())"
          >‹</button>
          <button
            v-for="p in Math.max(1, Math.ceil(total / pageSize))"
            :key="p"
            :class="['page-btn', { active: p === currentPage }]"
            @click="currentPage = p; loadLogs()"
          >{{ p }}</button>
          <button
            class="page-btn"
            :disabled="currentPage >= Math.ceil(total / pageSize)"
            @click="currentPage < Math.ceil(total / pageSize) && (currentPage++, loadLogs())"
          >›</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.system-view { min-height: 100%; }
</style>