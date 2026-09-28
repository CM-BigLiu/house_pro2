<script setup lang="ts">
import type { RentalFinancialSummary } from '@/api/rental';
import { formatMoney } from '@/utils/format';
defineProps<{ summary?: RentalFinancialSummary; vacantCount?: number; totalRooms?: number }>();
</script>
<template>
  <div v-if="summary" class="finance-tags" :aria-label="`${summary.period}收支与空置`">
    <span class="income" :title="`${summary.period}及往期未结账单`">待收 <b>{{ formatMoney(summary.pendingIncome) }}</b></span>
    <span v-if="summary.pendingExpense !== undefined" class="expense" :title="`${summary.period}及往期未结账单`">待付 <b>{{ formatMoney(summary.pendingExpense) }}</b></span>
    <span class="income" :title="`${summary.period}实际收款`">已收 <b>{{ formatMoney(summary.received) }}</b></span>
    <span v-if="summary.paid !== undefined" class="expense" :title="`${summary.period}实际付款`">已付 <b>{{ formatMoney(summary.paid) }}</b></span>
    <span v-if="totalRooms !== undefined" class="vacancy">空置 <b>{{ vacantCount || 0 }}/{{ totalRooms }} 间</b></span>
    <span v-if="summary.vacantDays !== undefined" class="vacancy" :title="`${summary.vacancySource === 'checkout' ? '退租' : '登记'}日期：${summary.vacantSince}`">{{ summary.vacancySource === 'registered' ? '登记空置' : '空置' }} <b>{{ summary.vacantDays }} 天</b></span>
  </div>
</template>
<style scoped>
.finance-tags { display:flex; gap:5px; flex-wrap:wrap; margin-top:10px; }.finance-tags span { font-size:10px; padding:3px 5px; border-radius:4px; line-height:1.5; border:1px solid; }.income { background:#ecfdf5; color:#087b59; border-color:#bee9d7!important; }.expense { background:#fff5ed; color:#a64b17; border-color:#f6d4bc!important; }.vacancy { background:#fff1f5; color:#ae4268; border-color:#f4c8d6!important; }.finance-tags b { font-weight:600; }
</style>
