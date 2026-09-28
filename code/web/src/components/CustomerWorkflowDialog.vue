<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { Customer } from '@/api/customer';
import { createCustomerAppointment, getCustomerPropertyOptions, getCustomerSigningContext, getCustomerWorkflowContext,
  signCustomer, terminateCustomerContract, type CustomerAppointment, type CustomerWorkflowAction, type Deal, type PropertyOption } from '@/api/deal';
import { useDictStore } from '@/stores/dict';
import { useUserStore } from '@/stores/user';
import ContractBusinessFields from './ContractBusinessFields.vue';
import { emptyContractDetails, validateContractDetails } from '@/api/business';

const props = defineProps<{ visible: boolean; customer: Customer | null; action: CustomerWorkflowAction }>();
const emit = defineEmits<{ 'update:visible': [boolean]; completed: []; switch: [CustomerWorkflowAction] }>();
const dict = useDictStore();
const user = useUserStore();
const loading = ref(false), submitting = ref(false), error = ref('');
const properties = ref<PropertyOption[]>([]), propertyTotal = ref(0), propertyPage = ref(1), propertyKeyword = ref(''), propertyLoading = ref(false);
const appointments = ref<CustomerAppointment[]>([]), contracts = ref<Deal[]>([]);
const rooms = ref<{ id: number; roomNo: string; status: string }[]>([]), shared = ref(false), roomLoading = ref(false);
const workflowType = ref<'regular' | 'tenant'>('regular');
const form = reactive({ propertyId: undefined as number | undefined, appointmentId: undefined as number | undefined,
  dealId: undefined as number | undefined, rentalRoomId: undefined as number | undefined, scheduledAt: '',
  contractCode: '', leaseStart: '', leaseEnd: '', rent: '', deposit: '0', paymentMethod: '', amount: '', remark: '', terminatedOn: '', reason: '', details: emptyContractDetails() });
const title = computed(() => ({ appointment: '客户约看', sign: '客户签约', terminate: '客户解约' })[props.action]);
const renting = computed(() => props.customer?.customerType === 'tenant');
let generation = 0, propertyGeneration = 0, roomGeneration = 0;
const dateTime = (value: string) => new Date(value).toLocaleString('zh-CN', { hour12: false });
const today = () => new Date().toLocaleDateString('sv-SE');

watch(() => [props.visible, props.customer?.id, props.action], async () => {
  const current = ++generation;
  if (!props.visible || !props.customer) return;
  error.value = ''; loading.value = true; appointments.value = []; contracts.value = []; properties.value = []; rooms.value = []; shared.value = false;
  Object.assign(form, { propertyId: undefined, appointmentId: undefined, dealId: undefined, rentalRoomId: undefined, scheduledAt: '', contractCode: '',
    leaseStart: '', leaseEnd: '', rent: '', deposit: '0', paymentMethod: '', amount: '', remark: '', terminatedOn: today(), reason: '', details: emptyContractDetails() });
  workflowType.value = 'regular';
  try {
    await dict.ensureLoaded(['payment_method']);
    if (props.action === 'appointment') { propertyKeyword.value = ''; propertyPage.value = 1; await loadProperties(); }
    else {
      const context = await getCustomerWorkflowContext(props.customer.id);
      if (current !== generation) return;
      appointments.value = context.appointments; contracts.value = context.contracts;
      if (props.action === 'terminate' && contracts.value.length === 1) form.dealId = contracts.value[0].id;
    }
  } catch { if (current === generation) error.value = '加载失败，请关闭后重试。'; }
  finally { if (current === generation) loading.value = false; }
}, { immediate: true });

