<script setup lang="ts">
import { computed } from 'vue';
import type { RentalSet, RentalRoom } from '@/api/rental';
import { useDictStore } from '@/stores/dict';
import { formatHouseAddress } from '@/utils/address';
import { formatMoney } from '@/utils/format';
import RentalFinancialTags from './RentalFinancialTags.vue';

const props = defineProps<{ items: RentalSet[]; deletingId?: number; checkoutSubmitting: Set<string>; storeName: (id?: number) => string }>();
const emit = defineEmits<{
  detail: [item: RentalSet, room?: RentalRoom]; edit: [item: RentalSet, room?: RentalRoom];
  sign: [item: RentalSet, room?: RentalRoom]; checkout: [item: RentalSet, room?: RentalRoom];
  delegation: [item: RentalSet]; appointment: [item: RentalSet]; remove: [item: RentalSet];
  bills: [item: RentalSet, room?: RentalRoom]; configure: [item: RentalSet];
}>();
const dict = useDictStore();
const address = (item: RentalSet) => formatHouseAddress({ community: item.communityName, building: item.building, unit: item.unit, roomNo: item.roomNo });
const label = (value?: string) => ({ rented: '已租', active: '空置', vacant: '空置', reserved: '已定', checkout: '退租待审批', maintenance: '维修中', dirty: '待保洁', repair: '维修中', pause: '已下架', configuring: '配置中' } as Record<string, string>)[value || ''] || value || '待确认';
const rented = (item: RentalSet) => item.bizType === 'shared' ? (item.rooms || []).filter(room => room.status === 'rented') : [];
const income = (item: RentalSet) => item.bizType === 'shared' ? rented(item).reduce((sum, room) => sum + Number(room.rentPrice || 0), 0) : item.status === 'rented' ? Number(item.rent || 0) : 0;
const deposits = (item: RentalSet) => item.bizType === 'shared' ? rented(item).reduce((sum, room) => sum + Number(room.depositAmount || 0), 0) : item.status === 'rented' ? Number(item.deposit || 0) : 0;
const canSign = (item: RentalSet, room?: RentalRoom) => ['active', 'vacant', 'reserved', 'rented'].includes(item.status) && (room ? ['vacant', 'reserved'].includes(room.status) : item.status !== 'rented');
const canCheckout = (item: RentalSet, room?: RentalRoom) => (room || item).status === 'rented' && !props.checkoutSubmitting.has(room ? `room:${room.id}` : `set:${item.id}`);
const canDelete = (item: RentalSet) => ['active', 'vacant', 'pause', 'maintenance'].includes(item.status) && !item.tenantName && !item.tenantPhone && (item.rooms || []).every(room => ['vacant', 'maintenance'].includes(room.status) && !room.tenantName && !room.tenantPhone);
const groups = computed(() => {
  const result: { key: string; title: string; items: RentalSet[]; shared: boolean }[] = [];
  for (const item of props.items) {
    if (item.bizType === 'shared') result.push({ key: `shared:${item.id}`, title: address(item), items: [item], shared: true });
    else {
      const key = `entire:${item.communityId}:${item.storeId}`;
      const group = result.find(group => group.key === key);
      if (group) group.items.push(item);
      else result.push({ key, title: item.communityName || item.address, items: [item], shared: false });
    }
  }
  return result;
});
</script>
<template>
  <div class="rental-card-list">
    <p v-if="items[0]?.financialSummary" class="finance-legend">{{ items[0].financialSummary.period }} · 待收/待付包含本月及往期未结账单；已收/已付按本月实际收付款。</p>
    <section v-for="group in groups" :key="group.key" class="card-group">
      <header class="group-heading">
        <h2>{{ group.title }} <small>【{{ storeName(group.items[0].storeId) }}】</small></h2>
        <div v-if="group.shared" class="group-totals"><span>租客月租 {{ formatMoney(income(group.items[0])) }}</span><span>租客押金 {{ formatMoney(deposits(group.items[0])) }}</span><span v-if="group.items[0].canViewLandlordInfo === true">月租差额 {{ formatMoney(income(group.items[0]) - Number(group.items[0].landlordRent || 0)) }}</span></div>
        <div v-else class="group-totals"><span>共 {{ group.items.length }} 套</span><span>已租 {{ group.items.filter(item => item.status === 'rented').length }} 套</span><span>空置 {{ group.items.filter(item => ['vacant', 'active'].includes(item.status)).length }} 套</span></div>
      </header>
      <div class="unit-grid">
        <template v-for="item in group.items" :key="item.id">
          <article v-if="group.shared" class="unit-card owner-card" :aria-label="`${item.code}房源卡片`">
            <header><span>房源<span v-if="item.canViewLandlordInfo === true"> · {{ item.landlordName || '房东未登记' }}</span></span><span v-if="item.canViewLandlordInfo === true">{{ formatMoney(item.landlordRent || 0) }}/月</span></header>
            <div class="unit-body"><button class="unit-title" @click="emit('detail', item)">{{ item.roomNo }} · {{ item.layout || '户型未登记' }}</button><p>{{ item.code }}</p><p v-if="item.canViewLandlordInfo === true">房东租期至 {{ item.leaseEnd || '未登记' }}</p><div class="unit-tags"><span>合租 {{ item.rooms?.length || 0 }} 间</span><span>{{ label(item.status) }}</span></div></div>
            <RentalFinancialTags class="card-finances" :summary="item.financialSummary" :vacant-count="item.vacantCount" :total-rooms="item.rooms?.length || 0" />
            <footer><button v-permission="['finance:arrears']" @click="emit('bills', item)">账单</button><button v-if="item.canViewLandlordInfo === true" v-permission="['renting:edit']" @click="emit('delegation', item)">委托</button><button v-permission="['renting:edit']" @click="emit('edit', item)">编辑</button><button v-permission="['renting:edit']" @click="emit('configure', item)">配置</button><button v-permission="['renting:delete']" class="danger" :disabled="!canDelete(item) || deletingId === item.id" @click="emit('remove', item)">删除</button></footer>
          </article>
          <template v-if="group.shared">
            <article v-for="room in item.rooms || []" :key="room.id" :class="['unit-card', room.status === 'rented' ? 'occupied' : 'available']" :aria-label="`${item.code}-${room.roomNo}房间卡片`">
              <header><span>{{ room.status === 'rented' ? room.tenantName || '租客未登记' : label(room.status) }}</span><span>{{ room.status === 'rented' ? '租金' : '定价' }} {{ formatMoney(room.status === 'rented' ? room.rentPrice || 0 : room.listedPrice || 0) }}</span></header>
              <div class="unit-body"><button class="unit-title" @click="emit('detail', item, room)">{{ /^\d+$/.test(room.roomNo) ? `${room.roomNo}号房` : room.roomNo }}</button><p>{{ room.roomType ? dict.getLabel('room_type', room.roomType) : '房型未登记' }}<span v-if="room.privateBathroom"> · 独卫</span></p><p>{{ room.status === 'rented' ? `租期至 ${room.leaseEnd || '未登记'}` : room.interiorArea ? `${room.interiorArea}㎡` : '面积未登记' }}</p><div class="unit-tags"><span>{{ label(room.status) }}</span><span v-if="room.paymentMethod">{{ dict.getLabel('payment_method', room.paymentMethod) }}</span><span v-if="room.arrearDays">欠 {{ room.arrearDays }} 天</span></div></div>
              <RentalFinancialTags class="card-finances" :summary="room.financialSummary" />
              <footer><button @click="emit('detail', item, room)">详情</button><button v-if="['vacant','reserved'].includes(room.status)" v-permission="['renting:appointment:sign']" :disabled="!canSign(item, room)" @click="emit('sign', item, room)">签约</button><button v-if="room.status === 'rented' || room.status === 'checkout'" v-permission="['renting:checkout']" :disabled="!canCheckout(item, room)" @click="emit('checkout', item, room)">退租</button><button v-permission="['renting:edit']" @click="emit('edit', item, room)">编辑</button><button v-permission="['finance:arrears']" @click="emit('bills', item, room)">账单</button></footer>
            </article>
          </template>
          <article v-else :class="['unit-card', item.status === 'rented' ? 'occupied' : 'available']" :aria-label="`${item.code}整租卡片`">
            <header><span>{{ item.status === 'rented' ? item.tenantName || '租客未登记' : label(item.status) }}</span><span>{{ item.status === 'rented' ? '租金' : '定价' }} {{ formatMoney(item.rent || 0) }}</span></header>
            <div class="unit-body"><button class="unit-title" @click="emit('detail', item)">{{ item.building }}栋{{ item.unit }}单元{{ item.roomNo }}</button><p>{{ item.layout || '户型未登记' }} · {{ item.buildingArea || '—' }}㎡</p><p>{{ item.status === 'rented' ? `租期至 ${item.tenantLeaseEnd || '未登记'}` : item.code }}</p><div class="unit-tags"><span>{{ label(item.status) }}</span><span v-if="item.tenantPaymentMethod">{{ dict.getLabel('payment_method', item.tenantPaymentMethod) }}</span></div></div>
            <RentalFinancialTags class="card-finances" :summary="item.financialSummary" />
            <footer><button @click="emit('detail', item)">详情</button><button v-permission="['renting:appointment:sign']" v-if="item.status !== 'rented' && item.status !== 'checkout'" :disabled="!canSign(item)" @click="emit('sign', item)">签约</button><button v-if="item.status === 'rented' || item.status === 'checkout'" v-permission="['renting:checkout']" :disabled="!canCheckout(item)" @click="emit('checkout', item)">退租</button><button v-permission="['renting:edit']" @click="emit('edit', item)">编辑</button><button v-permission="['renting:appointment:create']" @click="emit('appointment', item)">约看</button><button v-permission="['finance:arrears']" @click="emit('bills', item)">账单</button><button v-if="item.canViewLandlordInfo === true" v-permission="['renting:edit']" @click="emit('delegation', item)">房东</button></footer>
          </article>
        </template>
      </div>
    </section>
    <el-empty v-if="!items.length" description="没有找到符合条件的房源" />
  </div>
