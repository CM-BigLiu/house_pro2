<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getRentalSets, type RentalSet } from '@/api/rental';
import { createCheckout } from '@/api/checkout';
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
  await dictStore.ensureLoaded(['house_status', 'room_status', 'decoration', 'payment_method', 'lease_term']);
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

function editSet(item: RentalSet) {
  router.push(`/house/rent/edit/${item.id}`);
}

async function checkout(item: RentalSet) {
  // 合租校验：存在在租期内的租客则禁止对整房退租
  if (item.bizType === 'shared') {
    const rooms = (item as any).rooms || [];
    const now = new Date();
    const activeTenant = rooms.find((rm: any) => rm.status === 'rented' && rm.leaseEnd && new Date(rm.leaseEnd) > now);
    if (activeTenant) {
      ElMessage.warning(`房间「${activeTenant.roomNo}」的租客${activeTenant.tenantName ? `（${activeTenant.tenantName}）` : ''}仍在租期内，无法对整房退租`);
      return;
    }
  }
  try {
    await ElMessageBox.confirm(
      `确认对「${item.address || item.communityName}」进行退房登记？`,
      '退房登记',
      { confirmButtonText: '确认退房', cancelButtonText: '取消', type: 'warning' },
    );
  } catch {
    return; // 取消
  }
  try {
    const houseInfo = [item.communityName, item.building ? item.building + '栋' : '', item.unit ? item.unit + '单元' : '', item.roomNo].filter(Boolean).join(' ');
    await createCheckout({
      houseInfo,
      tenantName: item.tenantName || '',
      checkoutDate: new Date().toISOString().slice(0, 10),
      reason: '',
    });
    ElMessage.success('退租申请已提交，请在退租管理中确认');
    await load();
  } catch {
    ElMessage.error('提交退租失败');
  }
}

function editRoom(rm: any) {
  ElMessageBox.confirm(`编辑房间「${rm.roomNo}」信息`, '编辑房间')
    .then(() => ElMessage.info('房间编辑功能开发中'));
}

async function checkoutRoom(item: RentalSet, rm: any) {
  const houseInfo = [item.communityName, item.building ? item.building + '栋' : '', item.unit ? item.unit + '单元' : '', item.roomNo, rm.roomNo + '室'].filter(Boolean).join(' ');
  try {
    await ElMessageBox.confirm(
      `确认对房间「${rm.roomNo}」${rm.tenantName ? `（租客：${rm.tenantName}）` : ''}进行退租操作？`,
      '退租确认',
      { confirmButtonText: '确认退租', cancelButtonText: '取消', type: 'warning' },
    );
    await createCheckout({
      houseInfo,
      tenantName: rm.tenantName || '',
      checkoutDate: new Date().toISOString().slice(0, 10),
      reason: '',
    });
    ElMessage.success('退租申请已提交，请在退租管理中确认');
    await load();
  } catch {
    // 用户取消或接口失败
  }
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    active: 'pill-green',
    rented: 'pill-blue',
    reserved: 'pill-orange',
    checkout: 'pill-gray',
    pause: 'pill-gray',
    vacant: 'pill-green',
    maintenance: 'pill-orange',
  };
  return map[status] || 'pill-gray';
}

function statusText(status: string) {
  const map: Record<string, string> = {
    active: '待租',
    rented: '已租',
    reserved: '已预定',
    checkout: '已退租',
    pause: '已下架',
    vacant: '空置',
    maintenance: '维修中',
  };
  return map[status] || status;
}

function isExpiringSoon(dateStr: string): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return days > 0 && days <= 30;
}

// ---------- 缴费提醒 ----------
const PAYMENT_MONTHS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  semi_annual: 6,
  annual: 12,
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export interface PayReminder {
  type: 'pay' | 'overdue';
  date: string;
  label: string;
}

