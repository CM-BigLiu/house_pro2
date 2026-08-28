<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createCommunity, type Community } from '@/api/community';

const router = useRouter();
const submitting = ref(false);

const form = reactive<Partial<Community>>({
  name: '', alias: '', cityId: undefined, districtId: undefined,
  businessCircle: '', address: '', longitude: undefined, latitude: undefined,
});

async function submit() {
  if (!form.name?.trim()) return ElMessage.warning('请填写小区名称');
  submitting.value = true;
  try {
    await createCommunity(form);
    ElMessage.success('创建成功');
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
        <div class="page-title">新增小区</div>
        <div class="page-desc">填写小区基本信息</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/house/community')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card" style="padding: 24px;">
      <el-form :model="form" label-width="90px">
        <el-form-item label="小区名称" required>
          <el-input v-model="form.name" placeholder="请输入小区名称" />
        </el-form-item>
        <el-form-item label="别名">
          <el-input v-model="form.alias" placeholder="请输入别名" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input-number v-model="form.cityId" :min="1" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="区域">
          <el-input-number v-model="form.districtId" :min="1" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="商圈">
          <el-input v-model="form.businessCircle" placeholder="请输入商圈" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="经度">
          <el-input-number v-model="form.longitude" :precision="6" :step="0.01" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="纬度">
          <el-input-number v-model="form.latitude" :precision="6" :step="0.01" controls-position="right" style="width: 100%;" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-page { min-height: 100%; }
</style>