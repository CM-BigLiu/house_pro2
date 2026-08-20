<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { getAccountings, createAccounting, type Accounting } from '@/api/finance-report';

const list = ref<Accounting[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const form = reactive<Partial<Accounting>>({
  period: '', revenue: 0, receivable: 0, payable: 0, actualIncome: 0, actualExpense: 0, remark: '',
});
const query = reactive({ period: '' });

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const res = await getAccountings(query);
    list.value = res.list || [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, { period: '', revenue: 0, receivable: 0, payable: 0, actualIncome: 0, actualExpense: 0, remark: '' });
  dialogVisible.value = true;
}

async function submit() {
  await createAccounting(form);
  ElMessage.success('创建成功');
  dialogVisible.value = false;
  await load();
}
</script>

<template>
  <div class="finance-view">
    <div class="page-header">
      <div>
        <div class="page-title">财务核算</div>
        <div class="page-desc">权责发生制下的收入成本匹配与差异分析</div>
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="openCreate">新增核算</el-button>
        <el-button v-permission="['finance:export']">导出</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.period" placeholder="YYYY-MM" clearable @keyup.enter="load" />
      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <el-table :data="list" v-loading="loading" class="card">
      <el-table-column prop="period" label="月份" />
      <el-table-column prop="revenue" label="营业收入">
        <template #default="{ row }"><span class="income">¥{{ row.revenue.toLocaleString() }}</span></template>
      </el-table-column>
      <el-table-column prop="receivable" label="应收账款">
        <template #default="{ row }"><span class="amount">¥{{ row.receivable.toLocaleString() }}</span></template>
      </el-table-column>
      <el-table-column prop="payable" label="应付账款">
        <template #default="{ row }"><span class="amount">¥{{ row.payable.toLocaleString() }}</span></template>
      </el-table-column>
      <el-table-column prop="actualIncome" label="实际收款">
        <template #default="{ row }"><span class="income">¥{{ row.actualIncome.toLocaleString() }}</span></template>
      </el-table-column>
      <el-table-column prop="actualExpense" label="实际付款">
        <template #default="{ row }"><span class="expense">¥{{ row.actualExpense.toLocaleString() }}</span></template>
      </el-table-column>
      <el-table-column prop="diff" label="差异">
        <template #default="{ row }">
          <span :class="row.diff >= 0 ? 'profit' : 'expense'">¥{{ row.diff.toLocaleString() }}</span>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="新增财务核算" width="600px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="月份">
          <el-input v-model="form.period" placeholder="YYYY-MM" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="营业收入">
              <el-input-number v-model="form.revenue" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="应收账款">
              <el-input-number v-model="form.receivable" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="应付账款">
              <el-input-number v-model="form.payable" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实际收款">
              <el-input-number v-model="form.actualIncome" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实际付款">
              <el-input-number v-model="form.actualExpense" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
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
.amount { color: var(--ink-700); }
.profit { color: var(--primary); font-weight: 700; }
</style>
