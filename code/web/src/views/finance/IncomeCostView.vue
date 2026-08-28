<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { getIncomeCosts, createIncomeCost, type IncomeCost } from '@/api/finance-report';
import { formatMoney } from '@/utils/format';

const list = ref<IncomeCost[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const form = reactive<Partial<IncomeCost>>({
  period: '', rentIncome: 0, depositIncome: 0, energyIncome: 0, otherIncome: 0,
  rentCost: 0, energyCost: 0, decorateCost: 0, laborCost: 0, otherCost: 0,
});
const query = reactive({ keyword: '', type: '', dateStart: '', dateEnd: '' });

const typeOptions = [
  { label: '全部', value: '' },
  { label: '租金', value: 'rent' },
  { label: '押金', value: 'deposit' },
  { label: '物业费', value: 'property' },
  { label: '其他', value: 'other' },
];

// 汇总统计
const summaryData = computed(() => {
  const items = list.value;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthTotal = items
    .filter(i => i.period?.startsWith(currentMonth))
    .reduce((s, i) => s + Number(i.rentIncome || 0) + Number(i.depositIncome || 0) + Number(i.energyIncome || 0) + Number(i.otherIncome || 0), 0);
  const yearTotal = items
    .filter(i => i.period?.startsWith(currentMonth.slice(0, 4)))
    .reduce((s, i) => s + Number(i.rentIncome || 0) + Number(i.depositIncome || 0) + Number(i.energyIncome || 0) + Number(i.otherIncome || 0), 0);
  const grandTotal = items.reduce((s, i) => s + Number(i.rentIncome || 0) + Number(i.depositIncome || 0) + Number(i.energyIncome || 0) + Number(i.otherIncome || 0), 0);
  return { monthTotal, yearTotal, grandTotal };
});

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

function onSearch() {
  load();
}

function onReset() {
  query.keyword = '';
  query.type = '';
  query.dateStart = '';
  query.dateEnd = '';
  load();
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
        <div class="page-title">收入管理</div>
        <div class="page-desc">按收支科目归集收入明细，支持多维度筛选</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" @click="openCreate"><i data-lucide="plus"></i> 新增收入</button>
        <button v-permission="['finance:export']" class="btn btn-default"><i data-lucide="download"></i> 导出</button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">日期范围</span>
        <input v-model="query.dateStart" type="date" class="input input-sm" @change="onSearch" />
        <span class="range-sep">~</span>
        <input v-model="query.dateEnd" type="date" class="input input-sm" @change="onSearch" />
      </div>
      <div class="filter-group">
        <span class="filter-label">类型</span>
        <select v-model="query.type" class="select" @change="onSearch">
          <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <div class="filter-group">
        <input v-model="query.keyword" class="input" placeholder="关键词" @keyup.enter="onSearch" />
      </div>
      <div class="filter-group filter-actions">
        <button class="btn btn-primary btn-sm" @click="onSearch"><i data-lucide="search"></i> 筛选</button>
        <button class="btn btn-default btn-sm" @click="onReset"><i data-lucide="rotate-ccw"></i> 重置</button>
      </div>
    </div>

    <!-- 汇总条 -->
    <div class="summary-row">
      <span class="summary-chip">本月收入 <strong>{{ formatMoney(summaryData.monthTotal) }}</strong></span>
      <span class="summary-chip">本年收入 <strong>{{ formatMoney(summaryData.yearTotal) }}</strong></span>
      <span class="summary-chip">总收入 <strong>{{ formatMoney(summaryData.grandTotal) }}</strong></span>
    </div>

    <!-- 数据表格 -->
    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>收入类型</th>
              <th>来源</th>
              <th>金额</th>
              <th>关联合同</th>
              <th>经办人</th>
              <th>备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody v-if="list.length > 0">
            <tr v-for="row in list" :key="row.id || row.period">
              <td>
                <div class="cell-main">{{ row.period || '-' }}</div>
              </td>
              <td>
                <span class="pill pill-blue">收入</span>
              </td>
              <td>{{ row.rentIncome > 0 ? '租金' : row.depositIncome > 0 ? '押金' : row.energyIncome > 0 ? '能源' : '其他' }}</td>
              <td class="mono num-pos">
                ¥{{ (Number(row.rentIncome || 0) + Number(row.depositIncome || 0) + Number(row.energyIncome || 0) + Number(row.otherIncome || 0)).toLocaleString() }}
              </td>
              <td>-</td>
              <td>-</td>
              <td>{{ row.period || '-' }}</td>
              <td>
                <div class="operation-cell">
                  <button class="btn btn-ghost btn-sm">查看</button>
                  <button class="btn btn-ghost btn-sm">编辑</button>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td :colspan="8" style="text-align: center; padding: 48px 0; color: var(--ink-400);">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 新增对话框 -->
    <el-dialog v-model="dialogVisible" title="新增收入" width="600px">
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
.income { color: var(--success); font-weight: 700; }
.expense { color: var(--danger); font-weight: 700; }
</style>