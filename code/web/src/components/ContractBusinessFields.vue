<script setup lang="ts">
import type { ContractDetails } from '@/api/business';
import MoneyInput from './MoneyInput.vue';
import FreeRentPeriod from './FreeRentPeriod.vue';
defineProps<{
  details: ContractDetails;
  leaseStart?: string;
  mode: 'regular' | 'tenant' | 'management';
}>();
</script>

<template>
  <el-row :gutter="14">
    <template v-if="mode !== 'tenant'">
      <el-col :xs="24" :sm="12"
        ><el-form-item label="业主姓名" required
          ><el-input
            v-model="details.ownerName"
            maxlength="100" /></el-form-item
      ></el-col>
      <el-col :xs="24" :sm="12"
        ><el-form-item label="业主身份证" required
          ><el-input
            v-model="details.ownerIdCard"
            maxlength="18" /></el-form-item
      ></el-col>
      <el-col :xs="24" :sm="12"
        ><el-form-item label="业主通讯地址" required
          ><el-input
            v-model="details.ownerAddress"
            maxlength="255" /></el-form-item
      ></el-col>
      <el-col :xs="24" :sm="12"
        ><el-form-item label="业主电话" required
          ><el-input
            v-model="details.ownerPhone"
            maxlength="11" /></el-form-item
      ></el-col>
    </template>
    <el-col :span="24"
      ><el-form-item label="房屋地址" required
        ><el-input
          v-model="details.propertyAddress"
          maxlength="255" /></el-form-item
    ></el-col>
    <template v-if="mode !== 'management'">
      <el-col :xs="24" :sm="12"
        ><el-form-item label="客户身份证" required
          ><el-input
            v-model="details.customerIdCard"
            maxlength="18" /></el-form-item
      ></el-col>
      <el-col :xs="24" :sm="12"
        ><el-form-item label="客户通讯地址" required
          ><el-input
            v-model="details.customerAddress"
            maxlength="255" /></el-form-item
      ></el-col>
    </template>
    <template v-if="mode === 'tenant'">
      <el-col :xs="24" :sm="12"
        ><el-form-item label="常居人数" required
          ><el-input-number
            v-model="details.occupants"
            :min="1"
            :max="100"
            :precision="0" /></el-form-item
      ></el-col>
      <el-col :xs="24" :sm="12"
        ><el-form-item label="本房最多容纳人数" required
          ><el-input-number
            v-model="details.maxOccupants"
            :min="1"
            :max="100"
            :precision="0" /></el-form-item
      ></el-col>
    </template>
    <el-col :span="24"
      ><el-form-item label="押金情况"
        ><el-input
          v-model="details.depositNote"
          maxlength="255"
          placeholder="押金约定、退还条件等" /></el-form-item
    ></el-col>
    <el-col v-if="mode !== 'regular'" :xs="24" :sm="12"
      ><el-form-item label="首期付款日期" required
        ><el-date-picker
          v-model="details.paymentDate"
          type="date"
          value-format="YYYY-MM-DD" /></el-form-item
    ></el-col>
    <template v-if="mode === 'management'">
      <el-col :xs="24" :sm="12"
        ><el-form-item label="收款人" required
          ><el-input v-model="details.payee" maxlength="100" /></el-form-item
      ></el-col>
      <el-col :span="24"
        ><el-form-item label="收款账号" required
          ><el-input
            v-model="details.payeeAccount"
            maxlength="100" /></el-form-item
      ></el-col>
      <el-col :span="24"><FreeRentPeriod v-model="details.freeDays" :start="leaseStart" /></el-col>
    </template>
    <template v-else>
      <el-col :xs="24" :sm="8"
        ><el-form-item label="佣金金额（元）" required
          ><MoneyInput
            v-model="details.commissionAmount"
             /></el-form-item
      ></el-col>
    </template>
    <el-col :xs="24" :sm="8"
      ><el-form-item label="绩效分成（%）"
        ><el-input-number
          v-model="details.performanceRatio"
          :min="0"
          :max="100"
          :precision="2" /></el-form-item
    ></el-col>
    <el-col :xs="24" :sm="8"
      ><el-form-item label="提成比例（%）"
        ><el-input-number
          v-model="details.commissionRatio"
          :min="0"
          :max="100"
          :precision="2" /></el-form-item
    ></el-col>
  </el-row>
</template>
