<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getRentalSets, type RentalSet } from '@/api/rental';
import { useDictStore } from '@/stores/dict';
import { formatMoney } from '@/utils/format';

const router = useRouter();
const dictStore = useDictStore();
const list = ref<RentalSet[]>([]);
const total = ref(0);
const loading = ref(false);
const query = reactive({ keyword: '', status: '', bizType: '', page: 1, pageSize: 20 });

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'active', label: '待租' },
  { value: 'rented', label: '已出租' },
  { value: 'pause', label: '已下架' },
  { value: 'checkout', label: '已退租' },
];

const summary = computed(() => {
  const totalSets = list.value.length;
  const rented = list.value.filter(s => s.status === 'rented').length;
  const vacant = list.value.filter(s => s.status === 'active').length;
  const entire = list.value.filter(s => s.bizType === 'entire').length;
  const shared = list.value.filter(s => s.bizType === 'shared').length;
  return { totalSets, rented, vacant, entire, shared };
});

onMounted(async () => {
  await dictStore.ensureLoaded(['house_status', 'room_status', 'decoration_level', 'payment_method', 'lease_term']);
  await load();
});

async function load() {
  loading.value = true;
  try {
    const res = await getRentalSets(query);
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function setStatus(val: string) {
  query.status = val;
  query.page = 1;
  load();
}

function resetFilter() {
  query.keyword = '';
  query.status = '';
  query.bizType = '';
  query.page = 1;
  load();
}

function openCreate() {
  router.push('/house/rent/create');
}

function checkout(item: RentalSet) {
  ElMessageBox.confirm(`确认对「${item.address || item.communityName}」进行退房登记？`, '退房登记')
    .then(() => ElMessage.success('已提交退房流程'));
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    active: 'pill-green',
    rented: 'pill-blue',
    reserved: 'pill-orange',
    checkout: 'pill-gray',
    pause: 'pill-gray',
  };
  return map[status] || 'pill-gray';
}

</script>

<template>
  <div class="house-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-title">出租房源</div>
        <div class="page-desc">管理出租房套与房间状态、租金、押金信息</div>
      </div>
      <div class="page-actions">
        <button v-permission="['renting:add']" class="btn btn-primary" @click="openCreate">
          新增出租房源
        </button>
        <button v-permission="['renting:export']" class="btn btn-default">导出</button>
      </div>
    </div>

    <!-- Status Tabs -->
    <div class="status-tabs">
      <button
        v-for="opt in statusOptions"
        :key="opt.value"
        :class="['status-tab', { active: query.status === opt.value }]"
        @click="setStatus(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">关键词</span>
        <input v-model="query.keyword" class="input" placeholder="搜索小区/地址/编号" @keyup.enter="load" />
      </div>
      <div class="filter-group">
        <span class="filter-label">户型</span>
        <select v-model="query.bizType" class="select" @change="load">
          <option value="">全部</option>
          <option value="entire">整租</option>
          <option value="shared">合租</option>
        </select>
      </div>
      <button class="btn btn-primary btn-sm" @click="load">筛选</button>
      <button class="btn btn-default btn-sm" @click="resetFilter">重置</button>
    </div>

    <!-- Summary Row -->
    <div class="summary-row">
      <span class="summary-chip">出租房源共 <strong>{{ summary.totalSets }}</strong> 套</span>
      <span class="summary-chip">已出租 <strong>{{ summary.rented }}</strong></span>
      <span class="summary-chip">待租 <strong>{{ summary.vacant }}</strong></span>
      <span class="summary-chip">整租 <strong>{{ summary.entire }}</strong></span>
      <span class="summary-chip">合租 <strong>{{ summary.shared }}</strong></span>
    </div>

    <!-- Cards Grid -->
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="list.length === 0" class="empty-state">暂无出租房源</div>
    <div v-else class="house-grid">
      <div v-for="item in list" :key="item.id" class="detail-card">
        <!-- Card Header -->
        <div class="detail-card-header">
          <div class="detail-card-title">
            <span>{{ item.communityName }}</span>
            <span class="pill pill-green" v-if="item.bizType === 'entire'">整租</span>
            <span class="pill pill-purple" v-else>合租</span>
            <span class="tag tag-gray">{{ item.layout || '-' }}</span>
          </div>
          <span :class="['pill', statusClass(item.status)]">{{ dictStore.getLabel('house_status', item.status) }}</span>
        </div>

        <!-- Card Body -->
        <div class="detail-card-body">
          <div class="field-item">
            <span class="field-label">地址</span>
            <span class="field-value">{{ item.address || item.communityName }} {{ item.building }}栋{{ item.unit }}单元</span>
          </div>
          <div class="field-item">
            <span class="field-label">面积</span>
            <span class="field-value">{{ item.buildingArea ? item.buildingArea + '㎡' : '-' }}</span>
          </div>
          <div class="field-item">
            <span class="field-label">承租价</span>
            <span class="field-value price">{{ formatMoney(item.landlordRent) }}</span>
          </div>

          <!-- Rooms Section -->
          <div v-if="item.bizType === 'shared'" class="room-list">
            <div v-for="rm in (item as any).rooms || []" :key="rm.id" class="room-item">
              <div class="room-field">
                <span class="field-label">房号</span>
                <span class="field-value">{{ rm.roomNo }}</span>
              </div>
              <div class="room-field">
                <span class="field-label">户型</span>
                <span class="field-value">{{ rm.roomType || '-' }}</span>
              </div>
              <div class="room-field">
                <span class="field-label">租金</span>
                <span class="field-value">{{ formatMoney(rm.rentPrice) }}</span>
              </div>
              <div class="room-field">
                <span class="field-label">状态</span>
                <span :class="['pill', statusClass(rm.status)]">{{ dictStore.getLabel('room_status', rm.status) }}</span>
              </div>
              <div class="room-field">
                <span class="field-label">租期</span>
                <span class="field-value">{{ rm.leaseEnd ? '至 ' + rm.leaseEnd.slice(0, 10) : '-' }}</span>
              </div>
            </div>
          </div>

          <!-- Entire rental summary -->
          <div v-else class="field-item">
            <span class="field-label">租金</span>
            <span class="field-value price">{{ formatMoney(item.rent) }}</span>
          </div>
          <div v-if="item.bizType !== 'shared'" class="field-item">
            <span class="field-label">押金</span>
            <span class="field-value">{{ formatMoney(item.deposit) }}</span>
          </div>
        </div>

        <!-- Card Actions -->
        <div class="detail-card-actions">
          <button v-permission="['renting:edit']" class="btn btn-ghost btn-sm">编辑</button>
          <button v-permission="['renting:checkout']" class="btn btn-ghost btn-sm" @click="checkout(item)">更多</button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="table-footer" v-if="total > query.pageSize">
      <span class="text-muted">共 {{ total }} 条</span>
      <div class="pagination">
        <button class="page-btn" :disabled="query.page <= 1" @click="query.page--; load()">‹</button>
        <button
          v-for="p in Math.ceil(total / query.pageSize)"
          :key="p"
          :class="['page-btn', { active: p === query.page }]"
          @click="query.page = p; load()"
        >{{ p }}</button>
        <button class="page-btn" :disabled="query.page >= Math.ceil(total / query.pageSize)" @click="query.page++; load()">›</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.house-view { min-height: 100%; }

/* ---------- Cards Grid ---------- */
.house-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.detail-card {
  background: #fff;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
  overflow: hidden;
  &:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--ink-300);
  }
}

