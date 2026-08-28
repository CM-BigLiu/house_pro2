<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createReserveClient, type ReserveClient } from '@/api/reserve-client';
import { useDictStore } from '@/stores/dict';

const router = useRouter();
const dictStore = useDictStore();
const submitting = ref(false);

const form = reactive<Partial<ReserveClient>>({
  clientName: '', clientMobile: '', desiredLocation: '', demandType: 'rent',
  desiredLayout: '', areaMin: undefined, areaMax: undefined,
  priceMin: undefined, priceMax: undefined, sourceChannel: '',
  usage: '', urgency: 'normal', ownership: 'public', status: 'not_rented',
});

onMounted(async () => {
  await dictStore.ensureLoaded(['customer_status', 'source_channel', 'demand_type', 'urgency', 'disk_type']);
});

async function submit() {
  if (!form.clientName?.trim()) return ElMessage.warning('请填写姓名');
  submitting.value = true;
  try {
    await createReserveClient(form);
    ElMessage.success('创建成功');
    router.push('/house/reserve-client');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">录入储备客源</div>
        <div class="page-desc">填写潜在客户信息与意向需求</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/house/reserve-client')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card" style="padding: 24px;">
      <el-form :model="form" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名" required>
              <el-input v-model="form.clientName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电话">
              <el-input v-model="form.clientMobile" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="需求类型">
              <el-select v-model="form.demandType" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('demand_type')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="意向户型">
              <el-input v-model="form.desiredLayout" placeholder="如：两室一厅" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="面积最小">
              <el-input-number v-model="form.areaMin" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面积最大">
              <el-input-number v-model="form.areaMax" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="预算最小">
              <el-input-number v-model="form.priceMin" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预算最大">
              <el-input-number v-model="form.priceMax" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="来源">
              <el-select v-model="form.sourceChannel" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('source_channel')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公私盘">
              <el-select v-model="form.ownership" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('disk_type')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="意向位置">
          <el-input v-model="form.desiredLocation" placeholder="如：张江、联洋" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-page { min-height: 100%; }
</style>