<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { useDictStore } from '@/stores/dict';

const dictStore = useDictStore();
const dialogVisible = ref(false);
const form = reactive({
  title: '', amount: 0, taxType: '', invoiceType: 'normal', targetName: '', status: 'pending',
});
const rows = ref([
  { id: 1, title: '7月租金发票', amount: 12000, taxType: 'normal', invoiceType: 'normal', targetName: '张三', status: 'done' },
  { id: 2, title: '物业费发票', amount: 3600, taxType: 'normal', invoiceType: 'special', targetName: '李四', status: 'processing' },
]);

function apply() {
  dialogVisible.value = true;
}

function submit() {
  ElMessage.success('开票申请已提交');
  dialogVisible.value = false;
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    pending: 'pill-orange',
    processing: 'pill-blue',
    done: 'pill-green',
    rejected: 'pill-red',
  };
  return map[status] || 'pill-gray';
}
</script>

<template>
  <div class="finance-view">
    <div class="page-header">
      <div>
        <div class="page-title">开票管理</div>
        <div class="page-desc">发票申请、审批、开票状态跟踪</div>
      </div>
      <div class="page-actions">
        <el-button v-permission="['finance:ticket:apply']" type="primary" @click="apply">开票申请</el-button>
        <el-button v-permission="['finance:export']">导出</el-button>
      </div>
    </div>

    <el-table :data="rows" class="card">
      <el-table-column prop="title" label="开票项目" />
      <el-table-column prop="targetName" label="开票对象" />
      <el-table-column prop="amount" label="金额">
        <template #default="{ row }">
          <span class="income">¥{{ row.amount.toLocaleString() }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="invoiceType" label="发票类型">
        <template #default="{ row }">
          {{ row.invoiceType === 'normal' ? '普票' : '专票' }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <span :class="['pill', statusClass(row.status)]">{{ dictStore.getLabel('ticket_status', row.status) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{}">
          <el-button v-permission="['finance:ticket:approve']" size="small" type="primary" plain>审批</el-button>
          <el-button size="small">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="开票申请" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="开票项目" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="开票对象">
          <el-input v-model="form.targetName" />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="form.amount" :min="0" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="发票类型">
          <el-radio-group v-model="form.invoiceType">
            <el-radio label="normal">普票</el-radio>
            <el-radio label="special">专票</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.finance-view { min-height: 100%; }
.income { color: var(--success); font-weight: 700; }
</style>
