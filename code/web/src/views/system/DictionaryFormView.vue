<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createDict, getDict, updateDict } from '@/api/system';

const router = useRouter();
const route = useRoute();
const editId = computed(() => Number(route.query.edit) || 0);
const isEdit = computed(() => editId.value > 0);
const submitting = ref(false);
const loading = ref(false);

const form = reactive({
  code: '',
  name: '',
  description: '',
});

onMounted(async () => {
  if (!isEdit.value) return;
  loading.value = true;
  try { Object.assign(form, await getDict(editId.value)); }
  catch { router.replace('/system/dictionary'); }
  finally { loading.value = false; }
});

async function submit() {
  if (!form.code.trim() || !form.name.trim()) return ElMessage.warning('请填写字典编码和名称');
  submitting.value = true;
  try {
    if (isEdit.value) await updateDict(editId.value, form);
    else await createDict(form);
    ElMessage.success(isEdit.value ? '保存成功' : '创建成功');
    router.push('/system/dictionary');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">{{ isEdit ? '编辑字典' : '新增字典' }}</div>
        <div class="page-desc">{{ isEdit ? '维护字典基本信息' : '填写字典基本信息' }}</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/system/dictionary')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card" v-loading="loading">
      <div class="card-body">
        <el-form :model="form" label-width="80px">
          <el-form-item label="编码" required>
            <el-input v-model="form.code" placeholder="请输入字典编码" />
          </el-form-item>
          <el-form-item label="名称" required>
            <el-input v-model="form.name" placeholder="请输入字典名称" />
          </el-form-item>
          <el-form-item label="说明">
            <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入说明" />
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
