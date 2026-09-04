<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createRentalSet, getRentalSet, updateRentalSet, type RentalSet, type RentalRoom } from '@/api/rental';
import { getCommunities, type Community } from '@/api/community';
import { generateHouseCode } from '@/utils/code';
import { useDictStore } from '@/stores/dict';

const router = useRouter();
const route = useRoute();
const dictStore = useDictStore();
const submitting = ref(false);

const isEdit = computed(() => !!route.params.id);
const editId = computed(() => (route.params.id ? String(route.params.id) : ''));

const communityOptions = ref<Community[]>([]);
const communitiesLoading = ref(false);

type RoomForm = Partial<RentalRoom> & { leaseDateRange: [Date, Date] | null };
type FormState = Omit<Partial<RentalSet>, 'rooms'> & {
  rooms: RoomForm[];
  leaseDateRange: [Date, Date] | null;
  tenantLeaseDateRange: [Date, Date] | null;
};

function createEmptyForm(): FormState {
  return {
    code: generateHouseCode('ZJ'),
    bizType: 'entire',
    communityId: undefined,
    communityName: '',
    address: '',
    building: '',
    unit: '',
    roomNo: '',
    layout: '',
    buildingArea: 0,
    decoration: '',
    landlordRent: 0,
    leaseStart: '',
    leaseEnd: '',
    rentFreePeriod: '',
    rent: 0,
    deposit: 0,
    status: 'active',
    storeId: 1,
    salesmanId: undefined,
    housekeeperId: undefined,
    landlordName: '',
    landlordPhone: '',
    tenantName: '',
    tenantPhone: '',
    tenantPaymentMethod: '',
    tenantLeaseStart: '',
    tenantLeaseEnd: '',
    rooms: [],
    leaseDateRange: null,
    tenantLeaseDateRange: null,
  };
}

const form = reactive<FormState>(createEmptyForm());

const landlordRentText = ref('');
const tenantRentText = ref('');

function resetForm() {
  Object.assign(form, createEmptyForm());
  landlordRentText.value = '';
  tenantRentText.value = '';
}

