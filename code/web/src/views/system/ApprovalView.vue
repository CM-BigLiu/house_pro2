<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  approveApproval,
  getApprovals,
  rejectApproval,
  type ApprovalQuery,
  type ApprovalRecord,
  type ApprovalResult,
} from '@/api/approval';

const route = useRoute();
const rows = ref<ApprovalRecord[]>([]);
const total = ref(0);
const loading = ref(false);
const reviewVisible = ref(false);
const reviewRecord = ref<ApprovalRecord>();
const reviewAction = ref<'approve' | 'reject'>('approve');
const reviewRemark = ref('');
const reviewing = ref(false);

const query = reactive({
  page: 1,
  pageSize: 20,
  result: '' as ApprovalResult | '',
  entityType: String(route.query.entityType || ''),
  entityId: route.query.entityId ? Number(route.query.entityId) : undefined as number | undefined,
});

const entityLabels: Record<string, string> = {
  sale_property: '售房房源',
  rental_room: '出租房间',
  bill: '账单',
  invoice: '发票',
};

const statusLabels: Record<string, string> = {
  pre_publish: '待发布', published: '已发布', selling: '已发布', price_negotiation: '议价中', bargain: '议价中',
  quick_sale: '急售', sold: '已售', off_shelf: '已下架', vacant: '空置', reserved: '已预订',
  rented: '已出租', checkout: '退租中', configuring: '配置中', dirty: '待保洁', repair: '维修中',
  pending: '待处理', processing: '处理中', done: '已完成', issued: '已开票', voided: '已作废',
  pending_receive: '待收款', due: '应收', received: '已收款', final_review: '终审', cashiered: '已出纳',
  overdue: '逾期', refunded: '已退款', pending_pay: '待付款', paid: '已付款', red_flushed: '已红冲',
};

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const params: ApprovalQuery = { page: query.page, pageSize: query.pageSize };
    if (query.result) params.result = query.result;
    if (query.entityType) params.entityType = query.entityType;
    if (query.entityId) params.entityId = query.entityId;
    const response = await getApprovals(params);
    rows.value = response.list;
    total.value = response.total;
  } finally {
    loading.value = false;
  }
}

function reset() {
  query.page = 1;
  query.result = '';
  query.entityType = '';
  query.entityId = undefined;
  load();
}

function setResult(result: ApprovalResult | '') {
  query.result = result;
  query.page = 1;
  load();
}

function openReview(row: ApprovalRecord, action: 'approve' | 'reject') {
  reviewRecord.value = row;
  reviewAction.value = action;
  reviewRemark.value = '';
  reviewVisible.value = true;
}

async function submitReview() {
  if (!reviewRecord.value || reviewing.value) return;
  reviewing.value = true;
  try {
    if (reviewAction.value === 'approve') {
      await approveApproval(reviewRecord.value.id, reviewRemark.value);
      ElMessage.success('审批已通过，业务状态已更新');
    } else {
      await rejectApproval(reviewRecord.value.id, reviewRemark.value);
      ElMessage.success('审批已驳回，业务状态保持不变');
    }
    reviewVisible.value = false;
    await load();
  } finally {
    reviewing.value = false;
  }
}

function resultLabel(result: ApprovalResult) {
  return ({ pending: '待审批', approved: '已通过', rejected: '已驳回' } as Record<string, string>)[result] || result;
}

function resultClass(result: ApprovalResult) {
  return ({ pending: 'pill-orange', approved: 'pill-green', rejected: 'pill-red' } as Record<string, string>)[result] || 'pill-gray';
}

function statusLabel(status: string) {
  return statusLabels[status] || status || '--';
}
</script>