// 根据起租日 + 结束日 + 付款方式计算缴费提醒
// 返回 null 表示无需提醒（无起租日/付款方式，或租期已结束）
function getPayReminder(startStr?: string, endStr?: string, method?: string): PayReminder | null {
  if (!startStr || !method) return null;
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : null;
  const step = PAYMENT_MONTHS[method] || 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates: Date[] = [];
  let idx = 0;
  while (idx < 120) {
    const d = addMonths(start, idx * step);
    if (end && d.getTime() >= end.getTime()) break;
    dates.push(d);
    idx++;
  }
  if (!dates.length) return null;

  let next: Date | null = null;
  let prev: Date | null = null;
  for (const d of dates) {
    if (d.getTime() >= today.getTime()) {
      next = d;
      break;
    }
    prev = d;
  }
  if (!next) {
    // 没有未来的交租日，但上一期已过期且租期尚未结束 → 欠费
    if (prev && end && end.getTime() > today.getTime()) {
      return { type: 'overdue', date: formatDate(prev), label: '欠费' };
    }
    return null; // 租期已结束
  }

  const days = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  // 5 天内到期（含今天）→ 缴费
  if (days >= 0 && days <= 5) {
    return { type: 'pay', date: formatDate(next), label: '缴费' };
  }
  // 上一期交租日已过 → 欠费
  if (prev) {
    return { type: 'overdue', date: formatDate(prev), label: '欠费' };
  }
  return null;
}

// 公司 → 房东（承租）提醒
function landlordReminder(item: RentalSet): PayReminder | null {
  return getPayReminder(item.leaseStart, item.leaseEnd, (item as any).landlordPaymentMethod);
}

// 房客 → 公司（客租）提醒（整租）
function tenantReminder(item: RentalSet): PayReminder | null {
  return getPayReminder(item.tenantLeaseStart, item.tenantLeaseEnd, item.tenantPaymentMethod);
}

