<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getFlows, type Flow } from '@/api/finance';
import { useDictStore } from '@/stores/dict';
import { formatMoney } from '@/utils/format';
import { downloadCsv } from '@/utils/csv';

const router = useRouter();
const dictStore = useDictStore();
const list = ref<Flow[]>([]);
const loading = ref(false);
const total = ref(0);
const query = reactive({ keyword: '', type: '', page: 1, pageSize: 20 });

onMounted(async () => {
  await dictStore.ensureLoaded(['payment_type']);
  await load();
});

async function load() {
  loading.value = true;
  try {
    const res = await getFlows(query);
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function editFlow(row: Flow) { router.push(`/finance/daily-account/edit/${row.id}`); }
function exportCurrent() {
  downloadCsv(`流水-${new Date().toISOString().slice(0, 10)}.csv`, [
    ['编号', '摘要', '方向', '金额', '业务类型', '支付方式', '发生日期', '状态'],
    ...list.value.map((row) => [row.id, row.title, row.type, row.amount, row.bizType, row.paymentType, row.flowDate, row.status]),
  ]);
}

function typeClass(type: string) {
  return type === 'income' ? 'pill-green' : 'pill-red';
}
</script>

<template>
  <div class="finance-view">
    <div class="page-header">
      <div>
        <div class="page-title">流水账</div>
        <div class="page-desc">记录每一笔收入与支出流水，关联房源与客户</div>
      </div>
      <div class="page-actions">
        <button v-permission="['finance:flow:modify']" class="btn btn-primary" @click="router.push('/finance/daily-account/create')">记一笔</button>
        <el-button v-permission="['finance:flow:export']" @click="exportCurrent">导出</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="搜索摘要" clearable @keyup.enter="load" />
      <el-select v-model="query.type" placeholder="类型" clearable @change="load">
        <el-option label="收入" value="income" />
        <el-option label="支出" value="expense" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <el-table :data="list" v-loading="loading" class="card">
      <el-table-column prop="title" label="摘要" min-width="160" />
      <el-table-column label="类型" width="90">
        <template #default="{ row }">
          <span :class="['pill', typeClass(row.type)]">{{ row.type === 'income' ? '收入' : '支出' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" width="120">
        <template #default="{ row }">
          <span :class="row.type === 'income' ? 'income' : 'expense'">{{ formatMoney(row.amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="支付方式" width="110">
        <template #default="{ row }">
          {{ dictStore.getLabel('payment_type', row.paymentType) }}
        </template>
      </el-table-column>
      <el-table-column prop="houseTitle" label="房源" min-width="140" />
      <el-table-column prop="customerName" label="客户" width="110" />
      <el-table-column prop="flowDate" label="日期" width="110" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button v-permission="['finance:flow:modify']" size="small" type="primary" plain :disabled="row.status !== 'pending' || row.audited || row.isRed" @click="editFlow(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="table-footer"><span>共 {{ total }} 条</span><el-pagination v-model:current-page="query.page" :page-size="query.pageSize" :total="total" layout="prev, pager, next" @change="load" /></div>
  </div>
</template>

<style scoped lang="scss">
.finance-view { min-height: 100%; }
.income { color: var(--success); font-weight: 700; }
.expense { color: var(--danger); font-weight: 700; }
</style>
