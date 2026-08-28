<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  getEmployees, deleteEmployee,
  getRoles, getStores, getPositions,
  type Employee, type Role, type Store,
} from '@/api/organization';

const router = useRouter();

const employees = ref<Employee[]>([]);
const roles = ref<Role[]>([]);
const stores = ref<Store[]>([]);
const positions = ref<{ id: number; name: string; code: string }[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(15);
const total = ref(0);

const query = reactive({
  keyword: '',
  statusFilter: 'all' as string,
  storeId: undefined as number | undefined,
  positionId: undefined as number | undefined,
});

const statusStats = computed(() => {
  const total = employees.value.length;
  const active = employees.value.filter(e => e.status === 'normal').length;
  const left = employees.value.filter(e => e.status === 'left').length;
  return { total, active, left };
});

onMounted(async () => {
  await Promise.all([loadEmployees(), loadRoles(), loadStores(), loadPositions()]);
});

function setStatusFilter(val: string) {
  query.statusFilter = val;
  currentPage.value = 1;
  loadEmployees();
}

async function loadEmployees() {
  loading.value = true;
  try {
    const params: Record<string, any> = { ...query };
    if (params.statusFilter === 'all') delete params.statusFilter;
    if (!params.storeId) delete params.storeId;
    if (!params.positionId) delete params.positionId;
    if (!params.keyword) delete params.keyword;
    const res = await getEmployees(params);
    employees.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

async function loadRoles() {
  roles.value = await getRoles();
}

async function loadStores() {
  stores.value = await getStores();
}

async function loadPositions() {
  positions.value = await getPositions();
}

function resetFilters() {
  query.keyword = '';
  query.statusFilter = 'all';
  query.storeId = undefined;
  query.positionId = undefined;
  currentPage.value = 1;
  loadEmployees();
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = { normal: '在职', left: '离职', vacation: '休假' };
  return map[status] || status;
}

function getStatusPillClass(status: string) {
  const map: Record<string, string> = { normal: 'pill-green', left: 'pill-gray', vacation: 'pill-orange' };
  return map[status] || 'pill-gray';
}

function getInitials(name: string) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

function openEdit(row: Employee) {
  router.push(`/system/employee/create?edit=${row.id}`);
}

async function remove(row: Employee) {
  await deleteEmployee(row.id);
  ElMessage.success('删除成功');
  await loadEmployees();
}
</script>

<template>
  <div class="system-view">
    <!-- Page header -->
    <div class="page-header">
      <div>
        <div class="page-title">人员管理</div>
        <div class="page-desc">员工档案、角色绑定、所属店面维护</div>
      </div>
      <div class="page-actions">
        <button v-permission="['system:employee:edit']" class="btn btn-primary" @click="router.push('/system/employee/create')">新增员工</button>
      </div>
    </div>

    <!-- Status tabs -->
    <div class="status-tabs">
      <button
        :class="['status-tab', { active: query.statusFilter === 'all' }]"
        @click="setStatusFilter('all')"
      >全部</button>
      <button
        :class="['status-tab', { active: query.statusFilter === 'normal' }]"
        @click="setStatusFilter('normal')"
      >在职</button>
      <button
        :class="['status-tab', { active: query.statusFilter === 'left' }]"
        @click="setStatusFilter('left')"
      >离职</button>
      <button
        :class="['status-tab', { active: query.statusFilter === 'vacation' }]"
        @click="setStatusFilter('vacation')"
      >休假</button>
    </div>

    <!-- Filter bar -->
    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">门店</span>
        <select v-model="query.storeId" class="select" @change="loadEmployees">
          <option :value="undefined">不限</option>
          <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">岗位</span>
        <select v-model="query.positionId" class="select" @change="loadEmployees">
          <option :value="undefined">全部</option>
          <option v-for="p in positions" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
      <div class="filter-group" style="flex: 1; min-width: 140px; max-width: 240px;">
        <input
          v-model="query.keyword"
          class="input"
          placeholder="搜索姓名/手机号"
          @keyup.enter="loadEmployees"
        />
      </div>
      <button class="btn btn-primary" @click="loadEmployees">筛选</button>
      <button class="btn btn-default" @click="resetFilters">重置</button>
    </div>

    <!-- Summary row -->
    <div class="summary-row">
      <span class="summary-chip">共 <strong>{{ statusStats.total }}</strong> 人</span>
      <span class="summary-chip">在职 <strong>{{ statusStats.active }}</strong></span>
      <span class="summary-chip">离职 <strong>{{ statusStats.left }}</strong></span>
    </div>

    <!-- Data table -->
    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 180px;">姓名</th>
              <th style="width: 140px;">手机号</th>
              <th style="width: 160px;">岗位</th>
              <th style="width: 160px;">门店</th>
              <th style="width: 120px;">入职时间</th>
              <th style="width: 90px;">状态</th>
              <th style="width: 140px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="employees.length === 0">
              <td colspan="7" style="text-align: center; padding: 48px 0; color: var(--ink-400);">暂无数据</td>
            </tr>
            <tr v-for="row in employees" :key="row.id">
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span class="user-avatar">{{ getInitials(row.name) }}</span>
                  <span class="cell-main">{{ row.name }}</span>
                </div>
              </td>
              <td><span class="mono">{{ row.mobile }}</span></td>
              <td>
                <span v-if="row.positions && row.positions.length">
                  <span
                    v-for="(p, idx) in row.positions"
                    :key="p.id"
                  >{{ p.name }}<span v-if="idx < row.positions.length - 1">、</span></span>
                </span>
                <span v-else class="text-muted">--</span>
              </td>
              <td>
                <span v-if="row.stores && row.stores.length">
                  <span
                    v-for="s in row.stores"
                    :key="s.id"
                    class="pill pill-blue"
                    style="margin-right: 4px;"
                  >{{ s.name }}</span>
                </span>
                <span v-else class="text-muted">--</span>
              </td>
              <td>
                <span v-if="row.entryDate" class="mono">{{ row.entryDate }}</span>
                <span v-else class="text-muted">--</span>
              </td>
              <td>
                <span :class="['pill', getStatusPillClass(row.status)]">{{ getStatusLabel(row.status) }}</span>
              </td>
              <td>
                <div class="operation-cell">
                  <button
                    v-permission="['system:employee:edit']"
                    class="btn btn-default btn-sm"
                    @click="openEdit(row)"
                  >编辑</button>
                  <button
                    class="btn btn-danger btn-sm"
                    @click="remove(row)"
                  >删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table footer / pagination -->
      <div class="table-footer">
        <span class="text-muted">共 {{ total }} 条</span>
        <div class="pagination">
          <button
            class="page-btn"
            :disabled="currentPage <= 1"
            @click="currentPage > 1 && (currentPage--, loadEmployees())"
          >‹</button>
          <button
            v-for="p in Math.max(1, Math.ceil(total / pageSize))"
            :key="p"
            :class="['page-btn', { active: p === currentPage }]"
            @click="currentPage = p; loadEmployees()"
          >{{ p }}</button>
          <button
            class="page-btn"
            :disabled="currentPage >= Math.ceil(total / pageSize)"
            @click="currentPage < Math.ceil(total / pageSize) && (currentPage++, loadEmployees())"
          >›</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.system-view { min-height: 100%; }

/* ---------- User avatar (blue gradient circle with initials) ---------- */
.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4d8bff, #2e6bf0);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  flex: none;
  line-height: 1;
}
</style>