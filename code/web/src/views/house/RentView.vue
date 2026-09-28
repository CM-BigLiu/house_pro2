<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Building2,
  CalendarClock,
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
import { createCheckout } from '@/api/checkout';
import { getCustomers, type Customer } from '@/api/customer';
import {
  createRentalAppointment,
  followUpRentalAppointment,
  getRentalAppointmentSigningContext,
  getRentalSigningContext,
  signRentalProperty,
  type RentalSigningContext,
  recommendRentalAppointment,
  signRentalAppointment,
  deleteRentalSet,
  getRentalAppointments,
  getRentalSets,
  type RentalAppointment,
  type RentalRoom,
  type RentalSet,
  type RentalSetQuery,
} from '@/api/rental';
import { getEmployees, getStores, type Employee, type Store } from '@/api/organization';
import { useDictStore } from '@/stores/dict';
import { useUserStore } from '@/stores/user';
import { formatHouseAddress, formatBuilding, formatUnit } from '@/utils/address';
import { downloadCsv } from '@/utils/csv';
import { formatMoney } from '@/utils/format';
import { formatDate } from '@/utils/rental-schedule';
import ContractBusinessFields from '@/components/ContractBusinessFields.vue';
import PropertyDelegationDialog from '@/components/PropertyDelegationDialog.vue';
import { emptyContractDetails, validateContractDetails } from '@/api/business';

type SortValue = 'created_desc' | 'rent_desc' | 'rent_asc' | 'lease_end';
const router = useRouter();
const dictStore = useDictStore();
const userStore = useUserStore();
const list = ref<RentalSet[]>([]);
const total = ref(0);
const overviewList = ref<RentalSet[]>([]);
const overviewTotal = ref(0);
const loading = ref(false);
const deletingId = ref<number>();
const checkoutSubmitting = ref(new Set<string>());
const sortBy = ref<SortValue>('created_desc');
const storeOptions = ref<Store[]>([]);
const employeeOptions = ref<Employee[]>([]);
const moreFiltersOpen = ref(true);
const appointmentDialogVisible = ref(false);
const appointmentRecordsVisible = ref(false);
const appointmentSubmitting = ref(false);
const appointmentLoading = ref(false);
const appointmentList = ref<RentalAppointment[]>([]);
const appointmentTotal = ref(0);
const appointmentPropertyId = ref<number>();
const selectedRental = ref<RentalSet>();
const delegationProperty = ref<RentalSet | null>(null);
const delegationVisible = ref(false);
const recommendSource = ref<RentalAppointment>();
const recommendOptions = ref<RentalSet[]>([]);
const recommendLoading = ref(false);
const recommendError = ref(false);
const recommendTotal = ref(0);
let recommendKeyword = '';
let recommendPage = 0;
let recommendRequestId = 0;
const workflowRecord = ref<RentalAppointment>();
const followUpVisible = ref(false);
const followUpContent = ref('');
const signVisible = ref(false);
const directSigningProperty = ref<RentalSet>();
const directSigningContext = ref<RentalSigningContext>();
let signingGeneration = 0;
const signingContext = ref<Awaited<ReturnType<typeof getRentalAppointmentSigningContext>>>();
const signingContextLoading = ref(false);
const signingContextError = ref(false);
const workflowSubmitting = ref(false);
const signForm = reactive({ rentalRoomId: undefined as number | undefined, contractCode: '', tenantName: '', tenantPhone: '',
  leaseStart: '', leaseEnd: '', rent: '', deposit: '0', paymentMethod: '', remark: '', details: emptyContractDetails() });
const appointmentForm = reactive<{ scheduledAt: Date | null; customerId?: number; remark: string }>({ scheduledAt: null, remark: '' });
const appointmentCustomers = ref<Customer[]>([]);
const appointmentCustomersLoading = ref(false);
const appointmentCustomersError = ref(false);
const appointmentCustomersTotal = ref(0);
let customerKeyword = '';
let customerPage = 0;
let customerRequestId = 0;
const query = reactive<RentalSetQuery & { page: number; pageSize: number }>({
  keyword: '', status: '', bizType: '', code: '', roomNo: '', storeId: '',
  salesmanId: '', housekeeperId: '', paymentMethod: '', leaseTerm: '', layout: '',
  district: '', address: '', building: '', unit: '', operationStatus: '', businessStatus: '',
  propertyType: '', orientation: '', decoration: '', sourceChannel: '', landlordPhone: '', scope: 'all',
  sortBy: 'created_desc', page: 1, pageSize: 20,
});

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'vacant', label: '可租' },
  { value: 'rented', label: '已租' },
  { value: 'reserved', label: '已定' },
  { value: 'maintenance', label: '冻结' },
  { value: 'checkout', label: '退租待审批' },
  { value: 'pause', label: '已下架' },
];

const beijingDistricts = [
  '东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区', '门头沟区', '房山区',
  '通州区', '顺义区', '昌平区', '大兴区', '怀柔区', '平谷区', '密云区', '延庆区',
];

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / query.pageSize)));

const summary = computed(() => {
  const rooms = overviewList.value.flatMap((item) => item.bizType === 'shared' ? (item.rooms || []) : []);
  const entireSets = overviewList.value.filter((item) => item.bizType === 'entire');
  const allUnits = [...rooms, ...entireSets];
  const rentedRooms = rooms.filter((room) => room.status === 'rented').length
    + entireSets.filter((item) => item.status === 'rented').length;
  const vacantRooms = rooms.filter((room) => room.status === 'vacant').length
    + entireSets.filter((item) => ['active', 'vacant'].includes(item.status)).length;
  const expiring = overviewList.value.filter((item) => {
    if (item.bizType === 'shared') return item.rooms?.some((room) => isExpiringSoon(room.leaseEnd || ''));
    return isExpiringSoon(item.tenantLeaseEnd || item.leaseEnd || '');
  }).length;
  const reservedRooms = allUnits.filter((item) => item.status === 'reserved').length;
  const frozenRooms = allUnits.filter((item) => ['maintenance', 'pause'].includes(item.status)).length;
  return {
    totalSets: overviewTotal.value,
    totalUnits: allUnits.length,
    rentableRooms: vacantRooms,
    rentedRooms,
    reservedRooms,
    frozenRooms,
    expiring,
  };
});

const typeCounts = computed(() => ({
  entire: overviewList.value.filter((item) => item.bizType === 'entire').length,
  shared: overviewList.value.filter((item) => item.bizType === 'shared').length,
}));

const storeNames = computed(() => new Map(storeOptions.value.map((item) => [item.id, item.name])));
const employeeNames = computed(() => new Map(employeeOptions.value.map((item) => [item.id, item.name])));

const sortedList = computed(() => {
  const rows = [...list.value];
  return rows.sort((a, b) => {
    if (sortBy.value === 'rent_desc') return rentalIncome(b) - rentalIncome(a);
    if (sortBy.value === 'rent_asc') return rentalIncome(a) - rentalIncome(b);
    if (sortBy.value === 'lease_end') {
      return comparableDate(nearestTenantLeaseEnd(a)) - comparableDate(nearestTenantLeaseEnd(b));
    }
    return comparableDate(b.createdAt) - comparableDate(a.createdAt);
  });
});

