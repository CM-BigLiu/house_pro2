<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getBlacklist, deleteBlacklist, type Blacklist } from '@/api/blacklist';
import { useDictStore } from '@/stores/dict';

const router = useRouter();
const dictStore = useDictStore();
const list = ref<Blacklist[]>([]);
const total = ref(0);
const loading = ref(false);
const query = reactive({ keyword: '', type: '', status: '', page: 1, pageSize: 20 });

onMounted(async () => {
  await dictStore.ensureLoaded(['blacklist_type', 'blacklist_status']);
  await load();
});

async function load() {
  loading.value = true;
  try {
    const res = await getBlacklist(query);
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function openEdit(item: Blacklist) {
  ElMessage.info('编辑功能待对接: ' + item.name);
}

async function remove(item: Blacklist) {
  await ElMessageBox.confirm(`确认移除黑名单「${item.name}」？`, '提示');
  await deleteBlacklist(item.id);
  ElMessage.success('已移除');
  await load();
}

function typeClass(type: string) {
  const map: Record<string, string> = {
    tenant: 'pill-blue',
    landlord: 'pill-green',
    supplier: 'pill-orange',
    other: 'pill-gray',
  };
  return map[type] || 'pill-gray';
}

function handleSearch() {
  query.page = 1;
  load();
}
</script>

<template>
  <div class="house-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-title">黑名单管理</div>
        <div class="page-desc">租客、房东、供应商等失信人员统一管理</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" @click="router.push('/house/blacklist/create')">新增黑名单</button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="姓名/电话/身份证" clearable @keyup.enter="handleSearch" class="filter-input" />
      <el-select v-model="query.type" placeholder="类型" clearable @change="handleSearch" class="filter-select">
        <el-option v-for="item in dictStore.getItems('blacklist_type')" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="query.status" placeholder="状态" clearable @change="handleSearch" class="filter-select">
        <el-option v-for="item in dictStore.getItems('blacklist_status')" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="primary" @click="handleSearch">查询</el-button>
    </div>

    <!-- Data Table -->
    <div class="card table-wrap">
      <el-table :data="list" v-loading="loading" class="data-table" style="width: 100%">
        <el-table-column prop="name" label="姓名" min-width="100">
          <template #default="{ row }">
            <span class="cell-main">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="mobile" label="手机号" min-width="130">
          <template #default="{ row }">
            <span class="mono">{{ row.mobile || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" min-width="90">
          <template #default="{ row }">
            <span :class="['pill', typeClass(row.type)]">{{ dictStore.getLabel('blacklist_type', row.type) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="拉黑原因" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="拉黑时间" min-width="110">
          <template #default="{ row }">
            <span class="mono">{{ row.createdAt || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="操作人" min-width="100" />
        <el-table-column label="状态" min-width="80">
          <template #default="{ row }">
            <span :class="['pill', row.status === 'active' ? 'pill-red' : 'pill-gray']">{{ dictStore.getLabel('blacklist_status', row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <div class="operation-cell">
              <el-button size="small" type="primary" plain @click="openEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" plain @click="remove(row)">移除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-footer">
        <span class="table-total">共 {{ total }} 条</span>
        <div class="pagination">
          <el-pagination
            v-model:current-page="query.page"
            v-model:page-size="query.pageSize"
            :total="total"
            layout="prev, pager, next"
            small
            @change="load"
          />
        </div>
      </div>
    </div>

    <!-- Dialog -->
  </div>
</template>

<style scoped lang="scss">
.house-view { min-height: 100%; }

/* ---- Filter Bar ---- */
.filter-bar {
  background: #fff;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
}
.filter-input { width: 220px; }
.filter-select { width: 130px; }

/* ---- Table ---- */
.table-wrap {
  border-radius: var(--radius);
  overflow: hidden;
}
.data-table {
  :deep(.el-table__header th) {
    background: var(--ink-50);
    color: var(--ink-500);
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.2px;
  }
  :deep(.el-table__body tr:hover td) {
    background: var(--primary-softer);
  }
  :deep(.el-table__body td) {
    color: var(--ink-700);
    font-size: 13px;
  }
}
.cell-main {
  font-weight: 600;
  color: var(--ink-800);
}
.mono {
  font-family: var(--font-num);
}
.operation-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* ---- Table Footer ---- */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: #fff;
  border-top: 1px solid var(--ink-100);
}
.table-total {
  font-size: 13px;
  color: var(--ink-500);
}
.pagination {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-input, .filter-select { width: 100%; }
}
</style>