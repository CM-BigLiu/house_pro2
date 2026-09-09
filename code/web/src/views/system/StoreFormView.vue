<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createStore, getCities, getStoreForEdit, updateStore } from '@/api/organization';

const router = useRouter();
const route = useRoute();
const submitting = ref(false);
const loading = ref(false);
const editId = computed(() => Number(route.params.id || route.query.edit) || 0);
const isEdit = computed(() => editId.value > 0);

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
    if (isEdit.value) {
      loading.value = true;
      try {
        const store = await getStoreForEdit(editId.value);
        Object.assign(form, {
          name: store.name, address: store.address || '', phone: store.phone || '', cityId: store.cityId,
          manager: typeof store.manager === 'string' ? store.manager : store.manager?.name || '', status: store.status || 'active',
        });
      } catch { router.push('/system/store'); }
      finally { loading.value = false; }
    }
  } catch {
    // ignore
  }
});

async function submit() {
  if (!form.name.trim() || !form.cityId) return ElMessage.warning('请填写门店名称并选择城市');
  submitting.value = true;
  try {
    if (isEdit.value) await updateStore(editId.value, form);
    else await createStore(form);
    ElMessage.success(isEdit.value ? '保存成功' : '创建成功');
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
        <div class="page-title">{{ isEdit ? '编辑门店' : '新增门店' }}</div>
        <div class="page-desc">维护门店基本信息和店长</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/system/store')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card" v-loading="loading">
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
          <el-form-item label="状态">
            <el-select v-model="form.status" style="width: 100%;"><el-option label="营业中" value="active" /><el-option label="已停用" value="inactive" /></el-select>
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