async function loadProperties(keyword = propertyKeyword.value, more = false) {
  if (!props.customer) return;
  const current = ++propertyGeneration, dialogGeneration = generation;
  propertyKeyword.value = keyword; if (!more) propertyPage.value = 1;
  const page = more ? propertyPage.value + 1 : 1;
  propertyLoading.value = true;
  try {
    const result = await getCustomerPropertyOptions(props.customer.id, { keyword, page, pageSize: 20 });
    if (current !== propertyGeneration || dialogGeneration !== generation) return;
    properties.value = more ? [...properties.value, ...result.list] : result.list;
    propertyTotal.value = result.total; propertyPage.value = page;
  } finally { if (current === propertyGeneration) propertyLoading.value = false; }
}
async function selectAppointment(id: number) {
  form.rentalRoomId = undefined; shared.value = false; rooms.value = [];
  if (!props.customer || !renting.value) return;
  const current = ++roomGeneration, dialogGeneration = generation; roomLoading.value = true;
  try {
    const context = await getCustomerSigningContext(props.customer.id, id);
    if (current !== roomGeneration || dialogGeneration !== generation) return;
    shared.value = context.bizType === 'shared'; rooms.value = context.rooms;
    workflowType.value = context.workflowType || 'regular';
    form.details.propertyAddress = context.propertyAddress || appointments.value.find(row => row.id === id)?.propertyName || '';
  } catch { error.value = '签约房间加载失败，请重新选择约看记录。'; }
  finally { if (current === roomGeneration) roomLoading.value = false; }
}
function money(value: string, positive = false) { return /^\d+(\.\d{1,2})?$/.test(value) && Number.isFinite(Number(value)) && Number(value) <= 999999999999.99 && (positive ? Number(value) > 0 : Number(value) >= 0); }
async function submit() {
  if (!props.customer || submitting.value || loading.value || roomLoading.value) return;
  error.value = '';
  if (props.action === 'appointment' && (!form.propertyId || !form.scheduledAt || new Date(form.scheduledAt).getTime() <= Date.now())) error.value = '请选择房源及未来的约看时间。';
  if (props.action === 'sign') {
    if (!form.appointmentId) error.value = '请先选择该客户的约看记录。';
    else if (renting.value && (!form.leaseStart || !form.leaseEnd || form.leaseEnd < form.leaseStart || !money(form.rent) || !money(form.deposit) || !form.paymentMethod || (shared.value && !form.rentalRoomId))) error.value = '请填写有效租期、金额、付款方式，并选择合租房间。';
    else if (!renting.value && !money(form.amount, true)) error.value = '请填写有效的成交总价（元），最多两位小数。';
    else if (renting.value) error.value = validateContractDetails(form.details, workflowType.value);
  }
  if (props.action === 'terminate' && (!form.dealId || !form.terminatedOn || !form.reason.trim())) error.value = '请选择合同，并填写解约日期和原因。';
  if (error.value) return;
  submitting.value = true;
  try {
    if (props.action === 'appointment') await createCustomerAppointment(props.customer.id, { propertyId: form.propertyId!, scheduledAt: new Date(form.scheduledAt).toISOString(), remark: form.remark });
    if (props.action === 'sign') await signCustomer(props.customer.id, { appointmentId: form.appointmentId!, contractCode: form.contractCode || undefined,
      ...(renting.value ? { rentalRoomId: form.rentalRoomId, leaseStart: form.leaseStart, leaseEnd: form.leaseEnd, rent: Number(form.rent), deposit: Number(form.deposit), paymentMethod: form.paymentMethod, details: form.details } : { amount: Number(form.amount) }), remark: form.remark });
    if (props.action === 'terminate') await terminateCustomerContract(props.customer.id, { dealId: form.dealId!, terminatedOn: form.terminatedOn, reason: form.reason });
    ElMessage.success(props.action === 'terminate' && renting.value ? '解约申请已提交，请在退租管理审批并清算' : `${title.value}成功`);
    emit('completed'); emit('update:visible', false);
  } catch { /* 请求层统一展示后端校验及权限错误，保留表单方便修正。 */ }
  finally { submitting.value = false; }
}
</script>

