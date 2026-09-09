<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createReserveClient, getReserveClientForEdit, updateReserveClient, type ReserveClient } from '@/api/reserve-client';
import { useDictStore } from '@/stores/dict';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const route = useRoute();
const dictStore = useDictStore();
const userStore = useUserStore();
const submitting = ref(false);
const loading = ref(false);
const editId = computed(() => Number(route.params.id) || 0);
const isEdit = computed(() => editId.value > 0);

const form = reactive<Partial<ReserveClient>>({
  clientName: '', clientMobile: '', desiredLocation: '', demandType: 'rent',
  desiredLayout: '', areaMin: undefined, areaMax: undefined,
  priceMin: undefined, priceMax: undefined, sourceChannel: '',
  usage: '', urgency: 'normal', ownership: 'public', status: 'not_rented',
});

onMounted(async () => {
  await dictStore.ensureLoaded(['customer_status', 'source_channel', 'demand_type', 'urgency', 'disk_type']);
  if (isEdit.value) {
    loading.value = true;
    try {
      Object.assign(form, await getReserveClientForEdit(editId.value));
    } catch {
      router.push('/house/reserve-client');
    } finally {
      loading.value = false;
    }
  }
});

async function submit() {
  if (!form.clientName?.trim()) return ElMessage.warning('请填写姓名');
  if (!form.demandType) return ElMessage.warning('请选择需求类型');
  submitting.value = true;
  try {
    if (isEdit.value) await updateReserveClient(editId.value, form);
    else await createReserveClient({ ...form, storeId: userStore.userInfo?.storeIds?.[0] || 0 });
    ElMessage.success(isEdit.value ? '保存成功' : '创建成功');
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
        <div class="page-title">{{ isEdit ? '编辑储备客源' : '录入储备客源' }}</div>
        <div class="page-desc">维护意向需求资料；签约和跟进请在列表执行</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/house/reserve-client')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card" style="padding: 24px;" v-loading="loading">
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
