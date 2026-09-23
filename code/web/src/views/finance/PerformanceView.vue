<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getPerformances, createPerformance, type Performance } from '@/api/finance-report';
import { downloadCsv } from '@/utils/csv';
import { formatMoney } from '@/utils/format';

const list = ref<Performance[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const form = reactive<Partial<Performance>>({
  employeeName: '', period: '', newHouseCount: 0, newCustomerCount: 0, showingCount: 0, dealCount: 0,
  totalPerformance: 0, distributed: 0, retained: 0, transferred: 0, commission: 0,
});
const query = reactive({ keyword: '', period: '' });

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const res = await getPerformances(query);
    list.value = res.list || [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, {
    employeeName: '', period: '', newHouseCount: 0, newCustomerCount: 0, showingCount: 0, dealCount: 0,
    totalPerformance: 0, distributed: 0, retained: 0, transferred: 0, commission: 0,
  });
  dialogVisible.value = true;
}

async function submit() {
  if (!form.employeeName?.trim()) return ElMessage.warning('请填写员工姓名');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(form.period || '')) return ElMessage.warning('请按 YYYY-MM 填写月份');
  if (Number(form.totalPerformance) <= 0) return ElMessage.warning('业绩金额必须大于 0');
  await createPerformance(form);
  ElMessage.success('创建成功');
  dialogVisible.value = false;
  await load();
}

function exportCurrent() {
  downloadCsv('业绩核算.csv', [
    ['员工', '月份', '收房数', '收客数', '带看数', '成交数', '业绩金额', '提成'],
    ...list.value.map(row => [row.employeeName, row.period, row.newHouseCount, row.newCustomerCount, row.showingCount, row.dealCount, row.totalPerformance, row.commission]),
  ]);
  ElMessage.success('已导出当前结果');
}

function showDetails(row: Performance) {
  ElMessageBox.alert(`业绩：${formatMoney(row.totalPerformance)}\n已分配：${formatMoney(row.distributed)}\n留存：${formatMoney(row.retained)}\n提成：${formatMoney(row.commission)}`, `${row.employeeName} · ${row.period}`);
}
</script>

<template>
  <div class="finance-view">
    <div class="page-header">
      <div>
        <div class="page-title">业绩核算</div>
        <div class="page-desc">按员工业绩指标统计提成与排名</div>
      </div>
      <div class="page-actions">
        <button v-permission="['finance:bill:modify']" class="btn btn-primary" @click="openCreate">新增业绩</button>
        <button v-permission="['finance:export']" class="btn btn-default" @click="exportCurrent">导出</button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="员工姓名" clearable @keyup.enter="load" />
      <el-input v-model="query.period" placeholder="YYYY-MM" clearable @keyup.enter="load" />
      <button type="button" class="btn btn-primary" @click="load">查询</button>
    </div>

    <el-table :data="list" v-loading="loading" class="card">
      <el-table-column prop="employeeName" label="员工" />
      <el-table-column prop="period" label="月份" />
      <el-table-column prop="newHouseCount" label="收房数" />
      <el-table-column prop="newCustomerCount" label="收客数" />
      <el-table-column prop="showingCount" label="带看数" />
      <el-table-column prop="dealCount" label="成交数" />
      <el-table-column prop="totalPerformance" label="业绩金额">
        <template #default="{ row }">
          <span class="profit">{{ formatMoney(row.totalPerformance) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="distributed" label="已分配" />
      <el-table-column prop="retained" label="留存业绩" />
      <el-table-column prop="transferred" label="转移留存" />
      <el-table-column prop="commission" label="提成" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <button type="button" class="btn btn-ghost btn-sm" @click="showDetails(row)">明细</button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="新增业绩" width="620px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="员工">
          <el-input v-model="form.employeeName" />
        </el-form-item>
        <el-form-item label="月份">
          <el-input v-model="form.period" placeholder="YYYY-MM" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="收房数">
              <PlainNumberInput v-model="form.newHouseCount" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="收客数">
              <PlainNumberInput v-model="form.newCustomerCount" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="带看数">
              <PlainNumberInput v-model="form.showingCount" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="成交数">
              <PlainNumberInput v-model="form.dealCount" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="业绩金额">
              <PlainNumberInput v-model="form.totalPerformance" :min="0" style="width: 100%;" /><MoneyUppercase :value="form.totalPerformance" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="提成">
              <PlainNumberInput v-model="form.commission" :min="0" style="width: 100%;" /><MoneyUppercase :value="form.commission" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <button class="btn btn-default" @click="dialogVisible = false">取消</button>
        <button class="btn btn-primary" @click="submit">确定</button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.finance-view { min-height: 100%; }
.profit { color: var(--primary); font-weight: 700; }
</style>