.detail-card-header {
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--ink-100);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.detail-card-title {
  font-weight: 700;
  color: var(--ink-900);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}

.detail-card-body {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-card-actions {
  padding: 10px 16px;
  border-top: 1px solid var(--ink-100);
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

/* ---------- Field Items ---------- */
.field-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.field-label {
  color: var(--ink-500);
  flex: none;
}

.field-value {
  color: var(--ink-700);
  text-align: right;
  &.price {
    color: var(--danger);
    font-weight: 700;
    font-family: var(--font-num);
  }
}

/* ---------- Room List (blue left border) ---------- */
.room-list {
  margin-top: 4px;
  border-left: 3px solid var(--primary);
  border-radius: 0 6px 6px 0;
  background: var(--primary-softer);
  padding: 10px 12px;
  display: grid;
  gap: 8px;
}

.room-item {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  gap: 6px 10px;
  font-size: 12px;
  &:not(:last-child) {
    padding-bottom: 8px;
    border-bottom: 1px dashed var(--ink-200);
  }
}

.room-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  .field-label {
    font-size: 11px;
    color: var(--ink-400);
  }
  .field-value {
    font-size: 12.5px;
    color: var(--ink-700);
    font-weight: 500;
  }
  .pill {
    font-size: 10.5px;
    padding: 1.5px 7px;
    &::before { width: 4px; height: 4px; }
  }
}

/* ---------- Tags in card header ---------- */
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
}
.tag-gray {
  background: var(--ink-100);
  color: var(--ink-500);
}
.tag-orange {
  background: var(--warning-soft);
  color: var(--warning);
}

/* ---------- Section Title (in dialog) ---------- */
.section-title {
  font-weight: 700;
  color: var(--ink-900);
  margin: 16px 0 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--ink-200);
}

.room-row {
  background: var(--ink-50);
  border-radius: var(--radius-sm);
  padding: 10px;
  margin-bottom: 10px;
}

/* ---------- Responsive ---------- */
@media (max-width: 1200px) {
  .house-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .house-grid { grid-template-columns: 1fr; }
  .room-item { grid-template-columns: 1fr 1fr; }
}
</style>