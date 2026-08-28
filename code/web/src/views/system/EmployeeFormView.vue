<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createEmployee, getRoles, getStores, getPositions } from '@/api/organization';
import type { Role, Store } from '@/api/organization';

const router = useRouter();
const submitting = ref(false);

const roles = ref<Role[]>([]);
const stores = ref<Store[]>([]);
const positions = ref<{ id: number; name: string; code: string }[]>([]);

const form = reactive({
  name: '',
  mobile: '',
  status: 'normal' as string,
  roleIds: [] as number[],
  storeIds: [] as number[],
  positionIds: [] as number[],
  entryDate: '' as string | undefined,
});

onMounted(async () => {
  const [rolesData, storesData, positionsData] = await Promise.all([
    getRoles(),
    getStores(),
    getPositions(),
  ]);
  roles.value = rolesData;
  stores.value = storesData;
  positions.value = positionsData;
});

async function submit() {
  submitting.value = true;
  try {
    const payload = { ...form };
    if (!payload.entryDate) delete payload.entryDate;
    await createEmployee(payload);
    ElMessage.success('创建成功');
    router.push('/system/employee');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">新增员工</div>
        <div class="page-desc">填写员工基本信息</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/system/employee')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <el-form :model="form" label-width="90px">
          <el-form-item label="姓名" required>
            <el-input v-model="form.name" placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="手机号" required>
            <el-input v-model="form.mobile" placeholder="请输入手机号" />
          </el-form-item>
          <el-form-item label="岗位">
            <el-select v-model="form.positionIds" multiple style="width: 100%;" placeholder="请选择岗位">
              <el-option v-for="p in positions" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="所属门店">
            <el-select v-model="form.storeIds" multiple style="width: 100%;" placeholder="请选择门店">
              <el-option v-for="store in stores" :key="store.id" :label="store.name" :value="store.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="入驻时间">
            <el-date-picker
              v-model="form.entryDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%;"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="form.status" style="width: 100%;">
              <el-option label="在职" value="normal" />
              <el-option label="离职" value="left" />
              <el-option label="休假" value="vacation" />
            </el-select>
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