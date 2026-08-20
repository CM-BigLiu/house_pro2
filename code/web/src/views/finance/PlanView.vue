<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { getPaymentPlans, createPaymentPlan, type PaymentPlan } from '@/api/finance';

const list = ref<PaymentPlan[]>([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const form = reactive<Partial<PaymentPlan>>({
  planType: 'income', billingCategory: '', reason: '', totalPeriods: 1, totalAmount: 0,
});
const query = reactive({ planType: '', status: '', page: 1, pageSize: 20 });

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const res = await getPaymentPlans(query);
    list.value = res.list || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, { planType: 'income', billingCategory: '', reason: '', totalPeriods: 1, totalAmount: 0 });
  dialogVisible.value = true;
}

async function submit() {
  await createPaymentPlan(form);
  ElMessage.success('创建成功');
  dialogVisible.value = false;
  await load();
}

function typeClass(type: string) {
  return type === 'income' ? 'pill-green' : 'pill-orange';
}
</script>

<template>
  <div class="finance-view">
    <div class="page-header">
      <div>
        <div class="page-title">收支计划</div>
        <div class="page-desc">管理应收应支计划、分期与审批状态</div>
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="openCreate">新增计划</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-select v-model="query.planType" placeholder="类型" clearable @change="load">
        <el-option label="应收" value="income" />
        <el-option label="应支" value="expense" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <el-table :data="list" v-loading="loading" class="card">
      <el-table-column label="类型">
        <template #default="{ row }">
          <span :class="['pill', typeClass(row.planType)]">{{ row.planType === 'income' ? '应收' : '应支' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="billingCategory" label="款项种类" />
      <el-table-column prop="reason" label="原因" show-overflow-tooltip />
      <el-table-column prop="totalPeriods" label="总期数" />
      <el-table-column prop="totalAmount" label="总金额">
        <template #default="{ row }">¥{{ row.totalAmount.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="auditStatus" label="审批状态" />
      <el-table-column label="操作" width="120">
        <template #default="{}">
          <el-button size="small" type="primary" plain>编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar">
      <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" layout="total, prev, pager, next" @change="load" />
    </div>

    <el-dialog v-model="dialogVisible" title="新增收支计划" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="类型">
          <el-radio-group v-model="form.planType">
            <el-radio label="income">应收</el-radio>
            <el-radio label="expense">应支</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="款项种类">
          <el-input v-model="form.billingCategory" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="form.reason" />
        </el-form-item>
        <el-form-item label="总期数">
          <el-input-number v-model="form.totalPeriods" :min="1" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="总金额">
          <el-input-number v-model="form.totalAmount" :min="0" :precision="2" controls-position="right" style="width: 100%;" />
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
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
