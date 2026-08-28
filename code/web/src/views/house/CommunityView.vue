<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getCommunities, type Community,
} from '@/api/community';

/* ── Data ── */
const router = useRouter();
const list = ref<Community[]>([]);
const total = ref(0);
const loading = ref(false);
const filterKeyword = ref('');
const treeKeyword = ref('');

/* ── Mock tree data (replace with real API) ── */
interface DistrictNode {
  name: string;
  count: number;
  children: { name: string; count: number }[];
}
const treeData = ref<DistrictNode[]>([
  {
    name: '朝阳区', count: 245,
    children: [
      { name: 'CBD', count: 42 },
      { name: '望京', count: 38 },
      { name: '亚运村', count: 29 },
      { name: '双井', count: 31 },
      { name: '劲松', count: 25 },
    ],
  },
  {
    name: '海淀区', count: 198,
    children: [
      { name: '中关村', count: 36 },
      { name: '五道口', count: 28 },
      { name: '西二旗', count: 32 },
      { name: '上地', count: 24 },
    ],
  },
  {
    name: '东城区', count: 112,
    children: [
      { name: '东直门', count: 18 },
      { name: '安定门', count: 15 },
      { name: '北新桥', count: 22 },
    ],
  },
  {
    name: '西城区', count: 98,
    children: [
      { name: '金融街', count: 20 },
      { name: '西单', count: 16 },
      { name: '新街口', count: 14 },
    ],
  },
  {
    name: '丰台区', count: 156,
    children: [
      { name: '方庄', count: 27 },
      { name: '马家堡', count: 22 },
      { name: '科技园区', count: 30 },
    ],
  },
  {
    name: '通州区', count: 134,
    children: [
      { name: '梨园', count: 28 },
      { name: '北苑', count: 24 },
      { name: '万达', count: 19 },
    ],
  },
  {
    name: '大兴区', count: 87,
    children: [
      { name: '亦庄', count: 35 },
      { name: '黄村', count: 18 },
    ],
  },
]);

const selectedDistrict = ref<string>('');
const selectedBizCircle = ref<string>('');

const filteredTreeData = computed(() => {
  const kw = treeKeyword.value.trim().toLowerCase();
  if (!kw) return treeData.value;
  return treeData.value
    .map(d => ({
      ...d,
      children: d.children.filter(c => c.name.toLowerCase().includes(kw)),
    }))
    .filter(d => d.children.length > 0 || d.name.toLowerCase().includes(kw));
});

const allCount = computed(() => treeData.value.reduce((s, d) => s + d.count, 0));

/* ── Query ── */
const query = reactive({ keyword: '', page: 1, pageSize: 20 });

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const params: any = { page: query.page, pageSize: query.pageSize };
    if (query.keyword) params.keyword = query.keyword;
    const res = await getCommunities(params);
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function onPageChange(page: number) {
  query.page = page;
  load();
}

/* ── Tree & search ── */
function selectAll() {
  selectedDistrict.value = '';
  selectedBizCircle.value = '';
  query.keyword = '';
  query.page = 1;
  load();
}

function selectDistrict(name: string) {
  selectedDistrict.value = name;
  selectedBizCircle.value = '';
  query.keyword = name;
  query.page = 1;
  load();
}

function selectBizCircle(name: string) {
  selectedBizCircle.value = name;
  query.keyword = name;
  query.page = 1;
  load();
}

function onSearch() {
  query.keyword = filterKeyword.value;
  query.page = 1;
  load();
}

/* ── Create / Edit / Delete ── */
function openCreate() {
  router.push('/house/community/create');
}
function editCommunity(item: Community) {
  ElMessage.info('编辑功能待对接: ' + item.name);
}

