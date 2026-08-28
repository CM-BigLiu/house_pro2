<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { getAccountings, createAccounting, type Accounting } from '@/api/finance-report';
import { formatMoney } from '@/utils/format';

const list = ref<Accounting[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const form = reactive<Partial<Accounting>>({
  period: '', revenue: 0, receivable: 0, payable: 0, actualIncome: 0, actualExpense: 0, remark: '',
});
const query = reactive({ reportType: '', dateStart: '', dateEnd: '' });

const reportTypeOptions = [
  { label: '全部', value: '' },
  { label: '收支报表', value: 'income_expense' },
  { label: '利润报表', value: 'profit' },
  { label: '应收报表', value: 'receivable' },
];

// KPI 指标
const summaryMetrics = computed(() => {
  const items = list.value;
  const totalRevenue = items.reduce((s, i) => s + Number(i.revenue || 0), 0);
  const totalReceivable = items.reduce((s, i) => s + Number(i.receivable || 0), 0);
  const totalPayable = items.reduce((s, i) => s + Number(i.payable || 0), 0);
  const totalDiff = items.reduce((s, i) => s + Number(i.diff || 0), 0);
  const netFlow = totalReceivable - totalPayable;
  return { totalRevenue, totalReceivable, totalPayable, totalDiff, netFlow };
});

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

function onSearch() {
  load();
}

function onReset() {
  query.reportType = '';
  query.dateStart = '';
  query.dateEnd = '';
  load();
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
        <div class="page-title">财务报表</div>
        <div class="page-desc">权责发生制下的财务核算与差异分析</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" @click="openCreate"><i data-lucide="plus"></i> 新增核算</button>
        <button v-permission="['finance:export']" class="btn btn-default"><i data-lucide="download"></i> 导出报表</button>
        <button class="btn btn-default"><i data-lucide="circle-help"></i> 使用帮助</button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">报表类型</span>
        <select v-model="query.reportType" class="select" @change="onSearch">
          <option v-for="opt in reportTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">日期范围</span>
        <input v-model="query.dateStart" type="date" class="input input-sm" @change="onSearch" />
        <span class="range-sep">~</span>
        <input v-model="query.dateEnd" type="date" class="input input-sm" @change="onSearch" />
      </div>
      <div class="filter-group filter-actions">
        <button class="btn btn-primary btn-sm" @click="onSearch"><i data-lucide="search"></i> 查询</button>
        <button class="btn btn-default btn-sm" @click="onReset"><i data-lucide="rotate-ccw"></i> 重置</button>
      </div>
    </div>

    <!-- KPI 卡片 -->
    <div class="kpi-grid" style="margin-bottom: 16px;">
      <div class="kpi-card blue">
        <div class="kpi-label">营业收入</div>
        <div class="kpi-value">{{ formatMoney(summaryMetrics.totalRevenue) }}</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">应收账款</div>
        <div class="kpi-value">{{ formatMoney(summaryMetrics.totalReceivable) }}</div>
      </div>
      <div class="kpi-card pink">
        <div class="kpi-label">应付账款</div>
        <div class="kpi-value">{{ formatMoney(summaryMetrics.totalPayable) }}</div>
      </div>
      <div class="kpi-card yellow">
        <div class="kpi-label">净现金流</div>
        <div class="kpi-value">{{ formatMoney(summaryMetrics.netFlow) }}</div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>月份</th>
              <th>营业收入</th>
              <th>应收账款</th>
              <th>应付账款</th>
              <th>实际收款</th>
              <th>实际付款</th>
              <th>差异</th>
            </tr>
          </thead>
          <tbody v-if="list.length > 0">
            <tr v-for="(row, index) in list" :key="row.id || index">
              <td>
                <div class="cell-main">{{ row.period || '-' }}</div>
              </td>
              <td class="mono num-pos">{{ formatMoney(row.revenue) }}</td>
              <td class="mono">{{ formatMoney(row.receivable) }}</td>
              <td class="mono">{{ formatMoney(row.payable) }}</td>
              <td class="mono num-pos">{{ formatMoney(row.actualIncome) }}</td>
              <td class="mono num-neg">{{ formatMoney(row.actualExpense) }}</td>
              <td :class="['mono', (row.diff || 0) >= 0 ? 'num-pos' : 'num-neg']">
                {{ formatMoney(row.diff) }}
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td :colspan="7" style="text-align: center; padding: 48px 0; color: var(--ink-400);">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 新增对话框 -->
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
.amount { color: var(--ink-700); }
.profit { color: var(--primary); font-weight: 700; }
</style>