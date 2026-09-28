<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { getIncomeCosts, createIncomeCost, updateIncomeCost, type IncomeCost } from '@/api/finance-report';
import { getRentalCosts, getAutomaticIncomeCosts, type AutomaticIncomeCosts } from '@/api/business';
import { formatMoney } from '@/utils/format';
import { downloadCsv } from '@/utils/csv';
const period = ref(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date()).slice(0, 7));
const actual = ref<AutomaticIncomeCosts>({ period: period.value, list: [], totalIncome: 0, totalCost: 0, net: 0 });
const rental = ref<Awaited<ReturnType<typeof getRentalCosts>>>({ period: period.value, list: [], totalIncome: 0, totalCost: 0, freeAmount: 0, net: 0 });
const manual = ref<IncomeCost[]>([]), loading = ref(false), failed = ref(false), page = ref(1);
const direction = ref(''), category = ref(''), keyword = ref('');
const categories = computed(() => [...new Set(actual.value.list.map(row => row.category))]);
const filtered = computed(() => actual.value.list.filter(row => (!direction.value || row.direction === direction.value) && (!category.value || row.category === category.value) && (!keyword.value || [row.source, row.reference, row.propertyName].some(text => text?.includes(keyword.value)))));
const visible = computed(() => filtered.value.slice((page.value - 1) * 10, page.value * 10));
let generation = 0;
async function load() {
  const current = ++generation, selectedPeriod = period.value;
  loading.value = true; failed.value = false;
  try {
    const [accounting, plans, records] = await Promise.all([getAutomaticIncomeCosts(selectedPeriod), getRentalCosts(selectedPeriod), getIncomeCosts({ period: selectedPeriod, pageSize: 100 })]);
    if (current !== generation) return;
    actual.value = accounting; rental.value = plans; manual.value = records.list; page.value = 1;
  } catch { if (current === generation) failed.value = true; }
  finally { if (current === generation) loading.value = false; }
}
onMounted(load);
const dialogVisible = ref(false), saving = ref(false), editingId = ref(0);
const fields = [
  { key: 'rentIncome', label: '租金收入' }, { key: 'depositIncome', label: '押金收入' }, { key: 'energyIncome', label: '能源收入' }, { key: 'otherIncome', label: '其他收入' },
  { key: 'rentCost', label: '租金支出' }, { key: 'energyCost', label: '能源支出' }, { key: 'decorateCost', label: '装修支出' }, { key: 'laborCost', label: '人工支出' }, { key: 'otherCost', label: '其他支出' },
] as const;
const form = reactive<Partial<IncomeCost>>({});
const formIncome = computed(() => fields.slice(0, 4).reduce((sum, field) => sum + Math.round(Number(form[field.key] || 0) * 100), 0) / 100);
const formCost = computed(() => fields.slice(4).reduce((sum, field) => sum + Math.round(Number(form[field.key] || 0) * 100), 0) / 100);
function edit(row?: IncomeCost) {
  Object.keys(form).forEach(key => delete (form as Record<string, unknown>)[key]);
  editingId.value = row?.id || 0; form.period = row?.period || period.value;
  fields.forEach(field => form[field.key] = Number(row?.[field.key] || 0)); dialogVisible.value = true;
}
async function save() {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(form.period || '')) return ElMessage.warning('请选择有效月份');
  if (fields.some(field => !Number.isFinite(Number(form[field.key])) || Number(form[field.key]) < 0)) return ElMessage.warning('金额须为非负数');
  if (!formIncome.value && !formCost.value) return ElMessage.warning('至少填写一项有效金额');
  saving.value = true;
  try {
    if (editingId.value) await updateIncomeCost(editingId.value, form); else await createIncomeCost(form);
    dialogVisible.value = false; ElMessage.success('已保存并自动更新收支成本'); await load();
  } finally { saving.value = false; }
}
function exportCurrent() {
  if (failed.value || loading.value || actual.value.period !== period.value) return ElMessage.warning('请先加载本月数据');
  downloadCsv(`收支成本-${period.value}.csv`, [
    ['月份', period.value, '总收入', actual.value.totalIncome, '总支出', actual.value.totalCost, '净收支', actual.value.net],
    ['日期', '收支', '类型', '来源', '关联单据', '房源 / 项目', '金额'],
    ...filtered.value.map(row => [row.date, row.direction === 'income' ? '收入' : '支出', row.category, row.source, row.reference, row.propertyName, row.amount]),
    [], ['租金计划核算（不计入实际收付款总额）'],
    ['房源', '编码', '应收租金', '房东原租金', '免租扣减', '应付房东', '净额'],
    ...rental.value.list.map(row => [row.propertyName, row.propertyCode, row.rentIncome, row.originalRent, row.freeAmount, row.rentCost, row.net]),
  ]);
}
</script>
<template>
  <div class="finance-view">
    <div class="page-header"><div><div class="page-title">收支成本</div><div class="page-desc">业务收付款自动关联，按发生月份汇总收入、支出与净额</div></div><div class="page-actions">
      <button v-permission="['finance:income_cost:modify']" class="btn btn-primary" @click="edit()">补充收支</button>
      <button v-permission="['finance:export']" class="btn btn-default" :disabled="failed || loading" @click="exportCurrent">导出</button>
    </div></div>
    <section class="card accounting" v-loading="loading" aria-label="收支成本自动汇总">
      <div class="report-heading"><div><h2>收支成本自动汇总</h2><p>租金缴费、押金与退款、退房结算、配置费用和奖励、已收佣金及补充台账实时关联。</p></div><div class="report-controls">
        <el-date-picker v-model="period" type="month" value-format="YYYY-MM" :clearable="false" aria-label="核算月份" @change="load" /><el-button @click="load">刷新核算</el-button>
      </div></div>
      <el-alert v-if="failed" title="核算加载失败，请刷新重试" type="error" :closable="false" />
      <template v-else>
        <div class="accounting-summary"><div><span>总收入</span><strong class="num-pos">{{ formatMoney(actual.totalIncome) }}</strong></div><div><span>总支出</span><strong class="num-neg">{{ formatMoney(actual.totalCost) }}</strong></div><div><span>净收支</span><strong :class="actual.net < 0 ? 'num-neg' : 'num-pos'">{{ formatMoney(actual.net) }}</strong></div><div><span>关联明细</span><strong>{{ actual.list.length }} <small>笔</small></strong></div></div>
        <div class="report-filters"><el-select v-model="direction" placeholder="全部收支" clearable @change="page = 1"><el-option label="收入" value="income" /><el-option label="支出" value="expense" /></el-select><el-select v-model="category" placeholder="全部类型" clearable @change="page = 1"><el-option v-for="type in categories" :key="type" :label="type" :value="type" /></el-select><el-input v-model="keyword" placeholder="来源 / 关联单据 / 房源" clearable @input="page = 1" /></div>
        <el-table :data="visible" border stripe row-key="id" empty-text="本月暂无已发生收付款">
          <el-table-column prop="date" label="发生日期" width="115" /><el-table-column label="收支" width="75"><template #default="{ row }"><el-tag :type="row.direction === 'income' ? 'success' : 'danger'">{{ row.direction === 'income' ? '收入' : '支出' }}</el-tag></template></el-table-column>
          <el-table-column prop="category" label="类型" min-width="100" /><el-table-column prop="source" label="来源" min-width="145" /><el-table-column prop="reference" label="关联单据" min-width="150" show-overflow-tooltip /><el-table-column prop="propertyName" label="房源 / 项目" min-width="165" show-overflow-tooltip />
          <el-table-column label="金额（元）" width="130" align="right" fixed="right"><template #default="{ row }"><span :class="row.direction === 'income' ? 'num-pos' : 'num-neg'">{{ formatMoney(row.amount) }}</span></template></el-table-column>
        </el-table>
        <el-pagination v-model:current-page="page" :page-size="10" :total="filtered.length" layout="total, prev, pager, next" />
        <p class="report-note">收入按实收、租金及押金支出按实付计算；配置与奖励费用保存后计入成本，支付后更新现金且不重复计费。押金扣留不再次计入收入，配置金额减少按支出冲减记录。</p>
      </template>
    </section>
    <template v-if="!failed">
      <el-collapse class="card plan-card"><el-collapse-item title="租金计划核算 · 自动扣除免租日期" name="rent">
        <p class="report-note">按真实日历的租赁月份分摊租金，已缴金额在上方收付款中统计。</p>
        <div class="summary-row"><span class="summary-chip">应收 {{ formatMoney(rental.totalIncome) }}</span><span class="summary-chip">免租扣减 {{ formatMoney(rental.freeAmount) }}</span><span class="summary-chip">应付房东 {{ formatMoney(rental.totalCost) }}</span><span class="summary-chip">净额 {{ formatMoney(rental.net) }}</span></div>
        <el-table :data="rental.list" border empty-text="本月暂无租金计划"><el-table-column prop="propertyName" label="房源" min-width="200" /><el-table-column label="应收租金" min-width="125" align="right"><template #default="{ row }">{{ formatMoney(row.rentIncome) }}</template></el-table-column><el-table-column label="房东原租金" min-width="125" align="right"><template #default="{ row }">{{ formatMoney(row.originalRent) }}</template></el-table-column><el-table-column label="免租扣减" min-width="125" align="right"><template #default="{ row }">{{ formatMoney(row.freeAmount) }}</template></el-table-column><el-table-column label="应付房东" min-width="125" align="right"><template #default="{ row }">{{ formatMoney(row.rentCost) }}</template></el-table-column></el-table>
      </el-collapse-item></el-collapse>
      <section class="card manual-card"><h2>补充台账</h2><p class="report-note">仅补充尚未在业务中登记的收支，以下金额已计入上方总额。</p>
        <el-table :data="manual" border empty-text="本月暂无补充台账"><el-table-column prop="period" label="月份" width="115" /><el-table-column label="收入合计" min-width="130" align="right"><template #default="{ row }">{{ formatMoney(row.totalIncome) }}</template></el-table-column><el-table-column label="支出合计" min-width="130" align="right"><template #default="{ row }">{{ formatMoney(row.totalCost) }}</template></el-table-column><el-table-column label="净额" min-width="130" align="right"><template #default="{ row }">{{ formatMoney(Number(row.totalIncome) - Number(row.totalCost)) }}</template></el-table-column><el-table-column label="操作" width="95"><template #default="{ row }"><el-button v-permission="['finance:income_cost:modify']" link type="primary" @click="edit(row)">编辑</el-button></template></el-table-column></el-table>
      </section>
    </template>
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑补充收支' : '补充收支'" width="min(700px,94vw)" :close-on-click-modal="false">
      <el-form :model="form" label-position="top"><el-form-item label="归属月份" required><el-date-picker v-model="form.period" type="month" value-format="YYYY-MM" /></el-form-item><el-row :gutter="18"><el-col v-for="field in fields" :key="field.key" :span="12"><el-form-item :label="field.label"><MoneyInput v-model="form[field.key]" :min="0" /></el-form-item></el-col></el-row></el-form>
      <div class="summary-row"><span>收入 {{ formatMoney(formIncome) }}</span><span>支出 {{ formatMoney(formCost) }}</span><span>净额 {{ formatMoney(formIncome - formCost) }}</span></div>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存并重新计算</el-button></template>
    </el-dialog>
  </div>
