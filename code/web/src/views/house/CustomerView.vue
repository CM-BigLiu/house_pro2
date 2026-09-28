<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getCustomers, type Customer } from '@/api/customer';
import { useDictStore } from '@/stores/dict';
import CustomerWorkflowDialog from '@/components/CustomerWorkflowDialog.vue';
import type { CustomerWorkflowAction } from '@/api/deal';

const router = useRouter();
const route = useRoute();
const dictStore = useDictStore();
const list = ref<Customer[]>([]);
const loading = ref(false);
const total = ref(0);
const activeTab = ref('all');
const query = reactive({ keyword: typeof route.query.keyword === 'string' ? route.query.keyword : '', customerType: '', status: '', desiredDistrict: '', budgetMin: '', budgetMax: '', page: 1, pageSize: 10 });
const workflowVisible = ref(false), workflowAction = ref<CustomerWorkflowAction>('appointment'), selectedCustomer = ref<Customer | null>(null);
const loadFailed = ref(false);
let loadGeneration = 0;
const statusTabs = [
  { value: 'all', label: '全部客户' }, { value: 'tenant', label: '租房客户' },
  { value: 'buyer', label: '买房客户' }, { value: 'active', label: '有效客户' },
  { value: 'done', label: '已成交' }, { value: 'invalid', label: '已失效' },
];
const stats = computed(() => ({
  all: total.value,
  rent: list.value.filter((item) => item.customerType === 'tenant').length,
  buy: list.value.filter((item) => item.customerType === 'buyer').length,
}));

onMounted(async () => {
  await dictStore.ensureLoaded(['identity', 'customer_status', 'source_channel']);
  await load();
});
async function load() {
  const generation = ++loadGeneration;
  loading.value = true;
  loadFailed.value = false;
  try {
    const res = await getCustomers(query);
    if (generation !== loadGeneration) return;
    list.value = res.list;
    total.value = res.total;
  } catch { if (generation === loadGeneration) { list.value = []; total.value = 0; loadFailed.value = true; } }
  finally { if (generation === loadGeneration) loading.value = false; }
}
function onTabChange(value: string) {
  activeTab.value = value;
  query.customerType = ['tenant', 'buyer'].includes(value) ? value : '';
  query.status = ['all', 'tenant', 'buyer'].includes(value) ? '' : value;
  query.page = 1;
  load();
}
function search() { query.page = 1; load(); }
function reset() {
  Object.assign(query, { keyword: '', customerType: '', status: '', desiredDistrict: '', budgetMin: '', budgetMax: '', page: 1, pageSize: 10 });
  activeTab.value = 'all';
  load();
}
function openEdit(item: Customer) { router.push(`/house/customer/edit/${item.id}`); }
function openWorkflow(item: Customer, action: CustomerWorkflowAction) {
  selectedCustomer.value = item; workflowAction.value = action; workflowVisible.value = true;
}
function typeChanged() { activeTab.value = query.status || query.customerType || 'all'; }
function canStart(item: Customer) { return ['tenant', 'buyer'].includes(item.customerType) && item.status !== 'invalid'; }
function customerTypeLabel(type: string) {
  return ({ tenant: '租客', buyer: '买家', landlord: '业主' } as Record<string, string>)[type]
    || dictStore.getLabel('identity', type) || type;
}
function budgetText(item: Customer) {
  if (item.budgetMin == null && item.budgetMax == null) return '—';
  return `${item.budgetMin ?? 0} - ${item.budgetMax ?? '不限'}`;
}
function statusClass(status: string) {
  return ({ active: 'pill-blue', done: 'pill-green', invalid: 'pill-gray' } as Record<string, string>)[status] || 'pill-gray';
}
function statusLabel(status: string) {
  return ({ active: '有效', done: '已成交', invalid: '已失效' } as Record<string, string>)[status] || status;
}
</script>

