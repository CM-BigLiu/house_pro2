<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createEmployee, getEmployeeForEdit, getRoles, getStores, getPositions, updateEmployee } from '@/api/organization';
import type { Role, Store } from '@/api/organization';

const router = useRouter();
const route = useRoute();
const submitting = ref(false);
const loading = ref(false);
const editId = computed(() => Number(route.params.id || route.query.edit) || 0);
const isEdit = computed(() => editId.value > 0);
const roles = ref<Role[]>([]);
const stores = ref<Store[]>([]);
const positions = ref<{ id: number; name: string; code: string }[]>([]);
const form = reactive({
  name: '', mobile: '', password: '', status: 'normal' as string,
  roleIds: [] as number[], storeIds: [] as number[], positionIds: [] as number[],
  entryDate: '' as string | undefined,
});

onMounted(async () => {
  const [rolesData, storesData, positionsData] = await Promise.all([getRoles(), getStores(), getPositions()]);
  roles.value = rolesData;
  stores.value = storesData;
  positions.value = positionsData;
  if (isEdit.value) {
    loading.value = true;
    try {
      const employee = await getEmployeeForEdit(editId.value);
      Object.assign(form, {
        name: employee.name, mobile: employee.mobile, password: '', status: employee.status,
        roleIds: employee.roles?.map((item) => item.id) || [], storeIds: employee.stores?.map((item) => item.id) || [],
        positionIds: employee.positions?.map((item) => item.id) || [], entryDate: employee.entryDate || '',
      });
    } catch { router.push('/system/employee'); }
    finally { loading.value = false; }
  }
});

async function submit() {
  if (!form.name.trim() || !form.mobile.trim()) return ElMessage.warning('请填写姓名和手机号');
  if (!isEdit.value && !form.password) return ElMessage.warning('请设置初始密码');
  submitting.value = true;
  try {
    const payload: any = { ...form };
    if (!payload.entryDate) delete payload.entryDate;
    if (!payload.password) delete payload.password;
    if (isEdit.value) await updateEmployee(editId.value, payload);
    else await createEmployee(payload);
    ElMessage.success(isEdit.value ? '保存成功' : '创建成功');
    router.push('/system/employee');
  } finally { submitting.value = false; }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">{{ isEdit ? '编辑员工' : '新增员工' }}</div>
        <div class="page-desc">维护员工档案、角色、岗位和所属门店</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/system/employee')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card" v-loading="loading">
      <div class="card-body">
        <el-form :model="form" label-width="90px">
          <el-form-item label="姓名" required>
            <el-input v-model="form.name" placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="手机号" required>
            <el-input v-model="form.mobile" placeholder="请输入手机号" />
          </el-form-item>
          <el-form-item :label="isEdit ? '重置密码' : '初始密码'" :required="!isEdit">
            <el-input v-model="form.password" type="password" show-password :placeholder="isEdit ? '留空表示不修改' : '请输入初始密码'" />
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="form.roleIds" multiple style="width: 100%;" placeholder="请选择角色">
              <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
            </el-select>
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