</template>
<style scoped>
.finance-view { display:flex; flex-direction:column; gap:16px; }
.accounting,.manual-card,.plan-card { padding:20px; }
.report-heading { display:flex; justify-content:space-between; gap:18px; flex-wrap:wrap; margin-bottom:18px; }
h2 { margin:0 0 8px; font-size:16px; }
.report-heading p,.report-note { margin:6px 0 14px; color:var(--ink-500); font-size:12px; line-height:1.7; }
.report-controls,.report-filters { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
.report-controls :deep(.el-date-editor) { width:150px; }
.report-filters { margin:18px 0; }
.report-filters :deep(.el-select) { width:140px; }
.report-filters :deep(.el-input) { width:260px; }
.accounting-summary { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
.accounting-summary > div { padding:18px; border:1px solid #e3eaf4; border-radius:10px; background:#f7faff; }
.accounting-summary span { display:block; color:var(--ink-500); font-size:12px; }
.accounting-summary strong { display:block; margin-top:8px; font-size:23px; }
.accounting-summary small { font-size:12px; font-weight:400; }
:deep(.el-pagination) { margin-top:16px; justify-content:flex-end; }
@media(max-width:700px) { .accounting-summary { grid-template-columns:repeat(2,minmax(0,1fr)); } }
</style>
