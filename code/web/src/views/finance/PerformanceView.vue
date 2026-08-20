<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { getPerformances, createPerformance, type Performance } from '@/api/finance-report';

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
  await createPerformance(form);
  ElMessage.success('创建成功');
  dialogVisible.value = false;
  await load();
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
        <el-button type="primary" @click="openCreate">新增业绩</el-button>
        <el-button v-permission="['finance:export']">导出</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="员工姓名" clearable @keyup.enter="load" />
      <el-input v-model="query.period" placeholder="YYYY-MM" clearable @keyup.enter="load" />
      <el-button type="primary" @click="load">查询</el-button>
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
          <span class="profit">¥{{ row.totalPerformance.toLocaleString() }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="distributed" label="已分配" />
      <el-table-column prop="retained" label="留存业绩" />
      <el-table-column prop="transferred" label="转移留存" />
      <el-table-column prop="commission" label="提成" />
      <el-table-column label="操作" width="120">
        <template #default="{}">
          <el-button size="small" type="primary" plain>明细</el-button>
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
              <el-input-number v-model="form.newHouseCount" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="收客数">
              <el-input-number v-model="form.newCustomerCount" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="带看数">
              <el-input-number v-model="form.showingCount" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="成交数">
              <el-input-number v-model="form.dealCount" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="业绩金额">
              <el-input-number v-model="form.totalPerformance" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="提成">
              <el-input-number v-model="form.commission" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
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
.profit { color: var(--primary); font-weight: 700; }
</style>
