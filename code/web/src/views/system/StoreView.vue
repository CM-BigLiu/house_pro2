<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCities, type Store } from '@/api/organization';
import { get, del } from '@/utils/request';

interface StoreDetail extends Store {
  address?: string;
  phone?: string;
  manager?: string;
  employeeCount?: number;
  cityName?: string;
  status?: string;
}

const stores = ref<StoreDetail[]>([]);
const cities = ref<{ id: number; name: string }[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(12);
const total = ref(0);
const query = reactive({
  keyword: '',
  cityId: undefined as number | undefined,
  statusFilter: 'all' as string,
});

const router = useRouter();

onMounted(async () => {
  await loadCities();
  await loadStores();
});

async function loadCities() {
  try {
    cities.value = await getCities();
  } catch {
    // ignore
  }
}

async function loadStores() {
  loading.value = true;
  try {
    const params: Record<string, any> = { page: currentPage.value, pageSize: pageSize.value };
    if (query.keyword) params.keyword = query.keyword;
    if (query.cityId) params.cityId = query.cityId;
    if (query.statusFilter !== 'all') params.status = query.statusFilter;
    // 后端 /system/stores 直接返回数组（门店规模小、不分页），此处兼容两种返回形态
    const res = await get<{ list?: StoreDetail[]; total?: number } | StoreDetail[]>(
      '/system/stores',
      { params },
    );
    const list = Array.isArray(res) ? res : res.list || [];
    stores.value = list;
    total.value = Array.isArray(res) ? list.length : res.total ?? list.length;
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  query.keyword = '';
  query.cityId = undefined;
  query.statusFilter = 'all';
  currentPage.value = 1;
  loadStores();
}

function openEdit(row: StoreDetail) {
  router.push(`/system/store/create?edit=${row.id}`);
}

async function remove(row: StoreDetail) {
  try {
    await ElMessageBox.confirm(`确定删除门店「${row.name}」吗？`, '提示', { type: 'warning' });
    await del(`/system/stores/${row.id}`);
    ElMessage.success('删除成功');
    await loadStores();
  } catch {
    // cancel
  }
}

function statusClass(status?: string) {
  return status === 'active' ? 'pill-green' : 'pill-gray';
}

function statusLabel(status?: string) {
  return status === 'active' ? '营业中' : '已停用';
}

function managerName(item: StoreDetail): string {
  const m: any = item.manager;
  if (!m) return '';
  return typeof m === 'string' ? m : m.name || '';
}
</script>

<template>
  <div class="system-view">
    <div class="page-header">
      <div>
        <div class="page-title">门店管理</div>
        <div class="page-desc">管理所有门店信息及人员配置</div>
      </div>
      <div class="page-actions">
        <button v-permission="['system:store:edit']" class="btn btn-primary" @click="router.push('/system/store/create')">新增门店</button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">城市</span>
        <select v-model="query.cityId" class="select" @change="loadStores">
          <option :value="undefined">全部</option>
          <option v-for="c in cities" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div class="filter-group" style="flex: 1; min-width: 160px; max-width: 260px;">
        <input
          v-model="query.keyword"
          class="input"
          placeholder="搜索门店名称"
          @keyup.enter="loadStores"
        />
      </div>
      <button class="btn btn-primary" @click="loadStores">搜索</button>
      <button class="btn btn-default" @click="resetFilters">重置</button>
    </div>

    <div class="summary-row">
      <span class="summary-chip">共 <strong>{{ total }}</strong> 家门店</span>
    </div>

    <div class="house-grid">
      <div v-for="item in stores" :key="item.id" class="detail-card">
        <div class="detail-card-header">
          <div>
            <div class="detail-card-title">{{ item.name }}</div>
            <div v-if="managerName(item)" class="cell-sub" style="margin-top: 4px;">店长：{{ managerName(item) }}</div>
          </div>
          <span :class="['pill', statusClass(item.status)]">{{ statusLabel(item.status) }}</span>
        </div>
        <div class="detail-card-body">
          <div class="field-grid">
            <div class="field-item">
              <span class="field-label">地址</span>
              <span class="field-value">{{ item.address || '--' }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">电话</span>
              <span class="field-value">{{ item.phone || '--' }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">员工数</span>
              <span class="field-value">{{ item.employeeCount ?? '--' }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">城市</span>
              <span class="field-value">{{ item.cityName || '--' }}</span>
            </div>
          </div>
          <div class="house-actions" style="margin-top: 12px;">
            <button
              v-permission="['system:store:edit']"
              class="btn btn-default btn-sm"
              @click="openEdit(item)"
            >编辑</button>
            <button
              v-permission="['system:store:edit']"
              class="btn btn-danger btn-sm"
              @click="remove(item)"
            >删除</button>
          </div>
        </div>
      </div>
      <div v-if="stores.length === 0 && !loading" class="empty-state">暂无门店数据</div>
    </div>

    <div class="card" style="margin-top: 16px;">
      <div class="table-footer">
        <span class="text-muted">共 {{ total }} 条</span>
        <div class="pagination">
          <button
            class="page-btn"
            :disabled="currentPage <= 1"
            @click="currentPage > 1 && (currentPage--, loadStores())"
          >‹</button>
          <button
            v-for="p in Math.max(1, Math.ceil(total / pageSize))"
            :key="p"
            :class="['page-btn', { active: p === currentPage }]"
            @click="currentPage = p; loadStores()"
          >{{ p }}</button>
          <button
            class="page-btn"
            :disabled="currentPage >= Math.ceil(total / pageSize)"
            @click="currentPage < Math.ceil(total / pageSize) && (currentPage++, loadStores())"
          >›</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.system-view { min-height: 100%; }
</style>