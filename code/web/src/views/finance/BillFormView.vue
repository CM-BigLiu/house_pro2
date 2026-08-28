<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createBill, type Bill } from '@/api/finance';
import { useDictStore } from '@/stores/dict';

const router = useRouter();
const dictStore = useDictStore();

const form = reactive<Partial<Bill>>({
  title: '', category: '', amount: 0, paidAmount: 0, status: 'pending',
  tenantName: '', houseTitle: '', billDate: '', dueDate: '',
});
const submitting = ref(false);

async function submit() {
  submitting.value = true;
  try {
    await createBill(form);
    ElMessage.success('创建成功');
    router.push('/finance/bill');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">新增账单</div>
        <div class="page-desc">创建应收应付账单</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/finance/bill')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card">
      <el-form :model="form" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="款项种类">
          <el-select v-model="form.category" style="width: 100%;">
            <el-option
              v-for="item in dictStore.getItems('billing_category')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="房源">
          <el-input v-model="form.houseTitle" />
        </el-form-item>
        <el-form-item label="租客">
          <el-input v-model="form.tenantName" />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="form.amount" :min="0" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="到期日">
          <el-date-picker v-model="form.dueDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.form-page { min-height: 100%; }
</style>