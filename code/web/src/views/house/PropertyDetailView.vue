<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getHouseDetail, type PropertyDetail } from '@/api/property-detail';
import { useDictStore } from '@/stores/dict';
import { formatMoney } from '@/utils/format';
import { formatHouseAddress } from '@/utils/address';
import { readSaleTaxFees, saleTaxLabel, SALE_TAX_OPTIONS } from '@/utils/sale-tax';

const route = useRoute(), router = useRouter(), dict = useDictStore();
const kind = computed(() => route.name === 'SaleDetail' ? 'sale' : 'rent');
const data = ref<PropertyDetail>();
const loading = ref(false), error = ref('');
const property = computed(() => data.value?.property || {});
const rooms = computed<Record<string, any>[]>(() => (property.value.rooms || []).filter((room: any) => !data.value?.roomId || room.id === data.value.roomId));
const title = computed(() => kind.value === 'sale' ? '售房详情' : data.value?.roomId ? '合租房间详情' : property.value.bizType === 'shared' ? '合租房源详情' : '整租房源详情');
let version = 0;
async function load() {
  const current = ++version;
  loading.value = true; error.value = ''; data.value = undefined;
  try {
    const result = await getHouseDetail(kind.value, Number(route.params.id), route.query.roomId ? Number(route.query.roomId) : undefined);
    if (current === version) data.value = result;
    await dict.ensureLoaded(['property_type', 'decoration_level', 'orientation', 'source_channel', 'tax_type', 'certificate_type', 'payment_method']);
  } catch {
    if (current === version) error.value = '详情加载失败，请确认记录存在且有查看权限后重试。';
  } finally { if (current === version) loading.value = false; }
}
watch(() => route.fullPath, load, { immediate: true });

