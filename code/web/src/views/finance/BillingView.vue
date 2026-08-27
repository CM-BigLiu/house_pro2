<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useDictStore } from '@/stores/dict';
import { getInvoices, createInvoice, updateInvoice, type Invoice } from '@/api/finance';

const dictStore = useDictStore();
const rows = ref<Invoice[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const form = reactive({
  applySource: '',
  buyerName: '',
  buyerTaxNo: '',
  amountWithTax: 0,
  invoiceType: 'normal',
  remark: '',
});

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    const res = await getInvoices();
    rows.value = res.list || [];
  } finally {
    loading.value = false;
  }
}

function apply() {
  Object.assign(form, { applySource: '', buyerName: '', buyerTaxNo: '', amountWithTax: 0, invoiceType: 'normal', remark: '' });
  dialogVisible.value = true;
}

async function submit() {
  const taxRate = 0.06;
  const amountWithTax = Number(form.amountWithTax);
  const amountWithoutTax = Math.round((amountWithTax / (1 + taxRate)) * 100) / 100;
  const taxAmount = Math.round((amountWithTax - amountWithoutTax) * 100) / 100;
  await createInvoice({
    applySource: form.applySource,
    buyerName: form.buyerName,
    buyerTaxNo: form.buyerTaxNo || undefined,
    amountWithoutTax,
    taxAmount,
    amountWithTax,
    remark: form.remark,
  });
  ElMessage.success('开票申请已提交');
  dialogVisible.value = false;
  await loadData();
}

async function approve(row: Invoice) {
  await updateInvoice(row.id, { status: 'done' });
  ElMessage.success('审批通过');
  await loadData();
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

function invoiceTypeLabel(row: Invoice) {
  return row.buyerTaxNo ? '专票' : '普票';
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

    <el-table v-loading="loading" :data="rows" class="card">
      <el-table-column prop="applySource" label="开票项目" />
      <el-table-column prop="buyerName" label="开票对象" />
      <el-table-column prop="amountWithTax" label="金额">
        <template #default="{ row }">
          <span class="income">¥{{ Number(row.amountWithTax).toLocaleString() }}</span>
        </template>
      </el-table-column>
      <el-table-column label="发票类型">
        <template #default="{ row }">{{ invoiceTypeLabel(row) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <span :class="['pill', statusClass(row.status)]">{{ dictStore.getLabel('ticket_status', row.status) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button v-permission="['finance:ticket:approve']" size="small" type="primary" plain @click="approve(row)">审批</el-button>
          <el-button size="small">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="开票申请" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="开票项目" required>
          <el-input v-model="form.applySource" />
        </el-form-item>
        <el-form-item label="开票对象">
          <el-input v-model="form.buyerName" />
        </el-form-item>
        <el-form-item label="纳税人识别号">
          <el-input v-model="form.buyerTaxNo" />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="form.amountWithTax" :min="0" controls-position="right" style="width: 100%;" />
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