watch(
  () => route.fullPath,
  async () => {
    await dictStore.ensureLoaded(['house_status', 'room_status', 'decoration', 'payment_method', 'lease_term']);
    await loadCommunities();
    if (isEdit.value) {
      await loadData(editId.value);
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

function parseDate(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

async function loadData(id: string) {
  try {
    const data = await getRentalSet(id);
    Object.assign(form, {
      code: data.code,
      bizType: data.bizType,
      communityId: data.communityId,
      communityName: data.communityName ?? '',
      address: data.address ?? '',
      building: data.building ?? '',
      unit: data.unit ?? '',
      roomNo: data.roomNo ?? '',
      layout: data.layout ?? '',
      buildingArea: data.buildingArea ?? 0,
      decoration: data.decoration ?? '',
      landlordRent: data.landlordRent ?? 0,
      leaseStart: data.leaseStart ?? '',
      leaseEnd: data.leaseEnd ?? '',
      rentFreePeriod: data.rentFreePeriod ?? '',
      rent: data.rent ?? 0,
      deposit: data.deposit ?? 0,
      status: data.status,
      storeId: data.storeId,
      salesmanId: data.salesmanId,
      housekeeperId: data.housekeeperId,
      landlordName: data.landlordName ?? '',
      landlordPhone: data.landlordPhone ?? '',
      tenantName: data.tenantName ?? '',
      tenantPhone: data.tenantPhone ?? '',
      tenantPaymentMethod: data.tenantPaymentMethod ?? '',
      tenantLeaseStart: data.tenantLeaseStart ?? '',
      tenantLeaseEnd: data.tenantLeaseEnd ?? '',
    });
    landlordRentText.value = data.landlordRent != null ? String(data.landlordRent) : '';
    tenantRentText.value = data.rent != null ? String(data.rent) : '';

    const ls = parseDate(data.leaseStart);
    const le = parseDate(data.leaseEnd);
    form.leaseDateRange = ls && le ? [ls, le] : null;

    const tls = parseDate(data.tenantLeaseStart);
    const tle = parseDate(data.tenantLeaseEnd);
    form.tenantLeaseDateRange = tls && tle ? [tls, tle] : null;

    form.rooms = (data.rooms || []).map((r) => {
      const rs = parseDate(r.leaseStart);
      const re = parseDate(r.leaseEnd);
      return {
        id: r.id,
        setId: r.setId,
        roomNo: r.roomNo,
        roomType: r.roomType ?? '',
        rentPrice: r.rentPrice ?? 0,
        listedPrice: r.listedPrice ?? 0,
        status: r.status,
        paymentMethod: r.paymentMethod ?? '',
        leaseTerm: r.leaseTerm ?? '',
        depositAmount: r.depositAmount ?? 0,
        tenantName: r.tenantName ?? '',
        tenantPhone: r.tenantPhone ?? '',
        leaseStart: r.leaseStart,
        leaseEnd: r.leaseEnd,
        leaseDateRange: rs && re ? [rs, re] : null,
      };
    });
  } catch {
    ElMessage.error('加载房源数据失败');
    router.replace('/house/rent');
  }
}

async function loadCommunities(keyword = '') {
  communitiesLoading.value = true;
  try {
    communityOptions.value = (await getCommunities({ keyword })).list;
  } finally {
    communitiesLoading.value = false;
  }
}

function onCommunityChange(id: number) {
  const c = communityOptions.value.find((item) => item.id === id);
  form.communityName = c?.name || '';
  form.address = c?.address || '';
}

function onBizTypeChange(val: string | number | boolean | undefined) {
  if (val === 'entire') {
    form.rooms = [];
  } else if (val === 'shared' && form.rooms.length === 0) {
    addRoom();
  }
}

function addRoom() {
  form.rooms.push({ roomNo: '', roomType: '', rentPrice: 0, listedPrice: 0, status: 'vacant', paymentMethod: '', leaseTerm: '', depositAmount: 0, leaseDateRange: null });
}

function removeRoom(index: number) {
  form.rooms.splice(index, 1);
}

const leasePresets = [
  { label: '一年', years: 1 },
  { label: '三年', years: 3 },
  { label: '五年', years: 5 },
];

function applyLeasePreset(years: number, event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  // 防止触发 el-form 或 el-date-picker 的刷新
  const start = form.leaseDateRange?.[0] ? new Date(form.leaseDateRange[0]) : new Date();
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + years);
  end.setDate(end.getDate() - 1); // 租期结束 = 起始日 + N 年 - 1 天
  form.leaseDateRange = [start, end];
  form.leaseStart = start.toISOString().slice(0, 10);
  form.leaseEnd = end.toISOString().slice(0, 10);
}

function applyTenantLeasePreset(years: number, event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  const start = form.tenantLeaseDateRange?.[0] ? new Date(form.tenantLeaseDateRange[0]) : new Date();
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + years);
  end.setDate(end.getDate() - 1); // 租期结束 = 起始日 + N 年 - 1 天
  form.tenantLeaseDateRange = [start, end];
  form.tenantLeaseStart = start.toISOString().slice(0, 10);
  form.tenantLeaseEnd = end.toISOString().slice(0, 10);
}

function applyRoomLeasePreset(index: number, years: number, event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  const room = form.rooms[index];
  if (!room) return;
  const start = room.leaseDateRange?.[0] ? new Date(room.leaseDateRange[0]) : new Date();
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + years);
  end.setDate(end.getDate() - 1); // 租期结束 = 起始日 + N 年 - 1 天
  room.leaseDateRange = [start, end];
  room.leaseStart = start.toISOString().slice(0, 10);
  room.leaseEnd = end.toISOString().slice(0, 10);
}

function onRoomDateChange(index: number, val: [Date, Date] | null) {
  const room = form.rooms[index];
  if (!room) return;
  if (val && val[0] && val[1]) {
    room.leaseStart = val[0].toISOString().slice(0, 10);
    room.leaseEnd = val[1].toISOString().slice(0, 10);
  } else {
    room.leaseStart = '';
    room.leaseEnd = '';
  }
}

function onDateRangeChange(val: [Date, Date] | null) {
  if (val && val[0] && val[1]) {
    form.leaseStart = val[0].toISOString().slice(0, 10);
    form.leaseEnd = val[1].toISOString().slice(0, 10);
  } else {
    form.leaseStart = '';
    form.leaseEnd = '';
  }
}

function onTenantDateRangeChange(val: [Date, Date] | null) {
  if (val && val[0] && val[1]) {
    form.tenantLeaseStart = val[0].toISOString().slice(0, 10);
    form.tenantLeaseEnd = val[1].toISOString().slice(0, 10);
  } else {
    form.tenantLeaseStart = '';
    form.tenantLeaseEnd = '';
  }
}

// 付款方式 → 交租周期（月）
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

// 根据起租日 + 结束日 + 付款方式生成交租计划
function buildPaymentSchedule(startStr?: string, endStr?: string, method?: string) {
  if (!startStr || !method) return [] as { period: number; date: string }[];
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : null;
  const step = PAYMENT_MONTHS[method] || 1;
  const list: { period: number; date: string }[] = [];
  let idx = 0;
  while (idx < 120) {
    const d = addMonths(start, idx * step);
    if (end && d >= end) break;
    list.push({ period: idx + 1, date: formatDate(d) });
    idx++;
  }
  return list;
}

// 整租交租计划
const tenantPaymentSchedule = computed(() =>
  buildPaymentSchedule(form.tenantLeaseStart, form.tenantLeaseEnd, form.tenantPaymentMethod),
);

// 合租房间交租计划
function roomPaymentSchedule(room: any) {
  return buildPaymentSchedule(room.leaseStart, room.leaseEnd, room.paymentMethod);
}

async function submit() {
  if (!form.code?.trim()) return ElMessage.warning('请填写房源编码');
  if (!form.communityId) return ElMessage.warning('请选择小区');
  // 校验承租价为数字
  const landlordRent = Number(landlordRentText.value);
  if (landlordRentText.value === '' || isNaN(landlordRent) || landlordRent < 0) return ElMessage.warning('承租价必须为有效的正数');
  form.landlordRent = landlordRent;
  // 整租时校验客租价
  if (form.bizType === 'entire') {
    const tenantRent = Number(tenantRentText.value);
    if (tenantRentText.value === '' || isNaN(tenantRent) || tenantRent < 0) return ElMessage.warning('客租价必须为有效的正数');
    form.rent = tenantRent;
  }
  // 转换数字字段
  form.buildingArea = Number(form.buildingArea) || 0;
  form.deposit = Number(form.deposit) || 0;
  form.rooms.forEach(room => {
    room.rentPrice = Number(room.rentPrice) || 0;
    room.depositAmount = Number(room.depositAmount) || 0;
  });
  const rooms = form.rooms.map(({ leaseDateRange: _l, ...room }) => room) as RentalRoom[];
  submitting.value = true;
  try {
    const payload = { ...form, rooms: form.bizType === 'entire' ? [] : rooms } as Partial<RentalSet> & { leaseDateRange?: unknown; tenantLeaseDateRange?: unknown; rooms: RentalRoom[] };
    delete (payload as Record<string, unknown>).leaseDateRange;
    delete (payload as Record<string, unknown>).tenantLeaseDateRange;
    if (isEdit.value) {
      await updateRentalSet(editId.value, payload);
      ElMessage.success('保存成功');
    } else {
      await createRentalSet(payload);
      ElMessage.success('创建成功');
    }
    router.push('/house/rent');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">{{ isEdit ? '编辑出租房源' : '新增出租房源' }}</div>
        <div class="page-desc">{{ isEdit ? '修改出租房源基本信息与房间明细' : '填写出租房源基本信息与房间明细' }}</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/house/rent')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card" style="padding: 24px;">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="房源编码" required>
              <el-input v-model="form.code" readonly placeholder="系统自动生成">
                <template #append>
                  <el-button @click="form.code = generateHouseCode('ZJ')">重新生成</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="租赁方式">
              <el-radio-group v-model="form.bizType" @change="onBizTypeChange">
                <el-radio label="entire">整租</el-radio>
                <el-radio label="shared">合租</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="小区" required>
              <el-select
                v-model="form.communityId"
                filterable
                remote
                :remote-method="loadCommunities"
                placeholder="选择小区"
                :loading="communitiesLoading"
                style="width: 100%;"
                @change="onCommunityChange"
              >
                <el-option v-for="c in communityOptions" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地址">
              <el-input v-model="form.address" placeholder="选择小区后自动带出" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="楼栋">
              <el-input v-model="form.building" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="单元">
              <el-input v-model="form.unit" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="房号">
              <el-input v-model="form.roomNo" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="面积">
              <div style="width: 100%; display: flex; align-items: center; gap: 8px;">
                <el-input v-model="form.buildingArea" placeholder="请输入面积" />
                <span style="font-size: 12px; color: #94a3b8; flex: none;">㎡</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="户型">
              <el-input v-model="form.layout" placeholder="如：2室1厅1卫" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="装修">
              <el-select v-model="form.decoration" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('decoration')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 房东信息 -->
        <div class="section-title">房东信息</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="房东姓名">
              <el-input v-model="form.landlordName" placeholder="请输入房东姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="房东电话">
              <el-input v-model="form.landlordPhone" placeholder="请输入房东电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="承租价">
              <div style="width: 100%; display: flex; align-items: center; gap: 8px;">
                <el-input v-model="landlordRentText" placeholder="请输入承租价" />
                <span style="font-size: 12px; color: #94a3b8; flex: none;">元</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="承租期">
              <div style="width: 100%; display: flex; align-items: center; gap: 8px;">
                <el-date-picker
                  v-model="form.leaseDateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始"
                  end-placeholder="结束"
                  style="flex: 1;"
                  @change="onDateRangeChange"
                />
                <div style="display: flex; gap: 4px; flex: none;">
                  <button v-for="p in leasePresets" :key="p.years" class="lease-preset-btn" @click="applyLeasePreset(p.years, $event)">{{ p.label }}</button>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 租客信息（整租时显示） -->
        <template v-if="form.bizType === 'entire'">
          <div class="section-title">租客信息</div>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="租客姓名">
                <el-input v-model="form.tenantName" placeholder="请输入租客姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="租客电话">
                <el-input v-model="form.tenantPhone" placeholder="请输入租客电话" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="客租价">
                <div style="width: 100%; display: flex; align-items: center; gap: 8px;">
                  <el-input v-model="tenantRentText" placeholder="请输入对房客的租价" />
                  <span style="font-size: 12px; color: #94a3b8; flex: none;">元</span>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="押金">
                <div style="width: 100%; display: flex; align-items: center; gap: 8px;">
                  <el-input v-model="form.deposit" placeholder="请输入押金" />
                  <span style="font-size: 12px; color: #94a3b8; flex: none;">元</span>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="客租期">
                <div style="width: 100%; display: flex; align-items: center; gap: 8px;">
                  <el-date-picker
                    v-model="form.tenantLeaseDateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始"
                    end-placeholder="结束"
                    style="flex: 1;"
                    @change="onTenantDateRangeChange"
                  />
                  <div style="display: flex; gap: 4px; flex: none;">
                    <button v-for="p in leasePresets" :key="p.years" class="lease-preset-btn" @click="applyTenantLeasePreset(p.years, $event)">{{ p.label }}</button>
                  </div>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="付款方式">
                <el-select v-model="form.tenantPaymentMethod" placeholder="选择付款方式" style="width: 100%;">
                  <el-option v-for="item in dictStore.getItems('payment_method')" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <div v-if="tenantPaymentSchedule.length" class="pay-schedule">
            <div class="pay-schedule-title">交租日期（按客租期 + 付款方式自动计算）</div>
            <table class="pay-table">
              <thead>
                <tr><th>期数</th><th>交租日期</th></tr>
              </thead>
              <tbody>
                <tr v-for="p in tenantPaymentSchedule" :key="p.period">
                  <td>第 {{ p.period }} 期</td>
                  <td>{{ p.date }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <template v-if="form.bizType === 'shared'">
          <div class="section-title">房间明细</div>
          <div v-for="(room, index) in form.rooms" :key="index" class="room-row">
            <div class="room-row-header">
              <span>房间 {{ index + 1 }}</span>
              <el-button size="small" type="danger" plain @click="removeRoom(index)">删除</el-button>
            </div>
            <el-row :gutter="12">
              <el-col :span="8">
                <el-form-item label="房号">
                  <el-input v-model="room.roomNo" placeholder="如：A" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="房型">
                  <el-input v-model="room.roomType" placeholder="如：主卧" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="租金">
                  <el-input v-model="room.rentPrice" placeholder="0">
                    <template #append>元</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="押金">
                  <el-input v-model="room.depositAmount" placeholder="0">
                    <template #append>元</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="付款方式">
                  <el-select v-model="room.paymentMethod" placeholder="选择" style="width: 100%;">
                    <el-option v-for="item in dictStore.getItems('payment_method')" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="租客姓名">
                  <el-input v-model="room.tenantName" placeholder="请输入租客姓名" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="租客电话">
                  <el-input v-model="room.tenantPhone" placeholder="请输入租客电话" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="租期">
                  <div style="width: 100%; display: flex; align-items: center; gap: 8px;">
                    <el-date-picker
                      v-model="room.leaseDateRange"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始"
                      end-placeholder="结束"
                      style="flex: 1;"
                      @change="onRoomDateChange(index, $event)"
                    />
                    <div style="display: flex; gap: 4px; flex: none;">
                      <button v-for="p in leasePresets" :key="p.years" class="lease-preset-btn" @click="applyRoomLeasePreset(index, p.years, $event)">{{ p.label }}</button>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <div v-if="roomPaymentSchedule(room).length" class="pay-schedule">
              <div class="pay-schedule-title">交租日期（按租期 + 付款方式自动计算）</div>
              <table class="pay-table">
                <thead>
                  <tr><th>期数</th><th>交租日期</th></tr>
                </thead>
                <tbody>
                  <tr v-for="p in roomPaymentSchedule(room)" :key="p.period">
                    <td>第 {{ p.period }} 期</td>
                    <td>{{ p.date }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <el-button size="small" type="primary" plain @click="addRoom">+ 添加房间</el-button>
        </template>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-page { min-height: 100%; }

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
  padding: 12px 16px;
  margin-bottom: 12px;
}

.room-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 13px;
  color: var(--ink-700);
}

.room-row :deep(.el-form-item) {
  margin-bottom: 10px;
}
.room-row :deep(.el-form-item__label) {
  font-size: 12px;
  padding-right: 8px;
}

.lease-preset-btn {
  padding: 3px 14px; border-radius: 999px; font-size: 12px; font-weight: 600;
  border: 1px solid #bfdbfe; background: #eff6ff; color: #3b82f6;
  cursor: pointer; transition: all 0.15s;
}
.lease-preset-btn:hover { background: #dbeafe; border-color: #3b82f6; }

/* 交租日期表 */
.pay-schedule {
  margin-top: 4px;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
}
.pay-schedule-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-700);
  margin-bottom: 6px;
}
.pay-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.pay-table th,
.pay-table td {
  padding: 4px 10px;
  text-align: left;
  border-bottom: 1px solid #eef2f7;
}
.pay-table th {
  color: var(--ink-500);
  font-weight: 600;
  background: #eef2f7;
}
.pay-table td {
  color: var(--ink-700);
}
.pay-table tr:last-child td {
  border-bottom: none;
}

/* 保存按钮蓝色背景加固 */
:deep(.btn-primary),
.form-page .btn.btn-primary {
  background: linear-gradient(180deg, #3d7bff, #2e6bf0) !important;
  color: #fff !important;
  box-shadow: 0 3px 10px -2px rgba(46, 107, 240, 0.45), inset 0 1px 0 rgba(255,255,255,0.22) !important;
}
</style>