</template>
<style scoped>
.rental-card-list { display:grid; gap:20px; }
.finance-legend { margin:0; font-size:12px; color:var(--ink-500); line-height:1.7; }
.card-group { min-width:0; background:white; border:1px solid var(--ink-200); border-radius:10px; overflow:hidden; }
.group-heading { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; background:#f5f7fb; padding:12px 16px; }
.group-heading h2 { margin:0; font-size:13px; color:var(--ink-900); }.group-heading small { font-weight:normal; color:var(--ink-500); }
.group-totals { display:flex; flex-wrap:wrap; gap:12px; font-size:11px; color:var(--ink-500); }
.unit-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:14px; padding:16px; align-items:start; }
.unit-card { min-width:0; min-height:210px; border:1px solid #f49ab1; border-radius:8px; overflow:hidden; display:flex; flex-direction:column; }
.unit-card > header { display:flex; justify-content:space-between; gap:8px; background:#f68da7; color:white; padding:6px 9px; font-size:11px; flex-wrap:wrap; }.occupied { border-color:#7b9cf5; }.occupied > header { background:#7b9cf5; }.owner-card { border-color:#a8a0e9; }.owner-card > header { background:#a8a0e9; }
.unit-body { padding:10px; flex:1; }.unit-title { font-size:14px; font-weight:700; text-align:left; line-height:1.5; color:var(--ink-900); }.unit-title:hover { color:var(--primary); }.unit-body p { margin:4px 0; color:var(--ink-500); font-size:11px; overflow-wrap:anywhere; }
.unit-tags { display:flex; gap:5px; flex-wrap:wrap; margin-top:8px; }.unit-tags span { color:#597dcc; background:#f0f4ff; border:1px solid #d5dffa; padding:1px 4px; border-radius:3px; font-size:10px; }
.card-finances { margin:0 10px 6px; }
.unit-card > footer { display:flex; flex-wrap:wrap; gap:5px; justify-content:flex-end; padding:8px; }.unit-card > footer button { border:1px solid var(--ink-200); color:var(--primary); border-radius:4px; padding:3px 5px; font-size:11px; }.unit-card > footer button:hover { background:var(--primary-soft); }.unit-card > footer button:disabled { opacity:.4; cursor:not-allowed; }.unit-card > footer .danger { color:var(--danger); }
@media(max-width:560px) { .unit-grid { grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:10px; padding:10px; } }
</style>
