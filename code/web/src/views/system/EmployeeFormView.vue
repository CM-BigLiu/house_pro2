<script setup lang="ts">
import { computed, ref, reactive, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createEmployee, getEmployeeForEdit, getRoles, getStores, getPositions, updateEmployee, getEmployeeManagers } from '@/api/organization';
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
const managers = ref<Awaited<ReturnType<typeof getEmployeeManagers>>>([]);
const initialMobile = ref('');
const form = reactive({
  name: '', mobile: '', password: '', status: 'normal' as string,
  roleIds: [] as number[], storeIds: [] as number[], positionIds: [] as number[],
  entryDate: '' as string | undefined,
  managerId: null as number | null,
});
const isSalesperson = computed(() => roles.value.some(role => form.roleIds.includes(role.id) && ['salesman', 'agent'].includes(role.code)));
const availableManagers = computed(() => managers.value.filter(manager => manager.id !== editId.value && manager.storeIds.some(id => form.storeIds.includes(id))));
watch([isSalesperson, () => [...form.storeIds]], () => { if (!isSalesperson.value || !availableManagers.value.some(manager => manager.id === form.managerId)) form.managerId = null; });

onMounted(async () => {
  const [rolesData, storesData, positionsData, managerData] = await Promise.all([getRoles(), getStores(), getPositions(), getEmployeeManagers()]);
  roles.value = rolesData;
  stores.value = storesData;
  positions.value = positionsData;
  managers.value = managerData;
  if (isEdit.value) {
    loading.value = true;
    try {
      const employee = await getEmployeeForEdit(editId.value);
      initialMobile.value = employee.mobile;
      Object.assign(form, {
        name: employee.name, mobile: employee.mobile, password: '', status: employee.status,
        roleIds: employee.roles?.map((item) => item.id) || [], storeIds: employee.stores?.map((item) => item.id) || [],
        positionIds: employee.positions?.map((item) => item.id) || [], entryDate: employee.entryDate || '',
        managerId: employee.managerId || null,
      });
    } catch { router.push('/system/employee'); }
    finally { loading.value = false; }
  }
});

async function submit() {
  if (!form.name.trim() || !form.mobile.trim()) return ElMessage.warning('请填写姓名和手机号');
  if (!/^1\d{10}$/.test(form.mobile) && !(isEdit.value && form.mobile === initialMobile.value)) return ElMessage.warning('请输入正确的 11 位手机号');
  if (!isEdit.value && !form.password) return ElMessage.warning('请设置初始密码');
  if (form.password && form.password.length < 8) return ElMessage.warning('密码至少 8 位');
  if (!form.roleIds.length) return ElMessage.warning('请至少选择一个角色');
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
          <el-form-item label="角色" required>
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
          <el-form-item v-if="isSalesperson" label="归属店长">
            <el-select v-model="form.managerId" clearable filterable style="width:100%" placeholder="请选择同门店店长" @clear="form.managerId = null">
              <el-option v-for="manager in availableManagers" :key="manager.id" :value="manager.id" :label="`${manager.name} · ${manager.storeIds.map(id => stores.find(store => store.id === id)?.name).filter(Boolean).join(' / ')}`" />
            </el-select>
            <small class="manager-hint">先选择所属门店，再指定该业务员的归属店长。</small>
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
.manager-hint { color:var(--ink-500); line-height:1.7; }
</style>