<template>
  <el-dialog :model-value="visible" :title="title" width="min(760px, 94vw)" top="6vh" :close-on-click-modal="false" :before-close="(done: () => void) => { if (!submitting) done(); }" @update:model-value="emit('update:visible', $event)">
    <div v-loading="loading" class="workflow-body">
      <div class="customer-summary"><strong>{{ customer?.name }}</strong><span>{{ customer?.mobile }} · {{ renting ? '租房客户' : '买房客户' }}</span></div>
      <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
      <el-form :model="form" label-position="top" @submit.prevent="submit">
        <section class="form-section"><div class="section-heading"><span>01</span><div><strong>{{ action === 'appointment' ? '房源与约看' : action === 'sign' ? '合同与收款约定' : '合同解约' }}</strong><p>客户、房源和记录按当前账号的数据权限筛选</p></div></div>
          <template v-if="action === 'appointment'">
            <el-form-item label="约看房源" required><el-select v-model="form.propertyId" filterable remote :remote-method="(value: string) => loadProperties(value)" :loading="propertyLoading" placeholder="搜索房源名称或编号" style="width: 100%"><el-option v-for="item in properties" :key="item.id" :value="item.id" :label="`${item.name} · ${item.code}`" /></el-select>
              <el-button v-if="properties.length < propertyTotal" link type="primary" :loading="propertyLoading" @click="loadProperties(propertyKeyword, true)">加载更多房源（{{ properties.length }}/{{ propertyTotal }}）</el-button>
            </el-form-item>
            <el-form-item label="约看时间" required><el-date-picker v-model="form.scheduledAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" :disabled-date="(value: Date) => value.getTime() < new Date(today()).getTime()" placeholder="选择约看日期和时间" style="width:100%" /></el-form-item>
            <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" maxlength="500" show-word-limit /></el-form-item>
            <div class="form-hint">本次约看负责人：{{ user.name }}（由发起人自动负责）</div>
          </template>
          <template v-else-if="action === 'sign'">
            <el-alert v-if="!loading && !appointments.length" title="没有可签约的约看记录，请先为该客户创建约看。" type="info" :closable="false" />
            <el-form-item label="关联约看" required><el-select v-model="form.appointmentId" placeholder="选择该客户的约看记录" style="width:100%" @change="selectAppointment"><el-option v-for="item in appointments" :key="item.id" :value="item.id" :label="`${item.propertyName} · ${dateTime(item.scheduledAt)}`" /></el-select></el-form-item>
            <el-form-item v-if="renting && shared" label="签约房间" required><el-select v-model="form.rentalRoomId" :loading="roomLoading" style="width:100%" placeholder="选择可租房间"><el-option v-for="room in rooms" :key="room.id" :value="room.id" :disabled="!['vacant','reserved'].includes(room.status)" :label="room.roomNo" /></el-select></el-form-item>
            <el-form-item label="成交合同号"><el-input disabled placeholder="电子编码提交后自动生成" /></el-form-item>
            <template v-if="renting">
              <ContractBusinessFields :details="form.details" :mode="workflowType" />
              <el-row :gutter="14"><el-col :xs="24" :sm="12"><el-form-item label="租期开始" required><el-date-picker v-model="form.leaseStart" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item></el-col><el-col :xs="24" :sm="12"><el-form-item label="租期结束" required><el-date-picker v-model="form.leaseEnd" type="date" value-format="YYYY-MM-DD" :disabled-date="(value: Date) => !!form.leaseStart && value.getTime() < new Date(form.leaseStart).getTime()" style="width:100%" /></el-form-item></el-col></el-row>
              <el-row :gutter="14"><el-col :xs="24" :sm="12"><el-form-item label="月租金（元/月）" required><el-input v-model="form.rent" type="number" min="0" step="0.01" /><MoneyUppercase :value="form.rent" /></el-form-item></el-col><el-col :xs="24" :sm="12"><el-form-item label="押金（元）" required><el-input v-model="form.deposit" type="number" min="0" step="0.01" /><MoneyUppercase :value="form.deposit" /></el-form-item></el-col></el-row>
              <el-form-item label="付款方式" required><el-select v-model="form.paymentMethod" style="width:100%" placeholder="选择付款方式"><el-option v-for="item in dict.getItems('payment_method')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
            </template>
            <el-form-item v-else label="成交总价（元，非万元）" required><el-input v-model="form.amount" type="number" min="0.01" step="0.01" placeholder="输入合同成交总价" /><MoneyUppercase :value="form.amount" /></el-form-item>
            <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" maxlength="500" show-word-limit /></el-form-item>
            <div class="form-hint">签约将生成成交记录并更新客户及房源状态；合同金额不代表已收款。</div>
          </template>
          <template v-else>
            <el-alert :title="renting ? '租房解约提交退租审批，审批后释放房源，押金继续按原流程清算。' : '售房解约将合同标记为已解约并恢复原销售状态，保留成交历史，不自动处理退款。'" type="warning" :closable="false" show-icon />
            <el-form-item label="解约合同" required><el-select v-model="form.dealId" style="width:100%" :placeholder="contracts.length ? '选择生效合同' : '暂无可解约的生效合同'"><el-option v-for="item in contracts" :key="item.id" :value="item.id" :label="`${item.contractCode} · ${item.propertyName}`" /></el-select></el-form-item>
            <el-form-item label="解约日期" required><el-date-picker v-model="form.terminatedOn" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
            <el-form-item label="解约原因" required><el-input v-model="form.reason" type="textarea" :rows="4" maxlength="255" show-word-limit placeholder="填写解约原因，保留历史合同与成交记录" /></el-form-item>
          </template>
        </section>
      </el-form>
    </div>
    <template #footer><el-button :disabled="submitting" @click="emit('update:visible', false)">取消</el-button><el-button type="primary" :loading="submitting" :disabled="loading || roomLoading || (action === 'sign' && !appointments.length) || (action === 'terminate' && !contracts.length)" @click="submit">{{ action === 'terminate' && renting ? '提交解约申请' : `确认${title.slice(2)}` }}</el-button></template>
  </el-dialog>
</template>

<style scoped lang="scss">
.workflow-body { max-height: calc(82vh - 130px); overflow-y: auto; padding-right: 6px; }
.customer-summary { padding: 14px 16px; background: #f5f8ff; border: 1px solid #d6e2ff; border-radius: 8px; margin-bottom: 16px; display: grid; gap: 6px; }
.customer-summary span, .form-hint { color: #8195b5; font-size: 12px; }
.form-section { padding: 18px 20px; border: 1px solid #e7edf5; border-radius: 10px; background: #fff; margin-top: 14px; }
.section-heading { display: flex; align-items: center; gap: 10px; padding-bottom: 14px; margin-bottom: 18px; border-bottom: 1px solid #edf2f8; }
.section-heading > span { background: #3474ff; border-radius: 8px; color: white; padding: 8px; font-weight: 700; }
.section-heading p { color: #8195b5; font-size: 12px; margin: 4px 0 0; }
:deep(.el-form-item__label) { color: #263d64; font-weight: 600; font-size: 12px; }
:deep(.el-form-item__content) { align-items: flex-start; }
:deep(.el-alert) { margin-bottom: 14px; }
</style>
