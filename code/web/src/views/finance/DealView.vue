<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getDeals, type Deal } from '@/api/deal';
import { useDictStore } from '@/stores/dict';
const router = useRouter(), dict = useDictStore();
const query = reactive({ keyword: '', bizType: '', status: '', startDate: '', endDate: '', page: 1, pageSize: 10 });
const rows = ref<Deal[]>([]), total = ref(0), loading = ref(false), failed = ref(false), detail = ref<Deal | null>(null);
const stats = ref({ total: 0, rentCount: 0, saleCount: 0, monthlyRent: 0, saleAmount: 0 });
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / query.pageSize)));
let generation = 0;
const statusLabel = (value: string) => ({ active: '合同生效', termination_pending: '解约待审批', terminated: '已解约' }[value] || value);
const currency = (value: number | null) => value == null ? '未登记' : `¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateTime = (value: string) => new Date(value).toLocaleString('zh-CN', { hour12: false });
async function load() {
  const current = ++generation; loading.value = true; failed.value = false;
  try { const result = await getDeals(query); if (current === generation) { rows.value = result.list; total.value = result.total; stats.value = result.stats; } }
  catch { if (current === generation) { rows.value = []; total.value = 0; stats.value = { total: 0, rentCount: 0, saleCount: 0, monthlyRent: 0, saleAmount: 0 }; failed.value = true; } }
  finally { if (current === generation) loading.value = false; }
}
function search() { query.page = 1; load(); }
function reset() { Object.assign(query, { keyword: '', bizType: '', status: '', startDate: '', endDate: '', page: 1 }); load(); }
onMounted(async () => { await dict.ensureLoaded(['payment_method']); await load(); });
</script>

<template>
  <div class="deal-page">
    <div class="page-header"><div><div class="page-title">成交管理</div><div class="page-desc">租售合同统一归档，签约和解约由客户管理发起</div></div><button class="btn btn-default" @click="load">刷新</button></div>
    <div class="filter-bar">
      <input v-model="query.keyword" class="input keyword" placeholder="合同编号 / 客户 / 房源 / 负责人" @keyup.enter="search" />
      <select v-model="query.bizType" class="select"><option value="">全部业务</option><option value="rent">租房成交</option><option value="sale">买房成交</option></select>
      <select v-model="query.status" class="select"><option value="">全部状态</option><option value="active">合同生效</option><option value="termination_pending">解约待审批</option><option value="terminated">已解约</option></select>
      <label class="date-filter">签约时间<input v-model="query.startDate" type="date" class="input" /><span>至</span><input v-model="query.endDate" type="date" class="input" /></label>
      <button class="btn btn-primary btn-sm" @click="search">筛选</button><button class="btn btn-ghost btn-sm" @click="reset">重置</button>
    </div>
    <div class="summary-row"><span class="summary-chip">成交 {{ stats.total }} 单</span><span class="summary-chip">租房 {{ stats.rentCount }} 单</span><span class="summary-chip">买房 {{ stats.saleCount }} 单</span><span class="summary-chip">生效月租 {{ currency(stats.monthlyRent) }}</span><span class="summary-chip">生效售房总价 {{ currency(stats.saleAmount) }}</span></div>
    <p class="data-hint">统计按当前筛选与数据权限计算；合同金额不代表实收款，解约记录保留追溯。</p>
    <div v-if="failed" class="load-error">成交记录加载失败。<button class="btn btn-ghost btn-sm" @click="load">重试</button></div>
    <div class="table-wrap" v-loading="loading"><table class="data-table"><thead><tr><th>合同编号</th><th>业务类型</th><th>客户</th><th>房源信息</th><th>签约时间</th><th>合同金额</th><th>负责人</th><th>合同状态</th><th>操作</th></tr></thead><tbody>
      <tr v-if="!rows.length"><td colspan="9" class="empty-row">{{ failed ? '加载失败，请重试' : '暂无成交记录' }}</td></tr>
      <tr v-for="row in rows" :key="row.id" @dblclick="detail = row"><td>{{ row.contractCode }}</td><td><span class="pill pill-blue">{{ row.bizType === 'rent' ? '租房' : '买房' }}</span></td><td><div class="cell-main">{{ row.customerName }}</div><div class="cell-sub">{{ row.customerPhone || '—' }}</div></td><td><div class="cell-main">{{ row.propertyName }}</div><div class="cell-sub">{{ row.propertyCode }}{{ row.roomId ? ' · 合租房间' : '' }}</div></td><td>{{ dateTime(row.signedAt) }}</td><td>{{ currency(row.amount) }}<span class="cell-sub">{{ row.bizType === 'rent' ? '/月' : '总价' }}</span></td><td>{{ row.responsibleEmployeeName }}</td><td><span :class="['pill', row.status === 'active' ? 'pill-green' : row.status === 'terminated' ? 'pill-gray' : 'pill-blue']">{{ statusLabel(row.status) }}</span></td><td><button class="btn btn-ghost btn-sm" @click.stop="detail = row">查看</button></td></tr>
    </tbody></table></div>
    <div class="table-footer"><span>共 {{ total }} 条</span><div class="pagination"><button class="page-btn" :disabled="query.page <= 1 || loading" @click="query.page--; load()">上一页</button><span class="page-info">第 {{ query.page }} 页 / 共 {{ pageCount }} 页</span><button class="page-btn" :disabled="query.page >= pageCount || loading" @click="query.page++; load()">下一页</button></div></div>
    <el-dialog :model-value="!!detail" title="成交详情" width="min(680px, 94vw)" @update:model-value="(value: boolean) => { if (!value) detail = null; }">
      <el-descriptions v-if="detail" :column="2" border><el-descriptions-item label="合同编号" :span="2">{{ detail.contractCode }}</el-descriptions-item><el-descriptions-item label="客户">{{ detail.customerName }}</el-descriptions-item><el-descriptions-item label="联系电话">{{ detail.customerPhone || '未登记' }}</el-descriptions-item><el-descriptions-item label="房源" :span="2">{{ detail.propertyName }} · {{ detail.propertyCode }}</el-descriptions-item><el-descriptions-item label="签约时间" :span="2">{{ dateTime(detail.signedAt) }}</el-descriptions-item><el-descriptions-item label="合同状态">{{ statusLabel(detail.status) }}</el-descriptions-item><el-descriptions-item label="负责人">{{ detail.responsibleEmployeeName }}</el-descriptions-item><el-descriptions-item :label="detail.bizType === 'rent' ? '月租金' : '成交总价'">{{ currency(detail.amount) }}</el-descriptions-item><el-descriptions-item label="押金">{{ currency(detail.deposit) }}</el-descriptions-item><template v-if="detail.bizType === 'rent'"><el-descriptions-item label="租赁期限" :span="2">{{ detail.leaseStart || '未登记' }} 至 {{ detail.leaseEnd || '未登记' }}</el-descriptions-item><el-descriptions-item label="付款方式" :span="2">{{ detail.paymentMethod ? dict.getLabel('payment_method', detail.paymentMethod) : '未登记' }}</el-descriptions-item></template><el-descriptions-item v-if="detail.terminatedOn" label="解约日期">{{ detail.terminatedOn }}</el-descriptions-item><el-descriptions-item v-if="detail.terminationReason" label="解约原因" :span="2">{{ detail.terminationReason }}</el-descriptions-item><el-descriptions-item label="备注" :span="2">{{ detail.remark || '—' }}</el-descriptions-item></el-descriptions>
      <template #footer><el-button v-if="detail?.customerId" v-permission="['house:customer']" @click="router.push({ path: '/house/customer', query: { keyword: detail.customerName } })">前往客户管理</el-button><el-button @click="detail = null">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.deal-page { min-height: 100%; }.keyword { width: 270px; }.filter-bar > .select { width: 140px; }
.date-filter { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #8195b5; }.date-filter input { width: 145px; }
.data-hint { color: #8195b5; font-size: 12px; margin: 14px 0; }.load-error { color: #e45959; padding: 12px; }
.data-table { min-width: 1040px; }.table-wrap { overflow-x: auto; }.data-table td { white-space: nowrap; }
@media(max-width: 768px) { .keyword { width: 100%; }.date-filter { flex-wrap: wrap; } }
</style>
