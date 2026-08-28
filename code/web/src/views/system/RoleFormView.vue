<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createRole, getStores } from '@/api/organization';
import type { Store } from '@/api/organization';

const router = useRouter();
const submitting = ref(false);

const stores = ref<Store[]>([]);

const form = reactive({
  code: '',
  name: '',
  dataScope: 'self' as string,
  status: 'enabled' as string,
  permissionIds: [] as number[],
  assignedStores: [] as number[],
  customScope: '' as string | undefined,
});

onMounted(async () => {
  stores.value = await getStores();
});

async function submit() {
  submitting.value = true;
  try {
    const payload = { ...form };
    if (!payload.customScope) delete payload.customScope;
    await createRole(payload);
    ElMessage.success('创建成功');
    router.push('/system/role');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">新增角色</div>
        <div class="page-desc">填写角色基本信息</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/system/role')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <el-form :model="form" label-width="90px">
          <el-form-item label="角色代码" required>
            <el-input v-model="form.code" placeholder="例如：admin" />
          </el-form-item>
          <el-form-item label="角色名称" required>
            <el-input v-model="form.name" placeholder="例如：管理员" />
          </el-form-item>
          <el-form-item label="数据范围">
            <el-select v-model="form.dataScope" style="width:100%">
              <el-option label="仅自己" value="self" />
              <el-option label="本组" value="group" />
              <el-option label="本店" value="store" />
              <el-option label="全公司" value="company" />
              <el-option label="指定店面" value="assigned" />
              <el-option label="自定义" value="custom" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.dataScope === 'assigned'" label="指定店面">
            <el-select v-model="form.assignedStores" multiple style="width:100%">
              <el-option v-for="s in stores" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.dataScope === 'custom'" label="自定义规则">
            <el-input
              v-model="form.customScope"
              type="textarea" :rows="3"
              placeholder='{"store_id": [1,2]} 或 {"creator_id": "@me"}'
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-radio-group v-model="form.status">
              <el-radio value="enabled">启用</el-radio>
              <el-radio value="disabled">禁用</el-radio>
            </el-radio-group>
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