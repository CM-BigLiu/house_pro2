<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getBusinessSubmissions,
  reviewBusinessSubmission,
  type BusinessSubmission,
  type BusinessPerformance,
} from '@/api/business';
import BusinessPerformanceDetails from '@/components/BusinessPerformanceDetails.vue';
import { formatMoney } from '@/utils/format';
const rows = ref<BusinessSubmission[]>([]),
  loading = ref(false),
  failed = ref(false),
  busy = ref(false),
  detail = ref<BusinessSubmission | null>(null);
const names: Record<string, string> = {
  performance: '业绩核算',
  management: '房管房业务',
  regular: '普租',
  sale: '买卖',
};
const statuses: Record<string, string> = {
  submitted: '待财务处理',
  returned: '已退回',
  saved: '已保存',
};
async function load() {
  loading.value = true;
  failed.value = false;
  try {
    rows.value = await getBusinessSubmissions();
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
}
async function review(row: BusinessSubmission, action: 'return' | 'save') {
  if (busy.value) return;
  let note = '';
  if (action === 'return') {
    try {
      const result = await ElMessageBox.prompt(
        '填写退回原因，报送人可以修正后重新提交',
        '退回财务提交',
        { inputValidator: (value) => !!value?.trim() || '请填写退回原因' },
      );
      note = result.value;
    } catch {
      return;
    }
  }
  busy.value = true;
  try {
    await reviewBusinessSubmission(row.id, action, note);
    ElMessage.success(action === 'return' ? '已退回' : '已保存');
    detail.value = null;
    await load();
  } catch {
    /* 请求层提示。 */
  } finally {
    busy.value = false;
  }
}
function completeRow(row: Partial<BusinessPerformance>) {
  const empty = () => ({ amount: 0, commission: 0, details: [] });
  const sections = [row.regular, row.management, row.tenant, row.sale];
  return {
    employeeId: row.employeeId || 0,
    employeeName: row.employeeName || '',
    employeeCode: row.employeeCode || '',
    regular: row.regular || empty(),
    management: row.management || empty(),
    tenant: row.tenant || empty(),
    sale: row.sale || empty(),
    totalAmount:
      row.totalAmount ??
      sections.reduce((sum, s) => sum + Number(s?.amount || 0), 0),
    totalCommission:
      row.totalCommission ??
      sections.reduce((sum, s) => sum + Number(s?.commission || 0), 0),
  };
}
onMounted(load);
</script>
<template>
  <div class="review-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">财务管理</h1>
        <p class="page-desc">
          查看业绩核算、房管房业务、普租与买卖提交，保存或退回
        </p>
      </div>
      <el-button :loading="loading" @click="load">刷新</el-button>
    </header>
    <el-alert
      v-if="failed"
      title="财务提交加载失败，请重试"
      type="error"
      :closable="false"
    />
    <el-table :data="rows" v-loading="loading"
      ><el-table-column label="业务"
        ><template #default="{ row }">{{
          names[row.type]
        }}</template></el-table-column
      ><el-table-column prop="period" label="月份" /><el-table-column
        prop="employeeName"
        label="提交人"
      /><el-table-column label="提交时间"
        ><template #default="{ row }">{{
          new Date(row.createdAt).toLocaleString('zh-CN')
        }}</template></el-table-column
      ><el-table-column label="状态"
        ><template #default="{ row }">{{
          statuses[row.status]
        }}</template></el-table-column
      ><el-table-column prop="reviewNote" label="退回原因" /><el-table-column
        label="操作"
        min-width="180"
        ><template #default="{ row }"
          ><el-button link type="primary" @click="detail = row">查看</el-button
          ><template v-if="row.status === 'submitted'"
            ><el-button
              v-permission="['finance:accounting:modify']"
              link
              :disabled="busy"
              @click="review(row, 'return')"
              >退回</el-button
            ><el-button
              v-permission="['finance:accounting:modify']"
              link
              :disabled="busy"
              @click="review(row, 'save')"
              >保存</el-button
            ></template
          ></template
        ></el-table-column
      ></el-table
    >
    <el-dialog
      :model-value="!!detail"
      :title="`${names[detail?.type || '']} · ${detail?.period || ''}`"
      width="min(1150px,96vw)"
      @update:model-value="
        (value: boolean) => {
          if (!value) detail = null;
        }
      "
    >
      <template v-if="detail"
        ><p>
          {{ detail.employeeName }} · {{ statuses[detail.status] }}
          {{ detail.reviewNote }}
        </p>
        <template v-if="detail.type === 'management'"
          ><section
            v-for="bucket in detail.snapshot.buckets?.filter(
              (b) => b.period === detail?.period,
            )"
            :key="bucket.direction"
          >
            <h3>
              {{ bucket.direction === 'pay' ? '本月需支付' : '本月需收入' }}
              {{ formatMoney(bucket.amount) }}
            </h3>
            <el-table :data="bucket.list"
              ><el-table-column
                prop="propertyName"
                label="房屋地址"
              /><el-table-column
                prop="dueDate"
                label="支付日期"
              /><el-table-column label="支付金额"
                ><template #default="{ row }">{{
                  formatMoney(row.remaining)
                }}</template></el-table-column
              ></el-table
            >
          </section></template
        >
        <BusinessPerformanceDetails
          v-for="row in detail.snapshot.list || []"
          v-else
          :key="row.employeeId"
          :row="completeRow(row)"
        />
        <section v-if="detail.type === 'management'">
          <h3>本月实际收付款记录</h3>
          <el-table :data="detail.snapshot.payments || []"
            ><el-table-column
              prop="propertyName"
              label="房屋地址" /><el-table-column
              prop="paymentDate"
              label="支付日期" /><el-table-column label="收支"
              ><template #default="{ row }"
                >{{ row.direction === 'pay' ? '支付' : '收入' }}
                {{ formatMoney(row.amount) }}</template
              ></el-table-column
            ><el-table-column prop="payer" label="付款人" /><el-table-column
              prop="payee"
              label="收款人"
          /></el-table>
        </section>
      </template>
      <template #footer
        ><template v-if="detail?.status === 'submitted'"
          ><el-button
            v-permission="['finance:accounting:modify']"
            :disabled="busy"
            @click="review(detail, 'return')"
            >退回</el-button
          ><el-button
            v-permission="['finance:accounting:modify']"
            type="primary"
            :loading="busy"
            @click="review(detail, 'save')"
            >保存</el-button
          ></template
        ><el-button @click="detail = null">关闭</el-button></template
      >
    </el-dialog>
  </div>
</template>
<style scoped>
.review-page {
  display: grid;
  gap: 20px;
}
section {
  margin-bottom: 20px;
}
</style>