// 房客 → 公司（合租房间）提醒
function roomReminder(rm: any): PayReminder | null {
  return getPayReminder(rm.leaseStart, rm.leaseEnd, rm.paymentMethod);
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
            <span class="title-main">{{ item.communityName }}</span>
            <span class="title-comment">// {{ item.address || item.communityName }} {{ item.building }}栋{{ item.unit }}单元<span v-if="item.buildingArea"> · {{ item.buildingArea }}㎡</span></span>
            <span class="pill pill-green" v-if="item.bizType === 'entire'">整租</span>
            <span class="pill pill-purple" v-else>合租</span>
            <span class="tag tag-gray">{{ item.layout || '-' }}</span>
            <span
              v-if="item.bizType === 'shared' && landlordReminder(item)"
              :class="['pay-tag', landlordReminder(item)!.type === 'pay' ? 'pay-tag-pay' : 'pay-tag-overdue']"
              :title="`公司给房东交租 · 交租日 ${landlordReminder(item)!.date}`"
            >房东{{ landlordReminder(item)!.label }}</span>
          </div>
        </div>

        <!-- Card Body -->
        <div class="detail-card-body">
          <!-- Entire rental info grid -->
          <div v-if="item.bizType === 'entire'" class="info-grid">
            <div class="field-item">
              <span class="field-label">房东</span>
              <span class="field-value">{{ item.landlordName || '-' }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">房东电话</span>
              <span class="field-value">{{ item.landlordPhone || '-' }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">租客</span>
              <span class="field-value">{{ item.tenantName || '-' }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">租客电话</span>
              <span class="field-value">{{ item.tenantPhone || '-' }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">装修</span>
              <span class="field-value">{{ dictStore.getLabel('decoration', item.decoration) || item.decoration || '-' }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">状态</span>
              <span class="field-value">
                <span :class="['pill', statusClass(item.status)]">{{ statusText(item.status) }}</span>
              </span>
            </div>
            <div class="field-item">
              <span class="field-label">客租价</span>
              <span class="field-value price">
                {{ formatMoney(item.rent) }}<span style="font-size:11px;color:var(--ink-400);font-weight:400;">元</span>
                <span
                  v-if="tenantReminder(item)"
                  :class="['pay-tag', tenantReminder(item)!.type === 'pay' ? 'pay-tag-pay' : 'pay-tag-overdue']"
                  :title="`房客给公司交租 · 交租日 ${tenantReminder(item)!.date}`"
                >{{ tenantReminder(item)!.label }}</span>
              </span>
            </div>
            <div class="field-item">
              <span class="field-label">房东承租价</span>
              <span class="field-value">
                {{ formatMoney(item.landlordRent) }}<span style="font-size:11px;color:var(--ink-400);font-weight:400;">元</span>
                <span
                  v-if="landlordReminder(item)"
                  :class="['pay-tag', landlordReminder(item)!.type === 'pay' ? 'pay-tag-pay' : 'pay-tag-overdue']"
                  :title="`公司给房东交租 · 交租日 ${landlordReminder(item)!.date}`"
                >{{ landlordReminder(item)!.label }}</span>
              </span>
            </div>
            <div class="field-item">
              <span class="field-label">押金</span>
              <span class="field-value">{{ formatMoney(item.deposit) }}<span style="font-size:11px;color:var(--ink-400);font-weight:400;">元</span></span>
            </div>
            <div class="field-item">
              <span class="field-label">付款方式</span>
              <span class="field-value">{{ dictStore.getLabel('payment_method', item.tenantPaymentMethod) || '-' }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">客租期</span>
              <span class="field-value" :class="{ 'text-danger': (item.tenantLeaseEnd && isExpiringSoon(item.tenantLeaseEnd)) || (item.leaseEnd && isExpiringSoon(item.leaseEnd)) }">
                <template v-if="item.tenantLeaseStart">
                  {{ item.tenantLeaseStart.slice(0,10) }} ~ {{ item.tenantLeaseEnd ? item.tenantLeaseEnd.slice(0,10) : '-' }}
                </template>
                <template v-else-if="item.leaseStart">
                  {{ item.leaseStart.slice(0,10) }} ~ {{ item.leaseEnd ? item.leaseEnd.slice(0,10) : '-' }}
                </template>
                <template v-else>-</template>
              </span>
            </div>
            <div class="field-item">
              <span class="field-label">业务员</span>
              <span class="field-value">{{ item.salesmanId ?? '-' }}</span>
            </div>
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
                <span class="field-value price">
                  {{ formatMoney(rm.rentPrice) }}<span style="font-size:11px;color:var(--ink-400);font-weight:400;">元</span>
                  <span
                    v-if="rm.status === 'rented' && roomReminder(rm)"
                    :class="['pay-tag', roomReminder(rm)!.type === 'pay' ? 'pay-tag-pay' : 'pay-tag-overdue']"
                    :title="`房客给公司交租 · 交租日 ${roomReminder(rm)!.date}`"
                  >{{ roomReminder(rm)!.label }}</span>
                </span>
              </div>
              <div class="room-field">
                <span class="field-label">押金</span>
                <span class="field-value">{{ formatMoney(rm.depositAmount) }}<span style="font-size:11px;color:var(--ink-400);font-weight:400;">元</span></span>
              </div>
              <div class="room-field">
                <span class="field-label">租期</span>
                <span class="field-value">{{ rm.leaseEnd ? '至 ' + rm.leaseEnd.slice(0, 10) : '-' }}</span>
              </div>
              <div class="room-field">
                <span class="field-label">状态</span>
                <span class="field-value">
                  <span :class="['pill', statusClass(rm.status)]">{{ statusText(rm.status) }}</span>
                </span>
              </div>
              <div class="room-actions">
                <button class="btn btn-ghost btn-xs" @click.stop="editRoom(rm)">编辑</button>
                <button v-if="rm.status === 'rented'" class="btn btn-ghost btn-xs btn-danger-text" @click.stop="checkoutRoom(item, rm)">退租</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Card Actions -->
        <div class="detail-card-actions">
          <button v-permission="['renting:edit']" class="btn btn-ghost btn-sm" @click="editSet(item)">编辑</button>
          <button v-permission="['renting:checkout']" class="btn btn-ghost btn-sm" @click="checkout(item)">退租</button>
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
  grid-template-columns: repeat(2, 1fr);
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
  padding: 16px 20px 8px;
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
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}

.title-main {
  font-weight: 700;
  flex: none;
}

.title-comment {
  color: var(--ink-400);
  font-weight: 400;
  font-size: 12px;
  font-family: var(--font-mono, monospace);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  max-width: 100%;
  flex: 0 1 auto;
}

.header-right-info {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex: none;
}
.header-field {
  font-size: 13px;
  color: var(--ink-700);
  font-weight: 500;
  &.price {
    color: var(--danger);
    font-weight: 700;
    font-family: var(--font-num);
    font-size: 18px;
  }
}
.header-unit {
  font-size: 11px;
  color: var(--ink-400);
}

.card-address {
  padding: 0 20px 10px;
  font-size: 12px;
  color: var(--ink-400);
  border-bottom: 1px solid var(--ink-100);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-card-body {
  padding: 12px 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}

.detail-card-actions {
  padding: 12px 20px;
  border-top: 1px solid var(--ink-100);
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

/* ---------- Field Items ---------- */
.field-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}

.field-label {
  color: var(--ink-500);
  white-space: nowrap;
}

.field-value {
  color: var(--ink-700);
  text-align: right;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &.price {
    color: var(--danger);
    font-weight: 700;
    font-family: var(--font-num);
  }
}

/* ---------- Room List ---------- */
.room-list {
  margin-top: 4px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.room-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  padding: 5px 10px;
  flex-wrap: nowrap;
  &:not(:last-child) {
    padding-bottom: 5px;
    margin-bottom: 5px;
    border-bottom: 1px dashed var(--ink-200);
  }
}

.room-actions {
  display: flex;
  gap: 4px;
  flex: none;
  margin-left: auto;
}

.btn-xs {
  padding: 2px 7px;
  font-size: 11px;
  border-radius: 4px;
  line-height: 1.5;
}

.btn-danger-text {
  color: var(--danger);
  &:hover {
    background: var(--danger-soft);
  }
}

.text-danger {
  color: var(--danger) !important;
  font-weight: 600;
}

.room-field {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  .field-label {
    font-size: 11px;
    color: var(--ink-400);
    flex: none;
  }
  .field-value {
    font-size: 12.5px;
    color: var(--ink-700);
    font-weight: 500;
  }
  .field-value.price {
    color: var(--danger);
    font-weight: 700;
    font-family: var(--font-num);
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

/* ---------- 缴费提醒 tag ---------- */
.pay-tag {
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.5;
  border-radius: 4px;
  vertical-align: middle;
  white-space: nowrap;
  cursor: default;
}
.pay-tag-pay {
  background: #fef9c3;
  color: #a16207;
  border: 1px solid #fde047;
}
.pay-tag-overdue {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fca5a5;
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
  .room-item { flex-direction: column; gap: 4px; }
}
</style>

<style>
/* 确保新增和筛选按钮为蓝色背景 */
.house-view .btn-primary {
  background: linear-gradient(180deg, #3d7bff, #2e6bf0) !important;
  color: #fff !important;
  border-color: transparent !important;
  box-shadow: 0 3px 10px -2px rgba(46, 107, 240, 0.45) !important;
}
.house-view .btn-primary:hover {
  background: linear-gradient(180deg, #2e6bf0, #1e56d6) !important;
  box-shadow: 0 6px 16px -4px rgba(46, 107, 240, 0.5) !important;
}
</style>