<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createCommunity, getCommunity, type Community, updateCommunity } from '@/api/community';
import { getCities } from '@/api/organization';

const router = useRouter();
const route = useRoute();
const submitting = ref(false);
const loading = ref(false);
const cities = ref<{ id: number; name: string }[]>([]);
const isEdit = computed(() => Boolean(route.params.id));

const form = reactive<Partial<Community>>({
  name: '', alias: '', cityId: undefined, district: '',
  businessCircle: '', address: '', longitude: undefined, latitude: undefined,
});

onMounted(async () => {
  cities.value = await getCities();
  if (!isEdit.value) return;
  loading.value = true;
  try {
    const detail = await getCommunity(Number(route.params.id));
    Object.assign(form, detail, {
      longitude: detail.longitude == null ? undefined : Number(detail.longitude),
      latitude: detail.latitude == null ? undefined : Number(detail.latitude),
    });
  } catch {
    ElMessage.error('加载小区数据失败');
    router.replace('/house/community');
  } finally {
    loading.value = false;
  }
});

async function submit() {
  if (!form.name?.trim()) return ElMessage.warning('请填写小区名称');
  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateCommunity(Number(route.params.id), form);
      ElMessage.success('修改成功');
    } else {
      await createCommunity(form);
      ElMessage.success('创建成功');
    }
    router.push('/house/community');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">{{ isEdit ? '编辑小区' : '新增小区' }}</div>
        <div class="page-desc">{{ isEdit ? '维护小区基本信息' : '填写小区基本信息' }}</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/house/community')">返回</button>
        <button class="btn btn-primary" :disabled="submitting || loading" @click="submit">保存</button>
      </div>
    </div>

    <div v-loading="loading" class="card" style="padding: 24px;">
      <el-form :model="form" label-width="90px">
        <el-form-item label="小区名称" required>
          <el-input v-model="form.name" placeholder="请输入小区名称" />
        </el-form-item>
        <el-form-item label="别名">
          <el-input v-model="form.alias" placeholder="请输入别名" />
        </el-form-item>
        <el-form-item label="城市">
          <el-select v-model="form.cityId" clearable placeholder="请选择城市" style="width: 100%;">
            <el-option v-for="city in cities" :key="city.id" :label="city.name" :value="city.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="区域">
          <el-input v-model="form.district" placeholder="如：浦东新区" />
        </el-form-item>
        <el-form-item label="商圈">
          <el-input v-model="form.businessCircle" placeholder="请输入商圈" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="经度">
          <PlainNumberInput v-model="form.longitude" :precision="6" :step="0.01" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="纬度">
          <PlainNumberInput v-model="form.latitude" :precision="6" :step="0.01" style="width: 100%;" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-page { min-height: 100%; }
</style>
