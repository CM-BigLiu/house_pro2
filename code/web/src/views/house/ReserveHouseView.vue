<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getReserveProperties, createReserveProperty, updateReserveProperty, type ReserveProperty } from '@/api/reserve-property';
import { useDictStore } from '@/stores/dict';
import { formatMoney } from '@/utils/format';

const dictStore = useDictStore();
const list = ref<ReserveProperty[]>([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive<Partial<ReserveProperty>>({
  title: '', communityName: '', ownerName: '', ownerPhone: '',
  expectedPrice: 0, status: 'not_rented', diskType: 'public', source: '',
});
const query = reactive({ keyword: '', status: '', page: 1, pageSize: 20 });

onMounted(async () => {
  await dictStore.ensureLoaded(['house_status', 'disk_type', 'source_channel']);
  await load();
});

async function load() {
  loading.value = true;
  try {
    const res = await getReserveProperties(query);
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  isEdit.value = false;
  Object.assign(form, {
    title: '', communityName: '', ownerName: '', ownerPhone: '',
    expectedPrice: 0, status: 'not_rented', diskType: 'public', source: '',
  });
  dialogVisible.value = true;
}

function openEdit(item: ReserveProperty) {
  isEdit.value = true;
  Object.assign(form, { ...item });
  dialogVisible.value = true;
}

async function submit() {
  if (!form.title?.trim()) return ElMessage.warning('请填写标题');
  if (isEdit.value) {
    await updateReserveProperty(form.id!, form);
  } else {
    await createReserveProperty(form);
  }
  ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
  dialogVisible.value = false;
  await load();
}

function diskClass(type: string) {
  return type === 'private' ? 'pill-purple' : 'pill-blue';
}
</script>

<template>
  <div class="house-view">
    <div class="page-header">
      <div>
        <div class="page-title">储备房源</div>
        <div class="page-desc">储备期房源信息、拿房签约前状态维护</div>
      </div>
      <div class="page-actions">
        <el-button v-permission="['reserve:house:add']" type="primary" @click="openCreate">录入房源</el-button>
        <el-button v-permission="['reserve:house:export']">导出</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="小区/业主/电话" clearable @keyup.enter="load" />
      <el-select v-model="query.status" placeholder="状态" clearable @change="load">
        <el-option v-for="item in dictStore.getItems('house_status')" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <div class="card-list">
      <div v-for="item in list" :key="item.id" class="house-card">
        <div class="card-header">
          <div class="card-title">{{ item.title }}</div>
          <div class="pills">
            <span :class="['pill', diskClass(item.diskType)]">{{ dictStore.getLabel('disk_type', item.diskType) }}</span>
            <span class="pill pill-gray">{{ dictStore.getLabel('house_status', item.status) }}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="info-label">小区</span>
            <span class="info-value">{{ item.communityName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">期望价</span>
            <span class="info-value price">{{ formatMoney(item.expectedPrice) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">业主</span>
            <span class="info-value">{{ item.ownerName }} {{ item.ownerPhone }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">来源</span>
            <span class="info-value">{{ dictStore.getLabel('source_channel', item.source) }}</span>
          </div>
        </div>
        <div class="card-footer">
          <el-button v-permission="['reserve:house:take']" size="small" type="primary" plain>拿房签约</el-button>
          <el-button v-permission="['reserve:house:transfer']" size="small">转业务员</el-button>
          <el-button size="small" type="primary" plain @click="openEdit(item)">编辑</el-button>
        </div>
      </div>
    </div>

    <div class="pagination-bar">
      <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" layout="total, prev, pager, next" @change="load" />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑储备房源' : '录入储备房源'" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="小区">
          <el-input v-model="form.communityName" />
        </el-form-item>
        <el-form-item label="业主">
          <el-input v-model="form.ownerName" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.ownerPhone" />
        </el-form-item>
        <el-form-item label="期望价">
          <el-input-number v-model="form.expectedPrice" :min="0" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="盘源">
          <el-select v-model="form.diskType" style="width: 100%;">
            <el-option v-for="item in dictStore.getItems('disk_type')" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="form.source" style="width: 100%;">
            <el-option v-for="item in dictStore.getItems('source_channel')" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}
.pills {
  display: flex;
  gap: 6px;
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
