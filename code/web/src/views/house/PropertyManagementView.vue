<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Building2, RefreshCw, Search } from 'lucide-vue-next';
import { getManagedProperties, getManagedTenants, type ManagedProperty, type ManagedTenant } from '@/api/property-management';
import { useDictStore } from '@/stores/dict';
import PropertyConfigurationDialog from '@/components/PropertyConfigurationDialog.vue';

const router = useRouter();
const dictStore = useDictStore();
const activeTab = ref<'properties' | 'tenants'>('properties');
const properties = ref<ManagedProperty[]>([]);
const tenants = ref<ManagedTenant[]>([]);
const total = ref(0);
const loading = ref(false);
const loadError = ref(false);
const configurationProperty = ref<ManagedProperty | null>(null);
const configurationVisible = ref(false);
function configure(item: ManagedProperty) { configurationProperty.value = item; configurationVisible.value = true; }
const query = reactive({ keyword: '', page: 1, pageSize: 20 });
let requestId = 0;
const showingProperties = computed(() => activeTab.value === 'properties');
const statusLabels: Record<string, string> = { active: '空置', vacant: '空置', rented: '已租', reserved: '已定',
  maintenance: '冻结', configuring: '配置中', dirty: '待保洁', repair: '维修中', checkout: '退租待审批', off_shelf: '已下架' };

async function load() {
  const id = ++requestId;
  loading.value = true;
  loadError.value = false;
  try {
    const params = { ...query, keyword: query.keyword.trim() };
    if (showingProperties.value) {
      const data = await getManagedProperties(params);
      if (id !== requestId) return;
      properties.value = data.list;
      total.value = data.total;
    } else {
      const data = await getManagedTenants(params);
      if (id !== requestId) return;
      tenants.value = data.list;
      total.value = data.total;
    }
  } catch {
    if (id !== requestId) return;
    properties.value = [];
    tenants.value = [];
    total.value = 0;
    loadError.value = true;
  } finally {
    if (id === requestId) loading.value = false;
  }
}