<template>
  <div class="house-view">
    <div class="page-header">
      <div><div class="page-title">客源管理</div><div class="page-desc">统一维护租客、买家和业主资料</div></div>
      <div class="page-actions"><button v-permission="['house:customer:create']" class="btn btn-primary" @click="router.push('/house/customer/create')">新增客源</button></div>
    </div>
    <div class="status-tabs">
      <button v-for="tab in statusTabs" :key="tab.value" :class="['status-tab', { active: activeTab === tab.value }]" @click="onTabChange(tab.value)">{{ tab.label }}</button>
    </div>
    <div class="filter-bar">
      <input v-model="query.keyword" class="input filter-input" placeholder="姓名 / 电话 / 合同编号" @keyup.enter="search" />
      <select v-model="query.customerType" class="select filter-select" @change="typeChanged"><option value="">全部类型</option><option value="tenant">租客</option><option value="buyer">买家</option><option value="landlord">业主</option></select>
      <div class="filter-range">
        <div class="budget-field">
          <input v-model="query.budgetMin" type="number" min="0" class="input filter-input range-input" placeholder="预算 min" />
          <MoneyUppercase :value="query.budgetMin" />
        </div>
        <span class="range-sep">~</span>
        <div class="budget-field">
          <input v-model="query.budgetMax" type="number" min="0" class="input filter-input range-input" placeholder="预算 max" />
          <MoneyUppercase :value="query.budgetMax" />
        </div>
      </div>
      <input v-model="query.desiredDistrict" class="input filter-input" placeholder="期望区域" />
      <button class="btn btn-primary btn-sm" @click="search">筛选</button><button class="btn btn-ghost btn-sm" @click="reset">重置</button>
    </div>
    <div class="summary-row"><span class="summary-chip">符合条件 {{ stats.all }}</span><span class="summary-chip">· 当前页租客 {{ stats.rent }}</span><span class="summary-chip">· 当前页买家 {{ stats.buy }}</span></div>
    <div class="table-wrap" v-loading="loading">
      <table class="data-table">
        <thead><tr><th>姓名</th><th>电话</th><th>客户类型</th><th>预算范围</th><th>期望区域</th><th>跟进人</th><th>状态</th><th>登记时间</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-if="!list.length"><td colspan="9" class="empty-row">{{ loadFailed ? '加载失败，请重新筛选或刷新' : '暂无数据' }}</td></tr>
          <tr v-for="item in list" :key="item.id">
            <td><div class="cell-main">{{ item.name }}</div><div v-if="item.relatedPropertyCode" class="cell-sub">{{ item.relatedPropertyCode }}</div></td>
            <td>{{ item.mobile || '—' }}</td><td><span class="pill pill-blue">{{ customerTypeLabel(item.customerType) }}</span></td>
            <td>{{ budgetText(item) }}</td><td>{{ item.desiredDistrict || '—' }}</td><td>{{ item.employeeName || '—' }}</td>
            <td><span :class="['pill', statusClass(item.status)]">{{ statusLabel(item.status) }}</span></td><td>{{ item.createdAt?.slice(0, 10) || '—' }}</td>
            <td class="operations"><button v-permission="['house:customer:edit']" class="btn btn-sm btn-ghost" @click="openEdit(item)">编辑</button>
              <button v-permission="['house:customer:appointment']" class="btn btn-sm btn-ghost" :disabled="!canStart(item)" @click="openWorkflow(item, 'appointment')">约看</button>
              <button v-permission="['house:customer:sign']" class="btn btn-sm btn-ghost" :disabled="!canStart(item)" @click="openWorkflow(item, 'sign')">签约</button>
              <button v-permission="['house:customer:terminate']" class="btn btn-sm btn-ghost danger" :disabled="!['tenant','buyer'].includes(item.customerType)" @click="openWorkflow(item, 'terminate')">解约</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="table-footer"><span>共 {{ total }} 条</span><div class="pagination"><button class="page-btn" :disabled="query.page <= 1" @click="query.page--; load()">上一页</button><span class="page-info">第 {{ query.page }} 页 / 共 {{ Math.max(1, Math.ceil(total / query.pageSize)) }} 页</span><button class="page-btn" :disabled="query.page >= Math.ceil(total / query.pageSize)" @click="query.page++; load()">下一页</button></div></div>
    <CustomerWorkflowDialog v-model:visible="workflowVisible" :customer="selectedCustomer" :action="workflowAction" @completed="load" @switch="workflowAction = $event" />
  </div>
</template>

<style scoped lang="scss">
.house-view { min-height: 100%; }
.table-wrap { overflow-x: auto; }
.data-table { min-width: 1020px; }
.operations { min-width: 184px; }
.operations .btn { padding: 4px 7px; }
.danger { color: #e45959; }
.filter-input { width: 180px; }
.filter-select { width: 130px; }
.filter-bar > .filter-range { align-items: flex-start; }
.filter-range .budget-field { width: 160px; min-width: 0; }
.filter-range .range-input { width: 100%; }
.filter-range .range-sep { padding-top: 7px; }

@media (max-width: 768px) {
  .filter-input, .filter-select, .filter-range { width: 100%; }
  .filter-range .budget-field { flex: 1; width: 100%; }
}
</style>
