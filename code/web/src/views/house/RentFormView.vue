<script setup lang="ts">
import { buildPaymentSchedule, formatDate } from '@/utils/rental-schedule';
import { ref, reactive, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { rentalFormErrors, rentalLandlordFields } from '@/utils/rental-form';
import { createRentalSet, getRentalSet, getRentalDistricts, updateRentalSet, type RentalSet, type RentalRoom } from '@/api/rental';
import { uploadImage } from '@/api/wizard';
import { getCommunities, type Community } from '@/api/community';
import { getEmployees, getStores, type Employee, type Store } from '@/api/organization';
import { generateHouseCode } from '@/utils/code';
import { useDictStore } from '@/stores/dict';
import { useUserStore } from '@/stores/user';
import LayoutSelect from '@/components/LayoutSelect.vue';

const router = useRouter();
const route = useRoute();
const dictStore = useDictStore();
const userStore = useUserStore();
const submitting = ref(false);
const uploadingImages = ref(0);
const loading = ref(true);
const loadError = ref('');
const formRef = ref<FormInstance>();
const canViewLandlordInfo = ref(false);

const isEdit = computed(() => !!route.params.id);
const editId = computed(() => (route.params.id ? String(route.params.id) : ''));

const communityOptions = ref<Community[]>([]);
const communitiesLoading = ref(false);
const storeOptions = ref<Store[]>([]);
const employeeOptions = ref<Employee[]>([]);
const districtOptions = ref<string[]>([]);
const facilityOptions = [
  'WIFI', '床', '冰箱', '暖气', '衣柜', '沙发', '热水器', '燃气灶', '桌椅',
  '电视', '油烟机', '空调', '微波炉', '洗衣机', '卫生间', '阳台', '可做饭', '电磁炉',
];

const rentalStatusOptions = computed(() => {
  const fallback = [
    { value: 'vacant', label: '待租' },
    { value: 'rented', label: '已租' },
    { value: 'checkout', label: '已退租' },
    { value: 'pause', label: '暂停出租' },
  ];
  const merged = [...fallback, ...dictStore.getItems('house_status')];
  return merged.filter((item, index) => merged.findIndex(candidate => candidate.value === item.value) === index);
});

type RoomForm = Partial<RentalRoom> & { leaseDateRange: [Date, Date] | null };
type RentalEmergencyContact = { name: string; phone: string; relation?: string };
type FormState = Omit<Partial<RentalSet>, 'rooms' | 'tags' | 'facilities' | 'emergencyContacts' | 'images'> & {
  rooms: RoomForm[];
  tags: string[];
  facilities: string[];
  emergencyContacts: RentalEmergencyContact[];
  images: string[];
  leaseDateRange: [Date, Date] | null;
  tenantLeaseDateRange: [Date, Date] | null;
};

function createEmptyForm(): FormState {
  return {
    code: generateHouseCode('ZJ'),
    isManaged: false,
    bizType: 'entire',
    communityId: undefined,
    communityName: '',
    address: '',
    building: '',
    unit: '',
    floor: '',
    totalFloor: undefined,
    roomNo: '',
    layout: '',
    buildingArea: 0,
    interiorArea: 0,
    district: '',
    businessCircle: '',
    propertyType: '',
    orientation: '',
    elevator: '',
    decoration: '',
    sourceChannel: '',
    tags: [],
    facilities: [],
    title: '',
    description: '',
    communityIntro: '',
    nearbySchool: '',
    taxDescription: '',
    advantages: '',
    landlordRent: 0,
    landlordDeposit: 0,
    leaseStart: '',
    leaseEnd: '',
    landlordPaymentMethod: '',
    rentFreePeriod: '',
    rent: 0,
    deposit: 0,
    status: 'vacant',
    storeId: userStore.userInfo?.storeIds[0],
    salesmanId: undefined,
    housekeeperId: undefined,
    landlordName: '',
    landlordPhone: '',
    landlordPhoneBackup: '',
    landlordRemark: '',
    emergencyContacts: [],
    viewingTime: '',
    viewingTimeAlt: '',
    followUpContent: '',
    landlordIdCard: '',
    landlordBankCard: '',
    landlordBankName: '',
    tenantName: '',
    tenantPhone: '',
    tenantIdCard: '',
    tenantPaymentMethod: '',
    tenantLeaseStart: '',
    tenantLeaseEnd: '',
    images: [],
    rooms: [],
    leaseDateRange: null,
    tenantLeaseDateRange: null,
  };
}

const form = reactive<FormState>(createEmptyForm());

const landlordRentText = ref('');
const tenantRentText = ref('');
const occupied = (item: { status?: string; tenantName?: string; tenantPhone?: string }) => ['rented', 'checkout'].includes(item.status || '') || !!(item.tenantName || item.tenantPhone);
const rules = computed<FormRules>(() => {
  const required = ['code', 'bizType', 'communityId', 'address', 'building', 'unit', 'roomNo', 'layout', 'buildingArea', 'landlordRent'];
  const fields = [
    ...required, 'landlordPhone', 'landlordIdCard', 'landlordBankCard',
    'landlordDeposit', 'leaseDateRange',
  ];
  if (form.bizType === 'entire') {
    fields.push('rent', 'deposit', 'tenantName', 'tenantPhone', 'tenantIdCard', 'tenantPaymentMethod', 'tenantLeaseDateRange');
    if (occupied(form)) required.push('rent', 'deposit', 'tenantName', 'tenantPhone', 'tenantPaymentMethod', 'tenantLeaseDateRange');
  } else {
    fields.push('rooms');
    form.rooms.forEach((room, index) => {
      const prefix = `rooms.${index}.`;
      for (const key of ['roomNo', 'rentPrice', 'depositAmount', 'tenantName', 'tenantPhone', 'tenantIdCard', 'paymentMethod', 'leaseDateRange']) fields.push(prefix + key);
      required.push(prefix + 'roomNo');
      if (occupied(room)) for (const key of ['rentPrice', 'depositAmount', 'tenantName', 'tenantPhone', 'paymentMethod', 'leaseDateRange']) required.push(prefix + key);
    });
  }
  return Object.fromEntries(fields.map(key => [key, [{
    required: required.includes(key), trigger: ['blur', 'change'],
    validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
      const message = rentalFormErrors(form, landlordRentText.value, tenantRentText.value, canViewLandlordInfo.value)[key];
      callback(message ? new Error(message) : undefined);
    },
  }]]));
});