function changeTab(tab: 'properties' | 'tenants') {
  if (activeTab.value === tab) return;
  activeTab.value = tab;
  query.keyword = '';
  query.page = 1;
  total.value = 0;
  properties.value = [];
  tenants.value = [];
  load();
}
function search() { query.page = 1; load(); }
function reset() { query.keyword = ''; search(); }
function propertyName(item: ManagedProperty) {
  return item.title || [item.communityName || '租房房源', item.building && `${item.building}栋`, item.unit && `${item.unit}单元`, item.roomNo].filter(Boolean).join(' ');
}
function statusLabel(status: string) { return statusLabels[status] || dictStore.getLabel('room_status', status) || status; }
function signedTime(value: string | null) {
  if (!value) return '未登记';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '未登记';
  return date.toLocaleString('zh-CN', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function overdue(date: string | null) {
  if (!date) return false;
  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return date.slice(0, 10) < localDate;
}
onMounted(() => { load(); void dictStore.ensureLoaded(['room_status']).catch(() => {}); });
</script>

<template>
  <div class="management-page">
    <header class="page-header">
      <div><h1 class="page-title">房管房管理</h1><p class="page-desc">统一管理已托管房源、租客与租金支付时间</p></div>
      <button class="btn btn-default" :disabled="loading" @click="load"><RefreshCw :size="14" />刷新</button>
    </header>
    <section class="management-card">
      <div class="management-tabs" role="tablist" aria-label="房管房管理">
        <button id="properties-tab" role="tab" aria-controls="properties-panel" :aria-selected="showingProperties" :class="{ active: showingProperties }" @click="changeTab('properties')">房管管理</button>
        <button id="tenants-tab" role="tab" aria-controls="tenants-panel" :aria-selected="!showingProperties" :class="{ active: !showingProperties }" @click="changeTab('tenants')">客户管理</button>
      </div>
      <div class="management-toolbar">
        <el-input v-model="query.keyword" :placeholder="showingProperties ? '搜索小区、地址、房源名称或编号' : '搜索租客姓名或联系电话'" maxlength="100" clearable @keyup.enter="search" @clear="search" />
        <button class="btn btn-primary" :disabled="loading" @click="search"><Search :size="14" />查询</button>
        <button class="btn btn-default" :disabled="loading" @click="reset">重置</button>
        <span class="record-count">共 {{ total }} {{ showingProperties ? '套房源' : '份租约' }}</span>
      </div>
      <p class="management-tip">仅显示已托管房源，记录仅填写人和管理员可见；可在租房编辑页取消托管。{{ showingProperties ? '租赁期限为与房东签订的租期。' : '展示已录入的实际租客，不包含意向客户；未通过系统签约的记录显示“未登记”。' }}付款日期取未结清租金账单的最早应付日，已逾期账单优先展示。</p>
      <div v-if="loadError" class="load-error" role="alert">数据加载失败，请重试。<button class="btn btn-default btn-sm" @click="load">重试</button></div>
      <div v-else-if="showingProperties" id="properties-panel" role="tabpanel" aria-labelledby="properties-tab" v-loading="loading" class="management-table-shell">
        <table class="management-table property-table">
          <thead><tr><th>基本信息</th><th>房源状态</th><th>租赁期限（与房东）</th><th>下一次给房东的房租支付时间</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="item in properties" :key="item.id" class="property-row" @dblclick="router.push(`/house/rent/detail/${item.id}`)">
              <td><div class="property-info"><div class="property-icon"><Building2 :size="24" /></div><div>
                <button class="property-link" @click="router.push(`/house/rent/detail/${item.id}`)">{{ propertyName(item) }}</button>
                <div class="property-meta">{{ item.address || '地址未登记' }}</div>
                <div class="property-meta">{{ item.bizType === 'shared' ? '合租' : '整租' }} · {{ item.layout || '户型未登记' }}<template v-if="item.buildingArea"> · {{ item.buildingArea }}㎡</template></div>
                <small class="property-code">{{ item.code }}</small>
              </div></div></td>
              <td><span :class="['status-pill', { rented: item.status === 'rented' }]">{{ statusLabel(item.status) }}</span></td>
              <td><template v-if="item.leaseStart || item.leaseEnd"><div>{{ item.leaseStart || '开始日期未登记' }}</div><div class="date-end">至 {{ item.leaseEnd || '结束日期未登记' }}</div></template><span v-else class="muted">租期未登记</span></td>
              <td><span v-if="item.nextLandlordPaymentDate" :class="{ 'payment-overdue': overdue(item.nextLandlordPaymentDate) }">{{ item.nextLandlordPaymentDate }}<small v-if="overdue(item.nextLandlordPaymentDate)" class="overdue-tag">逾期</small></span><span v-else class="muted">未生成租金账单</span></td>
              <td><button v-permission="['renting:edit']" class="btn btn-ghost btn-sm" @click.stop="configure(item)">配置</button></td>
            </tr>
            <tr v-if="!loading && !properties.length"><td colspan="5" class="empty-state">暂无符合条件的托管房源</td></tr>
          </tbody>
        </table>
      </div>
      <div v-else id="tenants-panel" role="tabpanel" aria-labelledby="tenants-tab" v-loading="loading" class="management-table-shell">
        <table class="management-table tenant-table">
          <thead><tr><th>租客姓名</th><th>联系电话</th><th>签约时间</th><th>下一次租金支付时间</th></tr></thead>
          <tbody>
            <tr v-for="item in tenants" :key="item.key"><td>{{ item.tenantName }}</td><td>{{ item.tenantPhone || '未登记' }}</td><td>{{ signedTime(item.signedAt) }}</td><td><span v-if="item.nextRentPaymentDate" :class="{ 'payment-overdue': overdue(item.nextRentPaymentDate) }">{{ item.nextRentPaymentDate }}<small v-if="overdue(item.nextRentPaymentDate)" class="overdue-tag">逾期</small></span><span v-else class="muted">未生成租金账单</span></td></tr>
            <tr v-if="!loading && !tenants.length"><td colspan="4" class="empty-state">暂无符合条件的租客</td></tr>
          </tbody>
        </table>
      </div>
      <footer class="management-pagination"><el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" :page-sizes="[20, 50, 100]" layout="total, sizes, prev, pager, next" @current-change="load" @size-change="search" /></footer>
    </section>
    <PropertyConfigurationDialog v-model:visible="configurationVisible" :property-id="configurationProperty?.id || null" :property-name="configurationProperty ? propertyName(configurationProperty) : ''" @completed="load" />
  </div>
</template>

<style scoped>
.management-page { display: grid; gap: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.page-title { font-size: 22px; margin: 0 0 6px; }
.page-desc { margin: 0; font-size: 13px; color: var(--ink-400); }
.management-card { background: #fff; border: 1px solid var(--ink-200); border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgb(15 23 42 / 3%); }
.management-tabs { display: flex; gap: 24px; padding: 0 20px; border-bottom: 1px solid var(--ink-200); }
.management-tabs button { padding: 18px 8px 14px; background: transparent; border: 0; border-bottom: 3px solid transparent; color: var(--ink-500); font-size: 14px; cursor: pointer; }
.management-tabs button.active { color: var(--brand-600, #2e6bf0); border-bottom-color: #2e6bf0; font-weight: 600; }
.management-toolbar { display: flex; align-items: center; gap: 10px; padding: 20px 20px 12px; }
.management-toolbar :deep(.el-input) { max-width: 400px; }
.record-count { margin-left: auto; white-space: nowrap; font-size: 13px; color: var(--ink-500); }
.management-tip { margin: 0 20px 18px; padding: 10px 12px; background: #f6f9ff; color: var(--ink-500); border-radius: 6px; font-size: 12px; line-height: 1.7; }
.management-table-shell { overflow-x: auto; }
.management-table { width: 100%; min-width: 760px; border-collapse: collapse; font-size: 13px; }
.management-table th { text-align: left; background: #f7f9fc; color: var(--ink-500); font-size: 12px; font-weight: 600; padding: 14px 20px; border-block: 1px solid var(--ink-200); }
.management-table td { padding: 20px; border-bottom: 1px solid #edf1f7; color: var(--ink-700); line-height: 1.6; }
.property-table th:first-child { width: 42%; }
.property-row:hover, .tenant-table tbody tr:hover { background: #f8faff; }
.property-info { display: flex; align-items: center; gap: 14px; }
.property-icon { width: 64px; height: 64px; display: grid; place-items: center; flex: none; border-radius: 9px; background: #edf3ff; color: #3774f6; }
.property-link { padding: 0; background: transparent; border: 0; font-weight: 600; font-size: 14px; color: var(--ink-900); cursor: pointer; text-align: left; }
.property-link:hover { color: #2e6bf0; }
.property-meta { color: var(--ink-500); font-size: 12px; margin-top: 3px; }
.property-code { color: var(--ink-400); font-size: 11px; }
.status-pill { display: inline-block; padding: 3px 10px; border-radius: 999px; color: #159955; background: #eafbf2; white-space: nowrap; font-size: 12px; }
.status-pill.rented { color: #2e6bf0; background: #edf3ff; }
.date-end { color: var(--ink-500); font-size: 12px; margin-top: 4px; }
.muted { color: var(--ink-400); font-size: 12px; }
.payment-overdue { color: #e45a55; }
.overdue-tag { display: block; font-size: 11px; }
.management-table .empty-state { text-align: center; padding: 64px 20px; color: var(--ink-400); }
.management-pagination { display: flex; justify-content: flex-end; padding: 16px 20px; overflow-x: auto; }
.load-error { display: flex; align-items: center; justify-content: center; gap: 12px; color: #e45a55; padding: 64px 20px; }
@media (max-width: 640px) { .management-toolbar { flex-wrap: wrap; } .management-toolbar :deep(.el-input) { max-width: 100%; } .record-count { margin-left: 0; } .property-icon { display: none; } }
</style>
