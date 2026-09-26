<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { deleteSaleProperty, getSaleProperties, changeSaleStatus, exportSalePage, type SaleProperty } from '@/api/sale';
import { useDictStore } from '@/stores/dict';
import { downloadCsv } from '@/utils/csv';
import { formatMoney } from '@/utils/format';

const router = useRouter();
const dictStore = useDictStore();
const list = ref<SaleProperty[]>([]);
const total = ref(0);
const loading = ref(false);
const statusItem = ref<SaleProperty>();
const nextStatus = ref('');
const savingStatus = ref(false);
const exporting = ref(false);
const deletingId = ref<number>();
const saleStatuses = [
  { value: 'pre_publish', label: '待发布' }, { value: 'published', label: '已发布' },
  { value: 'price_negotiation', label: '议价中' }, { value: 'quick_sale', label: '急售' },
  { value: 'sold', label: '已售' }, { value: 'off_shelf', label: '已下架' },
];
const query = reactive({ keyword: '', status: '', page: 1, pageSize: 20 });

onMounted(async () => {
  await dictStore.ensureLoaded(['house_status', 'decoration_level', 'orientation', 'source_channel', 'tax_type', 'certificate_type', 'house_tag']);
  await load();
});

async function load() {
  loading.value = true;
  try {
    const res = await getSaleProperties(query);
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  router.push('/house/sale/create');
}

function openEdit(item: SaleProperty) {
  router.push('/house/sale/edit/' + item.id);
}

async function removeProperty(item: SaleProperty) {
  if (item.status === 'sold' || deletingId.value) return;
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
    // 用户取消时保持原列表；接口错误由请求拦截器提示。
  } finally { deletingId.value = undefined; }
}

function search() { query.page = 1; load(); }

function statusClass(status: string) {
  return ({ published: 'pill-green', selling: 'pill-green', price_negotiation: 'pill-orange', bargain: 'pill-orange', quick_sale: 'pill-orange', sold: 'pill-purple' } as Record<string, string>)[status] || 'pill-gray';
}

function statusLabel(status: string) {
  const normalized = ({ selling: 'published', bargain: 'price_negotiation' } as Record<string, string>)[status] || status;
  return saleStatuses.find((item) => item.value === normalized)?.label || status;
}

function formatHouseNumber(item: SaleProperty) {
  const building = item.building?.trim().replace(/(号楼|栋|座)$/u, '');
  const unit = item.unit?.trim().replace(/单元$/u, '');
  return `${building ? `${building}号楼` : ''}${unit ? `${unit}单元` : ''}${item.roomNo?.trim() || ''}`;
}

function openStatus(item: SaleProperty) { statusItem.value = item; nextStatus.value = ''; }

async function saveStatus() {
  if (!statusItem.value || !nextStatus.value || savingStatus.value) return;
  savingStatus.value = true;
  try {
    await changeSaleStatus(statusItem.value.id, nextStatus.value);
    statusItem.value = undefined;
    ElMessage.success('审批申请已提交，通过后状态将自动更新');
    await load();
  } finally { savingStatus.value = false; }
}

async function exportPage() {
  exporting.value = true;
  try {
    const { list: rows } = await exportSalePage(query);
    downloadCsv('售房当前页.csv', [
      ['编码', '标题', '小区', '房号', '售价', '面积', '业主', '电话（脱敏）', '状态'],
      ...rows.map((item) => [item.code, item.title, item.communityName, item.roomNo, item.totalPrice, item.buildingArea, item.ownerName, item.ownerPhone, statusLabel(item.status)]),
    ]);
    ElMessage.success('已导出当前筛选页 ' + rows.length + ' 条');
  } finally { exporting.value = false; }
}
</script>

