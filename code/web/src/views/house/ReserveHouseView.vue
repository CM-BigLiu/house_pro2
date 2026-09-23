<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { deleteReserveProperty, getReserveProperties, signReserveProperty, transferReserveProperty, type ReserveProperty } from '@/api/reserve-property';
import { getEmployees, type Employee } from '@/api/organization';
import { getCommunities, type Community } from '@/api/community';
import { useDictStore } from '@/stores/dict';
import { formatMoney } from '@/utils/format';
import { downloadCsv } from '@/utils/csv';
import { buildLeasePeriod } from '@/utils/rental-schedule';

const router = useRouter();
const dictStore = useDictStore();
const list = ref<ReserveProperty[]>([]);
const total = ref(0);
const loading = ref(false);
const query = reactive({ keyword: '', status: '', reserveType: '', page: 1, pageSize: 20 });
const statusOptions = computed(() => [
  { label: '全部', value: '' },
  ...(!query.reserveType || query.reserveType === 'rent' ? [
    { label: '未租', value: 'not_rented' }, { label: '已租', value: 'rented' },
    { label: '已签约', value: 'signed' },
  ] : []),
  ...(!query.reserveType || query.reserveType === 'sale' ? [
    { label: '未售', value: 'not_sold' }, { label: '已售', value: 'sold' },
  ] : []),
  { label: '已交定', value: 'deposit_paid' },
]);
const selected = ref<ReserveProperty | null>(null);
const signVisible = ref(false);
const transferVisible = ref(false);
const actionLoading = ref(false);
const deletingId = ref<number>();
const employees = ref<Employee[]>([]);
const communities = ref<Community[]>([]);
const communityLoading = ref(false);
const transferSalesmanId = ref<number>();
const signForm = reactive({
  contractCode: '', bizType: 'entire' as 'entire' | 'shared', leaseStart: '', leaseEnd: '', landlordRent: 0, landlordDeposit: 0,
  communityId: undefined as number | undefined, address: '', roomNo: '', layout: '', ownerName: '',
});
const leasePresets = [
  { label: '1年', years: 1 },
  { label: '3年', years: 3 },
  { label: '5年', years: 5 },
];
const missingSignFields = computed(() => {
  const item = selected.value;
  if (!item) return [];
  return [
    !item.communityId && '小区',
    !item.address?.trim() && '地址',
    !item.roomNo?.trim() && '房号',
    !item.layout?.trim() && '户型',
    !item.ownerName?.trim() && '房东姓名',
  ].filter(Boolean) as string[];
});

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
  router.push(`/house/reserve-house/edit/${item.id}`);
}

function canDelete(item: ReserveProperty) {
  return !['taken', 'signed', 'sold', 'rented', 'deposit_paid'].includes(item.status);
}

async function removeProperty(item: ReserveProperty) {
  if (!canDelete(item) || deletingId.value) return;
  try {
    await ElMessageBox.confirm(`确认删除储备房源“${item.title}”？删除后无法恢复。`, '删除确认', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    });
    deletingId.value = item.id;
    await deleteReserveProperty(item.id);
    if (list.value.length === 1 && query.page > 1) query.page--;
    await load();
    ElMessage.success('储备房源已删除');
  } catch {
    // 用户取消时保持原列表；接口错误由请求拦截器提示。
  } finally { deletingId.value = undefined; }
}

async function openSign(item: ReserveProperty) {
  if (item.reserveType === 'sale') return ElMessage.warning('售房储备不能办理租房签约');
  selected.value = item;
  Object.assign(signForm, {
    contractCode: '', bizType: item.details?.bizType || 'entire', leaseStart: '', leaseEnd: '',
    landlordRent: Number(item.details?.landlordRent ?? item.ownerQuote ?? 0),
    landlordDeposit: Number(item.details?.landlordDeposit ?? item.details?.deposit ?? 0),
    communityId: item.communityId, address: item.address || '', roomNo: item.roomNo || '',
    layout: item.layout || '', ownerName: item.ownerName || '',
  });
  signVisible.value = true;
  if (!item.communityId && !communities.value.length) {
    communityLoading.value = true;
    try {
      communities.value = (await getCommunities({ page: 1, pageSize: 1000 })).list;
    } finally {
      communityLoading.value = false;
    }
  }
}

function applyLeasePreset(years: number) {
  const period = buildLeasePeriod(signForm.leaseStart, years);
  if (!period) return;
  signForm.leaseStart = period.start;
  signForm.leaseEnd = period.end;
}

async function submitSign() {
  if (!selected.value) return;
  const missing = [
    !signForm.communityId && '小区', !signForm.address.trim() && '地址',
    !signForm.roomNo.trim() && '房号', !signForm.layout.trim() && '户型',
    !signForm.ownerName.trim() && '房东姓名',
  ].filter(Boolean);
  if (missing.length) return ElMessage.warning(`请补充：${missing.join('、')}`);
  if (!signForm.leaseStart || !signForm.leaseEnd || signForm.landlordRent < 0) return ElMessage.warning('请完整填写合同期限与租金');
  actionLoading.value = true;
  try {
    const result = await signReserveProperty(selected.value.id, signForm);
    ElMessage.success(`拿房签约成功，合同编号：${result.contractCode}`);
    signVisible.value = false;
    await load();
  } finally { actionLoading.value = false; }
}

