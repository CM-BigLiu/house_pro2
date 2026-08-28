<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createRentalSet, type RentalSet, type RentalRoom } from '@/api/rental';
import { getCommunities, type Community } from '@/api/community';
import { generateHouseCode } from '@/utils/code';
import { useDictStore } from '@/stores/dict';

const router = useRouter();
const dictStore = useDictStore();
const submitting = ref(false);

const communityOptions = ref<Community[]>([]);
const communitiesLoading = ref(false);

const form = reactive<Partial<RentalSet> & { rooms: Partial<RentalRoom>[] }>({
  code: generateHouseCode('ZJ'), bizType: 'entire', communityId: undefined, communityName: '', address: '', building: '', unit: '', roomNo: '',
  layout: '', buildingArea: 0, decoration: '', landlordRent: 0, leaseStart: '', leaseEnd: '', rentFreePeriod: '',
  rent: 0, deposit: 0, status: 'active', storeId: 1, salesmanId: undefined, housekeeperId: undefined,
  rooms: [],
});

onMounted(async () => {
  await dictStore.ensureLoaded(['house_status', 'room_status', 'decoration_level', 'payment_method', 'lease_term']);
  await loadCommunities();
});

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
  form.rooms.push({ roomNo: '', roomType: '', rentPrice: 0, listedPrice: 0, status: 'vacant', paymentMethod: '', leaseTerm: '', depositAmount: 0 });
}

function removeRoom(index: number) {
  form.rooms.splice(index, 1);
}

async function submit() {
  if (!form.code?.trim()) return ElMessage.warning('请填写房源编码');
  if (!form.communityId) return ElMessage.warning('请选择小区');
  submitting.value = true;
  try {
    await createRentalSet(form.bizType === 'entire' ? { ...form, rooms: [] } : form);
    ElMessage.success('创建成功');
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
        <div class="page-title">新增出租房源</div>
        <div class="page-desc">填写出租房源基本信息与房间明细</div>
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

        <template v-if="form.bizType === 'shared'">
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
  padding: 10px;
  margin-bottom: 10px;
}
</style>