function status(value?: string) {
  const labels: Record<string, string> = { vacant: '空置', active: '空置', rented: '已出租', checkout: '退租待审批', reserved: '已预订', configuring: '配置中', dirty: '待保洁', repair: '维修中', pre_publish: '待发布', published: '已发布', selling: '已发布', price_negotiation: '议价中', bargain: '议价中', quick_sale: '急售', sold: '已售', off_shelf: '已下架', pending: '待审批', approved: '已通过', confirmed: '已通过', rejected: '已驳回', completed: '已完成', success: '成功', failed: '失败' };
  return value ? labels[value] || value : '—';
}
function value(item: unknown) { return item === null || item === undefined || item === '' ? '—' : typeof item === 'boolean' ? (item ? '是' : '否') : String(item); }
function money(item: any) { return item == null || item === '' ? '—' : formatMoney(item); }
function date(item: any) { return item ? String(item).replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC') : '未记录'; }
function period(start: any, end: any) { return `${value(start)} 至 ${value(end)}`; }
type Field = [string, unknown];
const groups = computed<{ title: string; fields: Field[] }[]>(() => {
  const p = property.value;
  const basics: Field[] = [['房源编号', p.code], ['当前状态', status(p.status)], ['小区', p.communityName], ['详细地址', p.address], ['楼栋 / 单元 / 房号', `${value(p.building)} / ${value(p.unit)} / ${value(p.roomNo)}`], ['建筑面积（㎡）', p.buildingArea], ['套内面积（㎡）', p.interiorArea], ['装修', dict.getLabel('decoration_level', p.decoration)], ['登记时间', date(p.createdAt)]];
  if (kind.value === 'sale') return [
    { title: '房源信息', fields: [...basics, ['标题', p.title], ['物业类型', dict.getLabel('property_type', p.propertyType)], ['户型', `${value(p.layoutRooms)}室 ${value(p.layoutHalls)}厅 ${value(p.layoutBathrooms)}卫 ${value(p.layoutBalconies)}阳台`], ['楼层 / 总楼层', `${value(p.floor)} / ${value(p.totalFloor)}`], ['朝向', dict.getLabel('orientation', p.orientation)], ['电梯', ({ yes: '有', no: '无' } as Record<string, string>)[p.elevator] || value(p.elevator)], ['建成年份', p.buildYear]] },
    { title: '价格与产权', fields: [['售价（元）', money(p.salePrice ?? p.totalPrice)], ['单价（元/㎡）', money(p.unitPrice)], ['底价（元）', money(p.floorPrice)],
      ['税费明细', readSaleTaxFees(p).map(fee => `${saleTaxLabel(fee.type)}：${fee.amount == null ? '未填写金额' : `${money(fee.amount)} 元`}`).join('\n')],
      ...(p.taxType && !SALE_TAX_OPTIONS.some(option => option.value === p.taxType) ? [['原税费记录', dict.getLabel('tax_type', p.taxType)] as Field] : []),
      ['证件类型', dict.getLabel('certificate_type', p.certificateType)], ['负债（元）', money(p.debt)]] },
    { title: '业主与来源', fields: [['业主姓名', p.ownerName], ['业主电话', p.ownerPhone], ['备用电话', p.ownerPhoneBackup], ['来源渠道', dict.getLabel('source_channel', p.sourceChannel)], ['门店编号', p.storeId], ['维护人编号', p.maintainerId], ['标签', (p.tags || []).join('、')], ['房源描述', p.description]] },
  ];
  return [
    { title: '房源信息', fields: [...basics, ['出租方式', p.bizType === 'shared' ? '合租' : '整租'], ['户型', p.layout], ['商圈', p.businessCircle], ['门店编号', p.storeId], ['业务员编号', p.salesmanId], ['管家编号', p.housekeeperId]] },
    { title: '业主与收房信息', fields: [['业主姓名', p.landlordName], ['业主电话', p.landlordPhone], ['收房租金（元）', money(p.landlordRent)], ['房东押金（元）', money(p.landlordDeposit)], ['收房租期', period(p.leaseStart, p.leaseEnd)], ['免租期', p.rentFreePeriod]] },
    ...(p.bizType === 'shared' ? [] : [{ title: '租客与出租信息', fields: [['租客姓名', p.tenantName], ['租客电话', p.tenantPhone], ['出租租金（元）', money(p.rent)], ['租客押金（元）', money(p.deposit)], ['出租租期', period(p.tenantLeaseStart, p.tenantLeaseEnd)], ['付款方式', dict.getLabel('payment_method', p.tenantPaymentMethod)]] as Field[] }]),
  ];
});
function action(value: string) {
  return ({ 'rental:create': '登记租房', 'rental:update': '编辑租房', 'sale:create': '登记售房', 'sale:update': '编辑售房', 'sale:changeStatus': '申请变更状态' } as Record<string, string>)[value] || value;
}
</script>

<template>
  <div class="property-detail" v-loading="loading">
    <div class="page-header">
      <div><div class="page-title">{{ title }}</div><div class="page-desc">房源资料 · 租售信息 · 流程记录</div></div>
      <div class="page-actions"><button class="btn btn-default" @click="router.push(`/house/${kind}`)">返回列表</button><button class="btn btn-primary" :disabled="loading" @click="load">刷新</button></div>
    </div>
    <div v-if="error" class="card error-state" role="alert">{{ error }} <button class="btn btn-default" @click="load">重试</button></div>
    <template v-else-if="data">
      <div class="card property-banner"><h2>{{ property.code }} · {{ property.communityName || property.title }}</h2><p>{{ formatHouseAddress({ community: property.communityName, building: property.building, unit: property.unit, roomNo: property.roomNo }) }}</p><span class="pill pill-blue">{{ status(property.status) }}</span><p v-if="data.roomId">当前查看：{{ rooms[0]?.roomNo }} 室 <router-link :to="`/house/rent/detail/${property.id}`">查看整套房源</router-link></p></div>
      <section v-for="group in groups" :key="group.title" class="card detail-section">
        <h3>{{ group.title }}</h3>
        <dl class="detail-grid"><div v-for="field in group.fields" :key="field[0]"><dt>{{ field[0] }}</dt><dd>{{ value(field[1]) }}</dd></div></dl>
      </section>
      <section v-if="kind === 'rent' && property.bizType === 'shared'" class="card detail-section">
        <h3>房间与租客信息（{{ rooms.length }} 间）</h3>
        <el-empty v-if="!rooms.length" description="暂无房间信息" />
        <article v-for="room in rooms" :key="room.id" class="room-detail">
          <h4>{{ room.roomNo }} 室 · {{ room.roomType || '未填写房型' }} <span class="pill pill-blue">{{ status(room.status) }}</span></h4>
          <dl class="detail-grid">
            <div><dt>租金 / 挂牌价（元）</dt><dd>{{ money(room.rentPrice) }} / {{ money(room.listedPrice) }}</dd></div>
            <div><dt>押金（元）</dt><dd>{{ money(room.depositAmount) }}</dd></div>
            <div><dt>租客</dt><dd>{{ value(room.tenantName) }}</dd></div><div><dt>租客电话</dt><dd>{{ value(room.tenantPhone) }}</dd></div>
            <div><dt>租期</dt><dd>{{ period(room.leaseStart, room.leaseEnd) }}</dd></div><div><dt>付款方式</dt><dd>{{ dict.getLabel('payment_method', room.paymentMethod) }}</dd></div>
          </dl>
          <router-link v-if="!data.roomId" :to="{ path: `/house/rent/detail/${property.id}`, query: { roomId: room.id } }">查看该房间流程</router-link>
        </article>
      </section>
      <section class="card detail-section">
        <h3>房源流程信息</h3>
        <p class="muted">仅展示系统中已记录的流程。历史未关联房源的退租单不会自动归入；未记录的处理时间不作推测。</p>
        <h4>状态审批（{{ data.approvals.length }}）</h4>
        <el-empty v-if="!data.approvals.length" description="暂无状态审批记录" :image-size="56" />
        <article v-for="record in data.approvals" :key="record.id" class="flow-record">
          <div><strong>审批 #{{ record.id }}</strong> <span class="pill pill-blue">{{ status(record.result) }}</span></div>
          <p>{{ record.entityType === 'rental_room' ? `房间 ${property.rooms?.find((r: any) => r.id === record.entityId)?.roomNo || record.entityId}` : '房源' }}：{{ status(record.fromStatus) }} → {{ status(record.toStatus) }}</p>
          <p class="muted">申请时间：{{ date(record.createdAt) }} · 申请人编号：{{ record.operatorId }} · 审批人编号：{{ value(record.approverId) }}</p>
          <p v-if="record.remark">意见：{{ record.remark }}</p>
        </article>
        <template v-if="kind === 'rent'">
          <h4>退租与清算（{{ data.checkouts.length }}）</h4>
          <el-empty v-if="!data.checkouts.length" description="暂无关联退租记录" :image-size="56" />
          <article v-for="record in data.checkouts" :key="record.id" class="flow-record">
            <div><strong>{{ record.contractCode }}</strong> <span class="pill pill-blue">{{ status(record.status) }}</span></div>
            <p>{{ record.houseInfo }} · 租客：{{ value(record.tenantName) }}</p>
            <p>退租日期：{{ value(record.checkoutDate) }} · 清算金额：{{ money(record.settlementAmount) }}</p>
            <p>原因：{{ value(record.reason) }} · 备注：{{ value(record.remark) }}</p>
            <p class="muted">提交：{{ date(record.createdAt) }}<br>审批通过：{{ date(record.confirmedAt) }}<br>完成清算：{{ date(record.completedAt) }}</p>
          </article>
        </template>
        <h4>房源操作记录（{{ data.operations.length }}）</h4>
        <el-empty v-if="!data.operations.length" description="暂无操作日志" :image-size="56" />
        <article v-for="record in data.operations" :key="record.id" class="flow-record"><strong>{{ action(record.action) }}</strong> · {{ status(record.result) }}<p class="muted">{{ date(record.createdAt) }} · 操作人编号：{{ record.employeeId }}</p></article>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.property-detail { min-height: 300px; }
.property-banner, .detail-section, .error-state { padding: 22px; margin-bottom: 18px; }
h2 { font-size: 19px; margin: 0 0 10px; } h3 { font-size: 16px; margin: 0 0 18px; } h4 { font-size: 14px; margin: 18px 0 12px; }
p { margin: 8px 0; line-height: 1.7; overflow-wrap: anywhere; }
.muted, dt { color: var(--ink-500); font-size: 12px; }
.detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px 28px; margin: 0; }
dd { margin: 7px 0 0; font-size: 14px; color: var(--ink-800); overflow-wrap: anywhere; white-space: pre-wrap; }
.room-detail, .flow-record { border: 1px solid var(--ink-200); border-radius: 8px; padding: 16px; margin: 12px 0; }
.room-detail h4 { margin-top: 0; }.room-detail a { display: inline-block; margin-top: 16px; }
@media (max-width: 700px) { .detail-grid { grid-template-columns: 1fr; } .property-banner, .detail-section { padding: 16px; } .page-header { align-items: flex-start; flex-direction: column; gap: 12px; } }
</style>