async function openTransfer(item: ReserveProperty) {
  selected.value = item;
  transferSalesmanId.value = item.salesmanId;
  employees.value = (await getEmployees({ storeId: item.storeId })).list.filter((employee) => employee.status === 'normal');
  transferVisible.value = true;
}

async function submitTransfer() {
  if (!selected.value || !transferSalesmanId.value) return ElMessage.warning('请选择目标业务员');
  actionLoading.value = true;
  try {
    await transferReserveProperty(selected.value.id, transferSalesmanId.value);
    ElMessage.success('业务员已转移');
    transferVisible.value = false;
    await load();
  } finally { actionLoading.value = false; }
}

function exportCurrent() {
  downloadCsv(`储备房源-${new Date().toISOString().slice(0, 10)}.csv`, [
    ['类型', '标题', '小区', '地址', '门牌号', '户型', '业主', '电话', '报价', '状态'],
    ...list.value.map((item) => [item.reserveType === 'sale' ? '售房储备' : '租房储备', item.title, item.communityName, item.address, item.roomNo, item.layout, item.ownerName, item.ownerPhone, item.ownerQuote, item.status]),
  ]);
}

function diskClass(type: string) {
  return type === 'shop' || type === 'office' ? 'pill-purple' : 'pill-blue';
}

function reserveStatusLabel(status: string) {
  return ({ not_rented: '未租', not_sold: '未售', rented: '已租', sold: '已售', signed: '已签约', deposit_paid: '已交定', pause: '暂停' } as Record<string, string>)[status] || status || '-';
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
        <button v-permission="['reserve:house:export']" class="btn btn-default" @click="exportCurrent">导出</button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <el-select v-model="query.reserveType" placeholder="储备类型" style="width: 132px;" @change="query.status = ''; query.page = 1; load()">
        <el-option label="全部类型" value="" />
        <el-option label="租房储备" value="rent" />
        <el-option label="售房储备" value="sale" />
      </el-select>
      <div class="status-tabs">
        <span
          v-for="opt in statusOptions"
          :key="opt.value"
          :class="['status-tab', { active: query.status === opt.value }]"
          @click="query.status = opt.value; query.page = 1; load()"
        >{{ opt.label }}</span>
      </div>

      <el-input v-model="query.keyword" placeholder="小区/业主/电话" clearable @keyup.enter="load" class="filter-input" />
      <button type="button" class="btn btn-primary" @click="load">查询</button>
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
            <span :class="['pill', item.reserveType === 'sale' ? 'pill-purple' : 'pill-green']">{{ item.reserveType === 'sale' ? '售房储备' : '租房储备' }}</span>
            <span :class="['pill', diskClass(item.diskType)]">{{ dictStore.getLabel('disk_type', item.diskType) }}</span>
            <span :class="['pill', 'pill-gray']">{{ reserveStatusLabel(item.status) }}</span>
          </div>
        </div>
        <div class="detail-card-body">
          <div class="field-grid">
            <div class="field-item">
              <span class="field-label">小区</span>
              <span class="field-value">{{ item.communityName || '-' }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">{{ item.reserveType === 'sale' ? '售价' : '房东报价' }}</span>
              <span class="field-value price">{{ formatMoney(item.ownerQuote ?? undefined) }}</span>
            </div>
            <div v-if="item.reserveType === 'sale' && item.details?.unitPrice" class="field-item">
              <span class="field-label">单价</span>
              <span class="field-value">{{ formatMoney(item.details.unitPrice) }}/㎡</span>
            </div>
            <div v-if="item.reserveType !== 'sale' && item.details?.bizType" class="field-item">
              <span class="field-label">租赁方式</span>
              <span class="field-value">{{ item.details.bizType === 'shared' ? '合租' : '整租' }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">业主</span>
              <span class="field-value">{{ item.ownerName || '-' }} {{ item.ownerPhone || '' }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">来源</span>
              <span class="field-value">{{ dictStore.getLabel('source_channel', item.sourceChannel || item.source) || '-' }}</span>
            </div>
          </div>
        </div>
        <div class="detail-card-footer">
          <button v-if="item.reserveType !== 'sale'" type="button" class="btn btn-ghost btn-sm" v-permission="['reserve:house:take']" :disabled="!['not_rented', 'pause'].includes(item.status)" @click="openSign(item)">拿房签约</button>
          <button type="button" class="btn btn-ghost btn-sm" v-permission="['reserve:house:transfer']" :disabled="['taken', 'signed', 'sold'].includes(item.status)" @click="openTransfer(item)">转业务员</button>
          <button type="button" class="btn btn-ghost btn-sm" v-permission="['reserve:house:add']" @click="openEdit(item)">编辑</button>
          <button type="button" class="btn btn-ghost btn-sm btn-danger-text" v-permission="['reserve:house:delete']" :disabled="!canDelete(item) || deletingId === item.id" :title="canDelete(item) ? '删除房源' : '已签约、成交或流转的房源不能删除'" @click="removeProperty(item)">删除</button>
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

    <el-dialog v-model="signVisible" title="拿房签约" width="min(640px, 92vw)">
      <el-form :model="signForm" label-width="100px">
        <template v-if="missingSignFields.length">
          <el-alert :title="`还需补充：${missingSignFields.join('、')}`" type="warning" :closable="false" class="sign-missing-alert" />
          <div class="sign-missing-grid">
            <el-form-item v-if="!selected?.communityId" label="小区" required>
              <el-select v-model="signForm.communityId" filterable :loading="communityLoading" placeholder="请选择小区" style="width: 100%;">
                <el-option v-for="community in communities" :key="community.id" :label="community.name" :value="community.id" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="!selected?.address?.trim()" label="地址" required><el-input v-model="signForm.address" /></el-form-item>
            <el-form-item v-if="!selected?.roomNo?.trim()" label="房号" required><el-input v-model="signForm.roomNo" /></el-form-item>
            <el-form-item v-if="!selected?.layout?.trim()" label="户型" required><el-input v-model="signForm.layout" placeholder="如：2室1厅1卫" /></el-form-item>
            <el-form-item v-if="!selected?.ownerName?.trim()" label="房东姓名" required><el-input v-model="signForm.ownerName" /></el-form-item>
          </div>
        </template>
        <el-form-item label="合同编号"><el-input v-model="signForm.contractCode" placeholder="留空由系统生成" /></el-form-item>
        <el-form-item label="租赁方式" required><el-radio-group v-model="signForm.bizType"><el-radio value="entire">整租</el-radio><el-radio value="shared">合租</el-radio></el-radio-group></el-form-item>
        <el-form-item label="合同期限" required>
          <div class="contract-period-field">
            <div class="contract-date-row">
              <el-date-picker v-model="signForm.leaseStart" class="contract-date-picker" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" />
              <span class="contract-date-separator">至</span>
              <el-date-picker v-model="signForm.leaseEnd" class="contract-date-picker" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" />
            </div>
            <div class="contract-presets">
              <span>快捷期限</span>
              <button v-for="preset in leasePresets" :key="preset.years" type="button" class="lease-preset-btn" @click="applyLeasePreset(preset.years)">
                {{ preset.label }}
              </button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="房东租金" required><PlainNumberInput v-model="signForm.landlordRent" :min="0" style="width: 100%;" /><MoneyUppercase :value="signForm.landlordRent" /></el-form-item>
        <el-form-item label="房东押金"><PlainNumberInput v-model="signForm.landlordDeposit" :min="0" :precision="2" style="width: 100%;" /><MoneyUppercase :value="signForm.landlordDeposit" /></el-form-item>
      </el-form>
      <template #footer><button type="button" class="btn btn-default" @click="signVisible = false">取消</button><button type="button" class="btn btn-primary" :aria-busy="actionLoading" :disabled="actionLoading" @click="submitSign">确认签约并流转</button></template>
    </el-dialog>
    <el-dialog v-model="transferVisible" title="转业务员" width="440px">
      <el-select v-model="transferSalesmanId" filterable placeholder="请选择当前门店在职员工" style="width: 100%;">
        <el-option v-for="employee in employees" :key="employee.id" :label="`${employee.name}（${employee.mobile}）`" :value="employee.id" />
      </el-select>
      <template #footer><button type="button" class="btn btn-default" @click="transferVisible = false">取消</button><button type="button" class="btn btn-primary" :aria-busy="actionLoading" :disabled="actionLoading" @click="submitTransfer">确认转移</button></template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.house-view { min-height: 100%; }
.sign-missing-alert { margin-bottom: 16px; }
.sign-missing-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 12px;
}
.sign-missing-grid :deep(.el-form-item) { min-width: 0; }
.contract-period-field { width: 100%; min-width: 0; }
.contract-date-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  flex-wrap: nowrap;
}
.contract-date-picker {
  flex: 1 1 0;
  width: 0 !important;
  min-width: 0;
}
.contract-date-separator { flex: none; color: var(--ink-500); }
.contract-presets {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: var(--ink-500);
  font-size: 12px;
}
.lease-preset-btn {
  padding: 3px 12px;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  background: #eff6ff;
  color: #3b82f6;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.lease-preset-btn:hover { background: #dbeafe; border-color: #3b82f6; }

@media (max-width: 520px) {
  .sign-missing-grid { grid-template-columns: 1fr; }
  .contract-date-row { flex-wrap: wrap; }
  .contract-date-picker { flex-basis: calc(50% - 20px); width: calc(50% - 20px) !important; }
  .contract-presets { flex-wrap: wrap; }
}

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
