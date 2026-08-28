<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getReserveProperties, type ReserveProperty } from '@/api/reserve-property';
import { useDictStore } from '@/stores/dict';
import { formatMoney } from '@/utils/format';

const router = useRouter();
const dictStore = useDictStore();
const list = ref<ReserveProperty[]>([]);
const total = ref(0);
const loading = ref(false);
const query = reactive({ keyword: '', status: '', page: 1, pageSize: 20 });

onMounted(async () => {
  await dictStore.ensureLoaded(['house_status', 'disk_type', 'source_channel']);
  await load();
});

async function load() {
  loading.value = true;
  try {
    const res = await getReserveProperties(query);
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function openEdit(item: ReserveProperty) {
  ElMessage.info('编辑功能待对接: ' + item.title);
}

function diskClass(type: string) {
  return type === 'private' ? 'pill-purple' : 'pill-blue';
}
</script>

<template>
  <div class="house-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <div class="page-title">储备房源</div>
        <div class="page-desc">储备期房源信息、拿房签约前状态维护</div>
      </div>
      <div class="page-actions">
        <button v-permission="['reserve:house:add']" class="btn btn-primary" @click="router.push('/house/reserve-house/create')">录入房源</button>
        <button v-permission="['reserve:house:export']" class="btn btn-default">导出</button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="status-tabs">
        <span
          v-for="opt in [{ label: '全部', value: '' }, { label: '未租', value: 'not_rented' }, { label: '已租', value: 'rented' }, { label: '已售', value: 'sold' }, { label: '已签约', value: 'signed' }, { label: '已交定', value: 'deposit_paid' }]"
          :key="opt.value"
          :class="['status-tab', { active: query.status === opt.value }]"
          @click="query.status = opt.value; query.page = 1; load()"
        >{{ opt.label }}</span>
      </div>

      <el-input v-model="query.keyword" placeholder="小区/业主/电话" clearable @keyup.enter="load" class="filter-input" />
      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">加载中...</div>

    <!-- Empty State -->
    <div v-else-if="list.length === 0" class="empty-state">暂无储备房源</div>

    <!-- Card Grid -->
    <div v-else class="card-list">
      <div v-for="item in list" :key="item.id" class="detail-card">
        <div class="detail-card-header">
          <div class="detail-card-title">{{ item.title }}</div>
          <div class="pills">
            <span :class="['pill', diskClass(item.diskType)]">{{ dictStore.getLabel('disk_type', item.diskType) }}</span>
            <span :class="['pill', 'pill-gray']">{{ dictStore.getLabel('house_status', item.status) }}</span>
          </div>
        </div>
        <div class="detail-card-body">
          <div class="field-grid">
            <div class="field-item">
              <span class="field-label">小区</span>
              <span class="field-value">{{ item.communityName || '-' }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">期望价</span>
              <span class="field-value price">{{ formatMoney(item.expectedPrice) }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">业主</span>
              <span class="field-value">{{ item.ownerName || '-' }} {{ item.ownerPhone || '' }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">来源</span>
              <span class="field-value">{{ dictStore.getLabel('source_channel', item.source) || '-' }}</span>
            </div>
          </div>
        </div>
        <div class="detail-card-footer">
          <el-button v-permission="['reserve:house:take']" size="small" type="primary" plain>拿房签约</el-button>
          <el-button v-permission="['reserve:house:transfer']" size="small">转业务员</el-button>
          <el-button size="small" type="primary" plain @click="openEdit(item)">编辑</el-button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @change="load"
      />
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
.status-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 0;
}
.status-tab {
  border: 1px solid var(--ink-200);
  background: #fff;
  border-radius: 999px;
  padding: 5px 13px;
  font-size: 12px;
  color: var(--ink-600);
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: var(--shadow-xs);
  &:hover { border-color: var(--primary); color: var(--primary); }
  &.active {
    border-color: var(--primary);
    color: #fff;
    background: linear-gradient(180deg, #3d7bff, #2e6bf0);
    box-shadow: 0 3px 8px -2px rgba(46, 107, 240, 0.4);
    font-weight: 600;
  }
}
.filter-input { width: 220px; }

/* ---- Card Grid ---- */
.card-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.detail-card {
  background: #fff;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  overflow: hidden;
  &:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); border-color: var(--ink-300); }
}
.detail-card-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--ink-100);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  background: linear-gradient(180deg, #fbfcfe, #fff);
}
.detail-card-title {
  font-weight: 700;
  font-size: 14.5px;
  color: var(--ink-900);
}
.pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.detail-card-body {
  padding: 14px 16px;
}
.field-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 11px 14px;
}
.field-item {
  min-width: 0;
  padding: 7px 10px;
  background: var(--ink-50);
  border-radius: 6px;
  border: 1px solid var(--ink-100);
}
.field-label {
  display: block;
  font-size: 10.5px;
  color: var(--ink-400);
  margin-bottom: 2px;
  letter-spacing: 0.3px;
}
.field-value {
  font-size: 13px;
  color: var(--ink-800);
  font-weight: 550;
  overflow-wrap: anywhere;
  font-family: var(--font-num);
  &.price { color: var(--danger); font-weight: 700; }
}
.detail-card-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--ink-100);
}

/* ---- Pagination ---- */
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* ---- Loading / Empty ---- */
.loading-state, .empty-state {
  text-align: center;
  padding: 48px 0;
  color: var(--ink-400);
  font-size: 14px;
}

/* ---- Responsive ---- */
@media (max-width: 1200px) {
  .card-list { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .card-list { grid-template-columns: 1fr; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-input { width: 100%; }
}
</style>