function resetForm() {
  canViewLandlordInfo.value = true;
  Object.assign(form, createEmptyForm());
  landlordRentText.value = '';
  tenantRentText.value = '';
}

watch(
  () => route.fullPath,
  async () => {
    loading.value = true;
    loadError.value = '';
    try {
    await Promise.all([
      dictStore.ensureLoaded([
        'house_status', 'room_status', 'decoration_level', 'payment_method', 'lease_term',
        'property_type', 'orientation', 'source_channel', 'house_tag',
      ]),
      loadCommunities(),
      loadOrganizations(),
      getRentalDistricts().then((options) => { districtOptions.value = options; }),
    ]);
    if (isEdit.value) {
      await loadData(editId.value);
    } else {
      resetForm();
    }
    } catch { loadError.value = '表单数据加载失败，请刷新重试'; }
    finally { loading.value = false; }
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
    canViewLandlordInfo.value = data.canViewLandlordInfo === true;
    Object.assign(form, {
      isManaged: data.isManaged === true,
      code: data.code,
      bizType: data.bizType,
      communityId: data.communityId,
      communityName: data.communityName ?? '',
      address: data.address ?? '',
      building: data.building ?? '',
      unit: data.unit ?? '',
      floor: data.floor ?? '',
      totalFloor: data.totalFloor,
      roomNo: data.roomNo ?? '',
      layout: data.layout ?? '',
      buildingArea: data.buildingArea ?? 0,
      interiorArea: data.interiorArea ?? 0,
      district: data.district ?? '',
      businessCircle: data.businessCircle ?? '',
      propertyType: data.propertyType ?? '',
      orientation: data.orientation ?? '',
      elevator: data.elevator ?? '',
      decoration: data.decoration ?? '',
      sourceChannel: data.sourceChannel ?? '',
      tags: [...(data.tags ?? [])],
      facilities: [...(data.facilities ?? [])],
      title: data.title ?? '',
      description: data.description ?? '',
      communityIntro: data.communityIntro ?? '',
      nearbySchool: data.nearbySchool ?? '',
      taxDescription: data.taxDescription ?? '',
      advantages: data.advantages ?? '',
      landlordRent: data.landlordRent ?? 0,
      landlordDeposit: data.landlordDeposit ?? 0,
      leaseStart: data.leaseStart ?? '',
      leaseEnd: data.leaseEnd ?? '',
      landlordPaymentMethod: data.landlordPaymentMethod ?? '',
      rentFreePeriod: data.rentFreePeriod ?? '',
      rent: data.rent ?? 0,
      deposit: data.deposit ?? 0,
      status: data.status,
      storeId: data.storeId,
      salesmanId: data.salesmanId,
      housekeeperId: data.housekeeperId,
      landlordName: data.landlordName ?? '',
      landlordPhone: data.landlordPhone ?? '',
      landlordPhoneBackup: data.landlordPhoneBackup ?? '',
      landlordRemark: data.landlordRemark ?? '',
      emergencyContacts: [...(data.emergencyContacts ?? [])],
      viewingTime: data.viewingTime ?? '',
      viewingTimeAlt: data.viewingTimeAlt ?? '',
      followUpContent: data.followUpContent ?? '',
      landlordIdCard: data.landlordIdCard ?? '',
      landlordBankCard: data.landlordBankCard ?? '',
      landlordBankName: data.landlordBankName ?? '',
      tenantName: data.tenantName ?? '',
      tenantPhone: data.tenantPhone ?? '',
      tenantIdCard: data.tenantIdCard ?? '',
      tenantPaymentMethod: data.tenantPaymentMethod ?? '',
      tenantLeaseStart: data.tenantLeaseStart ?? '',
      tenantLeaseEnd: data.tenantLeaseEnd ?? '',
      images: [...(data.images ?? [])],
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
        renovationProgress: r.renovationProgress ?? '',
        paymentStatus: r.paymentStatus ?? '',
        depositAmount: r.depositAmount ?? 0,
        tenantName: r.tenantName ?? '',
        tenantPhone: r.tenantPhone ?? '',
        tenantIdCard: r.tenantIdCard ?? '',
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

async function loadOrganizations() {
  const [stores, employees] = await Promise.allSettled([getStores(), getEmployees()]);
  storeOptions.value = stores.status === 'fulfilled' ? stores.value : [];
  employeeOptions.value = employees.status === 'fulfilled' ? employees.value.list : [];
}

function onCommunityChange(id: number) {
  const c = communityOptions.value.find((item) => item.id === id);
  form.communityName = c?.name || '';
  form.address = c?.address || '';
  form.district = c?.district && districtOptions.value.includes(c.district) ? c.district : '';
  form.businessCircle = c?.businessCircle || c?.area || '';
}

function onBizTypeChange(val: string | number | boolean | undefined) {
  if (val === 'entire') {
    form.rooms = [];
  } else if (val === 'shared' && form.rooms.length === 0) {
    addRoom();
  }
}

function selectBizType(value: 'entire' | 'shared') {
  if (form.bizType === value) return;
  form.bizType = value;
  onBizTypeChange(value);
}

function selectElevator(value: 'yes' | 'no') {
  form.elevator = value;
}

function addRoom() {
  form.rooms.push({
    roomNo: '', roomType: '', rentPrice: 0, listedPrice: 0, status: 'vacant',
    paymentMethod: '', leaseTerm: '', renovationProgress: '', paymentStatus: '',
    depositAmount: 0, tenantIdCard: '', leaseDateRange: null,
  });
}

function removeRoom(index: number) {
  form.rooms.splice(index, 1);
}

function addEmergencyContact() {
  form.emergencyContacts.push({ name: '', phone: '', relation: '' });
}

function removeEmergencyContact(index: number) {
  form.emergencyContacts.splice(index, 1);
}

function addImage() {
  if (form.images.length < 20) form.images.push('');
}

function removeImage(index: number) {
  form.images.splice(index, 1);
}

async function handleImageUpload(options: { file: File }) {
  if (form.images.length + uploadingImages.value >= 20) {
    ElMessage.warning('最多上传 20 张房源图片');
    return;
  }
  if (!options.file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件');
    return;
  }
  if (options.file.size > 2 * 1024 * 1024) {
    ElMessage.warning('单张图片不能超过 2MB');
    return;
  }

  uploadingImages.value += 1;
  try {
    const result = await uploadImage(options.file);
    form.images.push(result.url);
    ElMessage.success('图片上传成功');
  } catch {
    // 请求层已给出具体错误信息。
  } finally {
    uploadingImages.value -= 1;
  }
}

const leasePresets = [
  { label: '一年', years: 1 },
  { label: '两年', years: 2 },
  { label: '三年', years: 3 },
  { label: '四年', years: 4 },
  { label: '五年', years: 5 },
  { label: '十年', years: 10 },
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
  form.leaseStart = formatDate(start);
  form.leaseEnd = formatDate(end);
}

function applyTenantLeasePreset(years: number, event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  const start = form.tenantLeaseDateRange?.[0] ? new Date(form.tenantLeaseDateRange[0]) : new Date();
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + years);
  end.setDate(end.getDate() - 1); // 租期结束 = 起始日 + N 年 - 1 天
  form.tenantLeaseDateRange = [start, end];
  form.tenantLeaseStart = formatDate(start);
  form.tenantLeaseEnd = formatDate(end);
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
  room.leaseStart = formatDate(start);
  room.leaseEnd = formatDate(end);
}

function onRoomDateChange(index: number, val: [Date, Date] | null) {
  const room = form.rooms[index];
  if (!room) return;
  if (val && val[0] && val[1]) {
    room.leaseStart = formatDate(val[0]);
    room.leaseEnd = formatDate(val[1]);
  } else {
    room.leaseStart = '';
    room.leaseEnd = '';
  }
}

function onDateRangeChange(val: [Date, Date] | null) {
  if (val && val[0] && val[1]) {
    form.leaseStart = formatDate(val[0]);
    form.leaseEnd = formatDate(val[1]);
  } else {
    form.leaseStart = '';
    form.leaseEnd = '';
  }
}

function onTenantDateRangeChange(val: [Date, Date] | null) {
  if (val && val[0] && val[1]) {
    form.tenantLeaseStart = formatDate(val[0]);
    form.tenantLeaseEnd = formatDate(val[1]);
  } else {
    form.tenantLeaseStart = '';
    form.tenantLeaseEnd = '';
  }
}

// 整租交租计划
const tenantPaymentSchedule = computed(() =>
  buildPaymentSchedule(form.tenantLeaseStart, form.tenantLeaseEnd, form.tenantPaymentMethod),
);

// 合租房间交租计划
function roomPaymentSchedule(room: any) {
  return buildPaymentSchedule(room.leaseStart, room.leaseEnd, room.paymentMethod);
}

async function submit(manage = false) {
  if (submitting.value || loading.value || loadError.value) return;
  submitting.value = true;
  try {
    if (!await formRef.value?.validate().catch(() => false)) return;
    if (manage && (!form.landlordName?.trim() || !form.landlordPhone?.trim()
      || !form.leaseStart || !form.leaseEnd || !form.landlordPaymentMethod)) {
      ElMessage.warning('托管前请补齐房东姓名、电话、承租期和房东缴费方式');
      return;
    }
    form.landlordRent = Number(landlordRentText.value);
    form.landlordDeposit = Number(form.landlordDeposit) || 0;
    if (form.bizType === 'entire') form.rent = Number(tenantRentText.value || 0);
    form.buildingArea = Number(form.buildingArea);
    form.interiorArea = Number(form.interiorArea) || 0;
    const totalFloorText = String(form.totalFloor ?? '').trim();
    form.totalFloor = totalFloorText ? Number(totalFloorText) : undefined;
    form.deposit = Number(form.deposit) || 0;
    form.tags = form.tags.map(tag => tag.trim()).filter(Boolean);
    form.facilities = form.facilities.map(item => item.trim()).filter(Boolean);
    form.images = form.images.map(item => item.trim()).filter(Boolean);
    form.emergencyContacts = form.emergencyContacts.filter(item => item.name.trim() || item.phone.trim());
    form.title = form.title?.trim();
    const rooms = form.rooms.map(({ leaseDateRange: _l, ...room }) => ({
      ...room,
      roomNo: room.roomNo?.trim(),
      rentPrice: Number(room.rentPrice || 0),
      listedPrice: Number(room.listedPrice || 0),
      depositAmount: Number(room.depositAmount || 0),
      status: room.status === 'vacant' && (room.tenantName || room.tenantPhone) ? 'rented' : room.status,
    })) as RentalRoom[];
    if (['active', 'vacant'].includes(form.status || '') &&
      (form.bizType === 'entire' ? form.tenantName || form.tenantPhone : rooms.some(room => room.status === 'rented'))) {
      form.status = 'rented';
    }
    const payload = { ...form, rooms: form.bizType === 'entire' ? [] : rooms } as Partial<RentalSet> & { leaseDateRange?: unknown; tenantLeaseDateRange?: unknown; rooms: RentalRoom[] };
    delete (payload as Record<string, unknown>).leaseDateRange;
    delete (payload as Record<string, unknown>).tenantLeaseDateRange;
    delete payload.isManaged;
    if (!canViewLandlordInfo.value) {
      for (const field of rentalLandlordFields) delete payload[field];
    } else if (manage) payload.isManaged = true;
    let saved: RentalSet;
    if (isEdit.value) {
      saved = await updateRentalSet(editId.value, payload);
    } else {
      saved = await createRentalSet(payload);
    }
    if (manage) {
      form.isManaged = true;
      ElMessage.success('已托管，房源已同步到房管房管理');
      if (!isEdit.value) await router.replace(`/house/rent/edit/${saved.id}`);
    } else {
      ElMessage.success(isEdit.value ? '保存成功' : '创建成功');
      router.push('/house/rent');
    }
  } catch {
    // 请求层显示失败原因；只有保存成功后才改变托管状态。
  } finally {
    submitting.value = false;
  }
}

async function toggleManagement() {
  if (!canViewLandlordInfo.value || submitting.value || loading.value || loadError.value) return;
  if (!form.isManaged) return submit(true);
  submitting.value = true;
  try {
    await updateRentalSet(editId.value, { isManaged: false });
    form.isManaged = false;
    ElMessage.success('已取消托管，房源已从房管房管理移除');
  } catch {
    // 失败时保留当前状态，允许重试。
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page" v-loading="loading">
    <div class="page-header">
      <div>
        <div class="page-title">{{ isEdit ? '编辑出租房源' : '新增出租房源' }}</div>
        <div class="page-desc">{{ isEdit ? '修改出租房源基本信息与房间明细' : '填写出租房源基本信息与房间明细' }}</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/house/rent')">返回</button>
        <button class="btn btn-primary" :disabled="submitting || loading || !!loadError" @click="submit()">保存</button>
      </div>
    </div>

    <div class="form-shell">
      <div v-if="loadError" role="alert">{{ loadError }}</div>
      <div class="form-tip">
        <strong>录入提示</strong>
        <span>红色 * 为必填项；未出租房源可留空租客信息，录入租客后请补齐电话、租期和付款方式。</span>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" scroll-to-error>
        <section class="form-section">
          <div class="section-heading">
            <span class="section-index">01</span>
            <div><strong>房源信息</strong><small>地址、户型、状态与业务归属</small></div>
          </div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="房源编码" prop="code">
              <el-input v-model="form.code" readonly placeholder="系统自动生成">
                <template v-if="!isEdit" #append>
                  <el-button @click="form.code = generateHouseCode('ZJ')">重新生成</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="租赁方式" prop="bizType">
              <div class="choice-group" role="group" aria-label="租赁方式">
                <button type="button" :aria-pressed="form.bizType === 'entire'" :class="['choice-chip', { active: form.bizType === 'entire' }]" @click="selectBizType('entire')">整租</button>
                <button type="button" :aria-pressed="form.bizType === 'shared'" :class="['choice-chip', { active: form.bizType === 'shared' }]" @click="selectBizType('shared')">合租</button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="小区" prop="communityId">
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
            <el-form-item label="地址" prop="address">
              <el-input v-model="form.address" placeholder="选择小区后自动带出" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="区域" prop="district">
              <el-select v-model="form.district" filterable clearable placeholder="请选择北京区域" style="width: 100%;">
                <el-option v-for="district in districtOptions" :key="district" :label="district" :value="district" />
                <el-option v-if="isEdit && form.district && !districtOptions.includes(form.district)" :label="`${form.district}（原区域）`" :value="form.district" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="商圈" prop="businessCircle">
              <el-input v-model="form.businessCircle" placeholder="如：张江" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="楼栋" prop="building">
              <el-input v-model="form.building" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="单元" prop="unit">
              <el-input v-model="form.unit" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="房号" prop="roomNo">
              <el-input v-model="form.roomNo" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="所在楼层" prop="floor">
              <el-input v-model="form.floor" placeholder="如：8" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="总楼层" prop="totalFloor">
              <PlainNumberInput v-model="form.totalFloor" :min="0" :precision="0" placeholder="如：18" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="面积" prop="buildingArea">
              <div style="width: 100%; display: flex; align-items: center; gap: 8px;">
                <el-input v-model="form.buildingArea" placeholder="请输入面积" />
                <span style="font-size: 12px; color: #94a3b8; flex: none;">㎡</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="套内面积" prop="interiorArea">
              <el-input v-model="form.interiorArea" placeholder="请输入套内面积">
                <template #append>㎡</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="户型" prop="layout">
              <LayoutSelect v-model="form.layout" storage-key="house_rent_custom_layouts" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="装修" prop="decoration">
              <el-select v-model="form.decoration" clearable placeholder="选择装修情况" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('decoration_level')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="房源类型" prop="propertyType">
              <el-select v-model="form.propertyType" clearable placeholder="选择房源类型" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('property_type')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="朝向" prop="orientation">
              <el-select v-model="form.orientation" clearable placeholder="选择朝向" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('orientation')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="电梯" prop="elevator">
              <div class="choice-group" role="group" aria-label="电梯">
                <button type="button" :aria-pressed="form.elevator === 'yes'" :class="['choice-chip', { active: form.elevator === 'yes' }]" @click="selectElevator('yes')">有</button>
                <button type="button" :aria-pressed="form.elevator === 'no'" :class="['choice-chip', { active: form.elevator === 'no' }]" @click="selectElevator('no')">无</button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="房源状态" prop="status">
              <el-select v-model="form.status" style="width: 100%;">
                <el-option v-for="item in rentalStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="所属门店" prop="storeId">
              <el-select v-model="form.storeId" filterable style="width: 100%;">
                <el-option v-for="item in storeOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="业务员" prop="salesmanId">
              <el-select v-model="form.salesmanId" filterable clearable style="width: 100%;">
                <el-option v-for="item in employeeOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="管家" prop="housekeeperId">
              <el-select v-model="form.housekeeperId" filterable clearable style="width: 100%;">
                <el-option v-for="item in employeeOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="来源渠道" prop="sourceChannel">
              <el-select v-model="form.sourceChannel" clearable placeholder="选择来源渠道" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('source_channel')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="房源标签" prop="tags">
              <el-select v-model="form.tags" multiple filterable allow-create default-first-option clearable placeholder="选择或输入标签" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('house_tag')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="房屋设施" prop="facilities">
              <el-select v-model="form.facilities" multiple filterable clearable placeholder="选择房屋设施" style="width: 100%;">
                <el-option v-for="item in facilityOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="房源标题" prop="title">
              <el-input v-model="form.title" maxlength="255" show-word-limit placeholder="请输入用于展示的房源标题" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="房源介绍" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="介绍房屋格局、采光、装修和居住体验" />
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="小区介绍"><el-input v-model="form.communityIntro" type="textarea" :rows="3" maxlength="200" show-word-limit /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="附近学校"><el-input v-model="form.nearbySchool" type="textarea" :rows="3" maxlength="200" show-word-limit /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="税费介绍"><el-input v-model="form.taxDescription" type="textarea" :rows="3" maxlength="200" show-word-limit /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="房源优势"><el-input v-model="form.advantages" type="textarea" :rows="3" maxlength="200" show-word-limit /></el-form-item></el-col>
        </el-row>
        </section>

        <!-- 房东信息 -->
        <section v-if="canViewLandlordInfo" class="form-section landlord-section">
        <div class="section-heading">
          <span class="section-index">02</span>
          <div><strong>房东与收房信息</strong><small>房东身份、收款账户与承租合同</small></div>
        </div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="房东姓名" prop="landlordName">
              <el-input v-model="form.landlordName" placeholder="请输入房东姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="房东电话" prop="landlordPhone">
              <el-input v-model="form.landlordPhone" placeholder="请输入房东电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备用电话" prop="landlordPhoneBackup">
              <el-input v-model="form.landlordPhoneBackup" maxlength="11" placeholder="请输入房东备用电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="房东身份证" prop="landlordIdCard">
              <el-input v-model="form.landlordIdCard" maxlength="18" placeholder="请输入证件号码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开户行" prop="landlordBankName">
              <el-input v-model="form.landlordBankName" placeholder="请输入银行及开户网点" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="收款银行卡" prop="landlordBankCard">
              <el-input v-model="form.landlordBankCard" maxlength="30" placeholder="请输入房东收款卡号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="承租价" prop="landlordRent">
              <div style="width: 100%; display: flex; align-items: center; gap: 8px;">
                <el-input v-model="landlordRentText" placeholder="请输入承租价" />
                <span style="font-size: 12px; color: #94a3b8; flex: none;">元</span>
              </div>
              <MoneyUppercase :value="landlordRentText" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="房东押金" prop="landlordDeposit">
              <div style="width: 100%; display: flex; align-items: center; gap: 8px;">
                <PlainNumberInput v-model="form.landlordDeposit" :min="0" :precision="2" placeholder="请输入房东押金" style="flex: 1;" />
                <span style="font-size: 12px; color: #94a3b8; flex: none;">元</span>
              </div>
              <MoneyUppercase :value="form.landlordDeposit" />
            </el-form-item>
          </el-col>
          <el-col :span="12" class="lease-field">
            <el-form-item label="承租期" prop="leaseDateRange">
              <div class="lease-range-control">
                <el-date-picker
                  v-model="form.leaseDateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始"
                  end-placeholder="结束"
                  style="flex: 1;"
                  @change="onDateRangeChange"
                />
                <div class="lease-presets">
                  <button v-for="p in leasePresets" :key="p.years" type="button" class="lease-preset-btn" @click="applyLeasePreset(p.years, $event)">{{ p.label }}</button>
                </div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="房东缴费" prop="landlordPaymentMethod">
              <el-select v-model="form.landlordPaymentMethod" clearable placeholder="选择缴费方式" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('payment_method')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="免租期" prop="rentFreePeriod">
              <el-input v-model="form.rentFreePeriod" placeholder="如：20天" />
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="首选带看时间"><el-input v-model="form.viewingTime" placeholder="如：周末 09:00-12:00" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="备选带看时间"><el-input v-model="form.viewingTimeAlt" placeholder="如：工作日 18:00 后" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="房东备注"><el-input v-model="form.landlordRemark" type="textarea" :rows="2" maxlength="500" show-word-limit /></el-form-item></el-col>
          <el-col :span="24">
            <div class="inline-heading"><strong>紧急联系人</strong><button type="button" class="btn btn-default btn-sm" @click="addEmergencyContact">添加联系人</button></div>
          </el-col>
          <el-col v-for="(contact, index) in form.emergencyContacts" :key="index" :span="24">
            <div class="contact-row"><el-input v-model="contact.name" placeholder="联系人姓名" /><el-input v-model="contact.phone" maxlength="11" placeholder="联系人电话" /><el-input v-model="contact.relation" placeholder="关系" /><button type="button" class="btn btn-ghost btn-sm" @click="removeEmergencyContact(index)">移除</button></div>
          </el-col>
          <el-col :span="24"><el-form-item label="首次跟进"><el-input v-model="form.followUpContent" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="记录出租要求、议价情况或下一步计划" /></el-form-item></el-col>
          <el-col :span="24">
            <div class="management-action">
              <button type="button" :class="['btn', form.isManaged ? 'btn-default' : 'btn-primary']" :disabled="submitting || loading || !!loadError" :aria-busy="submitting" @click="toggleManagement">{{ form.isManaged ? '取消托管' : '托管' }}</button>
              <div><strong>{{ form.isManaged ? '已同步到房管房管理' : '保存房源并同步到房管房管理' }}</strong><small>房东与收房信息、托管记录仅填写人和管理员可见。取消托管后保留租房档案。</small></div>
            </div>
          </el-col>
        </el-row>
        </section>

        <!-- 租客信息（整租时显示） -->
        <template v-if="form.bizType === 'entire'">
          <section class="form-section">
          <div class="section-heading">
            <span class="section-index">03</span>
            <div><strong>整租租客信息</strong><small>空置时可暂不填写，出租后需补齐合同信息</small></div>
          </div>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="租客姓名" prop="tenantName">
                <el-input v-model="form.tenantName" placeholder="请输入租客姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="租客电话" prop="tenantPhone">
                <el-input v-model="form.tenantPhone" placeholder="请输入租客电话" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="租客身份证" prop="tenantIdCard">
                <el-input v-model="form.tenantIdCard" maxlength="18" placeholder="请输入证件号码" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="客租价" prop="rent">
                <div style="width: 100%; display: flex; align-items: center; gap: 8px;">
                  <el-input v-model="tenantRentText" placeholder="请输入对房客的租价" />
                  <span style="font-size: 12px; color: #94a3b8; flex: none;">元</span>
                </div>
                <MoneyUppercase :value="tenantRentText" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="租客押金" prop="deposit">
                <div style="width: 100%; display: flex; align-items: center; gap: 8px;">
                  <el-input v-model="form.deposit" placeholder="请输入租客押金" />
                  <span style="font-size: 12px; color: #94a3b8; flex: none;">元</span>
                </div>
                <MoneyUppercase :value="form.deposit" />
              </el-form-item>
            </el-col>
            <el-col :span="12" class="lease-field">
              <el-form-item label="客租期" prop="tenantLeaseDateRange">
                <div class="lease-range-control">
                  <el-date-picker
                    v-model="form.tenantLeaseDateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始"
                    end-placeholder="结束"
                    style="flex: 1;"
                    @change="onTenantDateRangeChange"
                  />
                  <div class="lease-presets">
                    <button v-for="p in leasePresets" :key="p.years" type="button" class="lease-preset-btn" @click="applyTenantLeasePreset(p.years, $event)">{{ p.label }}</button>
                  </div>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="付款方式" prop="tenantPaymentMethod">
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
          </section>
        </template>

        <template v-if="form.bizType === 'shared'">
          <section class="form-section">
          <div class="section-heading section-heading-room">
            <span class="section-index">03</span>
            <div><strong>合租房间明细</strong><small>逐间维护价格、租客与租期</small></div>
            <button type="button" class="btn btn-primary btn-sm" @click="addRoom">+ 添加房间</button>
          </div>
          <div v-for="(room, index) in form.rooms" :key="index" class="room-row">
            <div class="room-row-header">
              <span>房间 {{ index + 1 }}</span>
              <el-button size="small" type="danger" plain @click="removeRoom(index)">删除</el-button>
            </div>
            <el-row :gutter="12">
              <el-col :span="8">
                <el-form-item label="房号" :prop="`rooms.${index}.roomNo`">
                  <el-input v-model="room.roomNo" placeholder="如：A" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="房型" :prop="`rooms.${index}.roomType`">
                  <el-input v-model="room.roomType" placeholder="如：主卧" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="租金" :prop="`rooms.${index}.rentPrice`">
                  <el-input v-model="room.rentPrice" placeholder="0">
                    <template #append>元</template>
                  </el-input>
                  <MoneyUppercase :value="room.rentPrice" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="挂牌价" :prop="`rooms.${index}.listedPrice`">
                  <el-input v-model="room.listedPrice" placeholder="0">
                    <template #append>元</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="押金" :prop="`rooms.${index}.depositAmount`">
                  <el-input v-model="room.depositAmount" placeholder="0">
                    <template #append>元</template>
                  </el-input>
                  <MoneyUppercase :value="room.depositAmount" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="房间状态" :prop="`rooms.${index}.status`">
                  <el-select v-model="room.status" style="width: 100%;">
                    <el-option v-for="item in dictStore.getItems('room_status')" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="付款方式" :prop="`rooms.${index}.paymentMethod`">
                  <el-select v-model="room.paymentMethod" placeholder="选择" style="width: 100%;">
                    <el-option v-for="item in dictStore.getItems('payment_method')" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="租赁期限" :prop="`rooms.${index}.leaseTerm`">
                  <el-select v-model="room.leaseTerm" clearable placeholder="选择" style="width: 100%;">
                    <el-option v-for="item in dictStore.getItems('lease_term')" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="装修进度" :prop="`rooms.${index}.renovationProgress`">
                  <el-input v-model="room.renovationProgress" placeholder="如：地板更换中" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="租客姓名" :prop="`rooms.${index}.tenantName`">
                  <el-input v-model="room.tenantName" placeholder="请输入租客姓名" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="租客电话" :prop="`rooms.${index}.tenantPhone`">
                  <el-input v-model="room.tenantPhone" placeholder="请输入租客电话" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="租客身份证" :prop="`rooms.${index}.tenantIdCard`">
                  <el-input v-model="room.tenantIdCard" maxlength="18" placeholder="请输入证件号码" />
                </el-form-item>
              </el-col>
              <el-col :span="12" class="lease-field">
                <el-form-item label="租期" :prop="`rooms.${index}.leaseDateRange`">
                  <div class="lease-range-control">
                    <el-date-picker
                      v-model="room.leaseDateRange"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始"
                      end-placeholder="结束"
                      style="flex: 1;"
                      @change="onRoomDateChange(index, $event)"
                    />
                    <div class="lease-presets">
                      <button v-for="p in leasePresets" :key="p.years" type="button" class="lease-preset-btn" @click="applyRoomLeasePreset(index, p.years, $event)">{{ p.label }}</button>
                    </div>
                  </div>
                  <div v-if="!room.leaseStart && room.leaseEnd" class="text-muted">
                    已记录结束日期 {{ room.leaseEnd }}，开始日期待补全
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
          <el-form-item v-if="!form.rooms.length" prop="rooms"><span class="empty-room-tip">请先添加一个房间</span></el-form-item>
          </section>
        </template>

        <section class="form-section">
          <div class="section-heading section-heading-room">
            <span class="section-index">04</span>
            <div><strong>房源图片</strong><small>可直接上传小区、客厅、卧室等图片，首张图用于列表封面</small></div>
            <div class="image-actions">
              <el-upload action="#" accept="image/*" multiple :show-file-list="false" :http-request="handleImageUpload" :disabled="form.images.length + uploadingImages >= 20">
                <button type="button" class="btn btn-primary btn-sm" :disabled="form.images.length + uploadingImages >= 20">{{ uploadingImages ? '上传中…' : '上传图片' }}</button>
              </el-upload>
              <button type="button" class="btn btn-default btn-sm" :disabled="form.images.length >= 20" @click="addImage">添加图片地址</button>
            </div>
          </div>
          <el-row :gutter="12">
            <el-col v-for="(image, index) in form.images" :key="index" :span="12">
              <div class="image-row">
                <img v-if="image" :src="image" :alt="`房源图片 ${index + 1}`" class="image-preview" />
                <span v-if="image.startsWith('data:image/')" class="image-uploaded">已上传图片 {{ index + 1 }}</span>
                <el-input v-else v-model="form.images[index]" :placeholder="`房源图片 ${index + 1} URL`" />
                <button type="button" class="btn btn-ghost btn-sm" @click="removeImage(index)">移除</button>
              </div>
            </el-col>
          </el-row>
        </section>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.management-action { display: flex; align-items: center; gap: 16px; padding: 16px; background: #f5f8ff; border: 1px solid #e0e9fb; border-radius: 8px; }
.management-action .btn { flex: none; min-width: 96px; }
.management-action strong { display: block; font-size: 13px; font-weight: 500; }
.management-action small { display: block; margin-top: 5px; color: #64748b; font-size: 12px; line-height: 1.6; }
.form-page { min-height: 100%; }

.form-shell {
  max-width: 1280px;
  margin: 0 auto;
  padding-bottom: 32px;
}

.form-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding: 10px 14px;
  border: 1px solid #cfe0ff;
  border-radius: 8px;
  color: #52709f;
  background: #f5f9ff;
  font-size: 12px;
}

.form-tip strong { color: #2f6fed; white-space: nowrap; }

.form-section {
  padding: 18px 20px 4px;
  margin-bottom: 12px;
  border: 1px solid #e7edf5;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 3px 14px rgba(33, 56, 94, 0.045);
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: -2px 0 17px;
  padding-bottom: 12px;
  border-bottom: 1px solid #edf1f7;
}

.section-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex: none;
  border-radius: 8px;
  color: #fff;
  background: linear-gradient(135deg, #548cff, #2f6fed);
  box-shadow: 0 5px 12px rgba(47, 111, 237, 0.22);
  font-size: 11px;
  font-weight: 800;
}

.section-heading strong {
  display: block;
  color: var(--ink-900);
  font-size: 14px;
  line-height: 20px;
}

.section-heading small {
  display: block;
  margin-top: 1px;
  color: var(--ink-500);
  font-size: 11px;
}

.section-heading-room .btn { margin-left: auto; }
.empty-room-tip { color: var(--ink-500); font-size: 12px; }

.choice-group {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border: 1px solid #dfe6f0;
  border-radius: 7px;
  background: #f6f8fb;
}

.choice-chip {
  min-width: 58px;
  padding: 5px 14px;
  border: 0;
  border-radius: 5px;
  color: #64748b;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}

.choice-chip:hover { color: #2f6fed; background: #eef4ff; }
.choice-chip.active {
  color: #fff;
  background: #3b7cff;
  box-shadow: 0 2px 6px rgba(47, 111, 237, 0.22);
}
.choice-chip:focus-visible { outline: 2px solid #8eb3ff; outline-offset: 1px; }

.form-section :deep(.el-form-item) { margin-bottom: 15px; }
.form-section :deep(.el-form-item__label) {
  height: auto;
  margin-bottom: 6px;
  padding: 0;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}

.room-row {
  background: #f8fafc;
  border: 1px solid #e9eef5;
  border-radius: 8px;
  padding: 14px 16px 2px;
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

.room-row :deep(.el-form-item) { margin-bottom: 12px; }

.inline-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 2px 0 12px;
  color: var(--ink-700);
  font-size: 12px;
}

.contact-row,
.image-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 12px;
}

.image-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.image-preview { width: 88px; height: 66px; flex: none; border: 1px solid var(--ink-200); border-radius: 7px; object-fit: cover; }
.image-uploaded { flex: 1; color: var(--ink-500); font-size: 12px; }

.lease-range-control { display: grid; width: 100%; gap: 8px; }
.lease-range-control :deep(.el-date-editor) { width: 100%; min-width: 0; }
.lease-presets { display: flex; flex-wrap: wrap; gap: 4px; }
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

@media (max-width: 1100px) {
  .form-section :deep(.el-col-6),
  .form-section :deep(.el-col-8),
  .form-section :deep(.el-col-12) {
    max-width: 50% !important;
    flex: 0 0 50% !important;
  }
  .form-section :deep(.lease-field) {
    max-width: 100% !important;
    flex: 0 0 100% !important;
  }
}

@media (max-width: 620px) {
  .form-tip { align-items: flex-start; }
  .form-section { padding: 16px 14px 2px; }
  .form-section :deep(.el-col-6),
  .form-section :deep(.el-col-8),
  .form-section :deep(.el-col-12) {
    max-width: 100% !important;
    flex: 0 0 100% !important;
  }
  .section-heading { align-items: flex-start; }
  .section-heading-room { flex-wrap: wrap; }
  .section-heading-room .btn { margin-left: 40px; }
  .section-heading-room .image-actions { width: 100%; margin-left: 40px; }
  .section-heading-room .image-actions .btn { margin-left: 0; }
}
</style>
