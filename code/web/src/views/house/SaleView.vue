<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  BadgeCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  HelpCircle,
  ListFilter,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Settings2,
} from 'lucide-vue-next';
import {
  changeSaleStatus,
  deleteSaleProperty,
  exportSalePage,
  getSaleProperties,
  type SaleProperty,
  type SalePropertyQuery,
} from '@/api/sale';
import { getEmployees, getStores, type Employee, type Store } from '@/api/organization';
import { useDictStore } from '@/stores/dict';
import { downloadCsv } from '@/utils/csv';
import { formatDate, formatMoney } from '@/utils/format';

type ScopeValue = 'all' | 'sold' | 'mine';
type SortValue = 'created_desc' | 'published_desc' | 'price_desc' | 'price_asc' | 'area_desc' | 'quality_desc' | 'follow_asc';

const router = useRouter();
const dictStore = useDictStore();
const list = ref<SaleProperty[]>([]);
const overviewList = ref<SaleProperty[]>([]);
const total = ref(0);
const overviewTotal = ref(0);
const mineTotal = ref(0);
const loading = ref(false);
const statusItem = ref<SaleProperty>();
const nextStatus = ref('');
const savingStatus = ref(false);
const exporting = ref(false);
const deletingId = ref<number>();
const activeScope = ref<ScopeValue>('all');
const sortBy = ref<SortValue>('created_desc');
const moreFiltersOpen = ref(true);
const storeOptions = ref<Store[]>([]);
const employeeOptions = ref<Employee[]>([]);

const saleStatuses = [
  { value: '', label: '全部' },
  { value: 'pre_publish', label: '待发布' },
  { value: 'published', label: '已发布' },
  { value: 'price_negotiation', label: '议价中' },
  { value: 'quick_sale', label: '急售' },
  { value: 'sold', label: '已售' },
  { value: 'off_shelf', label: '已下架' },
];

const query = reactive<SalePropertyQuery & { page: number; pageSize: number }>({
  keyword: '', status: '', code: '', community: '', building: '', unit: '', roomNo: '',
  propertyType: '', maintainerId: '', storeId: '', isPublic: '', verified: '',
  minSalePrice: '', maxSalePrice: '', minArea: '', maxArea: '', layoutRooms: '',
  minFloor: '', maxFloor: '', decoration: '', orientation: '', sourceChannel: '', tag: '',
  minQualityScore: '', maxQualityScore: '', buildYearFrom: '', buildYearTo: '',
  page: 1, pageSize: 20,
});

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / query.pageSize)));
const storeNames = computed(() => new Map(storeOptions.value.map((item) => [item.id, item.name])));
const employeeNames = computed(() => new Map(employeeOptions.value.map((item) => [item.id, item.name])));
const overview = computed(() => ({
  published: overviewList.value.filter((item) => normalizeStatus(item.status) === 'published').length,
  quickSale: overviewList.value.filter((item) => normalizeStatus(item.status) === 'quick_sale').length,
  sold: overviewList.value.filter((item) => normalizeStatus(item.status) === 'sold').length,
  verified: overviewList.value.filter((item) => item.verified || item.govVerifyStatus === 'verified').length,
  stale: overviewList.value.filter((item) => Number(item.daysWithoutFollow || 0) >= 30).length,
}));

onMounted(async () => {
  await Promise.all([
    dictStore.ensureLoaded([
      'house_status', 'property_type', 'decoration_level', 'orientation', 'source_channel',
      'tax_type', 'certificate_type', 'house_tag',
    ]),
    loadOrganizations(),
  ]);
  await load();
});

async function loadOrganizations() {
  const [stores, employees] = await Promise.allSettled([getStores(), getEmployees()]);
  storeOptions.value = stores.status === 'fulfilled' ? stores.value : [];
  employeeOptions.value = employees.status === 'fulfilled' ? employees.value.list : [];
}

async function load() {
  loading.value = true;
  try {
    const [res, overviewRes, mineRes] = await Promise.all([
      getSaleProperties({ ...query, scope: activeScope.value, sortBy: sortBy.value }),
      getSaleProperties({ page: 1, pageSize: 200, sortBy: 'created_desc' }),
      getSaleProperties({ page: 1, pageSize: 1, scope: 'mine', sortBy: 'created_desc' }),
    ]);
    list.value = res.list;
    total.value = res.total;
    overviewList.value = overviewRes.list;
    overviewTotal.value = overviewRes.total;
    mineTotal.value = mineRes.total;
  } finally {
    loading.value = false;
  }
}