<template>
  <div class="system-view">
    <div class="page-header">
      <div>
        <div class="page-title">审批中心</div>
        <div class="page-desc">集中处理业务状态变更申请，审批通过后业务状态才会生效</div>
      </div>
    </div>

    <div class="status-tabs">
      <button :class="['status-tab', { active: query.result === '' }]" @click="setResult('')">全部</button>
      <button :class="['status-tab', { active: query.result === 'pending' }]" @click="setResult('pending')">待审批</button>
      <button :class="['status-tab', { active: query.result === 'approved' }]" @click="setResult('approved')">已通过</button>
      <button :class="['status-tab', { active: query.result === 'rejected' }]" @click="setResult('rejected')">已驳回</button>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">业务类型</span>
        <select v-model="query.entityType" class="select" @change="query.page = 1; load()">
          <option value="">全部</option>
          <option v-for="(label, value) in entityLabels" :key="value" :value="value">{{ label }}</option>
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">业务编号</span>
        <input v-model.number="query.entityId" class="input input-sm" type="number" min="1" placeholder="输入编号" @keyup.enter="load" />
      </div>
      <button class="btn btn-primary" @click="query.page = 1; load()">查询</button>
      <button class="btn btn-default" @click="reset">重置</button>
    </div>

    <div class="summary-row">
      <span class="summary-chip">共 <strong>{{ total }}</strong> 条审批记录</span>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table v-loading="loading" class="data-table">
          <thead>
            <tr>
              <th style="width: 160px;">申请时间</th>
              <th style="width: 120px;">业务类型</th>
              <th style="width: 90px;">业务编号</th>
              <th style="width: 190px;">状态变更</th>
              <th style="width: 100px;">申请人</th>
              <th>备注</th>
              <th style="width: 100px;">审批结果</th>
              <th style="width: 100px;">审批人</th>
              <th style="width: 150px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!loading && rows.length === 0">
              <td colspan="9" class="empty-cell">暂无审批记录</td>
            </tr>
            <tr v-for="row in rows" :key="row.id">
              <td><span class="mono">{{ new Date(row.createdAt).toLocaleString() }}</span></td>
              <td>{{ entityLabels[row.entityType] || row.entityType }}</td>
              <td><span class="mono">#{{ row.entityId }}</span></td>
              <td>{{ statusLabel(row.fromStatus) }} → {{ statusLabel(row.toStatus) }}</td>
              <td>{{ row.operatorName || `员工#${row.operatorId}` }}</td>
              <td class="remark-cell" :title="row.remark">{{ row.remark || '--' }}</td>
              <td><span :class="['pill', resultClass(row.result)]">{{ resultLabel(row.result) }}</span></td>
              <td>{{ row.approverName || '--' }}</td>
              <td>
                <div v-if="row.result === 'pending'" v-permission="['system:approval:review']" class="operation-cell">
                  <button class="btn btn-primary btn-sm" @click="openReview(row, 'approve')">通过</button>
                  <button class="btn btn-danger btn-sm" @click="openReview(row, 'reject')">驳回</button>
                </div>
                <span v-else class="text-muted">已处理</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="table-footer">
        <span class="text-muted">共 {{ total }} 条</span>
        <div class="pagination">
          <button class="page-btn" :disabled="query.page <= 1" @click="query.page--; load()">‹</button>
          <span class="text-muted">第 {{ query.page }} / {{ Math.max(1, Math.ceil(total / query.pageSize)) }} 页</span>
          <button class="page-btn" :disabled="query.page >= Math.ceil(total / query.pageSize)" @click="query.page++; load()">›</button>
        </div>
      </div>
    </div>

    <el-dialog v-model="reviewVisible" :title="reviewAction === 'approve' ? '通过审批' : '驳回审批'" width="460px">
      <p v-if="reviewRecord" class="review-summary">
        {{ entityLabels[reviewRecord.entityType] || reviewRecord.entityType }} #{{ reviewRecord.entityId }}：
        {{ statusLabel(reviewRecord.fromStatus) }} → {{ statusLabel(reviewRecord.toStatus) }}
      </p>
      <el-input v-model="reviewRemark" type="textarea" :rows="4" maxlength="500" show-word-limit placeholder="填写审批意见（选填）" />
      <template #footer>
        <el-button :disabled="reviewing" @click="reviewVisible = false">取消</el-button>
        <el-button :type="reviewAction === 'approve' ? 'primary' : 'danger'" :loading="reviewing" @click="submitReview">
          确认{{ reviewAction === 'approve' ? '通过' : '驳回' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.system-view { min-height: 100%; }
.empty-cell { padding: 48px 0; text-align: center; color: var(--ink-400); }
.remark-cell { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: pre-line; }
.review-summary { margin: 0 0 16px; color: var(--ink-600); }
</style>
