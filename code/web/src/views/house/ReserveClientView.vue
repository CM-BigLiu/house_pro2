<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getReserveClients, createReserveClient, updateReserveClient, type ReserveClient } from '@/api/reserve-client';
import { useDictStore } from '@/stores/dict';
import { formatMoney } from '@/utils/format';

const dictStore = useDictStore();
const list = ref<ReserveClient[]>([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive<Partial<ReserveClient>>({
  clientName: '', clientMobile: '', desiredLocation: '', demandType: 'rent',
  desiredLayout: '', areaMin: undefined, areaMax: undefined,
  priceMin: undefined, priceMax: undefined, sourceChannel: '',
  usage: '', urgency: 'normal', ownership: 'public', status: 'not_rented',
});
const query = reactive({ keyword: '', demandType: '', status: '', page: 1, pageSize: 20 });

onMounted(async () => {
  await dictStore.ensureLoaded(['customer_status', 'source_channel', 'demand_type', 'urgency', 'disk_type']);
  await load();
});

async function load() {
  loading.value = true;
  try {
    const res = await getReserveClients(query);
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  isEdit.value = false;
  Object.assign(form, {
    clientName: '', clientMobile: '', desiredLocation: '', demandType: 'rent',
    desiredLayout: '', areaMin: undefined, areaMax: undefined,
    priceMin: undefined, priceMax: undefined, sourceChannel: '',
    usage: '', urgency: 'normal', ownership: 'public', status: 'not_rented',
  });
  dialogVisible.value = true;
}

function openEdit(item: ReserveClient) {
  isEdit.value = true;
  Object.assign(form, { ...item });
  dialogVisible.value = true;
}

async function submit() {
  if (!form.clientName?.trim()) return ElMessage.warning('请填写姓名');
  if (isEdit.value) {
    await updateReserveClient(form.id!, form);
  } else {
    await createReserveClient(form);
  }
  ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
  dialogVisible.value = false;
  await load();
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    not_rented: 'pill-green',
    rented: 'pill-blue',
    pause: 'pill-gray',
    deposit: 'pill-orange',
  };
  return map[status] || 'pill-gray';
}
</script>

<template>
  <div class="house-view">
    <div class="page-header">
      <div>
        <div class="page-title">储备客源</div>
        <div class="page-desc">维护潜在租客/买家信息、意向、跟进状态</div>
      </div>
      <div class="page-actions">
        <el-button v-permission="['reserve:client:add']" type="primary" @click="openCreate">录入客源</el-button>
        <el-button v-permission="['reserve:client:export']">导出</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="姓名/电话/意向" clearable @keyup.enter="load" />
      <el-select v-model="query.demandType" placeholder="需求" clearable @change="load">
        <el-option v-for="item in dictStore.getItems('demand_type')" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="query.status" placeholder="状态" clearable @change="load">
        <el-option v-for="item in dictStore.getItems('customer_status')" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <div class="card-list">
      <div v-for="item in list" :key="item.id" class="house-card">
        <div class="card-header">
          <div class="card-title">{{ item.clientName }}</div>
          <span :class="['pill', statusClass(item.status)]">{{ dictStore.getLabel('customer_status', item.status) }}</span>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="info-label">电话</span>
            <span class="info-value">{{ item.clientMobile }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">预算范围</span>
            <span class="info-value price">{{ formatMoney(item.priceMin) }} - {{ formatMoney(item.priceMax) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">意向位置</span>
            <span class="info-value">{{ item.desiredLocation }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">需求类型</span>
            <span class="info-value">{{ dictStore.getLabel('demand_type', item.demandType) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">来源</span>
            <span class="info-value">{{ dictStore.getLabel('source_channel', item.sourceChannel) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">维护人</span>
            <span class="info-value">{{ item.salesmanName }}</span>
          </div>
        </div>
        <div class="card-footer">
          <el-button v-permission="['reserve:client:transfer']" size="small" type="primary" plain>转签约</el-button>
          <el-button size="small">跟进</el-button>
          <el-button size="small" type="primary" plain @click="openEdit(item)">编辑</el-button>
        </div>
      </div>
    </div>

    <div class="pagination-bar">
      <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" layout="total, prev, pager, next" @change="load" />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑储备客源' : '录入储备客源'" width="620px">
      <el-form :model="form" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名" required>
              <el-input v-model="form.clientName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电话">
              <el-input v-model="form.clientMobile" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="需求类型">
              <el-select v-model="form.demandType" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('demand_type')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="意向户型">
              <el-input v-model="form.desiredLayout" placeholder="如：两室一厅" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="面积最小">
              <el-input-number v-model="form.areaMin" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面积最大">
              <el-input-number v-model="form.areaMax" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="预算最小">
              <el-input-number v-model="form.priceMin" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预算最大">
              <el-input-number v-model="form.priceMax" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="来源">
              <el-select v-model="form.sourceChannel" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('source_channel')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公私盘">
              <el-select v-model="form.ownership" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('disk_type')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="意向位置">
          <el-input v-model="form.desiredLocation" placeholder="如：张江、联洋" />
        </el-form-item>
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
@media (max-width: 1200px) {
  .card-list { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .card-list { grid-template-columns: 1fr; }
}
</style>