onMounted(async () => {
  await Promise.all([
    dictStore.ensureLoaded([
      'house_status', 'room_status', 'decoration_level', 'payment_method', 'lease_term', 'room_type',
      'property_type', 'orientation', 'source_channel',
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
    const [res, overview] = await Promise.all([
      getRentalSets({ ...query, sortBy: sortBy.value }),
      getRentalSets({ ...query, scope: 'all', status: '', sortBy: 'created_desc', page: 1, pageSize: 200 }),
    ]);
    list.value = res.list;
    total.value = res.total;
    overviewList.value = overview.list;
    overviewTotal.value = overview.total;
  } finally {
    loading.value = false;
  }
}

function search() {
  query.page = 1;
  load();
}

function setStatus(value: string) {
  query.status = value;
  search();
}

function setBizType(value: string) {
  query.bizType = value;
  search();
}

function resetFilter() {
  Object.assign(query, {
    keyword: '', status: '', bizType: '', code: '', roomNo: '', storeId: '',
    salesmanId: '', housekeeperId: '', paymentMethod: '', leaseTerm: '', layout: '',
    district: '', address: '', building: '', unit: '', operationStatus: '', businessStatus: '',
    propertyType: '', orientation: '', decoration: '', sourceChannel: '', landlordPhone: '', scope: 'all',
    page: 1, pageSize: query.pageSize,
  });
  sortBy.value = 'created_desc';
  search();
}

function goToPage(page: number) {
  const nextPage = Math.min(pageCount.value, Math.max(1, page));
  if (nextPage === query.page) return;
  query.page = nextPage;
  load();
}

function openCreate() {
  router.push('/house/rent/create');
}

function editSet(item: RentalSet) {
  router.push(`/house/rent/edit/${item.id}`);
}

function openDetail(item: RentalSet) {
  router.push(`/house/rent/detail/${item.id}`);
}

function handleRowDoubleClick(item: RentalSet, event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (target.closest('button, a, input, select, textarea')) return;
  openDetail(item);
}

function setDistrict(value: string) {
  query.district = value;
  search();
}

function openAppointment(item: RentalSet) {
  recommendSource.value = undefined;
  const nextHour = new Date(Date.now() + 60 * 60 * 1000);
  nextHour.setMinutes(0, 0, 0);
  selectedRental.value = item;
  appointmentForm.scheduledAt = nextHour;
  appointmentForm.customerId = undefined;
  appointmentForm.remark = '';
  appointmentDialogVisible.value = true;
  void searchAppointmentCustomers('');
}

async function searchAppointmentCustomers(keyword: string) {
  customerKeyword = keyword.trim();
  customerPage = 0;
  appointmentCustomers.value = [];
  appointmentCustomersTotal.value = 0;
  await loadAppointmentCustomers();
}

async function loadAppointmentCustomers() {
  const requestId = ++customerRequestId;
  const page = customerPage + 1;
  appointmentCustomersLoading.value = true;
  appointmentCustomersError.value = false;
  try {
    // 沿用客户管理接口，由后端按当前登录人的数据权限筛选。
    const result = await getCustomers({ keyword: customerKeyword, page, pageSize: 20 });
    if (requestId !== customerRequestId) return;
    appointmentCustomers.value = page === 1 ? result.list : [...appointmentCustomers.value, ...result.list];
    appointmentCustomersTotal.value = result.total;
    customerPage = page;
  } catch {
    if (requestId === customerRequestId) appointmentCustomersError.value = true;
  } finally {
    if (requestId === customerRequestId) appointmentCustomersLoading.value = false;
  }
}

async function submitAppointment() {
  if (appointmentSubmitting.value) return;
  if (!selectedRental.value || !appointmentForm.scheduledAt) {
    ElMessage.info('请选择约看时间');
    return;
  }
  if (recommendSource.value && !appointmentForm.customerId) {
    ElMessage.info('请选择推荐客户');
    return;
  }
  appointmentSubmitting.value = true;
  try {
    const payload = {
      rentalSetId: selectedRental.value.id,
      customerId: appointmentForm.customerId || undefined,
      scheduledAt: appointmentForm.scheduledAt.toISOString(),
      remark: appointmentForm.remark || undefined,
    };
    if (recommendSource.value) await recommendRentalAppointment(recommendSource.value.id, payload);
    else await createRentalAppointment(payload);
    appointmentDialogVisible.value = false;
    ElMessage.success(`${recommendSource.value ? '推荐约看' : '约看'}已创建，由${userStore.name || '当前用户'}负责`);
    if (appointmentRecordsVisible.value) await loadAppointments();
  } finally {
    appointmentSubmitting.value = false;
  }
}

function openFollowUp(record: RentalAppointment) {
  workflowRecord.value = record;
  followUpContent.value = '';
  followUpVisible.value = true;
}

async function submitFollowUp() {
  if (workflowSubmitting.value || !workflowRecord.value) return;
  if (!followUpContent.value.trim()) { ElMessage.info('请填写约看后跟进内容'); return; }
  workflowSubmitting.value = true;
  try {
    await followUpRentalAppointment(workflowRecord.value.id, followUpContent.value.trim());
    followUpVisible.value = false;
    ElMessage.success('跟进已保存');
    await loadAppointments();
  } finally { workflowSubmitting.value = false; }
}

async function openSign(record: RentalAppointment) {
  const current = ++signingGeneration;
  directSigningProperty.value = undefined;
  directSigningContext.value = undefined;
  workflowRecord.value = record;
  Object.assign(signForm, { rentalRoomId: record.rentalRoomId, contractCode: '', tenantName: '', tenantPhone: '',
    leaseStart: '', leaseEnd: '', rent: '', deposit: '0', paymentMethod: '', remark: '', details: emptyContractDetails() });
  signForm.details.propertyAddress = record.propertyName;
  signingContext.value = undefined;
  signingContextError.value = false;
  signingContextLoading.value = true;
  signVisible.value = true;
  try { const context = await getRentalAppointmentSigningContext(record.id); if (current === signingGeneration) signingContext.value = context; }
  catch { if (current === signingGeneration) signingContextError.value = true; }
  finally { if (current === signingGeneration) signingContextLoading.value = false; }
}

function canSignProperty(item: RentalSet, room?: RentalRoom) {
  if (!['active', 'vacant', 'reserved', 'rented'].includes(item.status)) return false;
  if (room) return ['vacant', 'reserved'].includes(room.status);
  return item.bizType === 'shared' ? item.rooms?.some(room => ['vacant', 'reserved'].includes(room.status)) : item.status !== 'rented';
}
async function openPropertySign(item: RentalSet, room?: RentalRoom) {
  const current = ++signingGeneration;
  workflowRecord.value = undefined;
  directSigningProperty.value = item;
  directSigningContext.value = undefined;
  Object.assign(signForm, { rentalRoomId: room?.id, contractCode: '', tenantName: '', tenantPhone: '',
    leaseStart: '', leaseEnd: '', rent: '', deposit: '0', paymentMethod: '', remark: '', details: emptyContractDetails() });
  signingContext.value = undefined;
  signingContextError.value = false;
  signingContextLoading.value = true;
  signVisible.value = true;
  try {
    const context = await getRentalSigningContext(item.id);
    if (current !== signingGeneration) return;
    signingContext.value = context;
    directSigningContext.value = context;
    Object.assign(signForm, context.defaults, { rent: context.defaults.rent.toFixed(2), deposit: context.defaults.deposit.toFixed(2),
      details: { ...emptyContractDetails(), ...context.defaults.details, propertyAddress: context.propertyAddress } });
    if (room) prefillSigningRoom(room.id);
  } catch { if (current === signingGeneration) signingContextError.value = true; }
  finally { if (current === signingGeneration) signingContextLoading.value = false; }
}
function prefillSigningRoom(id: number) {
  const room = directSigningContext.value?.rooms.find(room => room.id === id);
  if (room) Object.assign(signForm, { rent: room.rent.toFixed(2), deposit: room.deposit.toFixed(2), paymentMethod: room.paymentMethod });
}

async function submitSign() {
  if (workflowSubmitting.value || signingContextLoading.value || signingContextError.value || (!workflowRecord.value && !directSigningProperty.value)) return;
  const detailsError = validateContractDetails(signForm.details, signingContext.value?.workflowType === 'tenant' ? 'tenant' : 'regular');
  if (detailsError) { ElMessage.info(detailsError); return; }
  if (!signForm.leaseStart || !signForm.leaseEnd || signForm.leaseStart > signForm.leaseEnd) {
    ElMessage.info('请选择有效的租期'); return;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(signForm.rent) || !/^\d+(\.\d{1,2})?$/.test(signForm.deposit)) {
    ElMessage.info('请填写非负租金和押金，最多两位小数'); return;
  }
  if (!signForm.paymentMethod || (signingContext.value?.bizType === 'shared' && !signForm.rentalRoomId)) {
    ElMessage.info('请选择付款方式及签约房间'); return;
  }
  if (!workflowRecord.value?.customerId && (!signForm.tenantName.trim() || !/^1\d{10}$/.test(signForm.tenantPhone))) {
    ElMessage.info('请填写租客姓名和有效手机号'); return;
  }
  workflowSubmitting.value = true;
  try {
    const payload = { ...signForm, rent: Number(signForm.rent), deposit: Number(signForm.deposit),
      contractCode: signForm.contractCode.trim() || undefined, tenantName: signForm.tenantName.trim() || undefined,
      tenantPhone: signForm.tenantPhone || undefined };
    if (directSigningProperty.value) await signRentalProperty(directSigningProperty.value.id, payload);
    else await signRentalAppointment(workflowRecord.value!.id, payload);
    signVisible.value = false;
    ElMessage.success('签约已保存，出租信息已更新');
    await Promise.all([...(appointmentRecordsVisible.value ? [loadAppointments()] : []), load()]);
  } finally { workflowSubmitting.value = false; }
}

function openRecommend(record: RentalAppointment) {
  recommendSource.value = record;
  selectedRental.value = undefined;
  appointmentForm.customerId = record.customerId || undefined;
  appointmentForm.scheduledAt = new Date(Date.now() + 3_600_000);
  appointmentForm.remark = '';
  appointmentDialogVisible.value = true;
  if (!record.customerId) void searchAppointmentCustomers('');
  void searchRecommendRentals('');
}

async function searchRecommendRentals(keyword: string) {
  recommendKeyword = keyword.trim();
  recommendPage = 0;
  recommendOptions.value = [];
  recommendTotal.value = 0;
  await loadRecommendRentals();
}

async function loadRecommendRentals() {
  const requestId = ++recommendRequestId;
  const page = recommendPage + 1;
  recommendLoading.value = true;
  recommendError.value = false;
  try {
    const result = await getRentalSets({ keyword: recommendKeyword, page, pageSize: 20 });
    if (requestId !== recommendRequestId) return;
    recommendOptions.value = page === 1 ? result.list : [...recommendOptions.value, ...result.list];
    recommendTotal.value = result.total;
    recommendPage = page;
  } catch {
    if (requestId === recommendRequestId) recommendError.value = true;
  } finally { if (requestId === recommendRequestId) recommendLoading.value = false; }
}

function selectRecommendRental(id: number) {
  selectedRental.value = recommendOptions.value.find((item) => item.id === id);
}

async function loadAppointments() {
  appointmentLoading.value = true;
  try {
    const result = await getRentalAppointments({ page: 1, pageSize: 100, rentalSetId: appointmentPropertyId.value });
    appointmentList.value = result.list;
    appointmentTotal.value = result.total;
  } finally {
    appointmentLoading.value = false;
  }
}

async function openAppointmentRecords(propertyId?: number) {
  appointmentPropertyId.value = typeof propertyId === 'number' ? propertyId : undefined;
  appointmentRecordsVisible.value = true;
  await loadAppointments();
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
}

function appointmentStatusText(status: RentalAppointment['status']) {
  return ({ scheduled: '待约看', completed: '已跟进', signed: '已签约', cancelled: '已取消' } as Record<string, string>)[status] || status;
}

function actionText(action: string) {
  return ({ follow_up: '约看后跟进', sign: '签约', recommend: '再次推荐' } as Record<string, string>)[action] || action;
}

function formatPropertyName(item: RentalSet) {
  return formatHouseAddress({
    community: item.communityName,
    building: item.building,
    unit: item.unit,
    roomNo: item.roomNo,
  });
}

function rentalIncome(item: RentalSet) {
  if (item.bizType === 'shared' && item.rooms?.length) {
    return item.rooms.reduce((sum, room) => sum + Number(room.rentPrice || 0), 0);
  }
  return Number(item.rent || 0);
}

function comparableDate(value?: string) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

function nearestTenantLeaseEnd(item: RentalSet) {
  if (item.bizType === 'shared') {
    return (item.rooms || [])
      .map((room) => room.leaseEnd)
      .filter((date): date is string => Boolean(date))
      .sort()[0];
  }
  return item.tenantLeaseEnd || item.leaseEnd;
}

function phoneText(phone?: string) {
  if (!phone) return '-';
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
}

function statusClass(status: string) {
  return ({
    active: 'pill-green', vacant: 'pill-green', rented: 'pill-blue', reserved: 'pill-orange',
    checkout: 'pill-orange', pause: 'pill-gray', maintenance: 'pill-orange',
  } as Record<string, string>)[status] || 'pill-gray';
}

function statusText(status: string) {
  return ({
    active: '空置', vacant: '空置', rented: '已租', reserved: '已预定',
    checkout: '退租待审批', pause: '已下架', maintenance: '维修中',
  } as Record<string, string>)[status] || status || '-';
}

function statusCount(status: string) {
  if (!status) return summary.value.totalUnits;
  return overviewList.value.reduce((count, item) => {
    if (item.bizType === 'shared') {
      return count + (item.rooms || []).filter((room) => room.status === status).length;
    }
    if (status === 'vacant') return count + Number(['active', 'vacant'].includes(item.status));
    return count + Number(item.status === status);
  }, 0);
}

function isExpiringSoon(dateStr: string) {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  const now = new Date();
  const days = (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return days > 0 && days <= 30;
}

function storeName(id?: number) {
  return id ? storeNames.value.get(id) || `门店 #${id}` : '-';
}

function employeeName(id?: number) {
  return id ? employeeNames.value.get(id) || `员工 #${id}` : '-';
}

function operationStatusText(status?: string) {
  return ({ normal: '正常', renovating: '装修中', paused: '暂停运营' } as Record<string, string>)[status || 'normal'] || status || '-';
}

function displayDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : formatDate(date);
}

function showBatchHint(label: string) {
  ElMessage.info(`${label}：请先在房源卡中选择需要处理的记录`);
}

function canDelete(item: RentalSet) {
  return ['active', 'vacant', 'pause', 'maintenance'].includes(item.status)
    && !item.tenantName && !item.tenantPhone
    && (item.rooms || []).every((room) => ['vacant', 'maintenance'].includes(room.status)
      && !room.tenantName && !room.tenantPhone);
}

async function removeSet(item: RentalSet) {
  if (!canDelete(item) || deletingId.value) return;
  try {
    await ElMessageBox.confirm(`确认删除出租房源“${item.code}”？删除后无法恢复。`, '删除确认', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    });
    deletingId.value = item.id;
    await deleteRentalSet(item.id);
    if (list.value.length === 1 && query.page > 1) query.page--;
    await load();
    ElMessage.success('出租房源已删除');
  } catch {
    // 用户取消时保持原列表；接口错误由请求拦截器提示。
  } finally {
    deletingId.value = undefined;
  }
}

function checkoutKey(item: RentalSet, room?: RentalRoom) {
  return room ? `room:${room.id}` : `set:${item.id}`;
}

function checkoutDisabled(item: RentalSet, room?: RentalRoom) {
  return (room || item).status !== 'rented' || checkoutSubmitting.value.has(checkoutKey(item, room));
}

async function checkout(item: RentalSet, room?: RentalRoom) {
  if (checkoutDisabled(item, room)) return;
  const key = checkoutKey(item, room);
  checkoutSubmitting.value.add(key);
  try {
    const houseInfo = formatPropertyName(item) + (room ? ` ${room.roomNo}室` : '');
    await ElMessageBox.confirm(
      `确认提交「${houseInfo}」的退租申请？提交后进入待审批，审批通过后房间变为空置。`,
      '申请退租',
      { confirmButtonText: '提交退租', cancelButtonText: '取消', type: 'warning' },
    );
    await createCheckout({
      houseInfo,
      tenantName: (room || item).tenantName || '',
      rentalSetId: item.id,
      rentalRoomId: room?.id,
      checkoutDate: formatDate(new Date()),
      reason: '',
    });
    ElMessage.success('退租申请已提交，房态已变为待审批');
    await load();
  } catch {
    // 用户取消时保持原状态；接口错误由请求拦截器提示。
  } finally {
    checkoutSubmitting.value.delete(key);
  }
}

function exportCurrent() {
  downloadCsv(`租房-${new Date().toISOString().slice(0, 10)}.csv`, [
    ['编号', '小区', '地址', '房号', '租赁方式', '租金', '状态'],
    ...sortedList.value.map((item) => [
      item.code, item.communityName, item.address, item.roomNo,
      item.bizType === 'entire' ? '整租' : '合租', rentalIncome(item), statusText(item.status),
    ]),
  ]);
  ElMessage.success(`已导出当前页 ${sortedList.value.length} 条`);
}
</script>

<template>
  <div class="rental-page">
    <div class="prototype-note">
      <HelpCircle :size="15" />
      <span>租房房源使用统一列表视图，支持房态、租赁方式、北京区域和综合条件筛选。</span>
    </div>

    <section class="page-header-panel">
      <div>
        <h1>租房管理</h1>
        <p>一套一房间两层结构，支持整租与合租房源全生命周期管理</p>
      </div>
      <div class="page-actions">
        <button v-permission="['renting:appointment:view']" class="btn btn-default" @click="openAppointmentRecords()">
          <CalendarClock :size="15" /> 约看记录
        </button>
        <button class="btn btn-default" @click="showBatchHint('偏好设置')"><Settings2 :size="15" /> 偏好设置</button>
        <button v-permission="['renting:export']" class="btn btn-default" @click="exportCurrent">
          <Download :size="15" /> 导出当前页
        </button>
        <button class="btn btn-default" @click="showBatchHint('使用帮助')"><HelpCircle :size="15" /> 帮助</button>
        <button v-permission="['renting:add']" class="btn btn-primary" @click="openCreate">
          <Plus :size="16" /> 新房源录入
        </button>
      </div>
    </section>

    <section class="summary-strip" aria-label="房源概览">
      <span>合计 <strong>{{ summary.totalUnits }}</strong> 间</span>
      <span>未租 <strong>{{ summary.rentableRooms }}</strong> 间</span>
      <span>已租 <strong>{{ summary.rentedRooms }}</strong> 间</span>
      <span>已定 <strong>{{ summary.reservedRooms }}</strong> 间</span>
      <span>冻结 <strong>{{ summary.frozenRooms }}</strong> 间</span>
      <span class="summary-alert">30天内到期 <strong>{{ summary.expiring }}</strong> 套</span>
    </section>

    <section class="workspace-card">
      <div class="type-strip" aria-label="出租方式筛选">
        <button :class="['type-chip', { active: !query.bizType }]" @click="setBizType('')">全部房源 <span>{{ overviewTotal }}</span></button>
        <button :class="['type-chip', { active: query.bizType === 'entire' }]" @click="setBizType('entire')">整租 <span>{{ typeCounts.entire }}</span></button>
        <button :class="['type-chip', { active: query.bizType === 'shared' }]" @click="setBizType('shared')">合租 <span>{{ typeCounts.shared }}</span></button>
      </div>

      <div class="status-strip" aria-label="房源状态筛选">
        <button
          v-for="option in statusOptions"
          :key="option.value"
          :class="['status-chip', { active: query.status === option.value }]"
          @click="setStatus(option.value)"
        >
          {{ option.label }} <span>{{ statusCount(option.value) }}</span>
        </button>
      </div>

      <div class="district-strip" aria-label="北京区域筛选">
        <span>区域（北京）</span>
        <button :class="['district-chip', { active: !query.district }]" @click="setDistrict('')">全部区域</button>
        <button
          v-for="district in beijingDistricts"
          :key="district"
          :class="['district-chip', { active: query.district === district }]"
          @click="setDistrict(district)"
        >
          {{ district }}
        </button>
      </div>

      <div class="filter-panel">
        <div class="filter-grid filter-grid-main">
          <label class="filter-control filter-wide">
            <span>综合查询</span>
            <div class="search-main">
              <Search :size="15" />
              <input v-model="query.keyword" aria-label="综合查询" placeholder="小区名称 / 别名 / 地址" @keyup.enter="search" />
            </div>
          </label>
          <label class="filter-control">
            <span>排序方式</span>
            <select v-model="sortBy" @change="search">
              <option value="created_desc">按录入时间</option>
              <option value="rent_desc">租金从高到低</option>
              <option value="rent_asc">租金从低到高</option>
              <option value="lease_end">租约到期优先</option>
            </select>
          </label>
          <label class="filter-control">
            <span>门店/支队</span>
            <select v-model="query.storeId">
              <option value="">全部门店</option>
              <option v-for="item in storeOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
          </label>
          <label class="filter-control">
            <span>房号</span>
            <input v-model="query.roomNo" placeholder="房号" @keyup.enter="search" />
          </label>
          <label class="filter-control">
            <span>房源码</span>
            <input v-model="query.code" placeholder="房源码" @keyup.enter="search" />
          </label>
        </div>

        <div v-show="moreFiltersOpen" class="filter-grid filter-grid-more">
          <label class="filter-control"><span>业务员</span><select v-model="query.salesmanId"><option value="">全部</option><option v-for="item in employeeOptions" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label class="filter-control"><span>管家</span><select v-model="query.housekeeperId"><option value="">全部</option><option v-for="item in employeeOptions" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label class="filter-control"><span>业主电话</span><input v-model="query.landlordPhone" placeholder="业主/备用电话" @keyup.enter="search" /></label>
          <label class="filter-control"><span>房屋用途</span><select v-model="query.propertyType"><option value="">全部</option><option v-for="item in dictStore.getItems('property_type')" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
          <label class="filter-control"><span>朝向</span><select v-model="query.orientation"><option value="">全部</option><option v-for="item in dictStore.getItems('orientation')" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
          <label class="filter-control"><span>装修</span><select v-model="query.decoration"><option value="">全部</option><option v-for="item in dictStore.getItems('decoration_level')" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
          <label class="filter-control"><span>来源</span><select v-model="query.sourceChannel"><option value="">全部</option><option v-for="item in dictStore.getItems('source_channel')" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
          <label class="filter-control"><span>缴费方式</span><select v-model="query.paymentMethod"><option value="">全部</option><option v-for="item in dictStore.getItems('payment_method')" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
          <label class="filter-control"><span>租赁期限</span><select v-model="query.leaseTerm"><option value="">全部</option><option v-for="item in dictStore.getItems('lease_term')" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
          <label class="filter-control"><span>户型</span><input v-model="query.layout" placeholder="如 2室1厅" @keyup.enter="search" /></label>
          <label class="filter-control filter-wide"><span>物业地址</span><input v-model="query.address" placeholder="路名 / 弄号" @keyup.enter="search" /></label>
          <label class="filter-control"><span>楼栋</span><input v-model="query.building" placeholder="楼栋" @keyup.enter="search" /></label>
          <label class="filter-control"><span>单元</span><input v-model="query.unit" placeholder="单元" @keyup.enter="search" /></label>
          <label class="filter-control"><span>托管状态</span><select v-model="query.operationStatus"><option value="">全部</option><option value="normal">正常</option><option value="renovating">装修中</option><option value="paused">暂停运营</option></select></label>
          <label class="filter-control"><span>业务状态</span><select v-model="query.businessStatus"><option value="">全部</option><option value="normal">正常</option><option value="pending_collection">待收款</option><option value="arrears">有欠款</option><option value="checkout_pending">退租处理中</option></select></label>
        </div>

        <div class="filter-actions">
          <button class="btn btn-primary" @click="search"><Search :size="15" /> 查询</button>
          <button class="btn btn-default" @click="resetFilter"><RotateCcw :size="14" /> 重置</button>
          <button class="btn btn-default" @click="moreFiltersOpen = !moreFiltersOpen"><ListFilter :size="14" /> {{ moreFiltersOpen ? '收起筛选' : '更多筛选' }}</button>
        </div>
      </div>
    </section>

    <section class="list-toolbar">
      <div><Building2 :size="15" /><span>符合条件 <strong>{{ total }}</strong> 套</span></div>
      <label>排序：<select v-model="sortBy" aria-label="列表排序" @change="search"><option value="created_desc">新增时间</option><option value="rent_desc">租金从高到低</option><option value="rent_asc">租金从低到高</option><option value="lease_end">租约到期优先</option></select></label>
    </section>

    <div class="resource-table-shell" v-loading="loading">
      <div class="resource-table">
        <div class="resource-head resource-grid">
          <span>基本信息</span><span>房屋用途</span><span>房源状态</span><span>跟进</span><span>发布时间</span><span>维护人</span><span>操作</span>
        </div>
        <article v-for="item in sortedList" :key="item.id" class="resource-row resource-grid" title="双击查看详情" @dblclick="handleRowDoubleClick(item, $event)">
          <div class="basic-cell">
            <div class="house-cover">
              <img v-if="item.images?.[0]" :src="item.images[0]" :alt="item.title || item.communityName" />
              <div v-else class="house-cover-placeholder"><Building2 :size="26" /><small>{{ item.code }}</small></div>
              <span class="cover-badge">{{ item.bizType === 'shared' ? '合租' : '整租' }}</span>
            </div>
            <div class="house-main">
              <button class="house-subject" @click="openDetail(item)">{{ item.communityName }} · {{ formatBuilding(item.building) }}{{ formatUnit(item.unit) }}{{ item.roomNo }}</button>
              <p><MapPin :size="12" /> {{ item.title || item.address || '房源标题待完善' }}</p>
              <p class="house-facts">{{ item.layout || '户型待完善' }} · {{ item.buildingArea || '-' }}㎡ · {{ dictStore.getLabel('orientation', item.orientation) || '-' }} · {{ dictStore.getLabel('decoration_level', item.decoration) || '-' }} · {{ item.floor || '-' }}/{{ item.totalFloor || '-' }}层</p>
              <p class="price-line"><strong>{{ formatMoney(rentalIncome(item), 0) }}/月</strong><span>{{ dictStore.getLabel('payment_method', item.tenantPaymentMethod || item.landlordPaymentMethod) || '付款方式待完善' }}</span><span>房源码 {{ item.code }}</span></p>
              <p v-if="item.bizType === 'entire'" class="tenant-summary">租客 {{ item.tenantName || '暂无' }} · {{ phoneText(item.tenantPhone) }}</p>
              <div v-else class="room-summary"><span v-for="room in item.rooms || []" :key="room.id">{{ room.roomNo }}房 · {{ dictStore.getLabel('room_type', room.roomType) || room.roomType || '普通房' }}</span></div>
              <div v-if="item.tags?.length" class="house-tags"><span v-for="tag in item.tags" :key="tag" class="tag tag-blue">{{ dictStore.getLabel('house_tag', tag) || tag }}</span></div>
            </div>
          </div>
          <div class="center-cell"><strong>{{ dictStore.getLabel('property_type', item.propertyType) || item.propertyType || '-' }}</strong><small>{{ item.bizType === 'shared' ? `${item.vacantCount || 0}/${item.roomCount || item.rooms?.length || 0} 间可租` : '整租房源' }}</small></div>
          <div class="center-cell"><span :class="['pill', statusClass(item.status)]">{{ statusText(item.status) }}</span><small>{{ operationStatusText(item.operationStatus) }}</small></div>
          <div class="center-cell"><strong>{{ item.followUpContent || '暂无跟进' }}</strong><small>{{ item.viewingTime || '看房时间待完善' }}</small></div>
          <div class="center-cell"><strong>{{ displayDate(item.createdAt) }}</strong><small>租期至 {{ nearestTenantLeaseEnd(item)?.slice(0, 10) || '-' }}</small></div>
          <div class="center-cell"><strong>{{ employeeName(item.housekeeperId || item.salesmanId) }}</strong><small>{{ storeName(item.storeId) }}</small></div>
          <div class="operation-cell">
            <button class="action-link" @click="openDetail(item)">详情</button>
            <button v-permission="['renting:appointment:sign']" class="action-link sign-link" :disabled="!canSignProperty(item)" @click="openPropertySign(item)">成交</button>
            <button v-permission="['renting:appointment:create']" class="action-link appointment-link" @click="openAppointment(item)">约看</button>
            <button v-if="item.canViewLandlordInfo !== false" v-permission="['renting:edit']" class="action-link" @click="delegationProperty = item; delegationVisible = true">房管房</button>
            <button v-permission="['renting:edit']" class="action-link" @click="editSet(item)">编辑</button>
            <button v-if="item.bizType === 'entire'" v-permission="['renting:checkout']" class="action-link" :disabled="checkoutDisabled(item)" @click="checkout(item)">{{ item.status === 'checkout' ? '退租待审批' : '退租' }}</button>
            <button v-permission="['renting:delete']" class="action-link danger-text" :disabled="!canDelete(item) || deletingId === item.id" :title="canDelete(item) ? '删除房源' : '已有租客或业务记录的房源不能删除'" @click="removeSet(item)">删除</button>
          </div>
        </article>
        <div v-if="!sortedList.length && !loading" class="empty-state rental-empty">
          <span class="empty-icon"><Building2 :size="28" /></span><strong>没有找到符合条件的房源</strong><p>可以调整状态或关键词后重新查询</p><button class="btn btn-default" @click="resetFilter"><RotateCcw :size="14" /> 清空筛选</button>
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

    <el-dialog v-model="appointmentDialogVisible" :title="recommendSource ? '再次推荐' : '创建约看'" width="520px" destroy-on-close>
      <div class="appointment-form">
        <label v-if="recommendSource">
          <span>推荐房源</span>
          <el-select :model-value="selectedRental?.id" aria-label="推荐房源" filterable remote
            placeholder="搜索小区、地址或房源码" :remote-method="searchRecommendRentals" :loading="recommendLoading" @change="selectRecommendRental">
            <el-option v-for="item in recommendOptions" :key="item.id" :value="item.id" :label="`${formatPropertyName(item)} · ${item.code}`" />
            <template v-if="recommendOptions.length < recommendTotal" #footer>
              <button type="button" class="customer-load-more" :disabled="recommendLoading" @click.stop="loadRecommendRentals">加载更多房源</button>
            </template>
          </el-select>
        </label>
        <button v-if="recommendSource && recommendError" type="button" class="customer-load-more" @click="loadRecommendRentals">房源加载失败，点击重试</button>
        <div class="appointment-property">
          <span>约看房源</span>
          <strong>{{ selectedRental ? formatPropertyName(selectedRental) : '-' }}</strong>
          <small>房源码 {{ selectedRental?.code || '-' }}</small>
        </div>
        <label>
          <span>约看时间</span>
          <el-date-picker
            v-model="appointmentForm.scheduledAt"
            type="datetime"
            placeholder="请选择约看时间"
            format="YYYY-MM-DD HH:mm"
            :clearable="false"
          />
        </label>
        <label>
          <span>客户</span>
          <div class="appointment-customer-field">
            <el-select
              v-model="appointmentForm.customerId"
              aria-label="约看客户"
              placeholder="请选择客户，可搜索姓名或电话"
              filterable
              remote
              clearable
              :disabled="!!recommendSource?.customerId"
              :remote-method="searchAppointmentCustomers"
              :loading="appointmentCustomersLoading"
              no-data-text="暂无有权限查看的客户"
              no-match-text="未找到匹配的客户"
            >
              <el-option v-if="recommendSource?.customerId" :value="recommendSource.customerId" :label="`${recommendSource.customerName || '关联客户'} · #${recommendSource.customerId}`" />
              <el-option
                v-for="customer in (recommendSource?.customerId ? [] : appointmentCustomers)"
                :key="customer.id"
                :value="customer.id"
                :label="`${customer.name} · ${phoneText(customer.mobile)} · #${customer.id}`"
              />
              <template v-if="appointmentCustomers.length < appointmentCustomersTotal" #footer>
                <button type="button" class="customer-load-more" :disabled="appointmentCustomersLoading" @click.stop="loadAppointmentCustomers">
                  {{ appointmentCustomersLoading ? '加载中…' : '加载更多客户' }}（{{ appointmentCustomers.length }}/{{ appointmentCustomersTotal }}）
                </button>
              </template>
            </el-select>
            <small v-if="recommendSource?.customerId">本次推荐保留原约看客户</small>
            <small v-else-if="!appointmentCustomersError">仅展示当前账号有权限查看的客户{{ recommendSource ? '' : '，可不选' }}</small>
            <button v-else type="button" class="customer-load-more" @click="loadAppointmentCustomers">客户加载失败，点击重试</button>
          </div>
        </label>
        <label>
          <span>备注</span>
          <textarea v-model="appointmentForm.remark" maxlength="500" rows="3" placeholder="可填写集合地点等补充信息" />
        </label>
        <p class="appointment-owner-note">本次约看负责人：<strong>{{ userStore.name || '当前登录用户' }}</strong>（由发起人自动负责）</p>
      </div>
      <template #footer>
        <button class="btn btn-default" @click="appointmentDialogVisible = false">取消</button>
        <button class="btn btn-primary" :disabled="appointmentSubmitting" @click="submitAppointment">
          {{ appointmentSubmitting ? '提交中…' : recommendSource ? '确认推荐' : '确认约看' }}
        </button>
        <button v-if="!recommendSource" v-permission="['renting:appointment:view']" class="btn btn-default" @click="appointmentDialogVisible = false; openAppointmentRecords(selectedRental?.id)">约看结束 / 填写跟进</button>
      </template>
    </el-dialog>

    <el-dialog v-model="appointmentRecordsVisible" title="约看记录" width="min(1120px, 94vw)">
      <div v-loading="appointmentLoading" class="appointment-records">
        <p class="appointment-scope-note">共 {{ appointmentTotal }} 条；记录范围已按当前角色的数据权限自动过滤。</p>
        <div class="appointment-table-wrap">
          <table>
            <thead><tr><th>约看时间</th><th>房源</th><th>客户</th><th>负责人</th><th>状态</th><th>备注</th><th>操作</th></tr></thead>
            <tbody>
              <tr v-for="record in appointmentList" :key="record.id">
                <td>{{ formatDateTime(record.scheduledAt) }}</td>
                <td><strong>{{ record.propertyName }}</strong><small>{{ record.propertyCode }}</small></td>
                <td>{{ record.customerName || '-' }}</td>
                <td>{{ record.responsibleEmployeeName }}</td>
                <td><span class="appointment-status">{{ appointmentStatusText(record.status) }}</span><small v-if="record.contractCode">{{ record.contractCode }}</small></td>
                <td class="appointment-notes">
                  {{ record.remark || '-' }}
                  <details v-if="record.actions?.length" class="appointment-history">
                    <summary>跟进记录（{{ record.actions.length }}）</summary>
                    <p v-for="action in [...record.actions].sort((a, b) => a.id - b.id)" :key="action.id">
                      <strong>{{ actionText(action.action) }} · {{ action.employeeName }}</strong>
                      <small>{{ formatDateTime(action.createdAt) }}</small>
                      {{ action.content }}
                      <small v-if="action.details?.contractCode">合同：{{ action.details.contractCode }}</small>
                      <small v-if="action.details?.propertyCode">推荐房源：{{ action.details.propertyCode }}</small>
                    </p>
                  </details>
                </td>
                <td>
                  <div class="appointment-actions">
                    <button v-permission="['renting:appointment:follow-up']" type="button" class="action-link" :disabled="['signed','cancelled'].includes(record.status)" @click="openFollowUp(record)">约看结束 / 跟进</button>
                    <button v-permission="['renting:appointment:sign']" type="button" class="action-link" :disabled="['signed', 'cancelled'].includes(record.status)" @click="openSign(record)">成交</button>
                    <button v-permission="['renting:appointment:recommend']" type="button" class="action-link" :disabled="['signed', 'cancelled'].includes(record.status)" @click="openRecommend(record)">再次推荐</button>
                  </div>
                </td>
              </tr>
              <tr v-if="!appointmentList.length && !appointmentLoading"><td colspan="7" class="appointment-empty">暂无可查看的约看记录</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="followUpVisible" title="约看后跟进" width="520px" destroy-on-close>
      <div class="appointment-form">
        <div class="appointment-property"><strong>{{ workflowRecord?.propertyName }}</strong><small>客户：{{ workflowRecord?.customerName || '未关联客户' }}</small></div>
        <label><span>跟进内容</span><textarea v-model="followUpContent" aria-label="跟进内容" maxlength="500" rows="4" placeholder="记录客户反馈、意向及下一步安排" /></label>
      </div>
      <template #footer>
        <button class="btn btn-default" @click="followUpVisible = false">取消</button>
        <button class="btn btn-primary" :disabled="workflowSubmitting" @click="submitFollowUp">{{ workflowSubmitting ? '保存中…' : '保存跟进' }}</button>
      </template>
    </el-dialog>

    <PropertyDelegationDialog v-model:visible="delegationVisible" :property="delegationProperty" @completed="load" />
    <el-dialog v-model="signVisible" class="business-dialog" :title="signingContext?.workflowType === 'tenant' ? '承租成交' : '普租成交'" width="min(760px, 94vw)" top="5vh" destroy-on-close :close-on-click-modal="false" :show-close="!workflowSubmitting" :close-on-press-escape="!workflowSubmitting">
      <el-form v-loading="signingContextLoading" :model="signForm" label-position="top" class="signing-form" @submit.prevent>
        <div class="appointment-property"><strong>{{ directSigningProperty ? formatPropertyName(directSigningProperty) : workflowRecord?.propertyName }}</strong><small>客户：{{ signingContext?.customerName || workflowRecord?.customerName || '请填写租客信息' }} · {{ signingContext?.customerPhone || '电话未登记' }}</small></div>
        <p v-if="signingContextError" role="alert">签约信息加载失败，请关闭后重试。</p>
        <ContractBusinessFields :details="signForm.details" :mode="signingContext?.workflowType === 'tenant' ? 'tenant' : 'regular'" />
        <section class="sign-form-section">
          <div class="sign-section-heading"><span class="sign-section-index">01</span><div><strong>租客与房源</strong><small>{{ directSigningProperty ? '核对客户资料，确认本次签约房间' : '关联约看客户，确认本次签约房间' }}</small></div></div>
          <el-row :gutter="12">
            <template v-if="!workflowRecord?.customerId">
              <el-col :xs="24" :sm="12"><el-form-item label="租客姓名" required><el-input v-model="signForm.tenantName" maxlength="100" placeholder="请输入租客姓名" /></el-form-item></el-col>
              <el-col :xs="24" :sm="12"><el-form-item label="租客电话" required><el-input v-model="signForm.tenantPhone" maxlength="11" placeholder="请输入11位手机号" /></el-form-item></el-col>
            </template>
            <el-col v-else :span="24"><div class="sign-customer-tip">签约租客：{{ workflowRecord.customerName }}（自动使用所关联客户的信息）</div></el-col>
            <el-col v-if="signingContext?.bizType === 'shared'" :span="24"><el-form-item label="签约房间" required>
              <el-select v-model="signForm.rentalRoomId" aria-label="签约房间" placeholder="请选择房间" :disabled="!!workflowRecord?.rentalRoomId" @change="prefillSigningRoom">
                <el-option v-for="room in signingContext.rooms" :key="room.id" :value="room.id" :disabled="!['vacant', 'reserved'].includes(room.status)" :label="`${room.roomNo} · ${room.status === 'vacant' ? '可租' : room.status === 'reserved' ? '已定' : '不可签约'}`" />
              </el-select>
            </el-form-item></el-col>
          </el-row>
        </section>
        <section class="sign-form-section">
          <div class="sign-section-heading"><span class="sign-section-index">02</span><div><strong>合同与收款信息</strong><small>填写租赁期限、租金及付款方式</small></div></div>
          <el-row :gutter="12">
            <el-col :span="24"><el-form-item label="成交合同号"><el-input disabled placeholder="电子编码提交后自动生成" /></el-form-item></el-col>
            <el-col :xs="24" :sm="12"><el-form-item label="租期开始" required><el-date-picker v-model="signForm.leaseStart" aria-label="租期开始" type="date" value-format="YYYY-MM-DD" placeholder="选择开始日期" /></el-form-item></el-col>
            <el-col :xs="24" :sm="12"><el-form-item label="租期结束" required><el-date-picker v-model="signForm.leaseEnd" aria-label="租期结束" type="date" value-format="YYYY-MM-DD" placeholder="选择结束日期" :disabled-date="(date: Date) => !!signForm.leaseStart && date < new Date(`${signForm.leaseStart}T00:00:00`)" /></el-form-item></el-col>
            <el-col :xs="24" :sm="12"><el-form-item label="月租金" required><el-input v-model="signForm.rent" type="number" min="0" step="0.01" placeholder="元/月"><template #append>元/月</template></el-input></el-form-item></el-col>
            <el-col :xs="24" :sm="12"><el-form-item label="押金" required><el-input v-model="signForm.deposit" type="number" min="0" step="0.01" placeholder="元"><template #append>元</template></el-input></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="付款方式" required><el-select v-model="signForm.paymentMethod" aria-label="付款方式" placeholder="请选择付款方式"><el-option v-for="item in dictStore.getItems('payment_method')" :key="item.value" :value="item.value" :label="item.label" /></el-select></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="备注"><el-input v-model="signForm.remark" type="textarea" maxlength="500" :rows="2" show-word-limit placeholder="签约补充信息" /></el-form-item></el-col>
          </el-row>
        </section>
      </el-form>
      <template #footer>
        <button class="btn btn-default" :disabled="workflowSubmitting" @click="signVisible = false">取消</button>
        <button class="btn btn-primary" :disabled="workflowSubmitting || signingContextLoading || signingContextError" @click="submitSign">{{ workflowSubmitting ? '保存中…' : '确认签约' }}</button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.rental-page { min-height: 100%; color: var(--ink-800); }
.prototype-note { display: flex; align-items: center; gap: 8px; padding: 10px 13px; margin-bottom: 12px; color: #5f7194; background: #f4f8ff; border: 1px solid #b8d2ff; border-left: 3px solid var(--primary); border-radius: 8px; font-size: 11.5px; }
.prototype-note svg { flex: none; color: var(--primary); }
.page-header-panel { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 2px 0 10px; }
.page-header-panel h1 { margin: 0; color: var(--ink-900); font-size: 23px; line-height: 1.4; }
.page-header-panel p { margin: 2px 0 0; color: var(--ink-400); font-size: 12px; }
.page-header-panel .page-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.summary-strip { display: flex; flex-wrap: wrap; gap: 9px; margin-bottom: 12px; }
.summary-strip > span { padding: 6px 13px; color: var(--ink-500); background: #fff; border: 1px solid var(--ink-200); border-radius: 99px; box-shadow: var(--shadow-xs); font-size: 12px; }
.summary-strip strong { margin: 0 2px; color: var(--ink-900); font-family: var(--font-num); font-size: 14px; }
.summary-strip .summary-alert { color: #9a6700; background: #fffbeb; border-color: #fde68a; }

.workspace-card { margin-bottom: 16px; background: #fff; border: 1px solid var(--ink-200); border-radius: 12px; box-shadow: var(--shadow-xs); overflow: hidden; }
.market-tabs { display: flex; padding: 0 18px; border-bottom: 1px solid var(--ink-100); }
.market-tab { position: relative; padding: 15px 14px 13px; color: var(--ink-500); font-size: 13px; font-weight: 600; }
.market-tab::after { content: ''; position: absolute; right: 12px; bottom: -1px; left: 12px; height: 2px; background: transparent; }
.market-tab.active { color: var(--primary); }
.market-tab.active::after { background: var(--primary); }
.workspace-tabs { display: flex; gap: 6px; padding: 0 18px; border-bottom: 1px solid var(--ink-100); }
.workspace-tab { position: relative; padding: 14px 12px 12px; color: var(--ink-500); font-weight: 600; }
.workspace-tab::after { content: ''; position: absolute; right: 10px; bottom: -1px; left: 10px; height: 2px; background: transparent; border-radius: 2px 2px 0 0; }
.workspace-tab span { padding: 1px 6px; margin-left: 3px; color: var(--ink-400); background: var(--ink-100); border-radius: 99px; font-family: var(--font-num); font-size: 10.5px; }
.workspace-tab.active { color: var(--primary); }
.workspace-tab.active::after { background: var(--primary); }
.workspace-tab.active span { color: var(--primary); background: var(--primary-soft); }
.type-strip, .status-strip { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 16px 0; }
.type-chip { padding: 6px 12px; color: var(--ink-500); background: #fff; border: 1px solid var(--ink-200); border-radius: 99px; font-size: 12px; }
.type-chip span { color: var(--ink-400); font-family: var(--font-num); }
.type-chip.active { color: #fff; background: var(--primary); border-color: var(--primary); box-shadow: 0 5px 12px -6px rgba(46, 107, 240, .8); }
.type-chip.active span { color: rgba(255, 255, 255, .78); }
.status-strip { padding-top: 8px; padding-bottom: 10px; }
.status-chip { padding: 6px 11px; color: var(--ink-500); background: var(--ink-50); border: 1px solid var(--ink-200); border-radius: 99px; font-size: 12px; transition: all .15s; }
.status-chip span { margin-left: 3px; color: var(--ink-400); font-family: var(--font-num); }
.status-chip:hover { color: var(--primary); border-color: #b9ccf8; }
.status-chip.active { color: #fff; background: linear-gradient(135deg, #3e7cfa, #2e6bf0); border-color: transparent; box-shadow: 0 5px 12px -6px rgba(46, 107, 240, .8); }
.status-chip.active span { color: rgba(255, 255, 255, .78); }
.district-strip { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; padding: 9px 16px 11px; border-top: 1px solid var(--ink-100); }
.district-strip > span { margin-right: 3px; color: var(--ink-500); font-size: 11px; font-weight: 600; }
.district-chip { padding: 5px 9px; color: var(--ink-500); background: #fff; border: 1px solid var(--ink-200); border-radius: 6px; font-size: 11px; transition: all .15s; }
.district-chip:hover { color: var(--primary); border-color: #b9ccf8; }
.district-chip.active { color: var(--primary); background: var(--primary-soft); border-color: #b9ccf8; font-weight: 700; }
.filter-panel { padding: 12px 14px; background: #fbfcff; }
.filter-grid { display: grid; grid-template-columns: repeat(6, minmax(112px, 1fr)); gap: 9px 10px; }
.filter-grid-more { padding-top: 9px; }
.filter-wide { grid-column: span 2; }
.search-main { display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 12px; color: var(--ink-400); background: var(--ink-50); border: 1px solid var(--ink-200); border-radius: 8px; transition: all .15s; }
.search-main:focus-within { color: var(--primary); background: #fff; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(46, 107, 240, .1); }
.search-main input { width: 100%; min-width: 0; color: var(--ink-700); background: transparent; border: 0; outline: 0; font: inherit; }
.search-main input::placeholder { color: var(--ink-300); }
.filter-control { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 6px; color: var(--ink-400); font-size: 10.5px; }
.filter-control > span { white-space: nowrap; }
.filter-control > input, .filter-control select { width: 100%; min-width: 0; height: 34px; padding: 0 9px; color: var(--ink-700); background: #fff; border: 1px solid var(--ink-200); border-radius: 6px; outline: 0; font: inherit; font-size: 11.5px; }
.filter-control > input:focus, .filter-control select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(46, 107, 240, .08); }
.filter-control .search-main { height: 34px; padding: 0 9px; background: #fff; border-radius: 6px; }
.filter-actions { display: flex; justify-content: flex-end; gap: 7px; padding-top: 10px; }
.list-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 13px; margin-bottom: 10px; color: var(--ink-500); background: #fff; border: 1px solid var(--ink-200); border-radius: 9px; box-shadow: var(--shadow-xs); font-size: 11.5px; }
.list-toolbar > div, .list-toolbar label { display: flex; align-items: center; gap: 6px; }
.list-toolbar strong { color: var(--ink-900); font-family: var(--font-num); }
.list-toolbar select { height: 29px; padding: 0 8px; color: var(--ink-600); background: #fff; border: 1px solid var(--ink-200); border-radius: 6px; outline: 0; font: inherit; }
.resource-table-shell { overflow-x: auto; background: #fff; border: 1px solid var(--ink-200); border-radius: 10px; box-shadow: var(--shadow-sm); }
.resource-table { min-width: 1080px; }
.resource-grid { display: grid; grid-template-columns: minmax(430px, 3fr) minmax(95px, .72fr) minmax(95px, .72fr) minmax(115px, .9fr) minmax(115px, .85fr) minmax(105px, .82fr) minmax(116px, .82fr); }
.resource-head { color: var(--ink-500); background: var(--ink-50); border-bottom: 1px solid var(--ink-200); font-size: 11.5px; font-weight: 700; }
.resource-head span { display: flex; align-items: center; justify-content: center; min-height: 42px; padding: 8px 10px; border-right: 1px solid var(--ink-100); }
.resource-row { min-height: 150px; border-bottom: 1px solid var(--ink-100); transition: background .15s; }
.resource-row:hover { background: var(--primary-softer); }
.resource-row > div { min-width: 0; padding: 14px 10px; border-right: 1px solid var(--ink-100); }
.basic-cell { display: flex; align-items: flex-start; gap: 13px; }
.house-cover { position: relative; width: 120px; height: 90px; flex: none; overflow: hidden; background: var(--ink-100); border: 1px solid var(--ink-200); border-radius: 8px; }
.house-cover img { width: 100%; height: 100%; object-fit: cover; }
.house-cover-placeholder { display: grid; place-items: center; align-content: center; gap: 5px; width: 100%; height: 100%; color: #fff; background: linear-gradient(135deg, #315da8, #4d8df8); }
.house-cover-placeholder small { color: rgba(255,255,255,.72); font-family: var(--font-num); }
.cover-badge { position: absolute; top: 5px; left: 5px; padding: 2px 6px; color: #fff; background: rgba(22, 163, 74, .9); border-radius: 4px; font-size: 9.5px; }
.house-main { flex: 1; min-width: 0; }
.house-subject { display: block; max-width: 100%; overflow: hidden; color: var(--ink-900); font-size: 14px; font-weight: 700; text-align: left; text-overflow: ellipsis; white-space: nowrap; }
.house-subject:hover { color: var(--primary); }
.house-main > p { display: flex; align-items: center; gap: 4px; margin: 4px 0 0; overflow: hidden; color: var(--ink-400); font-size: 10.5px; text-overflow: ellipsis; white-space: nowrap; }
.house-main .house-facts { color: var(--ink-600); font-size: 11.5px; }
.house-main .price-line { gap: 10px; }
.price-line strong { color: var(--danger); font-family: var(--font-num); font-size: 16px; }
.price-line span { color: var(--ink-500); }
.tenant-summary { color: var(--ink-500) !important; }
.room-summary { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
.room-summary span { padding: 2px 6px; color: var(--ink-600); background: var(--ink-50); border-radius: 4px; font-size: 9.5px; }
.house-tags { margin-top: 6px; }
.house-tags .tag { margin-right: 4px; padding: 2px 6px; font-size: 9.5px; }
.center-cell { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 5px; color: var(--ink-700); text-align: center; }
.center-cell strong, .center-cell small { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.center-cell strong { font-size: 11.5px; }
.center-cell small { color: var(--ink-400); font-size: 10px; }
.operation-cell { display: flex; align-items: center; justify-content: center; align-content: center; flex-wrap: wrap; gap: 5px; }
.operation-cell .action-link { padding: 4px 7px; background: #fff; font-size: 10.5px; }
.operation-cell .appointment-link { color: var(--primary); border-color: #b9ccf8; }
.rental-empty { min-width: 1080px; }

.appointment-form { display: grid; gap: 16px; }
.appointment-property { padding: 13px 14px; background: var(--primary-softer); border: 1px solid #d8e5ff; border-radius: 9px; }
.appointment-property span, .appointment-property small { display: block; color: var(--ink-400); font-size: 11px; }
.appointment-property strong { display: block; margin: 4px 0 2px; color: var(--ink-800); font-size: 14px; }
.appointment-form > label { display: grid; grid-template-columns: 76px minmax(0, 1fr); align-items: start; gap: 10px; color: var(--ink-500); font-size: 12px; }
.appointment-form > label > span { padding-top: 9px; }
.appointment-form :deep(.el-date-editor) { width: 100%; }
.appointment-form :deep(.el-select) { width: 100%; }
.workflow-input { width: 100%; min-height: 34px; padding: 7px 10px; color: var(--ink-700); background: #fff; border: 1px solid var(--ink-200); border-radius: 7px; font: inherit; }
.signing-form { max-height: calc(82vh - 130px); overflow-y: auto; padding-right: 6px; }
.signing-form > .appointment-property { margin-bottom: 12px; }
.sign-form-section { padding: 18px 20px 4px; margin-bottom: 12px; border: 1px solid #e7edf5; border-radius: 10px; background: #fff; box-shadow: 0 3px 14px rgba(33, 56, 94, 0.045); }
.sign-section-heading { display: flex; align-items: center; gap: 10px; margin: -2px 0 17px; padding-bottom: 12px; border-bottom: 1px solid #edf1f7; }
.sign-section-index { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; flex: none; border-radius: 8px; color: #fff; background: linear-gradient(135deg, #548cff, #2f6fed); box-shadow: 0 5px 12px rgba(47, 111, 237, 0.22); font-size: 11px; font-weight: 800; }
.sign-section-heading strong { display: block; color: var(--ink-900); font-size: 14px; line-height: 20px; }
.sign-section-heading small { display: block; margin-top: 1px; color: var(--ink-500); font-size: 11px; }
.sign-customer-tip { margin-bottom: 15px; padding: 10px 12px; color: #52709f; background: #f5f9ff; border-radius: 6px; font-size: 12px; }
.signing-form :deep(.el-form-item) { margin-bottom: 15px; }
.signing-form :deep(.el-form-item__label) { height: auto; margin-bottom: 6px; padding: 0; color: #475569; font-size: 12px; font-weight: 600; line-height: 18px; }
.signing-form :deep(.el-select), .signing-form :deep(.el-date-editor.el-input) { width: 100%; }
.appointment-actions { display: flex; flex-wrap: wrap; gap: 6px; min-width: 172px; }
.appointment-actions .action-link { white-space: nowrap; }
.appointment-notes { max-width: 220px; overflow-wrap: anywhere; }
.appointment-history { margin-top: 6px; }
.appointment-history summary { color: var(--primary); cursor: pointer; }
.appointment-history p { margin: 8px 0; padding: 8px; background: var(--ink-50); border-radius: 6px; }
.appointment-customer-field :deep(.el-select) { width: 100%; }
.appointment-customer-field > small { display: block; margin-top: 6px; color: var(--ink-400); font-size: 11px; }
.customer-load-more { padding: 6px 0; color: var(--primary); background: none; border: 0; cursor: pointer; font: inherit; }
.customer-load-more:disabled { opacity: .6; cursor: wait; }
.appointment-form textarea { width: 100%; padding: 9px 10px; resize: vertical; color: var(--ink-700); border: 1px solid var(--ink-200); border-radius: 7px; outline: none; font: inherit; }
.appointment-form textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(46, 107, 240, .08); }
.appointment-owner-note, .appointment-scope-note { margin: 0; padding: 9px 11px; color: var(--ink-500); background: #f8fafc; border-radius: 7px; font-size: 11.5px; }
.appointment-owner-note strong { color: var(--primary); }
.appointment-table-wrap { margin-top: 10px; overflow-x: auto; border: 1px solid var(--ink-200); border-radius: 9px; }
.appointment-table-wrap table { width: 100%; min-width: 720px; border-collapse: collapse; }
.appointment-table-wrap th, .appointment-table-wrap td { padding: 11px 12px; border-bottom: 1px solid var(--ink-100); color: var(--ink-600); font-size: 11.5px; text-align: left; }
.appointment-table-wrap th { color: var(--ink-500); background: var(--ink-50); font-weight: 700; }
.appointment-table-wrap td strong, .appointment-table-wrap td small { display: block; }
.appointment-table-wrap td strong { color: var(--ink-800); }
.appointment-table-wrap td small { margin-top: 2px; color: var(--ink-400); }
.appointment-status { display: inline-flex; padding: 3px 8px; color: var(--primary); background: var(--primary-soft); border-radius: 99px; }
.appointment-table-wrap .appointment-empty { padding: 28px; color: var(--ink-400); text-align: center; }

.property-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.property-card { min-width: 0; overflow: hidden; background: #fff; border: 1px solid var(--ink-200); border-radius: 14px; box-shadow: var(--shadow-sm); transition: transform .18s, box-shadow .18s, border-color .18s; }
.property-card:hover { transform: translateY(-2px); border-color: #cfd9ea; box-shadow: 0 16px 32px -24px rgba(29, 54, 100, .52); }
.property-cover { position: relative; display: flex; align-items: center; gap: 12px; min-height: 86px; padding: 15px 17px; color: #fff; overflow: hidden; }
.property-cover::after { content: ''; position: absolute; right: -24px; top: -48px; width: 150px; height: 150px; border: 24px solid rgba(255, 255, 255, .07); border-radius: 50%; }
.cover-entire { background: linear-gradient(120deg, #254a93, #3378f5); }
.cover-shared { background: linear-gradient(120deg, #075b5e, #13acc1); }
.cover-icon { display: grid; place-items: center; width: 45px; height: 45px; flex: none; background: rgba(255, 255, 255, .13); border: 1px solid rgba(255, 255, 255, .17); border-radius: 12px; }
.cover-copy { position: relative; z-index: 1; display: grid; min-width: 0; }
.cover-copy > span { color: rgba(255, 255, 255, .62); font-family: var(--font-num); font-size: 10.5px; letter-spacing: .05em; }
.cover-copy > strong { overflow: hidden; font-size: 15px; text-overflow: ellipsis; white-space: nowrap; }
.cover-copy > small { display: flex; align-items: center; gap: 3px; overflow: hidden; color: rgba(255, 255, 255, .69); font-size: 10.5px; text-overflow: ellipsis; white-space: nowrap; }
.rent-mode { position: relative; z-index: 1; align-self: flex-start; padding: 3px 8px; margin-left: auto; color: rgba(255, 255, 255, .9); background: rgba(255, 255, 255, .13); border: 1px solid rgba(255, 255, 255, .18); border-radius: 99px; font-size: 10.5px; white-space: nowrap; }
.property-content { padding: 15px 16px 13px; }
.property-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.property-heading h2 { margin: 0 0 2px; color: var(--ink-900); font-size: 15px; }
.property-heading p { margin: 0; color: var(--ink-400); font-size: 11.5px; }
.property-heading > .pill { flex: none; margin-top: 1px; }
.quick-actions { display: flex; flex-wrap: wrap; gap: 6px; padding: 11px 0; border-bottom: 1px solid var(--ink-100); }
.action-link { padding: 4px 8px; color: var(--ink-600); background: var(--ink-50); border: 1px solid var(--ink-200); border-radius: 6px; font-size: 11.5px; }
.action-link:hover { color: var(--primary); background: var(--primary-softer); border-color: #bfd0f5; }
.action-link:disabled { opacity: .48; }
.property-facts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; padding: 11px 0; }
.property-facts-dense { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.property-facts > div { min-width: 0; padding: 8px 9px; background: var(--ink-50); border: 1px solid var(--ink-100); border-radius: 8px; }
.property-facts span, .tenant-block span, .landlord-line span, .landlord-metrics span { display: block; color: var(--ink-400); font-size: 10.5px; }
.property-facts strong { display: block; overflow: hidden; margin-top: 2px; color: var(--ink-800); font-family: var(--font-num); font-size: 12.5px; text-overflow: ellipsis; white-space: nowrap; }
.property-facts strong.money { color: var(--danger); font-size: 14px; }
.property-facts strong small, .room-price small { margin-left: 2px; color: var(--ink-400); font-size: 9.5px; font-weight: 400; }
.positive { color: var(--success) !important; }
.negative { color: var(--danger) !important; }
.tenant-block { display: grid; grid-template-columns: 1.25fr 1fr .8fr auto; gap: 10px; align-items: center; padding: 10px 11px; background: #f8faff; border: 1px solid #e3eafb; border-radius: 9px; }
.tenant-block strong, .landlord-line strong { display: block; overflow: hidden; color: var(--ink-700); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.tenant-person, .landlord-line { display: flex; align-items: center; gap: 8px; min-width: 0; }
.person-avatar { display: grid !important; place-items: center; width: 30px; height: 30px; flex: none; color: #fff !important; background: linear-gradient(135deg, #4a85fa, #2e6bf0); border-radius: 9px; }
.person-avatar-soft { color: var(--primary) !important; background: var(--primary-soft); }
.reminder-tag { display: inline-flex !important; align-items: center; width: max-content; padding: 2px 7px; border-radius: 99px; font-size: 10px !important; font-weight: 600; white-space: nowrap; }
.reminder-tag.warning { color: #9a5b04; background: #fff7d8; border: 1px solid #f9dc7a; }
.reminder-tag.danger { color: var(--danger); background: var(--danger-soft); border: 1px solid #fecaca; }

.room-section { padding-top: 2px; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 4px 0 8px; color: var(--ink-400); font-size: 10.5px; }
.section-heading > div { display: flex; align-items: center; gap: 5px; color: var(--ink-700); font-size: 12px; font-weight: 700; }
.room-grid { display: grid; grid-template-columns: 1fr; gap: 7px; }
.room-card { position: relative; min-width: 0; padding: 9px 10px; background: var(--ink-50); border: 1px solid var(--ink-200); border-left: 3px solid var(--ink-300); border-radius: 8px; }
.room-card.room-rented { border-left-color: var(--primary); }
.room-card.room-vacant, .room-card.room-active { border-left-color: var(--success); }
.room-card.room-maintenance, .room-card.room-checkout { border-left-color: var(--warning); }
.room-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; }
.room-card-head strong { overflow: hidden; color: var(--ink-800); font-size: 11.5px; text-overflow: ellipsis; white-space: nowrap; }
.room-card-head .pill { flex: none; padding: 1px 6px; font-size: 9.5px; }
.room-price { margin: 5px 0 3px; color: var(--danger); font-family: var(--font-num); font-size: 14px; font-weight: 700; }
.room-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 3px 10px; color: var(--ink-500); font-size: 10.5px; }
.room-meta span { display: flex; align-items: center; gap: 4px; min-width: 0; }
.room-actions { display: flex; gap: 8px; padding-top: 6px; margin-top: 6px; border-top: 1px dashed var(--ink-200); }
.room-actions button { color: var(--ink-500); font-size: 10.5px; }
.room-actions button:hover { color: var(--primary); }
.room-actions button:disabled { opacity: .38; }
.danger-text, .delete-link { color: var(--danger) !important; }
.room-card > .reminder-tag { position: absolute; right: 8px; bottom: 7px; }
.property-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 16px; background: #fbfcfe; border-top: 1px solid var(--ink-100); }
.landlord-line { flex: 1; }
.landlord-line > div { min-width: 0; }
.operation-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.operation-tags span { padding: 2px 6px; color: var(--success); background: var(--success-soft); border-radius: 99px; font-size: 9.5px; white-space: nowrap; }
.operation-tags span.warning { color: #9a5b04; background: #fff7d8; }
.delete-link { flex: none; padding: 4px 6px; font-size: 10.5px; }
.delete-link:disabled { color: var(--ink-300) !important; }

.landlord-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.landlord-card { padding: 16px; background: #fff; border: 1px solid var(--ink-200); border-radius: 12px; box-shadow: var(--shadow-xs); }
.landlord-card-head { display: flex; align-items: center; gap: 10px; }
.landlord-avatar { display: grid; place-items: center; width: 45px; height: 45px; flex: none; color: #875b18; background: linear-gradient(135deg, #fff7dd, #fde9ac); border-radius: 12px; }
.landlord-card-head h2 { margin: 0; color: var(--ink-900); font-size: 14px; }
.landlord-card-head p { margin: 1px 0 0; color: var(--ink-400); font-family: var(--font-num); font-size: 11.5px; }
.contract-tag { padding: 3px 8px; margin-left: auto; color: var(--success); background: var(--success-soft); border-radius: 99px; font-size: 10px; white-space: nowrap; }
.landlord-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px 0; }
.landlord-metrics > div { padding: 9px; background: var(--ink-50); border-radius: 8px; }
.landlord-metrics strong { display: block; margin-top: 3px; color: var(--ink-800); font-family: var(--font-num); font-size: 12px; }
.landlord-properties { display: grid; gap: 5px; }
.landlord-properties button { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; padding: 7px 9px; color: var(--ink-600); background: #fff; border: 1px solid var(--ink-200); border-radius: 7px; font-size: 10.5px; }
.landlord-properties button:hover { color: var(--primary); border-color: #bfd0f5; }
.landlord-properties button span { display: flex; align-items: center; gap: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.pagination-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 14px; margin-top: 16px; color: var(--ink-400); background: #fff; border: 1px solid var(--ink-200); border-radius: 10px; font-size: 11.5px; }
.page-btn { display: inline-grid; place-items: center; min-width: 30px; height: 30px; padding: 0 8px; }
.rental-empty { margin-top: 16px; background: #fff; border: 1px dashed var(--ink-300); border-radius: 12px; }
.rental-empty strong { display: block; margin-top: 8px; color: var(--ink-700); }
.rental-empty p { margin: 2px 0 12px; color: var(--ink-400); }
.empty-icon { display: inline-grid; place-items: center; width: 52px; height: 52px; color: var(--primary); background: var(--primary-soft); border-radius: 14px; }
.skeleton-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.skeleton-card { display: grid; gap: 12px; height: 330px; padding: 18px; background: #fff; border: 1px solid var(--ink-200); border-radius: 14px; }
.skeleton-card span { display: block; height: 52px; background: linear-gradient(90deg, var(--ink-100), #f8f9fc, var(--ink-100)); background-size: 200% 100%; border-radius: 8px; animation: shimmer 1.4s infinite linear; }
.skeleton-card span:first-child { height: 84px; }
.skeleton-card span:last-child { height: 130px; }
@keyframes shimmer { to { background-position: -200% 0; } }

@media (max-width: 1280px) {
  .filter-grid { grid-template-columns: repeat(4, minmax(112px, 1fr)); }
  .property-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .landlord-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 1050px) {
  .property-grid, .skeleton-grid { grid-template-columns: 1fr; }
  .filter-grid { grid-template-columns: repeat(3, minmax(112px, 1fr)); }
}
@media (max-width: 720px) {
  .page-header-panel { align-items: flex-start; flex-direction: column; }
  .page-header-panel .page-actions { width: 100%; justify-content: flex-start; }
  .landlord-grid { grid-template-columns: 1fr; }
  .filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .filter-wide { grid-column: span 2; }
  .tenant-block { grid-template-columns: 1fr 1fr; }
  .pagination-bar { align-items: flex-start; flex-direction: column; }
  .pagination { max-width: 100%; overflow-x: auto; }
}
@media (max-width: 480px) {
  .page-header-panel h1 { font-size: 21px; }
  .market-tabs, .workspace-tabs, .type-strip, .status-strip, .district-strip { overflow-x: auto; flex-wrap: nowrap; }
  .market-tab, .workspace-tab, .type-chip, .status-chip, .district-chip { flex: none; }
  .filter-grid { grid-template-columns: 1fr; }
  .filter-wide { grid-column: auto; }
  .filter-control { grid-template-columns: 70px minmax(0, 1fr); }
  .property-cover { min-height: 80px; padding: 13px; }
  .property-content { padding: 13px; }
  .tenant-block { grid-template-columns: 1fr; }
  .property-footer { align-items: flex-start; flex-direction: column; }
}
</style>
