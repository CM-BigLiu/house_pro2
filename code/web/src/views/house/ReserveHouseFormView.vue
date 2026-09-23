<script setup lang="ts">
import { computed, ref, reactive, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  createReserveProperty, getReservePropertyForEdit, updateReserveProperty,
  type ReserveProperty, type ReservePropertyDetails, type ReserveType,
} from '@/api/reserve-property';
import { getCommunities, type Community } from '@/api/community';
import { useDictStore } from '@/stores/dict';
import { useUserStore } from '@/stores/user';
import { calculateUnitPrice } from '@/utils/sale-form';

const router = useRouter();
const route = useRoute();
const dictStore = useDictStore();
const userStore = useUserStore();
const submitting = ref(false);
const loading = ref(true);
const loadError = ref('');
const editId = computed(() => Number(route.params.id) || 0);
const isEdit = computed(() => editId.value > 0);
const communityOptions = ref<Community[]>([]);
const communitiesLoading = ref(false);

const form = reactive<Partial<ReserveProperty>>({
  reserveType: 'rent', communityId: undefined, address: '', roomNo: '', layout: '', buildingArea: undefined,
  decoration: '', ownerName: '', ownerPhone: '', ownerQuote: undefined,
  diskType: 'public', sourceChannel: '', keyStatus: '',
});
const details = ref<ReservePropertyDetails>({ bizType: 'entire', rooms: [], tags: [] });

watch([() => form.ownerQuote, () => form.buildingArea, () => form.reserveType], ([price, area, type]) => {
  if (type === 'sale') details.value.unitPrice = calculateUnitPrice(price, area);
});

async function initialize() {
  loading.value = true;
  loadError.value = '';
  try {
    await Promise.all([
      dictStore.ensureLoaded([
        'disk_type', 'source_channel', 'decoration_level', 'property_type', 'orientation',
        'tax_type', 'certificate_type', 'payment_method', 'room_type', 'room_status',
      ]),
      loadCommunities(),
    ]);
    if (isEdit.value) {
      const data = await getReservePropertyForEdit(editId.value);
      Object.assign(form, {
        reserveType: data.reserveType || 'rent', communityId: data.communityId,
        address: data.address || '', roomNo: data.roomNo || '', layout: data.layout || '',
        buildingArea: data.buildingArea, decoration: data.decoration || '',
        ownerName: data.ownerName || '', ownerPhone: data.ownerPhone || '', ownerQuote: data.ownerQuote,
        diskType: data.diskType || 'public', sourceChannel: data.sourceChannel || '',
        keyStatus: data.keyStatus || '', status: data.status,
      });
      const loadedDetails: ReservePropertyDetails = { bizType: 'entire', rooms: [], tags: [], ...data.details };
      if (data.reserveType !== 'sale' && loadedDetails.landlordDeposit == null && loadedDetails.deposit != null) {
        loadedDetails.landlordDeposit = loadedDetails.deposit;
      }
      delete loadedDetails.deposit;
      details.value = loadedDetails;
      if (data.communityId && !communityOptions.value.some(c => c.id === data.communityId)) {
        communityOptions.value.push({ id: data.communityId, name: data.communityName } as Community);
      }
    }
  } catch {
    loadError.value = '储备房源表单加载失败，请重试';
  } finally {
    loading.value = false;
  }
}
onMounted(initialize);

async function loadCommunities(keyword = '') {
  communitiesLoading.value = true;
  try {
    communityOptions.value = (await getCommunities({ keyword })).list;
  } finally {
    communitiesLoading.value = false;
  }
}

function onCommunityChange(id: number | string) {
  form.communityId = typeof id === 'number' ? id : undefined;
  const c = communityOptions.value.find(item => item.id === form.communityId);
  form.communityName = c?.name || '';
  form.address = c?.address || '';
}

function onTypeChange(type: ReserveType) {
  form.reserveType = type;
  details.value = { bizType: 'entire', rooms: [], tags: [] };
  form.ownerQuote = null;
  form.layout = '';
}

function addRoom() {
  if (!details.value.rooms) details.value.rooms = [];
  details.value.rooms.push({ status: 'vacant' });
}

function onBizTypeChange(type: 'entire' | 'shared') {
  if (type === 'entire') details.value.rooms = [];
  else {
    details.value.tenantName = '';
    details.value.tenantPhone = '';
    details.value.tenantPaymentMethod = '';
    details.value.tenantLeaseStart = '';
    details.value.tenantLeaseEnd = '';
  }
}