async function deleteCommunity(item: Community) {
  try {
    await ElMessageBox.confirm(`确认删除"${item.name}"？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    ElMessage.success('删除成功（占位）');
    await load();
  } catch {
    // cancelled
  }
}

/* ── Helpers ── */
function formatPrice(price?: number): string {
  if (price === undefined || price === null) return '—';
  return price.toLocaleString() + ' 元/㎡';
}
</script>

<template>
  <div class="community-page">
    <!-- Page header -->
    <div class="page-header">
      <div>
        <div class="page-title">小区管理</div>
        <div class="page-desc">小区信息、楼栋结构、房源数量统计</div>
      </div>
      <div class="page-actions">
        <div class="search-input-wrap">
          <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input v-model="filterKeyword" class="input" placeholder="搜索小区名称或地址…" @keyup.enter="onSearch" />
        </div>
        <button class="btn btn-primary" @click="openCreate">
          <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          新增小区
        </button>
      </div>
    </div>

    <!-- Split layout: tree + cards -->
    <div class="split-layout">
      <!-- Tree panel -->
      <div class="tree-panel">
        <div class="tree-search">
          <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input v-model="treeKeyword" class="input-tree" placeholder="筛选区域…" />
        </div>
        <ul class="tree">
          <li :class="{ active: !selectedDistrict }">
            <span @click="selectAll">
              全部
              <span class="tree-count">{{ allCount }}</span>
            </span>
          </li>
          <li v-for="dist in filteredTreeData" :key="dist.name">
            <span
              :class="{ active: selectedDistrict === dist.name && !selectedBizCircle }"
              @click="selectDistrict(dist.name)"
            >
              {{ dist.name }}
              <span class="tree-count">{{ dist.count }}</span>
            </span>
            <ul v-if="dist.children.length">
              <li
                v-for="biz in dist.children"
                :key="biz.name"
                :class="{ active: selectedBizCircle === biz.name }"
              >
                <span @click="selectBizCircle(biz.name)">
                  {{ biz.name }}
                  <span class="tree-count">{{ biz.count }}</span>
                </span>
              </li>
            </ul>
          </li>
        </ul>
      </div>

      <!-- Main content -->
      <div class="split-main">
        <!-- Summary -->
        <div class="summary-row">
          <span class="summary-chip">
            共 <strong>{{ total }}</strong> 个小区
          </span>
          <span v-if="selectedDistrict" class="summary-chip">
            区域筛选：<strong>{{ selectedDistrict }}{{ selectedBizCircle ? ' / ' + selectedBizCircle : '' }}</strong>
          </span>
        </div>

        <!-- Cards grid -->
        <div v-loading="loading" class="house-grid">
          <div v-for="item in list" :key="item.id" class="detail-card">
            <div class="detail-card-header">
              <div class="detail-card-title">{{ item.name }}</div>
              <div class="detail-card-actions">
                <button class="btn btn-sm btn-ghost" title="编辑" @click="editCommunity(item)">
                  <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </button>
                <button class="btn btn-sm btn-ghost" title="删除" @click="deleteCommunity(item)">
                  <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="detail-card-body">
              <!-- Address & district -->
              <div class="detail-card-meta">
                <span v-if="item.address" class="meta-item">
                  <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {{ item.address }}
                </span>
                <span v-if="item.district || item.area" class="meta-item">
                  <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /><path d="M15 3v18" />
                  </svg>
                  {{ item.district || item.area }}
                </span>
              </div>

              <!-- Metric chips -->
              <div class="metric-row">
                <div class="metric-chip">
                  <span class="metric-label">楼栋数</span>
                  <span class="metric-value">{{ item.buildingCount ?? '—' }}</span>
                </div>
                <div class="metric-chip">
                  <span class="metric-label">总户数</span>
                  <span class="metric-value">{{ item.roomCount ?? '—' }}</span>
                </div>
                <div class="metric-chip metric-rent">
                  <span class="metric-label">出租</span>
                  <span class="metric-value">{{ item.unitCount ?? '—' }}</span>
                </div>
                <div class="metric-chip metric-sale">
                  <span class="metric-label">出售</span>
                  <span class="metric-value">{{ item.buildingCount ?? '—' }}</span>
                </div>
                <div class="metric-chip metric-price">
                  <span class="metric-label">均价</span>
                  <span class="metric-value">{{ formatPrice(item.longitude ? item.longitude : undefined) }}</span>
                </div>
              </div>

              <!-- Tags -->
              <div class="house-tags">
                <span v-if="item.businessCircle" class="tag tag-blue">{{ item.businessCircle }}</span>
                <span v-if="item.alias" class="tag tag-green">{{ item.alias }}</span>
                <span v-if="item.cityName" class="tag tag-purple">{{ item.cityName }}</span>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="!loading && list.length === 0" class="empty-state">
            暂无小区数据
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="total > query.pageSize" class="table-footer">
          <span class="text-muted">共 {{ total }} 条</span>
          <div class="pagination">
            <button
              class="page-btn"
              :disabled="query.page <= 1"
              @click="onPageChange(query.page - 1)"
            >
              <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              v-for="p in Math.ceil(total / query.pageSize)"
              :key="p"
              :class="['page-btn', { active: p === query.page }]"
              @click="onPageChange(p)"
            >
              {{ p }}
            </button>
            <button
              class="page-btn"
              :disabled="query.page >= Math.ceil(total / query.pageSize)"
              @click="onPageChange(query.page + 1)"
            >
              <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create dialog -->
  </div>
</template>

<style scoped lang="scss">
.community-page {
  min-height: 100%;
}

/* ── Tree search ── */
.tree-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--ink-50);
  border: 1px solid var(--ink-200);
  border-radius: var(--radius-sm);
  margin-bottom: 4px;

  .lucide {
    width: 14px;
    height: 14px;
    color: var(--ink-400);
    flex: none;
  }

  .input-tree {
    border: none;
    background: transparent;
    outline: none;
    font-size: 13px;
    color: var(--ink-700);
    width: 100%;
    font-family: inherit;
  }
  .input-tree::placeholder { color: var(--ink-300); }
}

/* ── Search input in page-actions ── */
.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  background: #fff;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius-sm);
  min-width: 220px;

  .lucide {
    width: 14px;
    height: 14px;
    color: var(--ink-400);
    flex: none;
  }

  .input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 13px;
    color: var(--ink-700);
    padding: 7px 0;
    width: 100%;
    min-width: 0;
    font-family: inherit;
  }
  .input::placeholder { color: var(--ink-300); }
}

/* ── Cards grid ── */
.house-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 14px;
}

/* ── Detail card ── */
.detail-card {
  background: #fff;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius);
  box-shadow: var(--shadow-xs);
  transition: all 0.18s;
}
.detail-card:hover {
  border-color: var(--ink-300);
  box-shadow: var(--shadow-sm);
}

.detail-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px 0;
}

.detail-card-title {
  font-weight: 700;
  color: var(--ink-900);
  font-size: 15px;
  line-height: 1.4;
}

.detail-card-actions {
  display: flex;
  gap: 2px;
  flex: none;
}

.detail-card-body {
  padding: 10px 14px 14px;
}

.detail-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin-bottom: 10px;

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--ink-500);

    .lucide {
      width: 12px;
      height: 12px;
      flex: none;
      color: var(--ink-400);
    }
  }
}

/* ── Metric row (楼栋数 · 总户数 · 出租 · 出售 · 均价) ── */
.metric-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.metric-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 5px 10px;
  background: var(--ink-50);
  border: 1px solid var(--ink-100);
  border-radius: 6px;
  min-width: 52px;
  flex: 1 0 auto;
  max-width: 80px;

  .metric-label {
    font-size: 10px;
    color: var(--ink-400);
    font-weight: 500;
    line-height: 1.3;
  }

  .metric-value {
    font-size: 15px;
    font-weight: 700;
    color: var(--ink-800);
    font-family: var(--font-num);
    line-height: 1.4;
  }
}

.metric-chip.metric-rent .metric-value { color: var(--warning); }
.metric-chip.metric-sale .metric-value { color: var(--danger); }
.metric-chip.metric-price .metric-value { color: var(--primary); font-size: 13px; }
</style>