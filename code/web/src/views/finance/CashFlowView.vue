<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  accountNames,
  getCompanyCashFlow,
  setOpeningBalance,
} from '@/api/business';
import { useUserStore } from '@/stores/user';
import { formatMoney } from '@/utils/format';
const data = ref<Awaited<ReturnType<typeof getCompanyCashFlow>>>({
    accounts: [],
    history: [],
    scope: '',
  }),
  loading = ref(false),
  failed = ref(false),
  user = useUserStore();
const bank = ref('bank_ccb'),
  selectedBank = computed(() =>
    data.value.accounts.find((row) => row.code === bank.value),
  );
const columns = computed(() => [
  { code: bank.value, title: '银行', account: selectedBank.value },
  ...['wechat', 'cash', 'corporate'].map(code => ({ code, title: accountNames[code], account: data.value.accounts.find(row => row.code === code) })),
].map(column => ({ ...column, history: data.value.history.filter(row => row.accountCode === column.code) })));
const administrator = computed(
  () =>
    user.permissions.includes('*') ||
    [user.userInfo?.role || '', ...(user.userInfo?.roleCodes || [])].some(role => ['super_admin', 'company_admin'].includes(role)),
);
async function load() {
  loading.value = true;
  failed.value = false;
  try {
    data.value = await getCompanyCashFlow();
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
}
async function opening(code: string) {
  const row = data.value.accounts.find((item) => item.code === code);
  if (!row) return;
  try {
    const { value } = await ElMessageBox.prompt(
      '填写期初余额，实际流水继续保留并叠加计算',
      `${row.name}期初余额`,
      {
        inputValue: String(row.openingBalance),
        inputPattern: /^-?\d+(\.\d{1,2})?$/,
        inputErrorMessage: '请输入有效金额，最多两位小数',
      },
    );
    await setOpeningBalance(code, Number(value));
    ElMessage.success('期初余额已保存');
    await load();
  } catch {
    /* 取消或请求层提示 */
  }
}
onMounted(load);
</script>
<template>
  <div class="cash-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">收支计划（公司现金流）</h1>
        <p class="page-desc">余额 = 期初余额 + 已登记收款 − 已登记付款</p>
      </div>
      <el-button :loading="loading" @click="load">刷新</el-button>
    </header>
    <el-alert
      v-if="failed"
      title="现金流加载失败，请重试"
      type="error"
      :closable="false"
    />
    <el-alert
      v-if="data.scope && data.scope !== 'company'"
      title="当前为个人或门店范围，仅展示授权范围内的现金变动；公司期初余额需公司范围账号查看。"
      type="info"
      :closable="false"
    />
    <div class="cash-columns" v-loading="loading">
      <section v-for="column in columns" :key="column.title" class="cash-column" :aria-label="`${column.title}现金流`">
        <article class="balance-card">
          <h2>{{ column.title }}</h2>
          <div class="account-selector"><el-select v-if="column.title === '银行'" v-model="bank" aria-label="银行账户">
            <el-option label="建设银行" value="bank_ccb" /><el-option label="农商银行" value="bank_rural" />
          </el-select></div>
          <strong>{{ formatMoney(column.account?.balance || 0) }}</strong><span>当前余额（元）</span>
          <el-button v-if="administrator" v-permission="['finance:plan:modify']" link @click="opening(column.code)">设置期初余额</el-button>
        </article>
        <div class="account-history">
          <div class="entry-heading"><span>日期</span><span>收支金额</span></div>
          <p v-if="!column.history.length" class="empty-history">暂无收付款记录</p>
          <article v-for="row in column.history" :key="row.id" class="account-entry">
            <div class="entry-heading"><time>{{ row.paymentDate }}</time><strong :class="row.direction === 'receive' ? 'positive' : 'negative'">{{ row.direction === 'receive' ? '+' : '−' }}{{ formatMoney(row.amount) }}</strong></div>
            <p>{{ row.payer }} → {{ row.payee }}</p><small>支付账号：{{ row.payerAccount }}</small><br><small>收款账号：{{ row.payeeAccount }}</small>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
<style scoped>
.cash-page {
  display: grid;
  gap: 22px;
}
.cash-columns {
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 18px;
  overflow-x: auto;
  padding-bottom: 8px;
}
.cash-column { border: 1px solid #dce6f5; border-radius: 12px; overflow: hidden; }
.account-history small { color: var(--ink-500); }
.account-selector { min-height:32px; }
.entry-heading { display:flex; justify-content:space-between; gap:8px; font-size:12px; }
.account-history > .entry-heading { padding:12px 16px; color:var(--ink-500); border-bottom:1px solid #e5eaf2; }
.account-entry { padding:16px; border-bottom:1px solid #e5eaf2; overflow-wrap:anywhere; font-size:13px; }
.account-entry p { margin:12px 0 8px; }
.account-entry strong { font-size:14px; }
.empty-history { margin:0; padding:28px 16px; text-align:center; font-size:13px; color:var(--ink-500); }
.balance-card {
  padding: 24px;
  background: #f8faff;
  display: grid;
  gap: 14px;
}
.balance-card h2 {
  margin: 0;
  font-size: 16px;
}
.balance-card strong {
  font-size: 27px;
  font-variant-numeric: tabular-nums;
}
.positive {
  color: #16a34a;
}
.negative {
  color: #dc2626;
}
</style>
