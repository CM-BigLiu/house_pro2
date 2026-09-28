<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  accountNames,
  getBusinessCalendar,
  settleSchedule,
  settleCharge,
  submitBusiness,
  type CalendarBucket,
  type ContractSchedule,
} from '@/api/business';
import PropertyConfigurationDialog from '@/components/PropertyConfigurationDialog.vue';
import { useUserStore } from '@/stores/user';
import { formatMoney } from '@/utils/format';
import { useDictStore } from '@/stores/dict';
const route = useRoute(), router = useRouter(), dict = useDictStore();
const propertyFilter = computed(() => Number(route.query.propertyId) || undefined), roomFilter = computed(() => Number(route.query.roomId) || undefined);
const bucketTotal = (bucket: CalendarBucket) => bucket.list.reduce((sum, row) => sum + Math.round(Number(row.remaining) * 100), 0) / 100;
const billDescription = (row: ContractSchedule) => row.billType === 'charge' ? `${row.categoryLabel || '费用'}${row.counterparty ? ` · ${row.counterparty}` : ''}` : `${row.contractCode || `合同 #${row.dealId}`} · 第${row.sequence}期`;
const rentFormula = (row: ContractSchedule) => {
  if (!row.freeRentDays) return '';
  const deduction = Number(row.freeRentAmount || 0);
  if (Math.round(Number(row.monthlyRent || 0) * row.freeRentDays / 30 * 100) > Math.round(deduction * 100)) {
    return `免租 ${row.freeRentDays}天，按月租÷30折算；扣减 ${formatMoney(deduction)}（以本期基础租金为上限）`;
  }
  return `免租 ${row.freeRentDays}天 × ${formatMoney(row.monthlyRent || 0)} ÷ 30 = ${formatMoney(deduction)}`;
};
const user = useUserStore(),
  period = ref(new Date().toLocaleDateString('sv-SE').slice(0, 7));
const buckets = ref<CalendarBucket[]>([]),
  overdue = ref<ContractSchedule[]>([]),
  loading = ref(false),
  failed = ref(false),
  busy = ref(false);
const selected = ref<ContractSchedule | null>(null),
  paymentVisible = ref(false),
  configurationVisible = ref(false),
  configurationProperty = ref<ContractSchedule | null>(null);