function search() {
  query.page = 1;
  load();
}

function setScope(scope: ScopeValue) {
  activeScope.value = scope;
  query.status = '';
  search();
}

function setStatus(status: string) {
  query.status = status;
  search();
}

function resetFilters() {
  Object.assign(query, {
    keyword: '', status: '', code: '', community: '', building: '', unit: '', roomNo: '',
    propertyType: '', maintainerId: '', storeId: '', isPublic: '', verified: '',
    minSalePrice: '', maxSalePrice: '', minArea: '', maxArea: '', layoutRooms: '',
    minFloor: '', maxFloor: '', decoration: '', orientation: '', sourceChannel: '', tag: '',
    minQualityScore: '', maxQualityScore: '', buildYearFrom: '', buildYearTo: '',
    page: 1, pageSize: query.pageSize,
  });
  activeScope.value = 'all';
  sortBy.value = 'created_desc';
  load();
}

function goToPage(page: number) {
  const nextPage = Math.max(1, Math.min(pageCount.value, page));
  if (nextPage === query.page) return;
  query.page = nextPage;
  load();
}

function openCreate() {
  router.push('/house/sale/create');
}

function openEdit(item: SaleProperty) {
  router.push('/house/sale/edit/' + item.id);
}

async function removeProperty(item: SaleProperty) {
  if (normalizeStatus(item.status) === 'sold' || deletingId.value) return;
  try {
    await ElMessageBox.confirm(`确认删除售房房源“${item.title}”？删除后无法恢复。`, '删除确认', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    });
    deletingId.value = item.id;
    await deleteSaleProperty(item.id);
    if (list.value.length === 1 && query.page > 1) query.page--;
    await load();
    ElMessage.success('售房房源已删除');
  } catch {
    // 用户取消时保持当前列表；接口错误由请求拦截器统一提示。
  } finally {
    deletingId.value = undefined;
  }
}

function normalizeStatus(status: string) {
  return ({ selling: 'published', bargain: 'price_negotiation' } as Record<string, string>)[status] || status;
}

function statusClass(status: string) {
  return ({
    published: 'pill-green', price_negotiation: 'pill-orange', quick_sale: 'pill-red',
    sold: 'pill-purple', off_shelf: 'pill-gray', pre_publish: 'pill-gray',
  } as Record<string, string>)[normalizeStatus(status)] || 'pill-gray';
}

function statusLabel(status: string) {
  const normalized = normalizeStatus(status);
  return saleStatuses.find((item) => item.value === normalized)?.label || status || '-';
}

function statusCount(status: string) {
  if (!status) return overviewTotal.value;
  return overviewList.value.filter((item) => normalizeStatus(item.status) === status).length;
}

function scopeCount(scope: ScopeValue) {
  if (scope === 'mine') return mineTotal.value;
  if (scope === 'sold') return overview.value.sold;
  return overviewTotal.value;
}

function formatHouseNumber(item: SaleProperty) {
  const building = item.building?.trim().replace(/(号楼|栋|座)$/u, '');
  const unit = item.unit?.trim().replace(/单元$/u, '');
  return `${building ? `${building}号楼` : ''}${unit ? `${unit}单元` : ''}${item.roomNo?.trim() || ''}` || '-';
}

function formatPriceWan(value?: number) {
  const amount = Number(value || 0);
  if (!amount) return '面议';
  return `${(amount / 10000).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}万`;
}

function qualityText(item: SaleProperty) {
  if (item.qualityScore == null) return '待评分';
  return `${item.qualityScore}分${item.qualityLevel ? ` · ${item.qualityLevel}级` : ''}`;
}

function followText(item: SaleProperty) {
  if (item.daysWithoutFollow != null) return `${item.daysWithoutFollow}天未跟进`;
  return item.lastFollowAt ? formatDate(item.lastFollowAt) : '暂无跟进';
}

function openStatus(item: SaleProperty) {
  statusItem.value = item;
  nextStatus.value = '';
}

async function saveStatus() {
  if (!statusItem.value || !nextStatus.value || savingStatus.value) return;
  savingStatus.value = true;
  try {
    await changeSaleStatus(statusItem.value.id, nextStatus.value);
    statusItem.value = undefined;
    ElMessage.success('审批申请已提交，通过后状态将自动更新');
    await load();
  } finally {
    savingStatus.value = false;
  }
}

