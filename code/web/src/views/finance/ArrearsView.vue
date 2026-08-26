<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getArrears, createArrear, type Arrear } from '@/api/finance';
import { useDictStore } from '@/stores/dict';
import { formatMoney } from '@/utils/format';

const dictStore = useDictStore();
const list = ref<Arrear[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const form = reactive<Partial<Arrear>>({
  name: '', identity: 'tenant', phone: '', amount: 0, paidAmount: 0, status: 'unpaid',
});
const query = reactive({ keyword: '', status: '' });

onMounted(async () => {
  await dictStore.ensureLoaded(['identity']);
  await load();
});

async function load() {
  loading.value = true;
  try {
    const res = await getArrears(query);
    list.value = res.list;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, { name: '', identity: 'tenant', phone: '', amount: 0, paidAmount: 0, status: 'unpaid' });
  dialogVisible.value = true;
}

async function submit() {
  await createArrear(form);
  ElMessage.success('创建成功');
  dialogVisible.value = false;
  await load();
}

function statusClass(status: string) {
  return status === 'unpaid' ? 'pill-red' : 'pill-green';
}
</script>

<template>
  <div class="finance-view">
    <div class="page-header">
      <div>
        <div class="page-title">欠款统计</div>
        <div class="page-desc">租客、房东、供应商欠款及回款跟踪</div>
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="openCreate">登记欠款</el-button>
        <el-button v-permission="['finance:export']">导出</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="姓名/电话" clearable @keyup.enter="load" />
      <el-select v-model="query.status" placeholder="状态" clearable @change="load">
        <el-option label="未结清" value="unpaid" />
        <el-option label="已结清" value="paid" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <el-table :data="list" v-loading="loading" class="card">
      <el-table-column prop="name" label="姓名" />
      <el-table-column label="身份" width="100">
        <template #default="{ row }">
          {{ dictStore.getLabel('identity', row.identity) }}
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="电话" />
      <el-table-column prop="amount" label="欠款金额">
        <template #default="{ row }">
          <span class="expense">{{ formatMoney(row.amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="paidAmount" label="已还金额">
        <template #default="{ row }">
          <span class="income">{{ formatMoney(row.paidAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="remainAmount" label="剩余欠款">
        <template #default="{ row }">
          <span class="profit">{{ formatMoney(row.remainAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <span :class="['pill', statusClass(row.status)]">{{ row.status === 'unpaid' ? '未结清' : '已结清' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{}">
          <el-button size="small" type="primary" plain>收款</el-button>
          <el-button size="small">明细</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="登记欠款" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="姓名" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="身份">
          <el-select v-model="form.identity" style="width: 100%;">
            <el-option
              v-for="item in dictStore.getItems('identity')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="欠款金额">
          <el-input-number v-model="form.amount" :min="0" controls-position="right" style="width: 100%;" />
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
.finance-view { min-height: 100%; }
.income { color: var(--success); font-weight: 700; }
.expense { color: var(--danger); font-weight: 700; }
.profit { color: var(--primary); font-weight: 700; }
</style>
