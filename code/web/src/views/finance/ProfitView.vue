<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getProfits, getProfitSummary, createProfit, type Profit } from '@/api/finance-report';
import { formatMoney } from '@/utils/format';

const list = ref<Profit[]>([]);
const summary = ref({ income: 0, cost: 0, profit: 0, margin: '0.00' });
const loading = ref(false);
const dialogVisible = ref(false);
const form = ref<Partial<Profit>>({ period: '', income: 0, cost: 0 });
const query = ref({ year: new Date().getFullYear().toString(), month: '', store: '' });

const storeOptions = [{ label: '全部', value: '' }, { label: '张江店', value: 'store_1' }, { label: '浦东店', value: 'store_2' }, { label: '联洋店', value: 'store_3' }];

// KPI 卡片数据
const kpiCards = ref([
  { label: '总收入', value: '¥0', color: 'blue' },
  { label: '总支出', value: '¥0', color: 'red' },
  { label: '净利润', value: '¥0', color: 'green' },
  { label: '利润率', value: '0%', color: 'purple' },
]);

onMounted(async () => {
  await load();
  summary.value = await getProfitSummary();
  updateKpis();
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

function updateKpis() {
  const fmt = (v: number) => `¥${v.toLocaleString('zh-CN')}`;
  kpiCards.value[0].value = fmt(summary.value.income);
  kpiCards.value[1].value = fmt(summary.value.cost);
  kpiCards.value[2].value = fmt(summary.value.profit);
  kpiCards.value[3].value = `${summary.value.margin}%`;
}

function onSearch() {
  load();
}

function onReset() {
  query.value = { year: new Date().getFullYear().toString(), month: '', store: '' };
  load();
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
  updateKpis();
}

function growthClass(val: number) {
  if (val > 0) return 'num-pos';
  if (val < 0) return 'num-neg';
  return '';
}
</script>

<template>
  <div class="finance-view">
    <div class="page-header">
      <div>
        <div class="page-title">利润分析</div>
        <div class="page-desc">按月份/房源维度核算公寓经营利润</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" @click="openCreate"><i data-lucide="plus"></i> 新增利润</button>
        <button v-permission="['finance:export']" class="btn btn-default"><i data-lucide="download"></i> 导出报表</button>
        <button class="btn btn-default"><i data-lucide="circle-help"></i> 使用帮助</button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">年份</span>
        <select v-model="query.year" class="select" @change="onSearch">
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">月份</span>
        <select v-model="query.month" class="select" @change="onSearch">
          <option value="">全部</option>
          <option v-for="m in 12" :key="m" :value="String(m).padStart(2, '0')">{{ m }}月</option>
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">门店</span>
        <select v-model="query.store" class="select" @change="onSearch">
          <option v-for="opt in storeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <div class="filter-group filter-actions">
        <button class="btn btn-primary btn-sm" @click="onSearch"><i data-lucide="search"></i> 查询</button>
        <button class="btn btn-default btn-sm" @click="onReset"><i data-lucide="rotate-ccw"></i> 重置</button>
      </div>
    </div>

    <!-- KPI 汇总卡片 -->
    <div class="kpi-grid" style="margin-bottom: 16px;">
      <div
        v-for="(card, idx) in kpiCards"
        :key="idx"
        :class="['kpi-card', card.color]"
      >
        <div class="kpi-label">{{ card.label }}</div>
        <div class="kpi-value">{{ card.value }}</div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>月份</th>
              <th>收入</th>
              <th>支出</th>
              <th>利润</th>
              <th>利润率</th>
              <th>环比增长</th>
            </tr>
          </thead>
          <tbody v-if="list.length > 0">
            <tr v-for="(row, index) in list" :key="row.id || index">
              <td>
                <div class="cell-main">{{ row.period || '-' }}</div>
              </td>
              <td class="mono num-pos">{{ formatMoney(row.income) }}</td>
              <td class="mono num-neg">{{ formatMoney(row.cost) }}</td>
              <td class="mono" :class="row.profit >= 0 ? 'num-pos' : 'num-neg'">{{ formatMoney(row.profit) }}</td>
              <td><span class="mono">{{ row.margin || '0.00' }}%</span></td>
              <td class="mono" :class="growthClass(row.growth || 0)">
                {{ row.growth ? (row.growth > 0 ? '+' : '') + row.growth + '%' : '-' }}
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td :colspan="6" style="text-align: center; padding: 48px 0; color: var(--ink-400);">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 新增对话框 -->
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
        <button class="btn btn-default" @click="dialogVisible = false">取消</button>
        <button class="btn btn-primary" @click="submit">确定</button>
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