<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createFlow, type Flow } from '@/api/finance';
import { useDictStore } from '@/stores/dict';

const router = useRouter();
const dictStore = useDictStore();

const form = reactive<Partial<Flow>>({
  title: '', type: 'income', amount: 0, paymentType: '', houseTitle: '', customerName: '', flowDate: '',
});
const submitting = ref(false);

async function submit() {
  submitting.value = true;
  try {
    await createFlow(form);
    ElMessage.success('创建成功');
    router.push('/finance/daily-account');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">记一笔</div>
        <div class="page-desc">记录收入与支出流水</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/finance/daily-account')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card">
      <el-form :model="form" label-width="80px">
        <el-form-item label="摘要" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio label="income">收入</el-radio>
            <el-radio label="expense">支出</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="form.amount" :min="0" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="form.paymentType" style="width: 100%;">
            <el-option
              v-for="item in dictStore.getItems('payment_type')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="form.flowDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.form-page { min-height: 100%; }
</style>