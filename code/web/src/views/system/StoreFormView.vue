<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getCities } from '@/api/organization';
import { post } from '@/utils/request';

const router = useRouter();
const submitting = ref(false);

const cities = ref<{ id: number; name: string }[]>([]);

const form = reactive({
  name: '',
  address: '',
  phone: '',
  manager: '',
  cityId: undefined as number | undefined,
  status: 'active',
});

onMounted(async () => {
  try {
    cities.value = await getCities();
  } catch {
    // ignore
  }
});

async function submit() {
  submitting.value = true;
  try {
    await post('/system/stores', form);
    ElMessage.success('创建成功');
    router.push('/system/store');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">新增门店</div>
        <div class="page-desc">填写门店基本信息</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/system/store')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <el-form :model="form" label-width="90px">
          <el-form-item label="门店名称" required>
            <el-input v-model="form.name" placeholder="请输入门店名称" />
          </el-form-item>
          <el-form-item label="所在城市">
            <el-select v-model="form.cityId" style="width: 100%;" placeholder="请选择城市">
              <el-option v-for="c in cities" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="地址">
            <el-input v-model="form.address" placeholder="请输入地址" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="form.phone" placeholder="请输入电话" />
          </el-form-item>
          <el-form-item label="店长">
            <el-input v-model="form.manager" placeholder="请输入店长姓名" />
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>