async function exportCurrentPage() {
  exporting.value = true;
  try {
    const { list: rows } = await exportSalePage({ ...query, scope: activeScope.value, sortBy: sortBy.value });
    downloadCsv('售房当前页.csv', [
      ['房源码', '房源标题', '房屋用途', '小区', '房号', '户型', '建筑面积', '朝向', '装修', '售价', '单价', '状态', '房源质量', '维护人', '业主', '电话（脱敏）', '发布时间'],
      ...rows.map((item) => [
        item.code, item.title, dictStore.getLabel('property_type', item.propertyType), item.communityName,
        formatHouseNumber(item), `${item.layoutRooms}室${item.layoutHalls}厅${item.layoutBathrooms}卫${item.layoutBalconies || 0}阳`,
        item.buildingArea, dictStore.getLabel('orientation', item.orientation),
        dictStore.getLabel('decoration_level', item.decoration), item.totalPrice, item.unitPrice,
        statusLabel(item.status), qualityText(item), employeeNames.value.get(item.maintainerId || 0) || '',
        item.ownerName, item.ownerPhone, item.publishedAt || item.createdAt,
      ]),
    ]);
    ElMessage.success(`已导出当前筛选页 ${rows.length} 条`);
  } finally {
    exporting.value = false;
  }
}

function showHint(name: string) {
  ElMessage.info(`${name}将在后续版本开放`);
}
</script>

