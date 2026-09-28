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
const administrator = computed(
  () =>
    user.permissions.includes('*') ||
    ['super_admin', 'company_admin'].includes(user.userInfo?.role || ''),
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
        <h1 class="page-title">公司现金流</h1>
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
    <div class="balance-grid" v-loading="loading">
      <article class="balance-card">
        <el-select v-model="bank"
          ><el-option label="建设银行" value="bank_ccb" /><el-option
            label="农商银行"
            value="bank_rural" /></el-select
        ><strong>{{ formatMoney(selectedBank?.balance || 0) }}</strong
        ><span>银行余额</span
        ><el-button
          v-if="administrator"
          v-permission="['finance:plan:modify']"
          link
          @click="opening(bank)"
          >设置期初余额</el-button
        >
      </article>
      <article
        v-for="row in data.accounts.filter(
          (item) => !item.code.startsWith('bank_'),
        )"
        :key="row.code"
        class="balance-card"
      >
        <h2>{{ row.name }}</h2>
        <strong>{{ formatMoney(row.balance) }}</strong
        ><span>余额</span
        ><el-button
          v-if="administrator"
          v-permission="['finance:plan:modify']"
          link
          @click="opening(row.code)"
          >设置期初余额</el-button
        >
      </article>
    </div>
    <el-table :data="data.history" empty-text="暂无实际收付款记录"
      ><el-table-column prop="paymentDate" label="支付日期" /><el-table-column
        label="公司账户"
        ><template #default="{ row }">{{
          accountNames[row.accountCode]
        }}</template></el-table-column
      ><el-table-column label="收支"
        ><template #default="{ row }"
          ><span :class="row.direction === 'receive' ? 'positive' : 'negative'"
            >{{ row.direction === 'receive' ? '+' : '−'
            }}{{ formatMoney(row.amount) }}</span
          ></template
        ></el-table-column
      ><el-table-column prop="payer" label="付款人" /><el-table-column
        prop="payerAccount"
        label="支付账号" /><el-table-column
        prop="payee"
        label="收款人" /><el-table-column prop="payeeAccount" label="收款账号"
    /></el-table>
  </div>
</template>
<style scoped>
.cash-page {
  display: grid;
  gap: 22px;
}
.balance-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}
.balance-card {
  padding: 24px;
  border: 1px solid #dce6f5;
  border-radius: 12px;
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
@media (max-width: 900px) {
  .balance-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
