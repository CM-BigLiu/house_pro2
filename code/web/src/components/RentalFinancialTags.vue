<script setup lang="ts">
import type { RentalFinancialSummary } from '@/api/rental';
import { formatMoney } from '@/utils/format';
defineProps<{ summary?: RentalFinancialSummary; vacantCount?: number; totalRooms?: number }>();
const emit = defineEmits<{ select: [section: 'pay' | 'receive'] }>();
</script>
<template>
  <div v-if="summary" class="finance-tags" :aria-label="`${summary.period}收支与空置`">
    <button type="button" class="income" :title="`${summary.period}及往期未结账单，点击查看租客收款`" @click="emit('select', 'receive')">待收 <b>{{ formatMoney(summary.pendingIncome) }}</b></button>
    <button v-if="summary.pendingExpense !== undefined" type="button" class="expense" :title="`${summary.period}及往期未结账单，点击查看房东支付`" @click="emit('select', 'pay')">待付 <b>{{ formatMoney(summary.pendingExpense) }}</b></button>
    <button type="button" class="income" :title="`${summary.period}实际收款，点击查看租客收款`" @click="emit('select', 'receive')">已收 <b>{{ formatMoney(summary.received) }}</b></button>
    <button v-if="summary.paid !== undefined" type="button" class="expense" :title="`${summary.period}实际付款，点击查看房东支付`" @click="emit('select', 'pay')">已付 <b>{{ formatMoney(summary.paid) }}</b></button>
    <span v-if="totalRooms !== undefined" class="vacancy">空置 <b>{{ vacantCount || 0 }}/{{ totalRooms }} 间</b></span>
    <span v-if="summary.vacantDays !== undefined" class="vacancy" :title="`${summary.vacancySource === 'checkout' ? '退租' : '登记'}日期：${summary.vacantSince}`">{{ summary.vacancySource === 'registered' ? '登记空置' : '空置' }} <b>{{ summary.vacantDays }} 天</b></span>
  </div>
</template>
<style scoped>
.finance-tags { display:flex; gap:5px; flex-wrap:wrap; margin-top:10px; }.finance-tags > * { font-size:10px; padding:3px 5px; border-radius:4px; line-height:1.5; border:1px solid; }.finance-tags button { font-family:inherit; cursor:pointer; }.finance-tags button:hover { text-decoration:underline; }.income { background:#ecfdf5; color:#087b59; border-color:#bee9d7!important; }.expense { background:#fff5ed; color:#a64b17; border-color:#f6d4bc!important; }.vacancy { background:#fff1f5; color:#ae4268; border-color:#f4c8d6!important; }.finance-tags b { font-weight:600; }
</style>
