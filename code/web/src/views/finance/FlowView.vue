<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getFlows, type Flow } from '@/api/finance';
import { useDictStore } from '@/stores/dict';
import { formatMoney } from '@/utils/format';

const router = useRouter();
const dictStore = useDictStore();
const list = ref<Flow[]>([]);
const loading = ref(false);
const query = reactive({ keyword: '', type: '' });

onMounted(async () => {
  await dictStore.ensureLoaded(['payment_type']);
  await load();
});

async function load() {
  loading.value = true;
  try {
    const res = await getFlows(query);
    list.value = res.list;
  } finally {
    loading.value = false;
  }
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
        <button class="btn btn-primary" @click="router.push('/finance/daily-account/create')">记一笔</button>
        <el-button v-permission="['finance:export']">导出</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="摘要/房源/客户" clearable @keyup.enter="load" />
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
        <template #default="{}">
          <el-button size="small" type="primary" plain>编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.finance-view { min-height: 100%; }
.income { color: var(--success); font-weight: 700; }
.expense { color: var(--danger); font-weight: 700; }
</style>