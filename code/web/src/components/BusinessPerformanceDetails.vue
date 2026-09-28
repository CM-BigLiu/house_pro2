<script setup lang="ts">
import type { BusinessPerformance } from '@/api/business';
import { formatMoney } from '@/utils/format';
defineProps<{ row: BusinessPerformance }>();
const columns = [
  { type: 'regular' as const, label: '普租' },
  { type: 'management' as const, label: '房管房' },
  { type: 'tenant' as const, label: '承租' },
  { type: 'sale' as const, label: '买卖' },
];
const configNames: Record<string, string> = {
  cleaning: '保洁',
  repair: '维修',
  renovation: '装修',
  furniture: '家具',
  appliance: '家电',
  collection_bonus: '收房奖',
  rental_bonus: '出房奖',
};
</script>
<template>
  <div class="performance-details">
    <h3>{{ row.employeeName }} · 员工编号 {{ row.employeeCode }}</h3>
    <section v-for="column in columns" :key="column.type">
      <h4>{{ column.label }}</h4>
      <el-table
        :data="row[column.type]?.details || []"
        empty-text="本月暂无记录"
        ><el-table-column
          prop="propertyName"
          label="成交房源 / 地址"
          min-width="150"
        /><el-table-column prop="contractCode" label="合同号" min-width="160" />
        <template v-if="column.type === 'management'">
          <el-table-column label="免租期"
            ><template #default="{ row: detail }"
              ><div v-for="(days, year) in detail.freeDays" :key="year">
                第{{ Number(year) + 1 }}年：{{ days }}天
              </div></template
            ></el-table-column
          >
          <el-table-column label="本月免租收益"
            ><template #default="{ row: detail }"
              ><span
                :class="detail.freeAmount >= 0 ? 'positive' : 'negative'"
                >{{ formatMoney(detail.freeAmount) }}</span
              ></template
            ></el-table-column
          >
          <el-table-column label="本月溢价收益"
            ><template #default="{ row: detail }"
              ><span
                :class="
                  detail.premium > 0
                    ? 'positive'
                    : detail.premium < 0
                      ? 'negative'
                      : 'neutral'
                "
                >{{
                  detail.premium > 0
                    ? '正溢价'
                    : detail.premium < 0
                      ? '负溢价'
                      : '0溢价'
                }}
                {{ formatMoney(detail.premium) }}</span
              ><small>{{ detail.occurredOn }}</small></template
            ></el-table-column
          >
          <el-table-column label="配置费用"
            ><template #default="{ row: detail }"
              >{{ formatMoney(detail.costs) }}
              <details v-if="detail.configuration?.length">
                <summary>配置与备注</summary>
                <p v-for="(item, index) in detail.configuration" :key="index">
                  {{ configNames[item.type] }}：{{ formatMoney(item.amount) }}
                  {{ item.recipient }}
                  {{
                    item.channel === 'cash'
                      ? '现金'
                      : item.channel === 'wechat'
                        ? '微信'
                        : item.channel === 'transfer'
                          ? '转账'
                          : ''
                  }}
                  {{ item.remark }}
                </p>
              </details></template
            ></el-table-column
          >
        </template>
        <template v-else-if="column.type === 'sale'"
          ><el-table-column prop="role" label="归属" /><el-table-column
            label="分配比例"
            ><template #default="{ row: detail }"
              >{{ detail.ratio ?? detail.performanceRatio ?? 100 }}%</template
            ></el-table-column
          ><el-table-column label="计佣金额"
            ><template #default="{ row: detail }">{{
              formatMoney(detail.amount)
            }}</template></el-table-column
          ></template
        >
        <template v-else
          ><el-table-column
            prop="customerName"
            label="成交客户"
          /><el-table-column label="收佣金额"
            ><template #default="{ row: detail }">{{
              formatMoney(detail.received)
            }}</template></el-table-column
          ><el-table-column label="绩效分成"
            ><template #default="{ row: detail }"
              >{{ detail.performanceRatio }}%</template
            ></el-table-column
          ><el-table-column label="提成"
            ><template #default="{ row: detail }"
              >{{ formatMoney(detail.commission) }}（{{
                detail.commissionRatio
              }}%）</template
            ></el-table-column
          ></template
        >
      </el-table>
    </section>
    <h4>总计</h4>
    <table class="totals">
      <thead>
        <tr>
          <th>项目</th>
          <th v-for="column in columns" :key="column.type">
            {{ column.label }}
          </th>
          <th>总计</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>计佣金额</th>
          <td v-for="column in columns" :key="column.type">
            {{ formatMoney(row[column.type]?.amount || 0) }}
          </td>
          <td>{{ formatMoney(row.totalAmount || 0) }}</td>
        </tr>
        <tr>
          <th>提成金额</th>
          <td v-for="column in columns" :key="column.type">
            {{ formatMoney(row[column.type]?.commission || 0) }}
          </td>
          <td>{{ formatMoney(row.totalCommission || 0) }}</td>
        </tr>
        <tr>
          <th colspan="5">经纪人总收入（提成）</th>
          <td>{{ formatMoney(row.totalCommission || 0) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<style scoped>
.performance-details section {
  margin-bottom: 22px;
  overflow: auto;
}
.positive {
  color: #16a34a;
}
.negative {
  color: #dc2626;
}
.neutral {
  color: #64748b;
}
small {
  display: block;
  margin-top: 6px;
}
.totals {
  width: 100%;
  border-collapse: collapse;
}
.totals th,
.totals td {
  border: 1px solid #e2e8f0;
  padding: 12px;
  text-align: right;
}
.totals th:first-child {
  text-align: left;
}
details {
  font-size: 12px;
}
</style>