<template>
  <div class="sale-page">
    <div class="reference-note">
      <HelpCircle :size="15" />
      <span>支持房源范围、状态、价格、面积、户型、装修、来源和质量等组合查询，列表字段对齐经纪业务常用视图。</span>
    </div>

    <section class="page-header-panel">
      <div>
        <h1>售房管理</h1>
        <p>二手房源查询、验真、维护、跟进和成交状态统一管理</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="showHint('列表设置')"><Settings2 :size="15" /> 列表设置</button>
        <button v-permission="['sale:export']" class="btn btn-default" :disabled="exporting" @click="exportCurrentPage">
          <Download :size="15" /> 导出当前页
        </button>
        <button v-permission="['sale:add']" class="btn btn-primary" @click="openCreate"><Plus :size="16" /> 房源录入</button>
      </div>
    </section>

    <section class="summary-strip" aria-label="售房房源概览">
      <span>全部 <strong>{{ overviewTotal }}</strong> 套</span>
      <span>在售 <strong>{{ overview.published }}</strong> 套</span>
      <span class="summary-warning">急售 <strong>{{ overview.quickSale }}</strong> 套</span>
      <span>已售 <strong>{{ overview.sold }}</strong> 套</span>
      <span>已验真 <strong>{{ overview.verified }}</strong> 套</span>
      <span :class="{ 'summary-alert': overview.stale > 0 }">30天未跟进 <strong>{{ overview.stale }}</strong> 套</span>
    </section>

    <section class="workspace-card">
      <div class="market-tabs" role="tablist" aria-label="交易类型">
        <button class="market-tab active" role="tab">二手房</button>
        <button class="market-tab" role="tab" @click="router.push('/house/rent')">租房</button>
      </div>

      <div class="scope-tabs" role="tablist" aria-label="房源范围">
        <button v-for="tab in ([{ value: 'all', label: '租售房源' }, { value: 'sold', label: '成交房源' }, { value: 'mine', label: '我的房源' }] as const)" :key="tab.value" :class="['scope-tab', { active: activeScope === tab.value }]" role="tab" @click="setScope(tab.value)">
          {{ tab.label }} <span>{{ scopeCount(tab.value) }}</span>
        </button>
      </div>

      <div class="status-strip" aria-label="房源状态筛选">
        <button v-for="option in saleStatuses" :key="option.value" :class="['status-chip', { active: query.status === option.value }]" @click="setStatus(option.value)">
          {{ option.label }} <span>{{ statusCount(option.value) }}</span>
        </button>
      </div>

      <div class="filter-panel">
        <div class="filter-grid filter-grid-main">
          <label class="filter-control filter-wide">
            <span>综合查询</span>
            <div class="search-main"><Search :size="15" /><input v-model="query.keyword" aria-label="综合查询" placeholder="小区 / 房源码 / 房号 / 业主" @keyup.enter="search" /></div>
          </label>
          <label class="filter-control"><span>小区</span><input v-model="query.community" placeholder="小区名称" @keyup.enter="search" /></label>
          <label class="filter-control"><span>房源码</span><input v-model="query.code" placeholder="房源编号" @keyup.enter="search" /></label>
          <label class="filter-control"><span>栋座</span><input v-model="query.building" placeholder="栋座" @keyup.enter="search" /></label>
          <label class="filter-control"><span>单元</span><input v-model="query.unit" placeholder="单元" @keyup.enter="search" /></label>
          <label class="filter-control"><span>房号</span><input v-model="query.roomNo" placeholder="房号" @keyup.enter="search" /></label>
          <label class="filter-control"><span>房屋用途</span><select v-model="query.propertyType"><option value="">全部</option><option v-for="item in dictStore.getItems('property_type')" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
          <label class="filter-control"><span>维护人</span><select v-model="query.maintainerId"><option value="">全部</option><option v-for="item in employeeOptions" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label class="filter-control"><span>门店</span><select v-model="query.storeId"><option value="">全部门店</option><option v-for="item in storeOptions" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
        </div>

        <div v-show="moreFiltersOpen" class="filter-grid filter-grid-more">
          <label class="filter-control"><span>公私盘</span><select v-model="query.isPublic"><option value="">全部</option><option value="false">私盘</option><option value="true">公盘</option></select></label>
          <label class="filter-control"><span>验真状态</span><select v-model="query.verified"><option value="">全部</option><option value="true">已验真</option><option value="false">未验真</option></select></label>
          <label class="filter-control filter-range"><span>售价(万)</span><div><input v-model="query.minSalePrice" inputmode="decimal" placeholder="最低" @keyup.enter="search" /><i>—</i><input v-model="query.maxSalePrice" inputmode="decimal" placeholder="最高" @keyup.enter="search" /></div></label>
          <label class="filter-control filter-range"><span>面积(㎡)</span><div><input v-model="query.minArea" inputmode="decimal" placeholder="最小" @keyup.enter="search" /><i>—</i><input v-model="query.maxArea" inputmode="decimal" placeholder="最大" @keyup.enter="search" /></div></label>
          <label class="filter-control"><span>户型</span><select v-model="query.layoutRooms"><option value="">全部</option><option v-for="room in 6" :key="room" :value="room">{{ room }}室</option><option value="7">7室及以上</option></select></label>
          <label class="filter-control filter-range"><span>楼层</span><div><input v-model="query.minFloor" inputmode="numeric" placeholder="最低" @keyup.enter="search" /><i>—</i><input v-model="query.maxFloor" inputmode="numeric" placeholder="最高" @keyup.enter="search" /></div></label>
          <label class="filter-control"><span>装修</span><select v-model="query.decoration"><option value="">全部</option><option v-for="item in dictStore.getItems('decoration_level')" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
          <label class="filter-control"><span>朝向</span><select v-model="query.orientation"><option value="">全部</option><option v-for="item in dictStore.getItems('orientation')" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
          <label class="filter-control"><span>来源</span><select v-model="query.sourceChannel"><option value="">全部</option><option v-for="item in dictStore.getItems('source_channel')" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
          <label class="filter-control filter-range"><span>质量分</span><div><input v-model="query.minQualityScore" inputmode="numeric" placeholder="最低" @keyup.enter="search" /><i>—</i><input v-model="query.maxQualityScore" inputmode="numeric" placeholder="最高" @keyup.enter="search" /></div></label>
          <label class="filter-control filter-range"><span>建筑年代</span><div><input v-model="query.buildYearFrom" inputmode="numeric" placeholder="最早" @keyup.enter="search" /><i>—</i><input v-model="query.buildYearTo" inputmode="numeric" placeholder="最近" @keyup.enter="search" /></div></label>
          <label class="filter-control"><span>标签</span><input v-model="query.tag" placeholder="房源标签" @keyup.enter="search" /></label>
        </div>

        <div class="filter-actions">
          <button class="btn btn-primary" @click="search"><Search :size="15" /> 查询</button>
          <button class="btn btn-default" @click="resetFilters"><RotateCcw :size="14" /> 重置</button>
          <button class="btn btn-default" @click="moreFiltersOpen = !moreFiltersOpen"><ListFilter :size="14" /> {{ moreFiltersOpen ? '收起筛选' : '更多查询' }}</button>
        </div>
      </div>
    </section>

    <section class="list-toolbar">
      <div><Building2 :size="15" /><span>符合条件 <strong>{{ total }}</strong> 套</span></div>
      <label>排序：
        <select v-model="sortBy" aria-label="排序方式" @change="search">
          <option value="created_desc">新增时间</option><option value="published_desc">发布时间</option>
          <option value="price_desc">总价从高到低</option><option value="price_asc">总价从低到高</option>
          <option value="area_desc">面积从大到小</option><option value="quality_desc">房源质量</option>
          <option value="follow_asc">未跟进优先</option>
        </select>
      </label>
    </section>

    <div class="resource-table-shell" v-loading="loading">
      <div class="resource-table">
        <div class="resource-head resource-grid">
          <span>基本信息</span><span>房屋用途</span><span>房源状态</span><span>房源质量</span><span>跟进情况</span><span>发布时间</span><span>维护人</span><span>操作</span>
        </div>
        <article v-for="item in list" :key="item.id" class="resource-row resource-grid">
          <div class="basic-cell">
            <div class="house-cover">
              <img v-if="item.images?.[0]" :src="item.images[0]" :alt="item.title" />
              <div v-else class="house-cover-placeholder"><Building2 :size="26" /><small>{{ item.code }}</small></div>
              <span v-if="item.isPublic" class="cover-badge">公盘</span>
            </div>
            <div class="house-main">
              <button class="house-subject" @click="router.push(`/house/sale/detail/${item.id}`)">{{ item.communityName }} · {{ formatHouseNumber(item) }}</button>
              <p><MapPin :size="12" /> {{ item.title }}</p>
              <p class="house-facts">{{ item.layoutRooms }}室{{ item.layoutHalls }}厅{{ item.layoutBathrooms }}卫{{ item.layoutBalconies || 0 }}阳 · {{ item.buildingArea }}㎡ · {{ dictStore.getLabel('orientation', item.orientation) || '-' }} · {{ dictStore.getLabel('decoration_level', item.decoration) || '-' }} · {{ item.floor || '-' }}/{{ item.totalFloor || '-' }}层</p>
              <p class="price-line"><strong>{{ formatPriceWan(item.totalPrice) }}</strong><span>{{ item.unitPrice ? `${formatMoney(item.unitPrice, 0)}/㎡` : '单价待完善' }}</span><span v-if="item.floorPrice">底价 {{ formatPriceWan(item.floorPrice) }}</span></p>
              <div v-if="item.tags?.length || item.isRentSaleCoexist || item.verified" class="house-tags">
                <span v-if="item.isRentSaleCoexist" class="tag tag-purple">租售同存</span>
                <span v-if="item.verified" class="tag tag-green"><BadgeCheck :size="11" /> 已验真</span>
                <span v-for="tag in item.tags" :key="tag" class="tag tag-blue">{{ dictStore.getLabel('house_tag', tag) }}</span>
              </div>
            </div>
          </div>
          <div class="center-cell"><strong>{{ dictStore.getLabel('property_type', item.propertyType) || item.propertyType || '-' }}</strong><small>{{ item.isPublic ? '公共房源' : '私盘房源' }}</small></div>
          <div class="center-cell"><span :class="['pill', statusClass(item.status)]">{{ statusLabel(item.status) }}</span><small v-if="item.govVerifyStatus">{{ item.govVerifyStatus }}</small></div>
          <div class="center-cell quality-cell"><strong>{{ qualityText(item) }}</strong><small>{{ item.verified ? '验真通过' : '待验真' }}</small></div>
          <div class="center-cell"><strong :class="{ stale: Number(item.daysWithoutFollow || 0) >= 30 }">{{ followText(item) }}</strong><small>{{ item.viewingTime || '看房时间待完善' }}</small></div>
          <div class="center-cell"><strong>{{ formatDate(item.publishedAt || item.createdAt) }}</strong><small>更新 {{ formatDate(item.updatedAt || item.createdAt) }}</small></div>
          <div class="center-cell"><strong>{{ employeeNames.get(item.maintainerId || 0) || '未分配' }}</strong><small>{{ storeNames.get(item.storeId) || `门店 ${item.storeId}` }}</small></div>
          <div class="operation-cell">
            <button class="action-link" @click="router.push(`/house/sale/detail/${item.id}`)">详情</button>
            <button v-permission="['sale:edit']" class="action-link" @click="openEdit(item)">编辑</button>
            <button v-permission="['sale:changeStatus']" class="action-link" @click="openStatus(item)">变更状态</button>
            <button v-permission="['sale:delete']" class="action-link danger-text" :disabled="normalizeStatus(item.status) === 'sold' || deletingId === item.id" @click="removeProperty(item)">删除</button>
          </div>
        </article>
        <div v-if="!list.length && !loading" class="empty-state sale-empty">
          <Building2 :size="30" /><strong>没有找到符合条件的房源</strong><p>可以调整筛选条件后重新查询</p><button class="btn btn-default" @click="resetFilters"><RotateCcw :size="14" /> 清空筛选</button>
        </div>
      </div>
    </div>

    <footer v-if="!loading && total > 0" class="pagination-bar">
      <span>当前显示 {{ (query.page - 1) * query.pageSize + 1 }}–{{ Math.min(query.page * query.pageSize, total) }} 条，共 {{ total }} 条</span>
      <div class="pagination">
        <button class="page-btn" :disabled="query.page <= 1" aria-label="上一页" @click="goToPage(query.page - 1)"><ChevronLeft :size="15" /></button>
        <button v-for="page in pageCount" :key="page" :class="['page-btn', { active: page === query.page }]" @click="goToPage(page)">{{ page }}</button>
        <button class="page-btn" :disabled="query.page >= pageCount" aria-label="下一页" @click="goToPage(query.page + 1)"><ChevronRight :size="15" /></button>
      </div>
    </footer>

    <el-dialog :model-value="!!statusItem" title="变更售房状态" width="440px" @close="statusItem = undefined">
      <p>{{ statusItem?.title }}</p>
      <p>当前状态：{{ statusLabel(statusItem?.status || '') }}</p>
      <p>选择目标状态后提交审批，通过后生效。</p>
      <el-select v-model="nextStatus" placeholder="请选择目标状态" aria-label="目标状态" style="width: 100%">
        <el-option v-for="value in statusItem?.allowedStatuses || []" :key="value" :value="value" :label="statusLabel(value)" />
      </el-select>
      <template #footer>
        <el-button :disabled="savingStatus" @click="statusItem = undefined">取消</el-button>
        <el-button type="primary" :loading="savingStatus" :disabled="!nextStatus" @click="saveStatus">提交审批</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.sale-page { min-height: 100%; color: var(--ink-800); }