function removeRoom(index: number) {
  details.value.rooms?.splice(index, 1);
}

function saleLayout(): string {
  const { layoutRooms, layoutHalls, layoutBathrooms } = details.value;
  if ([layoutRooms, layoutHalls, layoutBathrooms].every(value => value == null)) return '';
  return `${layoutRooms || 0}室${layoutHalls || 0}厅${layoutBathrooms || 0}卫`;
}

async function submit() {
  if (submitting.value || loading.value || loadError.value) return;
  const type = form.reserveType;
  if (type !== 'rent' && type !== 'sale') return ElMessage.warning('请选择租房储备或售房储备');
  if (!form.communityId && !form.address?.trim() && !form.roomNo?.trim() &&
    !form.ownerName?.trim() && !form.ownerPhone?.trim() && !details.value.title?.trim()) {
    return ElMessage.warning('请至少填写小区、地址、房号、业主或标题中的一项');
  }
  if (type === 'sale') details.value.unitPrice = calculateUnitPrice(form.ownerQuote, form.buildingArea);
  const payload: Partial<ReserveProperty> = {
    reserveType: type,
    communityId: form.communityId,
    address: form.address?.trim(),
    roomNo: form.roomNo?.trim(),
    layout: type === 'sale' ? (saleLayout() || form.layout?.trim()) : form.layout?.trim(),
    buildingArea: form.buildingArea,
    decoration: form.decoration,
    ownerName: form.ownerName?.trim(),
    ownerPhone: form.ownerPhone?.trim(),
    ownerQuote: form.ownerQuote,
    diskType: form.diskType,
    sourceChannel: form.sourceChannel,
    keyStatus: form.keyStatus,
    details: details.value,
  };
  submitting.value = true;
  try {
    if (isEdit.value) await updateReserveProperty(editId.value, payload);
    else await createReserveProperty({ ...payload, storeId: userStore.userInfo?.storeIds?.[0] || 0 });
    ElMessage.success(isEdit.value ? '保存成功' : '创建成功');
    router.push('/house/reserve-house');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">{{ isEdit ? '编辑储备房源' : '录入储备房源' }}</div>
        <div class="page-desc">先选择租房或售房，储备期资料可逐步补齐</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/house/reserve-house')">返回</button>
        <button class="btn btn-primary" :disabled="submitting || loading || !!loadError" @click="submit">保存</button>
      </div>
    </div>

    <div class="card" style="padding: 24px;" v-loading="loading">
      <div v-if="loadError" role="alert">{{ loadError }} <el-button link type="primary" @click="initialize">重试</el-button></div>
      <p class="form-tip">储备类型必选；其他资料可暂缺，但至少需要一项能识别房源或业主的信息。切换类型会清空当前类型的专属字段。</p>
      <el-form :model="form" label-width="106px">
        <div class="section-title">储备类型</div>
        <el-form-item label="用途" required>
          <el-radio-group v-model="form.reserveType" :disabled="isEdit && ['taken', 'signed', 'sold'].includes(form.status || '')" @change="onTypeChange">
            <el-radio value="rent">租房储备</el-radio>
            <el-radio value="sale">售房储备</el-radio>
          </el-radio-group>
        </el-form-item>

        <div class="section-title">房源信息</div>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="小区"><el-select v-model="form.communityId" filterable remote clearable :remote-method="loadCommunities" placeholder="选择小区" :loading="communitiesLoading" style="width: 100%;" @change="onCommunityChange"><el-option v-for="c in communityOptions" :key="c.id" :label="c.name" :value="c.id" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="地址"><el-input v-model="form.address" placeholder="选择小区后可自动带出" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="楼栋"><el-input v-model="details.building" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="单元"><el-input v-model="details.unit" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="房号"><el-input v-model="form.roomNo" /></el-form-item></el-col>
          <template v-if="form.reserveType === 'rent'">
            <el-col :span="12"><el-form-item label="户型"><el-input v-model="form.layout" placeholder="如：2室1厅1卫" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="租赁方式"><el-radio-group v-model="details.bizType" @change="onBizTypeChange"><el-radio value="entire">整租</el-radio><el-radio value="shared">合租</el-radio></el-radio-group></el-form-item></el-col>
          </template>
          <template v-else>
            <el-col :span="8"><el-form-item label="房源标题"><el-input v-model="details.title" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="房源类型"><el-select v-model="details.propertyType" clearable style="width: 100%;"><el-option v-for="item in dictStore.getItems('property_type')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="楼层"><el-input v-model="details.floor" /></el-form-item></el-col>
            <el-col v-for="part in [{ key: 'layoutRooms', label: '室' }, { key: 'layoutHalls', label: '厅' }, { key: 'layoutBathrooms', label: '卫' }, { key: 'layoutBalconies', label: '阳台' }]" :key="part.key" :span="6"><el-form-item :label="part.label"><PlainNumberInput v-model="details[part.key as keyof ReservePropertyDetails]" :min="0" :precision="0" style="width: 100%;" /></el-form-item></el-col>
          </template>
          <el-col :span="8"><el-form-item label="建筑面积(㎡)"><PlainNumberInput v-model="form.buildingArea" :min="0" :precision="2" style="width: 100%;" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="装修"><el-select v-model="form.decoration" clearable style="width: 100%;"><el-option v-for="item in dictStore.getItems('decoration_level')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <template v-if="form.reserveType === 'sale'">
            <el-col :span="8"><el-form-item label="套内面积(㎡)"><PlainNumberInput v-model="details.interiorArea" :min="0" :precision="2" style="width: 100%;" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="朝向"><el-select v-model="details.orientation" clearable style="width: 100%;"><el-option v-for="item in dictStore.getItems('orientation')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="电梯"><el-radio-group v-model="details.elevator"><el-radio value="yes">有</el-radio><el-radio value="no">无</el-radio></el-radio-group></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="建造年份"><PlainNumberInput v-model="details.buildYear" :min="0" :precision="0" style="width: 100%;" /></el-form-item></el-col>
          </template>
        </el-row>

        <div class="section-title">{{ form.reserveType === 'rent' ? '房东与租赁信息' : '业主与售价信息' }}</div>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item :label="form.reserveType === 'rent' ? '房东姓名' : '业主姓名'"><el-input v-model="form.ownerName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="form.reserveType === 'rent' ? '房东电话' : '业主电话'"><el-input v-model="form.ownerPhone" /></el-form-item></el-col>
          <el-col v-if="form.reserveType === 'sale'" :span="12"><el-form-item label="备用电话"><el-input v-model="details.ownerPhoneBackup" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="form.reserveType === 'rent' ? '房东报价(元)' : '售价(元)'"><div class="price-field"><PlainNumberInput v-model="form.ownerQuote" :min="0" :precision="2" style="width: 100%;" /><MoneyUppercase :value="form.ownerQuote" /></div></el-form-item></el-col>
          <template v-if="form.reserveType === 'rent'">
            <el-col :span="12"><el-form-item label="预计承租价"><PlainNumberInput v-model="details.landlordRent" :min="0" :precision="2" style="width: 100%;" /><MoneyUppercase :value="details.landlordRent" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="预计房东押金"><PlainNumberInput v-model="details.landlordDeposit" :min="0" :precision="2" style="width: 100%;" /><MoneyUppercase :value="details.landlordDeposit" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="预计客租价"><PlainNumberInput v-model="details.rent" :min="0" :precision="2" style="width: 100%;" /><MoneyUppercase :value="details.rent" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="免租期"><el-input v-model="details.rentFreePeriod" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="承租开始"><el-date-picker v-model="details.leaseStart" type="date" value-format="YYYY-MM-DD" style="width: 100%;" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="承租结束"><el-date-picker v-model="details.leaseEnd" type="date" value-format="YYYY-MM-DD" style="width: 100%;" /></el-form-item></el-col>
          </template>
          <template v-else>
            <el-col :span="12"><el-form-item label="单价(元/㎡)"><PlainNumberInput v-model="details.unitPrice" disabled :precision="2" style="width: 100%;" /><MoneyUppercase :value="details.unitPrice" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="底价(元)"><PlainNumberInput v-model="details.floorPrice" :min="0" :precision="2" style="width: 100%;" /><MoneyUppercase :value="details.floorPrice" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="税费"><el-select v-model="details.taxType" clearable style="width: 100%;"><el-option v-for="item in dictStore.getItems('tax_type')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="产证"><el-select v-model="details.certificateType" clearable style="width: 100%;"><el-option v-for="item in dictStore.getItems('certificate_type')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="负债(元)"><PlainNumberInput v-model="details.debt" :min="0" :precision="2" style="width: 100%;" /><MoneyUppercase :value="details.debt" /></el-form-item></el-col>
          </template>
        </el-row>

        <template v-if="form.reserveType === 'rent'">
          <template v-if="details.bizType !== 'shared'">
            <div class="section-title">租客信息（未出租可不填）</div>
            <el-row :gutter="12">
            <el-col :span="12"><el-form-item label="租客姓名"><el-input v-model="details.tenantName" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="租客电话"><el-input v-model="details.tenantPhone" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="付款方式"><el-select v-model="details.tenantPaymentMethod" clearable style="width: 100%;"><el-option v-for="item in dictStore.getItems('payment_method')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="租期开始"><el-date-picker v-model="details.tenantLeaseStart" type="date" value-format="YYYY-MM-DD" style="width: 100%;" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="租期结束"><el-date-picker v-model="details.tenantLeaseEnd" type="date" value-format="YYYY-MM-DD" style="width: 100%;" /></el-form-item></el-col>
            </el-row>
          </template>
          <template v-if="details.bizType === 'shared'">
            <div class="section-title">合租房间明细（可暂缺）</div>
            <div v-for="(room, index) in details.rooms || []" :key="index" class="room-row">
              <div class="room-row-header">房间 {{ index + 1 }} <el-button type="danger" link @click="removeRoom(index)">删除</el-button></div>
              <el-row :gutter="12">
                <el-col :span="8"><el-form-item label="房号"><el-input v-model="room.roomNo" /></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="房型"><el-select v-model="room.roomType" clearable style="width: 100%;"><el-option v-for="item in dictStore.getItems('room_type')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="状态"><el-select v-model="room.status" style="width: 100%;"><el-option v-for="item in dictStore.getItems('room_status')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="租金"><PlainNumberInput v-model="room.rentPrice" :min="0" :precision="2" style="width: 100%;" /><MoneyUppercase :value="room.rentPrice" /></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="押金"><PlainNumberInput v-model="room.depositAmount" :min="0" :precision="2" style="width: 100%;" /><MoneyUppercase :value="room.depositAmount" /></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="付款方式"><el-select v-model="room.paymentMethod" clearable style="width: 100%;"><el-option v-for="item in dictStore.getItems('payment_method')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="租客姓名"><el-input v-model="room.tenantName" /></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="租客电话"><el-input v-model="room.tenantPhone" /></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="租期开始"><el-date-picker v-model="room.leaseStart" type="date" value-format="YYYY-MM-DD" style="width: 100%;" /></el-form-item></el-col>
                <el-col :span="8"><el-form-item label="租期结束"><el-date-picker v-model="room.leaseEnd" type="date" value-format="YYYY-MM-DD" style="width: 100%;" /></el-form-item></el-col>
              </el-row>
            </div>
            <el-button @click="addRoom">+ 添加房间</el-button>
          </template>
        </template>

        <div class="section-title">来源与补充信息</div>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="盘源"><el-select v-model="form.diskType" clearable style="width: 100%;"><el-option v-for="item in dictStore.getItems('disk_type')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="来源"><el-select v-model="form.sourceChannel" clearable style="width: 100%;"><el-option v-for="item in dictStore.getItems('source_channel')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <template v-if="form.reserveType === 'sale'">
            <el-col :span="12"><el-form-item label="全城区售"><el-switch v-model="details.isCitywideSale" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="标签"><el-select v-model="details.tags" multiple filterable allow-create default-first-option style="width: 100%;" /></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="备注"><el-input v-model="details.description" type="textarea" :rows="2" /></el-form-item></el-col>
          </template>
        </el-row>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-page { min-height: 100%; }
.form-tip { margin: 0 0 18px; color: var(--ink-500); font-size: 13px; }
.price-field { width: 100%; }
.room-row { padding: 14px; margin-bottom: 12px; border: 1px solid var(--ink-200); border-radius: var(--radius); }
.room-row-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-weight: 600; }
@media (max-width: 1100px) { .form-page :deep(.el-col) { flex: 0 0 100%; max-width: 100%; } }
</style>