const form = reactive({
  requestKey: '',
  paymentDate: '',
  amount: 0,
  accountCode: 'bank_ccb',
  payerAccount: '',
  payer: '',
  payeeAccount: '',
  payee: '',
});
const accountOptions = computed(() => Object.values(accountNames));
const partyOptions = computed(() => [
  ...new Set([user.name, form.payer, form.payee].filter(Boolean)),
]);
let generation = 0;
async function load() {
  const current = ++generation;
  loading.value = true;
  failed.value = false;
  try {
    const result = await getBusinessCalendar(period.value, { ...(propertyFilter.value ? { propertyId: propertyFilter.value } : {}), ...(roomFilter.value ? { roomId: roomFilter.value } : {}) });
    if (current === generation) {
      buckets.value = result.buckets;
      overdue.value = result.overdue;
    }
  } catch {
    if (current === generation) {
      failed.value = true;
      buckets.value = [];
      overdue.value = [];
    }
  } finally {
    if (current === generation) loading.value = false;
  }
}
function openPayment(row: ContractSchedule) {
  selected.value = row;
  Object.assign(form, {
    requestKey: crypto.randomUUID(),
    paymentDate: new Date().toLocaleDateString('sv-SE'),
    amount: row.remaining,
    accountCode: 'bank_ccb',
    payerAccount: '',
    payer: row.direction === 'pay' ? user.name : row.counterparty || '',
    payeeAccount: '',
    payee: row.direction === 'receive' ? user.name : row.counterparty || '',
  });
  paymentVisible.value = true;
}
async function pay() {
  if (busy.value || !selected.value) return;
  if (
    !form.paymentDate ||
    form.amount <= 0 ||
    form.amount > selected.value.remaining ||
    [form.payerAccount, form.payer, form.payeeAccount, form.payee].some(
      (value) => !value.trim(),
    )
  )
    return ElMessage.warning(
      '请补齐双方资料，金额须大于零且不超过本期未结金额',
    );
  busy.value = true;
  try {
    await (selected.value.billType === 'charge' ? settleCharge : settleSchedule)(selected.value.id, form);
    ElMessage.success('收付款已登记，现金余额及下一期流程已更新');
    paymentVisible.value = false;
    await load();
  } catch {
    /* 保留表单和幂等编号供重试。 */
  } finally {
    busy.value = false;
  }
}
async function submit() {
  if (busy.value || failed.value || loading.value) return;
  busy.value = true;
  try {
    await submitBusiness('management', period.value);
    ElMessage.success('本月房管房业务已提交财务');
  } catch {
    /* 请求层提示。 */
  } finally {
    busy.value = false;
  }
}
function configure(row: ContractSchedule) {
  configurationProperty.value = row;
  configurationVisible.value = true;
}
onMounted(async () => { await dict.ensureLoaded(['payment_method']); await load(); });
watch(() => [route.query.propertyId, route.query.roomId], load);
</script>
<template>
  <div class="business-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">房管房业务</h1>
        <p class="page-desc">按委托及承租合同追踪各期支付、收款与房源配置</p>
      </div>
      <el-button
        v-permission="['finance:arrears:modify']"
        type="primary"
        :loading="busy"
        :disabled="failed || loading"
        @click="submit"
        >财务提交</el-button
      >
    </header>
    <div class="filter-bar">
      <el-date-picker
        v-model="period"
        type="month"
        value-format="YYYY-MM"
        :clearable="false"
        :disabled="busy"
        @change="load"
      /><el-button :loading="loading" @click="load">查询</el-button><el-button v-if="propertyFilter || roomFilter" @click="router.replace({ path: '/finance/arrears' })">查看全部房源</el-button>
    </div>
    <el-alert
      v-if="failed"
      title="房管房业务加载失败，请重试"
      type="error"
      :closable="false"
    />
    <section
      v-for="direction in ['pay', 'receive']"
      :key="direction"
      :class="['direction-section', direction]"
      v-loading="loading"
    >
      <h2>{{ direction === 'pay' ? '房东支付信息及各项费用' : '租客收款信息（租金、押金、佣金）' }}</h2>
      <div class="month-grid">
        <article
          v-for="bucket in buckets.filter((row) => row.direction === direction)"
          :key="bucket.period"
          class="month-card"
        >
          <header>
            <h3>
              {{ bucket.period === period ? '本月' : '下月'
              }}{{ direction === 'pay' ? '需支付' : '需收款' }} ·
              {{ bucket.period }}
            </h3>
            <strong>{{ formatMoney(bucketTotal(bucket)) }}</strong
            ><span>共 {{ bucket.count }} 套</span>
          </header>
          <el-table :data="bucket.list" empty-text="本月暂无待办计划"
            ><el-table-column
              prop="propertyName"
              label="房屋地址"
              min-width="200"
            ><template #default="{ row }"><div>{{ row.propertyName }}</div><small class="bill-note">{{ billDescription(row) }}</small><small v-if="row.billType !== 'charge'" class="bill-note">月租 {{ formatMoney(row.monthlyRent) }} · {{ dict.getLabel('payment_method', row.paymentMethod) }}</small><small v-else class="bill-note">{{ row.contractCode || '房源费用' }}{{ row.remark ? ` · ${row.remark}` : '' }}</small></template></el-table-column><el-table-column label="账单期间" width="166"><template #default="{ row }">{{ row.periodStart }}<template v-if="row.billType !== 'charge'"><br>至 {{ row.periodEnd }}</template></template></el-table-column><el-table-column
              prop="dueDate"
              label="支付日期"
              width="110"
            /><el-table-column :label="direction === 'pay' ? '待付金额' : '待收金额'" width="185"
              ><template #default="{ row }"><b>{{ formatMoney(row.remaining) }}</b><small class="bill-note">本期{{ direction === 'pay' ? '应付' : '应收' }} {{ formatMoney(row.amount) }}</small><small v-if="row.freeRentDays" class="bill-note">基础租金 {{ formatMoney(row.grossRent || 0) }}</small><small v-if="row.freeRentDays" class="free-note">{{ rentFormula(row) }}</small><small class="bill-note">已结 {{ formatMoney(row.settledAmount) }}</small></template></el-table-column
            ><el-table-column label="操作" width="110" fixed="right"
              ><template #default="{ row }"
                ><el-button
                  v-permission="['finance:arrears:modify']"
                  link
                  type="primary"
                  @click="openPayment(row)"
                  >{{ direction === 'pay' ? '支付' : '登记收款' }}</el-button
                ><el-button
                  v-permission="['renting:edit']"
                  link
                  @click="configure(row)"
                  >配置</el-button
                ></template
              ></el-table-column
            ></el-table
          >
        </article>
      </div>
    </section>
    <section v-if="overdue.length" class="overdue">
      <h2>往期未结清（先完成前一期，再进入下一期）</h2>
      <el-table :data="overdue"
        ><el-table-column
          prop="propertyName"
          label="房屋地址"
        ><template #default="{ row }">{{ row.propertyName }}<small class="bill-note">{{ billDescription(row) }}<template v-if="row.billType !== 'charge'"> · {{ dict.getLabel('payment_method', row.paymentMethod) }}</template></small><small class="bill-note">{{ row.periodStart }}<template v-if="row.billType !== 'charge'"> 至 {{ row.periodEnd }}</template></small></template></el-table-column><el-table-column prop="dueDate" label="支付日期" /><el-table-column
          label="方向"
          ><template #default="{ row }">{{
            row.direction === 'pay' ? '应付' : '应收'
          }}</template></el-table-column
        ><el-table-column label="未结金额"
          ><template #default="{ row }">{{
            formatMoney(row.remaining)
          }}<small v-if="row.freeRentDays" class="free-note">{{ rentFormula(row) }}</small><small class="bill-note">本期 {{ formatMoney(row.amount) }} · 已结 {{ formatMoney(row.settledAmount) }}</small></template></el-table-column
        ><el-table-column label="操作"
          ><template #default="{ row }"
            ><el-button
              v-permission="['finance:arrears:modify']"
              link
              type="primary"
              @click="openPayment(row)"
              >登记收付款</el-button
            ><el-button
              v-permission="['renting:edit']"
              link
              @click="configure(row)"
              >配置</el-button
            ></template
          ></el-table-column
        ></el-table
      >
    </section>
    <el-dialog
      v-model="paymentVisible"
      :title="selected?.direction === 'pay' ? '登记支付' : '确认租客已支付'"
      width="min(650px,94vw)"
      :close-on-click-modal="false"
      :show-close="!busy"
      :close-on-press-escape="!busy"
      ><p>
        {{ selected?.propertyName }} · {{ selected ? billDescription(selected) : '' }} · 未结
        {{ formatMoney(selected?.remaining || 0) }}
      </p><p class="bill-note">{{ selected?.contractCode }} · {{ selected?.periodStart }} 至 {{ selected?.periodEnd }} · {{ dict.getLabel('payment_method', selected?.paymentMethod) }}</p>
      <el-form label-position="top"
        ><el-row :gutter="14"
          ><el-col :span="12"
            ><el-form-item label="支付日期" required
              ><el-date-picker
                v-model="form.paymentDate"
                type="date"
                value-format="YYYY-MM-DD" /></el-form-item></el-col
          ><el-col :span="12"
            ><el-form-item label="支付金额" required
              ><el-input-number
                v-model="form.amount"
                :min="0.01"
                :max="selected?.remaining"
                :precision="2" /></el-form-item></el-col
        ></el-row>
        <el-form-item label="公司收支账户" required
          ><el-select v-model="form.accountCode"
            ><el-option
              v-for="(name, code) in accountNames"
              :key="code"
              :value="code"
              :label="name" /></el-select
        ></el-form-item>
        <el-row :gutter="14"
          ><el-col
            v-for="field in [
              {
                key: 'payerAccount',
                label: '支付账号',
                options: accountOptions,
              },
              { key: 'payer', label: '付款人', options: partyOptions },
              {
                key: 'payeeAccount',
                label: '收款账号',
                options: accountOptions,
              },
              { key: 'payee', label: '收款人', options: partyOptions },
            ]"
            :key="field.key"
            :span="12"
            ><el-form-item :label="field.label" required
              ><el-select
                v-model="
                  form[
                    field.key as
                      | 'payerAccount'
                      | 'payer'
                      | 'payeeAccount'
                      | 'payee'
                  ]
                "
                filterable
                allow-create
                default-first-option
                placeholder="手填或下拉选择"
                ><el-option
                  v-for="value in field.options"
                  :key="value"
                  :label="value"
                  :value="value" /></el-select></el-form-item></el-col
        ></el-row> </el-form
      ><template #footer
        ><el-button :disabled="busy" @click="paymentVisible = false"
          >取消</el-button
        ><el-button type="primary" :loading="busy" @click="pay"
          >提交</el-button
        ></template
      >
    </el-dialog>
    <PropertyConfigurationDialog
      v-model:visible="configurationVisible"
      :property-id="configurationProperty?.propertyId || null"
      :property-name="configurationProperty?.propertyName"
      @completed="load"
    />
  </div>
</template>
<style scoped>
.business-page {
  display: grid;
  gap: 20px;
}
.direction-section {
  padding: 18px;
  border-radius: 12px;
  border: 1px solid;
}
.pay {
  background: #fff7ed;
  border-color: #fed7aa;
}
.receive {
  background: #f0fdf4;
  border-color: #bbf7d0;
}
.month-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.month-card {
  background: white;
  border-radius: 10px;
  padding: 16px;
  overflow: auto;
}
.month-card header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.month-card strong {
  font-size: 20px;
}
.free-note { display:block; color:#0b815b; font-size:11px; line-height:1.7; overflow-wrap:anywhere; }
.bill-note { display:block; color:var(--ink-500); font-size:11px; line-height:1.7; overflow-wrap:anywhere; }.month-card :deep(.cell) { line-height:1.65; }.month-card b { color:var(--ink-900); }
h2 {
  font-size: 17px;
  margin: 0 0 16px;
}
h3 {
  font-size: 14px;
  margin: 0;
}
.overdue {
  padding: 18px;
  background: #fff1f2;
  border-radius: 12px;
}
@media (max-width: 1600px) {
  .month-grid {
    grid-template-columns: 1fr;
  }
}
</style>
