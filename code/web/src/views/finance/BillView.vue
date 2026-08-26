<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getBills, createBill, type Bill } from '@/api/finance';
import { useDictStore } from '@/stores/dict';
import { formatMoney } from '@/utils/format';

const dictStore = useDictStore();
const list = ref<Bill[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const form = reactive<Partial<Bill>>({
  title: '', category: '', amount: 0, paidAmount: 0, status: 'pending',
  tenantName: '', houseTitle: '', billDate: '', dueDate: '',
});
const query = reactive({ keyword: '', status: '' });

onMounted(async () => {
  await dictStore.ensureLoaded(['billing_category']);
  await load();
});

async function load() {
  loading.value = true;
  try {
    const res = await getBills(query);
    list.value = res.list;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, {
    title: '', category: '', amount: 0, paidAmount: 0, status: 'pending',
    tenantName: '', houseTitle: '', billDate: '', dueDate: '',
  });
  dialogVisible.value = true;
}

async function submit() {
  await createBill(form);
  ElMessage.success('创建成功');
  dialogVisible.value = false;
  await load();
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    pending: 'pill-orange',
    paid: 'pill-green',
    partial: 'pill-blue',
    cancelled: 'pill-gray',
  };
  return map[status] || 'pill-gray';
}

const statusLabelMap: Record<string, string> = {
  pending: '待收',
  paid: '已收',
  partial: '部分',
  cancelled: '作废',
};
</script>

<template>
  <div class="finance-view">
    <div class="page-header">
      <div>
        <div class="page-title">账单</div>
        <div class="page-desc">应收应付账单管理、收款核销、作废</div>
      </div>
      <div class="page-actions">
        <el-button v-permission="['finance:bill:modify']" type="primary" @click="openCreate">新增账单</el-button>
        <el-button v-permission="['finance:export']">导出</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="账单标题/房源/租客" clearable @keyup.enter="load" />
      <el-select v-model="query.status" placeholder="状态" clearable @change="load">
        <el-option label="待收款" value="pending" />
        <el-option label="已收款" value="paid" />
        <el-option label="部分收款" value="partial" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <el-table :data="list" v-loading="loading" class="card">
      <el-table-column prop="title" label="账单标题" min-width="160" />
      <el-table-column label="款项种类" width="120">
        <template #default="{ row }">
          {{ dictStore.getLabel('billing_category', row.category) }}
        </template>
      </el-table-column>
      <el-table-column prop="houseTitle" label="房源" min-width="140" />
      <el-table-column prop="tenantName" label="租客" width="100" />
      <el-table-column label="金额" width="120">
        <template #default="{ row }">
          <span class="price">{{ formatMoney(row.amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="dueDate" label="到期日" width="110" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <span :class="['pill', statusClass(row.status)]">{{ statusLabelMap[row.status] }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{}">
          <el-button v-permission="['finance:bill:modify']" size="small" type="primary" plain>编辑</el-button>
          <el-button v-permission="['finance:bill:cancel']" size="small">作废</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="新增账单" width="560px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="款项种类">
          <el-select v-model="form.category" style="width: 100%;">
            <el-option
              v-for="item in dictStore.getItems('billing_category')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="房源">
          <el-input v-model="form.houseTitle" />
        </el-form-item>
        <el-form-item label="租客">
          <el-input v-model="form.tenantName" />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="form.amount" :min="0" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="到期日">
          <el-date-picker v-model="form.dueDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
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
.price { color: var(--danger); font-weight: 700; }
</style>