.reference-note { display: flex; align-items: center; gap: 8px; padding: 10px 13px; margin-bottom: 12px; color: #5f7194; background: #f4f8ff; border: 1px solid #b8d2ff; border-left: 3px solid var(--primary); border-radius: 8px; font-size: 11.5px; }
.reference-note svg { flex: none; color: var(--primary); }
.page-header-panel { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 2px 0 10px; }
.page-header-panel h1 { margin: 0; color: var(--ink-900); font-size: 23px; line-height: 1.4; }
.page-header-panel p { margin: 2px 0 0; color: var(--ink-400); font-size: 12px; }
.page-header-panel .page-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.summary-strip { display: flex; flex-wrap: wrap; gap: 9px; margin-bottom: 12px; }
.summary-strip > span { padding: 6px 13px; color: var(--ink-500); background: #fff; border: 1px solid var(--ink-200); border-radius: 99px; box-shadow: var(--shadow-xs); font-size: 12px; }
.summary-strip strong { margin: 0 2px; color: var(--ink-900); font-family: var(--font-num); font-size: 14px; }
.summary-strip .summary-warning { color: #9a5b04; background: #fffaf0; border-color: #f7d598; }
.summary-strip .summary-alert { color: var(--danger); background: var(--danger-soft); border-color: #fecaca; }
.workspace-card { margin-bottom: 12px; overflow: hidden; background: #fff; border: 1px solid var(--ink-200); border-radius: 12px; box-shadow: var(--shadow-xs); }
.market-tabs { display: flex; padding: 0 18px; border-bottom: 1px solid var(--ink-100); }
.market-tab { position: relative; padding: 14px 18px 12px; color: var(--ink-500); font-size: 13px; font-weight: 600; }
.market-tab::after { content: ''; position: absolute; right: 12px; bottom: -1px; left: 12px; height: 2px; background: transparent; }
.market-tab.active { color: var(--primary); }
.market-tab.active::after { background: var(--primary); }
.scope-tabs { display: flex; flex-wrap: wrap; gap: 5px; padding: 10px 16px 2px; }
.scope-tab { padding: 7px 11px; color: var(--ink-500); border-bottom: 2px solid transparent; font-size: 12px; }
.scope-tab span { padding: 1px 6px; margin-left: 3px; color: var(--ink-400); background: var(--ink-100); border-radius: 99px; font-family: var(--font-num); font-size: 10px; }
.scope-tab.active { color: var(--primary); border-bottom-color: var(--primary); font-weight: 700; }
.scope-tab.active span { color: var(--primary); background: var(--primary-soft); }
.status-strip { display: flex; flex-wrap: wrap; gap: 7px; padding: 8px 16px 11px; }
.status-chip { padding: 5px 10px; color: var(--ink-500); background: var(--ink-50); border: 1px solid var(--ink-200); border-radius: 99px; font-size: 11.5px; }
.status-chip span { margin-left: 3px; color: var(--ink-400); font-family: var(--font-num); }
.status-chip:hover { color: var(--primary); border-color: #b9ccf8; }
.status-chip.active { color: #fff; background: linear-gradient(135deg, #3e7cfa, #2e6bf0); border-color: transparent; box-shadow: 0 5px 12px -6px rgba(46, 107, 240, .8); }
.status-chip.active span { color: rgba(255, 255, 255, .78); }
.filter-panel { padding: 12px 14px; background: #fbfcff; border-top: 1px solid var(--ink-100); }
.filter-grid { display: grid; grid-template-columns: repeat(6, minmax(118px, 1fr)); gap: 9px 10px; }
.filter-grid-more { padding-top: 9px; }
.filter-wide { grid-column: span 2; }
.filter-control { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 6px; color: var(--ink-400); font-size: 10.5px; }
.filter-control > span { white-space: nowrap; }
.filter-control > input, .filter-control select { width: 100%; min-width: 0; height: 34px; padding: 0 9px; color: var(--ink-700); background: #fff; border: 1px solid var(--ink-200); border-radius: 6px; outline: 0; font: inherit; font-size: 11.5px; }
.filter-control > input:focus, .filter-control select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(46, 107, 240, .08); }
.search-main { display: flex; align-items: center; gap: 7px; height: 34px; padding: 0 9px; color: var(--ink-400); background: #fff; border: 1px solid var(--ink-200); border-radius: 6px; }
.search-main:focus-within { color: var(--primary); border-color: var(--primary); box-shadow: 0 0 0 3px rgba(46, 107, 240, .08); }
.search-main input { width: 100%; min-width: 0; color: var(--ink-700); background: transparent; border: 0; outline: 0; font: inherit; font-size: 11.5px; }
.filter-range { grid-column: span 2; }
.filter-range > div { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 5px; }
.filter-range input { width: 100%; min-width: 0; height: 34px; padding: 0 8px; color: var(--ink-700); background: #fff; border: 1px solid var(--ink-200); border-radius: 6px; outline: 0; font: inherit; font-size: 11.5px; }
.filter-range input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(46, 107, 240, .08); }
.filter-range i { color: var(--ink-300); font-style: normal; }
.filter-actions { display: flex; justify-content: flex-end; gap: 7px; padding-top: 11px; }
.list-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 13px; margin-bottom: 10px; color: var(--ink-500); background: #fff; border: 1px solid var(--ink-200); border-radius: 9px; box-shadow: var(--shadow-xs); font-size: 11.5px; }
.list-toolbar > div { display: flex; align-items: center; gap: 6px; }
.list-toolbar strong { color: var(--ink-900); font-family: var(--font-num); }
.list-toolbar label { display: flex; align-items: center; gap: 5px; }
.list-toolbar select { height: 29px; padding: 0 8px; color: var(--ink-600); background: #fff; border: 1px solid var(--ink-200); border-radius: 6px; outline: 0; font: inherit; }
.resource-table-shell { overflow-x: auto; background: #fff; border: 1px solid var(--ink-200); border-radius: 10px; box-shadow: var(--shadow-sm); }
.resource-table { min-width: 1120px; }
.resource-grid { display: grid; grid-template-columns: minmax(400px, 2.8fr) minmax(90px, .72fr) minmax(90px, .72fr) minmax(100px, .78fr) minmax(110px, .9fr) minmax(105px, .82fr) minmax(100px, .82fr) minmax(92px, .72fr); }
.resource-head { color: var(--ink-500); background: var(--ink-50); border-bottom: 1px solid var(--ink-200); font-size: 11.5px; font-weight: 700; }
.resource-head span { display: flex; align-items: center; justify-content: center; min-height: 42px; padding: 8px 10px; border-right: 1px solid var(--ink-100); }
.resource-row { min-height: 154px; border-bottom: 1px solid var(--ink-100); transition: background .15s; }
.resource-row:last-of-type { border-bottom: 0; }
.resource-row:hover { background: var(--primary-softer); }
.resource-row > div { min-width: 0; padding: 14px 10px; border-right: 1px solid var(--ink-100); }
.resource-row > div:last-child { border-right: 0; }
.basic-cell { display: flex; align-items: flex-start; gap: 13px; }
.house-cover { position: relative; width: 120px; height: 90px; flex: none; overflow: hidden; background: var(--ink-100); border: 1px solid var(--ink-200); border-radius: 8px; }
.house-cover img { width: 100%; height: 100%; object-fit: cover; }
.house-cover-placeholder { display: grid; place-items: center; align-content: center; gap: 5px; width: 100%; height: 100%; color: rgba(255, 255, 255, .9); background: linear-gradient(135deg, #315da8, #4d8df8); }
.house-cover-placeholder small { max-width: 105px; overflow: hidden; color: rgba(255, 255, 255, .68); font-family: var(--font-num); font-size: 9.5px; text-overflow: ellipsis; white-space: nowrap; }
.cover-badge { position: absolute; top: 5px; left: 5px; padding: 2px 6px; color: #fff; background: rgba(22, 163, 74, .9); border-radius: 4px; font-size: 9.5px; }
.house-main { flex: 1; min-width: 0; }
.house-subject { display: block; max-width: 100%; overflow: hidden; color: var(--ink-900); font-size: 14px; font-weight: 700; text-align: left; text-overflow: ellipsis; white-space: nowrap; }
.house-subject:hover { color: var(--primary); }
.house-main > p { display: flex; align-items: center; gap: 4px; margin: 4px 0 0; overflow: hidden; color: var(--ink-400); font-size: 10.5px; text-overflow: ellipsis; white-space: nowrap; }
.house-main .house-facts { color: var(--ink-600); font-size: 11.5px; }
.house-main .price-line { gap: 10px; }
.price-line strong { color: var(--danger); font-family: var(--font-num); font-size: 16px; }
.price-line span { color: var(--ink-500); }
.house-tags { margin-top: 7px; }
.house-tags .tag { gap: 3px; padding: 2px 6px; font-size: 9.5px; }
.center-cell { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 5px; color: var(--ink-700); text-align: center; }
.center-cell strong { max-width: 100%; overflow: hidden; font-size: 11.5px; text-overflow: ellipsis; white-space: nowrap; }
.center-cell small { max-width: 100%; overflow: hidden; color: var(--ink-400); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.center-cell .stale { color: var(--danger); }
.quality-cell strong { color: #8a5a13; }
.operation-cell { display: flex; align-items: center; justify-content: center; align-content: center; flex-wrap: wrap; gap: 5px; }
.action-link { padding: 4px 7px; color: var(--ink-600); background: #fff; border: 1px solid var(--ink-200); border-radius: 5px; font-size: 10.5px; }
.action-link:hover { color: var(--primary); background: var(--primary-soft); border-color: #bfd0f5; }
.action-link:disabled { color: var(--ink-300) !important; cursor: not-allowed; opacity: .55; }
.danger-text { color: var(--danger); }
.sale-empty { min-width: 1120px; background: #fff; }
.sale-empty svg { color: var(--primary); }
.sale-empty strong { display: block; margin-top: 8px; color: var(--ink-700); }
.sale-empty p { margin: 3px 0 12px; }
.pagination-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 14px; margin-top: 14px; color: var(--ink-400); background: #fff; border: 1px solid var(--ink-200); border-radius: 10px; font-size: 11.5px; }
@media (max-width: 1280px) { .filter-grid { grid-template-columns: repeat(4, minmax(118px, 1fr)); } }
@media (max-width: 820px) {
  .page-header-panel { align-items: flex-start; flex-direction: column; }
  .page-header-panel .page-actions { justify-content: flex-start; }
  .filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .filter-wide, .filter-range { grid-column: span 2; }
  .pagination-bar { align-items: flex-start; flex-direction: column; }
}
@media (max-width: 480px) {
  .page-header-panel h1 { font-size: 21px; }
  .market-tabs, .scope-tabs, .status-strip { overflow-x: auto; flex-wrap: nowrap; }
  .market-tab, .scope-tab, .status-chip { flex: none; }
  .filter-grid { grid-template-columns: 1fr; }
  .filter-wide, .filter-range { grid-column: auto; }
  .filter-control { grid-template-columns: 70px minmax(0, 1fr); }
  .filter-actions, .list-toolbar { align-items: stretch; flex-direction: column; }
}
</style>
