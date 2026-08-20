<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { getIncomeCosts, createIncomeCost, type IncomeCost } from '@/api/finance-report';

const list = ref<IncomeCost[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const form = reactive<Partial<IncomeCost>>({
  period: '', rentIncome: 0, depositIncome: 0, energyIncome: 0, otherIncome: 0,
  rentCost: 0, energyCost: 0, decorateCost: 0, laborCost: 0, otherCost: 0,
});
const query = reactive({ period: '' });

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const res = await getIncomeCosts(query);
    list.value = res.list || [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, {
    period: '', rentIncome: 0, depositIncome: 0, energyIncome: 0, otherIncome: 0,
    rentCost: 0, energyCost: 0, decorateCost: 0, laborCost: 0, otherCost: 0,
  });
  dialogVisible.value = true;
}

async function submit() {
  await createIncomeCost(form);
  ElMessage.success('创建成功');
  dialogVisible.value = false;
  await load();
}
</script>

<template>
  <div class="finance-view">
    <div class="page-header">
      <div>
        <div class="page-title">收入成本</div>
        <div class="page-desc">按收支科目归集收入与成本明细</div>
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="openCreate">新增</el-button>
        <el-button v-permission="['finance:export']">导出</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.period" placeholder="YYYY-MM" clearable @keyup.enter="load" />
      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <el-table :data="list" v-loading="loading" class="card" style="width: 100%">
      <el-table-column prop="period" label="月份" width="110" fixed />
      <el-table-column label="收入" align="center">
        <el-table-column prop="rentIncome" label="租金收入">
          <template #default="{ row }"><span class="income">¥{{ row.rentIncome.toLocaleString() }}</span></template>
        </el-table-column>
        <el-table-column prop="depositIncome" label="押金收入">
          <template #default="{ row }"><span class="income">¥{{ row.depositIncome.toLocaleString() }}</span></template>
        </el-table-column>
        <el-table-column prop="energyIncome" label="能源收入">
          <template #default="{ row }"><span class="income">¥{{ row.energyIncome.toLocaleString() }}</span></template>
        </el-table-column>
        <el-table-column prop="otherIncome" label="其他收入">
          <template #default="{ row }"><span class="income">¥{{ row.otherIncome.toLocaleString() }}</span></template>
        </el-table-column>
      </el-table-column>
      <el-table-column label="成本" align="center">
        <el-table-column prop="rentCost" label="拿房成本">
          <template #default="{ row }"><span class="expense">¥{{ row.rentCost.toLocaleString() }}</span></template>
        </el-table-column>
        <el-table-column prop="energyCost" label="能源成本">
          <template #default="{ row }"><span class="expense">¥{{ row.energyCost.toLocaleString() }}</span></template>
        </el-table-column>
        <el-table-column prop="decorateCost" label="装修成本">
          <template #default="{ row }"><span class="expense">¥{{ row.decorateCost.toLocaleString() }}</span></template>
        </el-table-column>
        <el-table-column prop="laborCost" label="人工成本">
          <template #default="{ row }"><span class="expense">¥{{ row.laborCost.toLocaleString() }}</span></template>
        </el-table-column>
        <el-table-column prop="otherCost" label="其他成本">
          <template #default="{ row }"><span class="expense">¥{{ row.otherCost.toLocaleString() }}</span></template>
        </el-table-column>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="新增收入成本" width="600px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="月份">
          <el-input v-model="form.period" placeholder="YYYY-MM" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="租金收入">
              <el-input-number v-model="form.rentIncome" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="押金收入">
              <el-input-number v-model="form.depositIncome" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="能源收入">
              <el-input-number v-model="form.energyIncome" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="其他收入">
              <el-input-number v-model="form.otherIncome" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="拿房成本">
              <el-input-number v-model="form.rentCost" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="能源成本">
              <el-input-number v-model="form.energyCost" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="装修成本">
              <el-input-number v-model="form.decorateCost" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="人工成本">
              <el-input-number v-model="form.laborCost" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="其他成本">
              <el-input-number v-model="form.otherCost" :min="0" controls-position="right" style="width: 100%;" />
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
.income { color: var(--success); font-weight: 700; }
.expense { color: var(--danger); font-weight: 700; }
</style>
