<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { RentalRoom } from '@/api/rental';
import { useDictStore } from '@/stores/dict';
import { buildLeasePeriod, buildPaymentSchedule } from '@/utils/rental-schedule';
import MoneyInput from './MoneyInput.vue';
type Room = Partial<RentalRoom> & { leaseDateRange?: [Date, Date] | null };
const props = defineProps<{ rooms: Room[]; facilityOptions: string[]; initialRoomId?: number }>();
const emit = defineEmits<{ add: [after?: number]; remove: [index: number] }>();
const dict = useDictStore(), activeRoom = ref<Room | null>(null), numbering = ref(false), sorting = ref(false);
const numberPrefix = ref(''), firstNumber = ref(1);
watch(() => [props.initialRoomId, props.rooms] as const, ([id, rooms]) => {
  if (id) activeRoom.value = rooms.find(room => room.id === id) || null;
}, { immediate: true });
const activeIndex = computed(() => activeRoom.value ? props.rooms.indexOf(activeRoom.value) : -1);
const roomTypes = computed(() => dict.getItems('room_type').length ? dict.getItems('room_type') : [
  { value: 'master', label: '主卧' }, { value: 'second', label: '次卧' }, { value: 'small', label: '小卧' },
]);
function numberRooms() {
  props.rooms.forEach((room, index) => { room.roomNo = `${numberPrefix.value}${firstNumber.value + index}`; });
  numbering.value = false;
}
function move(index: number, offset: number) {
  const next = index + offset;
  if (next < 0 || next >= props.rooms.length) return;
  const [room] = props.rooms.splice(index, 1); props.rooms.splice(next, 0, room);
}
function period(years: number) {
  if (!activeRoom.value) return;
  const range = buildLeasePeriod(activeRoom.value.leaseStart, years);
  if (range) Object.assign(activeRoom.value, { leaseStart: range.start, leaseEnd: range.end });
}
const payments = computed(() => activeRoom.value ? buildPaymentSchedule(activeRoom.value.leaseStart, activeRoom.value.leaseEnd, activeRoom.value.paymentMethod) : []);
</script>
<template>
  <div class="room-toolbar">
    <el-button type="primary" plain @click="emit('add')">＋ 添加房间</el-button>
    <el-button :disabled="!rooms.length" @click="numbering = true">房号设置</el-button>
    <el-button :disabled="rooms.length < 2" @click="sorting = true">房间排序</el-button>
  </div>
  <el-table :data="rooms" border size="small" class="shared-room-table" empty-text="请添加房间">
    <el-table-column label="房号" width="64"><template #default="{ row, $index }"><el-form-item :prop="`rooms.${$index}.roomNo`"><el-input v-model="row.roomNo" placeholder="房号" /></el-form-item></template></el-table-column>
    <el-table-column v-for="field in [{ key: 'privateBathroom', label: '独卫' }, { key: 'balcony', label: '阳台' }, { key: 'airConditioner', label: '空调' }]" :key="field.key" :label="field.label" width="64">
      <template #header><span v-if="field.key !== 'airConditioner'" class="required-marker">*</span>{{ field.label }}</template><template #default="{ row, $index }"><el-form-item :prop="`rooms.${$index}.${field.key}`">
      <el-select v-model="row[field.key]" placeholder="待确认"><el-option :value="true" label="有" /><el-option :value="false" label="无" /></el-select>
    </el-form-item></template></el-table-column>
    <el-table-column label="房型" width="88"><template #header><span class="required-marker">*</span>房型</template><template #default="{ row, $index }"><el-form-item :prop="`rooms.${$index}.roomType`"><el-select v-model="row.roomType" filterable allow-create default-first-option placeholder="请选择">
      <el-option v-for="item in roomTypes" :key="item.value" :value="item.value" :label="item.label" />
    </el-select></el-form-item></template></el-table-column>
    <el-table-column label="套内面积" width="88"><template #default="{ row, $index }"><el-form-item :prop="`rooms.${$index}.interiorArea`"><MoneyInput v-model="row.interiorArea" unit="㎡" /></el-form-item></template></el-table-column>
    <el-table-column label="朝向" width="112"><template #default="{ row }"><el-select v-model="row.orientation" clearable placeholder="请选择">
      <el-option v-for="item in dict.getItems('orientation')" :key="item.value" :value="item.value" :label="item.label" />
    </el-select></template></el-table-column>
    <el-table-column label="定价" width="108"><template #default="{ row, $index }"><el-form-item :prop="`rooms.${$index}.listedPrice`"><MoneyInput v-model="row.listedPrice" unit="元/月" /></el-form-item></template></el-table-column>
    <el-table-column label="房间配置" min-width="114"><template #default="{ row }"><div class="room-configuration"><span class="facility-summary" :title="row.facilities?.join('、')">{{ row.facilities?.join('、') || '未配置' }}</span><el-button link type="primary" @click="activeRoom = row">编辑</el-button></div></template></el-table-column>
    <el-table-column label="操作" width="74"><template #default="{ $index }"><div class="room-actions"><el-button link type="primary" :aria-label="`在第${$index + 1}间后添加`" @click="emit('add', $index)">＋</el-button><el-button link type="danger" :aria-label="`删除第${$index + 1}间`" @click="emit('remove', $index)">－</el-button></div></template></el-table-column>
  </el-table>
  <el-dialog :model-value="!!activeRoom" :title="`房间 ${activeRoom?.roomNo || ''} 配置与租赁资料`" width="min(760px,94vw)" append-to-body @update:model-value="(value: boolean) => { if (!value) activeRoom = null; }">
    <template v-if="activeRoom">
      <el-form-item label="房间配置"><el-checkbox-group v-model="activeRoom.facilities"><el-checkbox v-for="item in facilityOptions" :key="item" :value="item">{{ item }}</el-checkbox></el-checkbox-group></el-form-item>
      <el-row :gutter="14">
        <el-col :sm="12" :xs="24"><el-form-item label="房间状态"><el-select v-model="activeRoom.status"><el-option v-for="item in dict.getItems('room_status')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
        <el-col :sm="12" :xs="24"><el-form-item label="成交租金" :prop="`rooms.${activeIndex}.rentPrice`"><MoneyInput v-model="activeRoom.rentPrice" /></el-form-item></el-col>
        <el-col :sm="12" :xs="24"><el-form-item label="押金" :prop="`rooms.${activeIndex}.depositAmount`"><MoneyInput v-model="activeRoom.depositAmount" /></el-form-item></el-col>
        <el-col :sm="12" :xs="24"><el-form-item label="付款方式" :prop="`rooms.${activeIndex}.paymentMethod`"><el-select v-model="activeRoom.paymentMethod"><el-option v-for="item in dict.getItems('payment_method')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
        <el-col :sm="12" :xs="24"><el-form-item label="租客姓名" :prop="`rooms.${activeIndex}.tenantName`"><el-input v-model="activeRoom.tenantName" /></el-form-item></el-col>
        <el-col :sm="12" :xs="24"><el-form-item label="租客电话" :prop="`rooms.${activeIndex}.tenantPhone`"><el-input v-model="activeRoom.tenantPhone" /></el-form-item></el-col>
        <el-col :sm="12" :xs="24"><el-form-item label="租客身份证" :prop="`rooms.${activeIndex}.tenantIdCard`"><el-input v-model="activeRoom.tenantIdCard" maxlength="18" /></el-form-item></el-col>
        <el-col :sm="12" :xs="24"><el-form-item label="装修进度"><el-input v-model="activeRoom.renovationProgress" /></el-form-item></el-col>
      </el-row>
      <el-form-item label="租期" :prop="`rooms.${activeIndex}.leaseDateRange`"><div class="room-dates">
        <el-date-picker v-model="activeRoom.leaseStart" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" />至
        <el-date-picker v-model="activeRoom.leaseEnd" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" />
        <el-button v-for="years in [1, 3, 5]" :key="years" @click="period(years)">{{ years }}年</el-button>
      </div></el-form-item>
      <div v-if="payments.length" class="room-dates"><span v-for="row in payments" :key="row.period">第{{ row.period }}期：{{ row.date }}</span></div>
    </template>
    <template #footer><span class="hint">随房源一起保存</span><el-button type="primary" @click="activeRoom = null">完成</el-button></template>
  </el-dialog>
  <el-dialog v-model="numbering" title="房号设置" width="min(440px,94vw)" append-to-body>
    <p>按当前房间顺序统一编号。</p><el-form-item label="房号前缀"><el-input v-model="numberPrefix" maxlength="30" placeholder="如 A，可留空" /></el-form-item>
    <el-form-item label="起始编号"><el-input-number v-model="firstNumber" :min="1" :max="9999" :precision="0" /></el-form-item>
    <template #footer><el-button @click="numbering = false">取消</el-button><el-button type="primary" @click="numberRooms">应用房号</el-button></template>
  </el-dialog>
  <el-dialog v-model="sorting" title="房间排序" width="min(440px,94vw)" append-to-body>
    <div v-for="(room, index) in rooms" :key="room.id || room.roomNo" class="sort-room"><span>{{ room.roomNo }}</span><el-button :disabled="index === 0" @click="move(index, -1)">上移</el-button><el-button :disabled="index === rooms.length - 1" @click="move(index, 1)">下移</el-button></div>
    <template #footer><el-button type="primary" @click="sorting = false">完成排序</el-button></template>
  </el-dialog>
</template>
<style scoped>
.room-toolbar { display:flex; justify-content:flex-end; gap:8px; margin-bottom:16px; flex-wrap:wrap; }
.shared-room-table :deep(.el-form-item) { margin:0; }
.shared-room-table :deep(.el-form-item__error) { position:static; }
.shared-room-table :deep(th.el-table__cell) { background:#f0f5fd; color:#334155; font-weight:600; padding:12px 0; }
.shared-room-table :deep(td.el-table__cell) { padding:12px 0; }
.shared-room-table :deep(.cell) { padding:0 6px; }
.shared-room-table :deep(.el-input__wrapper), .shared-room-table :deep(.el-select__wrapper) { padding-left:6px; padding-right:6px; }
.shared-room-table :deep(.el-input-group__append) { padding:0 4px; font-size:11px; }
.required-marker { color:var(--el-color-danger); margin-right:3px; }
.facility-summary { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }
.room-actions { display:flex; justify-content:center; gap:6px; }
.room-actions :deep(.el-button + .el-button) { margin-left:0; }
.room-configuration { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.room-dates { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.sort-room { display:flex; align-items:center; gap:10px; margin:14px 0; }
.sort-room > span { flex:1; }
.hint { margin-right:16px; color:var(--ink-500); }
</style>
