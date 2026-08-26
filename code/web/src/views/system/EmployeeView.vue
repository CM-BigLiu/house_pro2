<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getRoles, getStores, type Employee, type Role, type Store } from '@/api/organization';

type EmployeeForm = Partial<Employee> & { roleIds?: number[]; storeIds?: number[]; positionIds?: number[] };

const employees = ref<Employee[]>([]);
const roles = ref<Role[]>([]);
const stores = ref<Store[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive<EmployeeForm>({
  name: '', mobile: '', status: 'normal', roleIds: [], storeIds: [], positionIds: [],
});
const query = reactive({ keyword: '' });

onMounted(async () => {
  await Promise.all([loadEmployees(), loadRoles(), loadStores()]);
});

async function loadEmployees() {
  loading.value = true;
  try {
    const res = await getEmployees(query);
    employees.value = res.list;
  } finally {
    loading.value = false;
  }
}

async function loadRoles() {
  roles.value = await getRoles();
}

async function loadStores() {
  stores.value = await getStores();
}

function openCreate() {
  isEdit.value = false;
  Object.assign(form, { name: '', mobile: '', status: 'normal', roleIds: [], storeIds: [], positionIds: [] });
  dialogVisible.value = true;
}

function openEdit(row: Employee) {
  isEdit.value = true;
  Object.assign(form, {
    ...row,
    roleIds: row.roles?.map((r) => r.id) || [],
    storeIds: row.stores?.map((s) => s.id) || [],
    positionIds: row.positions?.map((p) => p.id) || [],
  });
  dialogVisible.value = true;
}

async function submit() {
  if (isEdit.value) {
    await updateEmployee(form.id!, form);
  } else {
    await createEmployee(form);
  }
  ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
  dialogVisible.value = false;
  await loadEmployees();
}

async function remove(row: Employee) {
  await deleteEmployee(row.id);
  ElMessage.success('删除成功');
  await loadEmployees();
}
</script>

<template>
  <div class="system-view">
    <div class="page-header">
      <div>
        <div class="page-title">人员管理</div>
        <div class="page-desc">员工档案、角色绑定、所属店面维护</div>
      </div>
      <div class="page-actions">
        <el-button v-permission="['system:employee:edit']" type="primary" @click="openCreate">新增员工</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="姓名/手机号" clearable @keyup.enter="loadEmployees" />
      <el-button type="primary" @click="loadEmployees">查询</el-button>
    </div>

    <el-table :data="employees" v-loading="loading" class="card">
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="mobile" label="手机号" />
      <el-table-column label="角色">
        <template #default="{ row }">
          <span v-for="role in row.roles" :key="role.id" class="pill pill-blue" style="margin-right: 4px;">{{ role.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="店面">
        <template #default="{ row }">
          <span v-for="store in row.stores" :key="store.id" class="pill pill-gray" style="margin-right: 4px;">{{ store.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <span :class="['pill', row.status === 'normal' ? 'pill-green' : 'pill-gray']">{{ row.status === 'normal' ? '在职' : '离职' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button v-permission="['system:employee:edit']" size="small" type="primary" plain @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" plain @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑员工' : '新增员工'" width="600px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="姓名" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="手机号" required>
          <el-input v-model="form.mobile" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roleIds" multiple style="width: 100%;">
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属店面">
          <el-select v-model="form.storeIds" multiple style="width: 100%;">
            <el-option
              v-for="store in stores"
              :key="store.id"
              :label="store.name"
              :value="store.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%;">
            <el-option label="在职" value="normal" />
            <el-option label="离职" value="left" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.system-view { min-height: 100%; }
</style>
