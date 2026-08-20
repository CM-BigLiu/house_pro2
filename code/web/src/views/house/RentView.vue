<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getRentalSets, createRentalSet, type RentalSet, type RentalRoom } from '@/api/rental';
import { useDictStore } from '@/stores/dict';
import { formatMoney } from '@/utils/format';

const dictStore = useDictStore();
const list = ref<RentalSet[]>([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const form = reactive<Partial<RentalSet> & { rooms: Partial<RentalRoom>[] }>({
  code: '', bizType: 'entire', communityName: '', address: '', building: '', unit: '', roomNo: '',
  layout: '', buildingArea: 0, decoration: '', landlordRent: 0, leaseStart: '', leaseEnd: '', rentFreePeriod: '',
  rent: 0, deposit: 0, status: 'active', storeId: 1, salesmanId: undefined, housekeeperId: undefined,
  rooms: [],
});
const query = reactive({ keyword: '', status: '', bizType: '', page: 1, pageSize: 20 });

onMounted(async () => {
  await dictStore.ensureLoaded(['house_status', 'room_status', 'decoration_level', 'payment_method', 'lease_term']);
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

function openCreate() {
  Object.assign(form, {
    code: '', bizType: 'entire', communityName: '', address: '', building: '', unit: '', roomNo: '',
    layout: '', buildingArea: 0, decoration: '', landlordRent: 0, leaseStart: '', leaseEnd: '', rentFreePeriod: '',
    rent: 0, deposit: 0, status: 'active', storeId: 1, salesmanId: undefined, housekeeperId: undefined,
    rooms: [{ roomNo: '', roomType: '', rentPrice: 0, listedPrice: 0, status: 'vacant', paymentMethod: '', leaseTerm: '', depositAmount: 0 }],
  });
  dialogVisible.value = true;
}

function addRoom() {
  form.rooms.push({ roomNo: '', roomType: '', rentPrice: 0, listedPrice: 0, status: 'vacant', paymentMethod: '', leaseTerm: '', depositAmount: 0 });
}

function removeRoom(index: number) {
  form.rooms.splice(index, 1);
}

async function submit() {
  if (!form.code?.trim()) return ElMessage.warning('请填写房源编码');
  await createRentalSet(form);
  ElMessage.success('创建成功');
  dialogVisible.value = false;
  await load();
}

function checkout(item: RentalSet) {
  ElMessageBox.confirm(`确认对「${item.address || item.communityName}」进行退房登记？`, '退房登记')
    .then(() => ElMessage.success('已提交退房流程'));
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    active: 'pill-green',
    rented: 'pill-blue',
    reserved: 'pill-orange',
    checkout: 'pill-gray',
    pause: 'pill-gray',
  };
  return map[status] || 'pill-gray';
}
</script>

<template>
  <div class="house-view">
    <div class="page-header">
      <div>
        <div class="page-title">租房管理</div>
        <div class="page-desc">管理租房套与房间状态、租金、押金信息</div>
      </div>
      <div class="page-actions">
        <el-button v-permission="['renting:add']" type="primary" @click="openCreate">新建房间</el-button>
        <el-button v-permission="['renting:export']">导出</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="小区/楼栋/房号" clearable @keyup.enter="load" />
      <el-select v-model="query.status" placeholder="状态" clearable @change="load">
        <el-option v-for="item in dictStore.getItems('house_status')" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="query.bizType" placeholder="租赁方式" clearable @change="load">
        <el-option label="整租" value="entire" />
        <el-option label="合租" value="shared" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <div class="card-list">
      <div v-for="item in list" :key="item.id" class="house-card">
        <div class="card-header">
          <div class="card-title">{{ item.address || item.communityName }}</div>
          <span :class="['pill', statusClass(item.status)]">{{ dictStore.getLabel('house_status', item.status) }}</span>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="info-label">位置</span>
            <span class="info-value">{{ item.communityName }} {{ item.building }}栋{{ item.unit }}单元{{ item.roomNo }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">月租</span>
            <span class="info-value price">{{ formatMoney(item.rent) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">押金</span>
            <span class="info-value">{{ formatMoney(item.deposit) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">房间</span>
            <span class="info-value">{{ item.roomCount }} 间 / 空 {{ item.vacantCount }} 间</span>
          </div>
        </div>
        <div class="card-footer">
          <el-button v-permission="['renting:edit']" size="small" type="primary" plain>编辑</el-button>
          <el-button v-permission="['renting:checkout']" size="small" @click="checkout(item)">退房</el-button>
        </div>
      </div>
    </div>

    <div class="pagination-bar">
      <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" layout="total, prev, pager, next" @change="load" />
    </div>

    <el-dialog v-model="dialogVisible" title="新建租房套" width="720px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="房源编码" required>
              <el-input v-model="form.code" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="租赁方式">
              <el-radio-group v-model="form.bizType">
                <el-radio label="entire">整租</el-radio>
                <el-radio label="shared">合租</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="小区">
              <el-input v-model="form.communityName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地址">
              <el-input v-model="form.address" />
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
              <el-input-number v-model="form.buildingArea" :min="0" :precision="2" controls-position="right" style="width: 100%;" />
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
                <el-option v-for="item in dictStore.getItems('decoration_level')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="承租价">
              <el-input-number v-model="form.landlordRent" :min="0" :precision="2" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="租期">
              <el-date-picker v-model="form.leaseStart" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title">房间明细</div>
        <div v-for="(room, index) in form.rooms" :key="index" class="room-row">
          <el-row :gutter="8">
            <el-col :span="4">
              <el-input v-model="room.roomNo" placeholder="房号" />
            </el-col>
            <el-col :span="4">
              <el-input v-model="room.roomType" placeholder="房型" />
            </el-col>
            <el-col :span="4">
              <el-input-number v-model="room.rentPrice" :min="0" :precision="2" controls-position="right" style="width: 100%;" />
            </el-col>
            <el-col :span="4">
              <el-input-number v-model="room.depositAmount" :min="0" :precision="2" controls-position="right" style="width: 100%;" />
            </el-col>
            <el-col :span="4">
              <el-select v-model="room.paymentMethod" placeholder="付款方式" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('payment_method')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select v-model="room.leaseTerm" placeholder="租期" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('lease_term')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-col>
            <el-col :span="24" style="margin-top: 6px;">
              <el-button size="small" type="danger" plain @click="removeRoom(index)">删除房间</el-button>
            </el-col>
          </el-row>
        </div>
        <el-button size="small" type="primary" plain @click="addRoom">+ 添加房间</el-button>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.house-view { min-height: 100%; }
.card-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.house-card {
  background: #fff;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease;
  &:hover { box-shadow: var(--shadow-md); }
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.card-title {
  font-weight: 700;
  color: var(--ink-900);
  font-size: 14px;
}
.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.info-label { color: var(--ink-500); }
.info-value {
  color: var(--ink-700);
  &.price { color: var(--danger); font-weight: 700; }
}
.card-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
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
@media (max-width: 1200px) {
  .card-list { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .card-list { grid-template-columns: 1fr; }
}
</style>