<template>
  <div class="house-view">
    <div class="page-header">
      <div>
        <div class="page-title">售房管理</div>
        <div class="page-desc">管理在售房源信息、价格、状态及业主联系方式</div>
      </div>
      <div class="page-actions">
        <button v-permission="['sale:add']" class="btn btn-primary" @click="openCreate">新房源录入</button>
        <button v-permission="['sale:export']" class="btn btn-default" :disabled="exporting" @click="exportPage">导出当前页</button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-group" style="flex: 1; min-width: 160px; max-width: 260px;">
        <span class="filter-label">搜索</span>
        <input
          v-model="query.keyword"
          class="input"
          placeholder="小区/房号/业主"
          @keyup.enter="search"
        />
      </div>
      <div class="filter-group">
        <span class="filter-label">状态</span>
        <select v-model="query.status" class="select" @change="search">
          <option value="">全部</option>
          <option v-for="item in saleStatuses" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </div>
      <button class="btn btn-primary" @click="search">查询</button>
    </div>

    <div class="summary-row">
      <span class="summary-chip">共 <strong>{{ total }}</strong> 套房源</span>
    </div>

    <div class="house-grid" style="grid-template-columns: repeat(3, 1fr);">
      <div v-for="item in list" :key="item.id" class="detail-card">
        <div class="detail-card-header">
          <div>
            <div class="detail-card-title">{{ item.title }}</div>
            <div class="cell-sub" style="margin-top: 2px;">{{ item.communityName }} · {{ formatHouseNumber(item) }}</div>
          </div>
          <span :class="['pill', statusClass(item.status)]">{{ statusLabel(item.status) }}</span>
        </div>
        <div class="detail-card-body">
          <div class="field-grid" style="grid-template-columns: repeat(2, 1fr);">
            <div class="field-item">
              <span class="field-label">总价</span>
              <span class="field-value" style="color: var(--danger); font-weight: 700;">{{ formatMoney(item.totalPrice) }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">单价</span>
              <span class="field-value">{{ formatMoney(item.unitPrice) }}/m²</span>
            </div>
            <div class="field-item">
              <span class="field-label">面积</span>
              <span class="field-value">{{ item.buildingArea }} m²</span>
            </div>
            <div class="field-item">
              <span class="field-label">户型</span>
              <span class="field-value">{{ item.layoutRooms }}室{{ item.layoutHalls }}厅{{ item.layoutBathrooms }}卫</span>
            </div>
            <div class="field-item">
              <span class="field-label">装修</span>
              <span class="field-value">{{ dictStore.getLabel('decoration_level', item.decoration) }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">业主</span>
              <span class="field-value">{{ item.ownerName }} {{ item.ownerPhone }}</span>
            </div>
          </div>
          <div class="house-tags" v-if="item.tags && item.tags.length">
            <span v-for="tag in item.tags" :key="tag" class="tag tag-blue">{{ dictStore.getLabel('house_tag', tag) }}</span>
          </div>
          <div class="house-actions" style="margin-top: 12px;">
            <button class="btn btn-default btn-sm" @click="router.push(`/house/sale/detail/${item.id}`)">详情 / 流程</button>
            <button v-permission="['sale:edit']" class="btn btn-default btn-sm" @click="openEdit(item)">编辑</button>
            <button v-permission="['sale:delete']" class="btn btn-ghost btn-sm btn-danger-text" :disabled="item.status === 'sold' || deletingId === item.id" :title="item.status === 'sold' ? '已售房源不能删除' : '删除房源'" @click="removeProperty(item)">删除</button>
            <button v-permission="['sale:changeStatus']" class="btn btn-default btn-sm" @click="openStatus(item)">变更状态</button>
          </div>
        </div>
      </div>
      <div v-if="list.length === 0 && !loading" class="empty-state" style="grid-column: 1 / -1;">暂无房源数据</div>
    </div>

    <div class="card" style="margin-top: 16px;">
      <div class="table-footer">
        <span class="text-muted">共 {{ total }} 条</span>
        <div class="pagination">
          <button
            class="page-btn"
            :disabled="query.page <= 1"
            @click="query.page > 1 && (query.page--, load())"
          >‹</button>
          <button
            v-for="p in Math.max(1, Math.ceil(total / query.pageSize))"
            :key="p"
            :class="['page-btn', { active: p === query.page }]"
            @click="query.page = p; load()"
          >{{ p }}</button>
          <button
            class="page-btn"
            :disabled="query.page >= Math.ceil(total / query.pageSize)"
            @click="query.page < Math.ceil(total / query.pageSize) && (query.page++, load())"
          >›</button>
        </div>
      </div>
    </div>
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

<style scoped>
.house-view { min-height: 100%; }
</style>
