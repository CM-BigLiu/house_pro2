<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  createManualSale,
  getBusinessEmployees,
  getBusinessPerformance,
  submitBusiness,
  type BusinessPerformance,
} from '@/api/business';
import BusinessPerformanceDetails from '@/components/BusinessPerformanceDetails.vue';
import { downloadCsv } from '@/utils/csv';
import { formatMoney } from '@/utils/format';
const period = ref(new Date().toLocaleDateString('sv-SE').slice(0, 7)),
  list = ref<BusinessPerformance[]>([]),
  loading = ref(false),
  failed = ref(false),
  busy = ref(false),
  submitted = ref(false);
const detail = ref<BusinessPerformance | null>(null),
  saleVisible = ref(false),
  employees = ref<{ id: number; name: string }[]>([]);
const form = reactive({
  amount: 0,
  address: '',
  entryEmployeeId: undefined as number | undefined,
  closingEmployeeId: undefined as number | undefined,
  entryRatio: 50,
  closingRatio: 50,
  commissionRatio: 0,
});
const columns = [
  { type: 'regular' as const, label: '普租' },
  { type: 'management' as const, label: '房管房' },
  { type: 'tenant' as const, label: '承租' },
  { type: 'sale' as const, label: '买卖' },
];
const totalIncome = computed(() =>
  list.value.reduce((s, row) => s + row.totalCommission, 0),
);
let generation = 0;
async function load() {
  const current = ++generation;
  loading.value = true;
  failed.value = false;
  submitted.value = false;
  try {
    const result = await getBusinessPerformance(period.value);
    if (current === generation) list.value = result.list;
  } catch {
    if (current === generation) {
      failed.value = true;
      list.value = [];
    }
  } finally {
    if (current === generation) loading.value = false;
  }
}
async function submit(type = 'performance') {
  if (busy.value || failed.value || loading.value) return;
  busy.value = true;
  try {
    const submission = await submitBusiness(type, period.value);
    if (type === 'performance' && submission.snapshot?.list)
      list.value = submission.snapshot.list;
    submitted.value = true;
    ElMessage.success('已提交财务，列表可下载或打印');
  } catch {
    /* 请求层提示。 */
  } finally {
    busy.value = false;
  }
}
async function openSale() {
  Object.assign(form, {
    amount: 0,
    address: '',
    entryEmployeeId: undefined,
    closingEmployeeId: undefined,
    entryRatio: 50,
    closingRatio: 50,
    commissionRatio: 0,
  });
  employees.value = [];
  saleVisible.value = true;
  try {
    employees.value = await getBusinessEmployees();
  } catch {
    /* 请求层显示 */
  }
}
async function saveSale() {
  if (busy.value) return;
  if (
    form.amount <= 0 ||
    !form.address.trim() ||
    !form.entryEmployeeId ||
    !form.closingEmployeeId ||
    form.entryRatio + form.closingRatio !== 100
  )
    return ElMessage.warning(
      '请填写金额、地址和员工，录入及成交比例合计须为100%',
    );
  busy.value = true;
  try {
    await createManualSale({
      amount: form.amount,
      address: form.address,
      details: {
        entryEmployeeId: form.entryEmployeeId,
        closingEmployeeId: form.closingEmployeeId,
        entryRatio: form.entryRatio,
        closingRatio: form.closingRatio,
        commissionRatio: form.commissionRatio,
      },
    });
    saleVisible.value = false;
    ElMessage.success('买卖业绩已记录');
    await load();
  } catch {
    /* 保留表单供修正。 */
  } finally {
    busy.value = false;
  }
}
function exportList() {
  downloadCsv(`业绩核算-${period.value}.csv`, [
    [
      '姓名',
      '员工编号',
      ...columns.flatMap((c) => [`${c.label}计佣金额`, `${c.label}提成金额`]),
      '总计佣金额',
      '总收入',
    ],
    ...list.value.map((row) => [
      row.employeeName,
      row.employeeCode,
      ...columns.flatMap((c) => [row[c.type].amount, row[c.type].commission]),
      row.totalAmount,
      row.totalCommission,
    ]),
  ]);
}
function print() {
  window.print();
}
onMounted(load);
</script>
<template>
  <div id="performance-report" class="performance-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">业绩核算</h1>
        <p class="page-desc">
          成交报送人名下自动归集普租、房管房、承租与买卖业绩
        </p>
      </div>
      <div class="page-actions no-print">
        <el-button
          v-permission="['finance:performance:modify']"
          @click="openSale"
          >手工买卖</el-button
        ><el-button
          v-permission="['finance:performance:modify']"
          type="primary"
          :loading="busy"
          :disabled="failed || loading"
          @click="submit()"
          >财务提交</el-button
        ><el-button
          v-permission="['finance:export']"
          :disabled="failed || loading"
          @click="exportList"
          >下载列表</el-button
        ><el-button @click="print">打印</el-button>
      </div>
    </header>
    <div class="filter-bar no-print">
      <el-date-picker
        v-model="period"
        type="month"
        value-format="YYYY-MM"
        :clearable="false"
        :disabled="busy"
        @change="load"
      /><el-button :loading="loading" @click="load">查询</el-button
      ><el-button
        v-permission="['finance:performance:modify']"
        :disabled="busy || loading || failed"
        @click="submit('regular')"
        >普租提交</el-button
      ><el-button
        v-permission="['finance:performance:modify']"
        :disabled="busy || loading || failed"
        @click="submit('sale')"
        >买卖提交</el-button
      >
    </div>
    <p>
      {{ period }} · 经纪人总收入 {{ formatMoney(totalIncome)
      }}<span v-if="submitted"> · 已提交财务</span>
    </p>
    <el-alert
      v-if="failed"
      title="业绩加载失败，请重试"
      type="error"
      :closable="false"
    />
    <el-table :data="list" v-loading="loading" border
      ><el-table-column
        prop="employeeName"
        label="姓名"
        width="100"
      /><el-table-column
        prop="employeeCode"
        label="员工编号"
        width="100"
      /><el-table-column
        v-for="column in columns"
        :key="column.type"
        :label="column.label"
        min-width="150"
        ><template #default="{ row }"
          ><div :class="row[column.type].amount < 0 ? 'negative' : 'positive'">
            计佣 {{ formatMoney(row[column.type].amount) }}
          </div>
          <small
            >提成 {{ formatMoney(row[column.type].commission) }}</small
          ></template
        ></el-table-column
      ><el-table-column label="总计" min-width="155"
        ><template #default="{ row }"
          ><strong>{{ formatMoney(row.totalAmount) }}</strong>
          <div>总收入 {{ formatMoney(row.totalCommission) }}</div>
          <el-button link class="no-print" @click="detail = row"
            >全部明细</el-button
          ></template
        ></el-table-column
      ></el-table
    >
    <p class="hint">
      佣金按合同约定金额计佣，绩效 = 收佣金额 × 绩效分成，提成 = 绩效 ×
      提成比例。房管房收益按所选月份租期归属，免租按合同年度扣除，溢价为租客月租与业主月租差额；金额不代表已收款。
    </p>
    <el-dialog
      :model-value="!!detail"
      title="经纪人业绩明细"
      width="min(1150px,96vw)"
      @update:model-value="
        (value: boolean) => {
          if (!value) detail = null;
        }
      "
      ><BusinessPerformanceDetails v-if="detail" :row="detail"
    /></el-dialog>
    <el-dialog
      v-model="saleVisible"
      title="手工买卖成交"
      width="min(720px,94vw)"
      :close-on-click-modal="false"
      ><el-form label-position="top"
        ><el-form-item label="成交地址" required
          ><el-input v-model="form.address" maxlength="255" /></el-form-item
        ><el-form-item label="成交金额（元）" required
          ><el-input-number
            v-model="form.amount"
            :min="0.01"
            :precision="2" /></el-form-item
        ><el-row :gutter="14"
          ><el-col :span="12"
            ><el-form-item label="房源录入人" required
              ><el-select v-model="form.entryEmployeeId" filterable
                ><el-option
                  v-for="e in employees"
                  :key="e.id"
                  :value="e.id"
                  :label="`${e.name} · ${String(e.id).padStart(6, '0')}`" /></el-select></el-form-item
            ><el-form-item label="录入比例（%）"
              ><el-input-number
                v-model="form.entryRatio"
                :min="0"
                :max="100"
                :precision="2"
            /></el-form-item>
            <p>
              录入金额 {{ formatMoney((form.amount * form.entryRatio) / 100) }}
            </p></el-col
          ><el-col :span="12"
            ><el-form-item label="成交人" required
              ><el-select v-model="form.closingEmployeeId" filterable
                ><el-option
                  v-for="e in employees"
                  :key="e.id"
                  :value="e.id"
                  :label="`${e.name} · ${String(e.id).padStart(6, '0')}`" /></el-select></el-form-item
            ><el-form-item label="成交比例（%）"
              ><el-input-number
                v-model="form.closingRatio"
                :min="0"
                :max="100"
                :precision="2"
            /></el-form-item>
            <p>
              成交金额
              {{ formatMoney((form.amount * form.closingRatio) / 100) }}
            </p></el-col
          ></el-row
        ><el-form-item label="提成比例（%）"
          ><el-input-number
            v-model="form.commissionRatio"
            :min="0"
            :max="100"
            :precision="2" /></el-form-item></el-form
      ><template #footer
        ><el-button :disabled="busy" @click="saleVisible = false"
          >取消</el-button
        ><el-button type="primary" :loading="busy" @click="saveSale"
          >提交</el-button
        ></template
      ></el-dialog
    >
  </div>
</template>
<style scoped>
.performance-page {
  display: grid;
  gap: 20px;
}
.positive {
  color: #16a34a;
}
.negative {
  color: #dc2626;
}
.hint {
  color: #64748b;
  font-size: 12px;
  line-height: 1.8;
}
@media print {
  .no-print {
    display: none !important;
  }
  :global(body *) {
    visibility: hidden;
  }
  #performance-report,
  #performance-report * {
    visibility: visible;
  }
  #performance-report {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
</style>
