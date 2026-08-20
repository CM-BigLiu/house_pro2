<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-vue-next';
import { getProfits, getProfitSummary, createProfit, type Profit } from '@/api/finance-report';
import { ElMessage } from 'element-plus';

const list = ref<Profit[]>([]);
const summary = ref({ income: 0, cost: 0, profit: 0, margin: '0.00' });
const loading = ref(false);
const dialogVisible = ref(false);
const form = ref<Partial<Profit>>({ period: '', income: 0, cost: 0 });

const metrics = ref([
  { label: '本月利润', value: '¥0', trend: '+0%', icon: Wallet, color: 'var(--primary-soft)' },
  { label: '收入合计', value: '¥0', trend: '+0%', icon: TrendingUp, color: 'var(--success-soft)' },
  { label: '成本合计', value: '¥0', trend: '-0%', icon: TrendingDown, color: 'var(--danger-soft)' },
]);

onMounted(async () => {
  await load();
  summary.value = await getProfitSummary();
  updateMetrics();
});

async function load() {
  loading.value = true;
  try {
    const res = await getProfits();
    list.value = res.list || [];
  } finally {
    loading.value = false;
  }
}

function updateMetrics() {
  const format = (v: number) => `¥${v.toLocaleString('zh-CN')}`;
  metrics.value[0].value = format(summary.value.profit);
  metrics.value[1].value = format(summary.value.income);
  metrics.value[2].value = format(summary.value.cost);
}

function openCreate() {
  form.value = { period: '', income: 0, cost: 0 };
  dialogVisible.value = true;
}

async function submit() {
  await createProfit(form.value);
  ElMessage.success('创建成功');
  dialogVisible.value = false;
  await load();
  summary.value = await getProfitSummary();
  updateMetrics();
}
</script>

<template>
  <div class="finance-view">
    <div class="page-header">
      <div>
        <div class="page-title">公寓利润</div>
        <div class="page-desc">按月份/房源维度核算公寓经营利润</div>
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="openCreate">新增利润</el-button>
        <el-button v-permission="['finance:export']">导出</el-button>
      </div>
    </div>

    <div class="metric-row">
      <div v-for="(m, idx) in metrics" :key="idx" class="metric-card">
        <div class="metric-icon" :style="{ background: m.color }">
          <component :is="m.icon" :size="22" />
        </div>
        <div class="metric-body">
          <div class="metric-value">{{ m.value }}</div>
          <div class="metric-label">{{ m.label }}</div>
          <div class="metric-trend">{{ m.trend }}</div>
        </div>
      </div>
    </div>

    <el-table :data="list" v-loading="loading" class="card">
      <el-table-column prop="period" label="月份" />
      <el-table-column prop="income" label="收入">
        <template #default="{ row }">
          <span class="income">¥{{ row.income.toLocaleString() }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="cost" label="成本">
        <template #default="{ row }">
          <span class="expense">¥{{ row.cost.toLocaleString() }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="profit" label="利润">
        <template #default="{ row }">
          <span class="profit">¥{{ row.profit.toLocaleString() }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="margin" label="利润率%" />
    </el-table>

    <el-dialog v-model="dialogVisible" title="新增利润" width="520px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="月份">
          <el-input v-model="form.period" placeholder="YYYY-MM" />
        </el-form-item>
        <el-form-item label="收入">
          <el-input-number v-model="form.income" :min="0" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="成本">
          <el-input-number v-model="form.cost" :min="0" controls-position="right" style="width: 100%;" />
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
.metric-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.metric-card {
  background: #fff;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius);
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: var(--shadow-sm);
}
.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius);
  display: grid;
  place-items: center;
  color: var(--primary);
}
.metric-body { flex: 1; }
.metric-value {
  font-family: var(--font-num);
  font-size: 20px;
  font-weight: 700;
  color: var(--ink-900);
}
.metric-label {
  font-size: 12.5px;
  color: var(--ink-500);
  margin-top: 2px;
}
.metric-trend {
  font-size: 11px;
  color: var(--success);
  margin-top: 4px;
}
.income { color: var(--success); font-weight: 700; }
.expense { color: var(--danger); font-weight: 700; }
.profit { color: var(--primary); font-weight: 700; }
@media (max-width: 768px) {
  .metric-row { grid-template-columns: 1fr; }
}
</style>
