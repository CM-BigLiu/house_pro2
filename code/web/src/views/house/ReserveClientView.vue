<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { addReserveClientFollowUp, convertReserveClient, getReserveClients, type ReserveClient } from '@/api/reserve-client';
import { useDictStore } from '@/stores/dict';
import { formatMoney } from '@/utils/format';
import { downloadCsv } from '@/utils/csv';

const router = useRouter();
const dictStore = useDictStore();
const list = ref<ReserveClient[]>([]);
const total = ref(0);
const loading = ref(false);
const query = reactive({ keyword: '', demandType: '', status: '', page: 1, pageSize: 20 });
const selected = ref<ReserveClient | null>(null);
const followVisible = ref(false);
const convertVisible = ref(false);
const actionLoading = ref(false);
const followForm = reactive({ followType: 'phone', content: '', status: 'completed' });
const convertForm = reactive({ contractCode: '', contractEndDate: '' });

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

function openEdit(item: ReserveClient) {
  router.push(`/house/reserve-client/edit/${item.id}`);
}

function openFollow(item: ReserveClient) {
  selected.value = item;
  Object.assign(followForm, { followType: 'phone', content: '', status: 'completed' });
  followVisible.value = true;
}

async function submitFollow() {
  if (!selected.value || !followForm.content.trim()) return ElMessage.warning('请填写跟进内容');
  actionLoading.value = true;
  try {
    await addReserveClientFollowUp(selected.value.id, followForm);
    ElMessage.success('跟进记录已保存');
    followVisible.value = false;
    await load();
  } finally { actionLoading.value = false; }
}

function openConvert(item: ReserveClient) {
  selected.value = item;
  Object.assign(convertForm, { contractCode: '', contractEndDate: '' });
  convertVisible.value = true;
}

async function submitConvert() {
  if (!selected.value || !convertForm.contractCode.trim()) return ElMessage.warning('请填写已签合同编号');
  actionLoading.value = true;
  try {
    await convertReserveClient(selected.value.id, convertForm);
    ElMessage.success('客源已转为正式客户');
    convertVisible.value = false;
    await load();
  } finally { actionLoading.value = false; }
}

function exportCurrent() {
  downloadCsv(`储备客源-${new Date().toISOString().slice(0, 10)}.csv`, [
    ['姓名', '电话', '需求类型', '意向位置', '预算下限', '预算上限', '维护人', '状态'],
    ...list.value.map((item) => [item.clientName, item.clientMobile, item.demandType, item.desiredLocation, item.priceMin, item.priceMax, item.salesmanName, item.status]),
  ]);
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    not_rented: 'pill-green',
    rented: 'pill-blue',
    pause: 'pill-gray',
    deposit: 'pill-orange',
    sold: 'pill-green',
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
        <button v-permission="['reserve:client:add']" class="btn btn-primary" @click="router.push('/house/reserve-client/create')">录入客源</button>
        <button v-permission="['reserve:client:export']" class="btn btn-default" @click="exportCurrent">导出</button>
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
          <el-button v-permission="['reserve:client:transfer']" size="small" type="primary" plain :disabled="!['not_rented', 'deposit'].includes(item.status)" @click="openConvert(item)">转签约</el-button>
          <el-button v-permission="['reserve:client:add']" size="small" @click="openFollow(item)">跟进</el-button>
          <el-button v-permission="['reserve:client:add']" size="small" type="primary" plain @click="openEdit(item)">编辑</el-button>
        </div>
      </div>
    </div>

    <div class="pagination-bar">
      <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" layout="total, prev, pager, next" @change="load" />
    </div>

    <el-dialog v-model="followVisible" title="新增跟进" width="500px">
      <el-form :model="followForm" label-width="80px">
        <el-form-item label="跟进方式"><el-select v-model="followForm.followType" style="width: 100%;"><el-option label="电话" value="phone" /><el-option label="微信" value="wechat" /><el-option label="到访" value="visit" /><el-option label="带看" value="viewing" /><el-option label="其他" value="other" /></el-select></el-form-item>
        <el-form-item label="跟进内容" required><el-input v-model="followForm.content" type="textarea" :rows="4" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="followVisible = false">取消</el-button><el-button type="primary" :loading="actionLoading" @click="submitFollow">保存跟进</el-button></template>
    </el-dialog>

    <el-dialog v-model="convertVisible" title="转签约" width="500px">
      <el-alert title="确认已完成线下签约后，系统将创建正式客户并关闭该储备客源。" type="warning" :closable="false" style="margin-bottom: 16px;" />
      <el-form :model="convertForm" label-width="100px">
        <el-form-item label="合同编号" required><el-input v-model="convertForm.contractCode" /></el-form-item>
        <el-form-item label="合同到期日"><el-date-picker v-model="convertForm.contractEndDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="convertVisible = false">取消</el-button><el-button type="primary" :loading="actionLoading" @click="submitConvert">确认转签约</el-button></template>
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
