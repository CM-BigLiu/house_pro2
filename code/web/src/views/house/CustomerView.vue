<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getCustomers, type Customer } from '@/api/customer';
import { useDictStore } from '@/stores/dict';

const router = useRouter();
const dictStore = useDictStore();
const list = ref<Customer[]>([]);
const loading = ref(false);
const total = ref(0);
const query = reactive({ keyword: '', identity: '', status: '', district: '', budgetMin: '', budgetMax: '', page: 1, pageSize: 10 });
const currentPage = ref(1);
const pageSize = ref(10);
const activeTab = ref('all');

const statusMap: Record<string, string> = {
  all: '全部客户',
  rent_a: '求租 A',
  rent_b: '求租 B',
  buy: '求购',
  done: '已成交',
  invalid: '已失效',
};

const stats = computed(() => {
  const all = list.value.length;
  const rent = list.value.filter((i: Customer) => i.identity === 'tenant').length;
  const buy = list.value.filter((i: Customer) => i.identity === 'shareholder').length;
  return { all, rent, buy };
});

onMounted(async () => {
  await dictStore.ensureLoaded(['identity', 'customer_status', 'source_channel']);
  await load();
});

async function load() {
  loading.value = true;
  try {
    const res = await getCustomers({ keyword: query.keyword, identity: query.identity });
    list.value = res.list;
    total.value = res.total ?? res.list.length;
  } finally {
    loading.value = false;
  }
}

function onTabChange(tab: string) {
  activeTab.value = tab;
  if (tab === 'all') query.status = '';
  else query.status = tab;
  currentPage.value = 1;
  load();
}

function onSearch() {
  currentPage.value = 1;
  load();
}

function onReset() {
  Object.assign(query, { keyword: '', identity: '', status: '', district: '', budgetMin: '', budgetMax: '', page: 1, pageSize: 10 });
  activeTab.value = 'all';
  currentPage.value = 1;
  load();
}

function onPageChange(page: number) {
  currentPage.value = page;
  load();
}

function openCreate() {
  router.push('/house/customer/create');
}

function statusPillClass(status: string) {
  const map: Record<string, string> = {
    not_rented: 'pill-orange',
    pending: 'pill-orange',
    following: 'pill-blue',
    rented: 'pill-green',
    sold: 'pill-green',
    done: 'pill-green',
    invalid: 'pill-gray',
  };
  return map[status] || 'pill-gray';
}

function identityClass(id: string) {
  const map: Record<string, string> = {
    tenant: 'pill-blue',
    landlord: 'pill-green',
    shareholder: 'pill-purple',
    supplier: 'pill-orange',
  };
  return map[id] || 'pill-gray';
}
</script>

<template>
  <div class="house-view">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title">客源管理</div>
      <div class="page-actions">
        <button class="btn btn-primary" @click="openCreate">新增客源</button>
      </div>
    </div>

    <!-- Status Tabs -->
    <div class="status-tabs">
      <button
        v-for="(label, key) in statusMap"
        :key="key"
        :class="['status-tab', { active: activeTab === key }]"
        @click="onTabChange(key)"
      >
        {{ label }}
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <input
        v-model="query.keyword"
        class="filter-input"
        placeholder="姓名 / 电话"
        @keyup.enter="onSearch"
      />
      <select v-model="query.identity" class="filter-select">
        <option value="">需求类型</option>
        <option value="tenant">求租</option>
        <option value="shareholder">求购</option>
      </select>
      <div class="filter-range">
        <input v-model="query.budgetMin" class="filter-input range-input" placeholder="预算 min" />
        <span class="range-sep">~</span>
        <input v-model="query.budgetMax" class="filter-input range-input" placeholder="预算 max" />
      </div>
      <select v-model="query.district" class="filter-select">
        <option value="">区域</option>
      </select>
      <button class="btn btn-primary btn-sm" @click="onSearch">筛选</button>
      <button class="btn btn-ghost btn-sm" @click="onReset">重置</button>
    </div>

    <!-- Summary Row -->
    <div class="summary-row">
      <span class="summary-chip">客源总数 {{ stats.all }}</span>
      <span class="summary-chip">· 求租 {{ stats.rent }}</span>
      <span class="summary-chip">· 求购 {{ stats.buy }}</span>
    </div>

    <!-- Data Table -->
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>姓名</th>
            <th>电话</th>
            <th>需求类型</th>
            <th>预算范围</th>
            <th>期望区域</th>
            <th>跟进人</th>
            <th>状态</th>
            <th>跟进时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="list.length === 0">
            <td colspan="9" class="empty-row">暂无数据</td>
          </tr>
          <tr v-for="item in list" :key="item.id">
            <td>
              <div class="cell-sub">{{ item.name }}</div>
            </td>
            <td>{{ item.phone }}</td>
            <td>
              <span :class="['pill', identityClass(item.identity)]">
                {{ dictStore.getLabel('identity', item.identity) }}
              </span>
            </td>
            <td>—</td>
            <td>—</td>
            <td>{{ item.employeeName || '—' }}</td>
            <td>
              <span :class="['pill', statusPillClass(item.status)]">
                {{ dictStore.getLabel('customer_status', item.status) }}
              </span>
            </td>
            <td>{{ item.createdAt || '—' }}</td>
            <td class="operation-cell">
              <button class="btn btn-sm btn-ghost">编辑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="table-footer">
      <div class="pagination">
        <button
          class="page-btn"
          :disabled="currentPage <= 1"
          @click="onPageChange(currentPage - 1)"
        >
          上一页
        </button>
        <span class="page-info">第 {{ currentPage }} 页 / 共 {{ Math.ceil(total / pageSize) }} 页</span>
        <button
          class="page-btn"
          :disabled="currentPage >= Math.ceil(total / pageSize)"
          @click="onPageChange(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.house-view { min-height: 100%; }
</style>