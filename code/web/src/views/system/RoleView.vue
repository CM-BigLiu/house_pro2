<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { getRoles, createRole, updateRole, deleteRole, getStores, type Role, type Store, type Permission } from '@/api/organization';
import { getPermissions } from '@/api/organization';

type RoleForm = Partial<Role> & { permissionIds?: number[] };

const roles = ref<Role[]>([]);
const permissions = ref<Permission[]>([]);
const stores = ref<Store[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive<RoleForm>({
  code: '', name: '', dataScope: 'self', status: 'enabled', permissionIds: [], assignedStores: [], customScope: '',
});

onMounted(async () => {
  await Promise.all([loadRoles(), loadPermissions(), loadStores()]);
});

async function loadStores() {
  stores.value = await getStores();
}

async function loadRoles() {
  loading.value = true;
  try {
    roles.value = await getRoles();
  } finally {
    loading.value = false;
  }
}

async function loadPermissions() {
  permissions.value = await getPermissions();
}

function openCreate() {
  isEdit.value = false;
  Object.assign(form, { code: '', name: '', dataScope: 'self', status: 'enabled', permissionIds: [], assignedStores: [], customScope: '' });
  dialogVisible.value = true;
}

function openEdit(row: Role) {
  isEdit.value = true;
  Object.assign(form, {
    ...row,
    permissionIds: row.permissions?.map((p) => p.id) || [],
    assignedStores: row.assignedStores || [],
    customScope: row.customScope || '',
  });
  dialogVisible.value = true;
}

async function submit() {
  const payload = { ...form };
  if (!payload.customScope) delete payload.customScope;
  if (isEdit.value) {
    await updateRole(form.id!, payload);
  } else {
    await createRole(payload);
  }
  ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
  dialogVisible.value = false;
  await loadRoles();
}

async function remove(row: Role) {
  await deleteRole(row.id);
  ElMessage.success('删除成功');
  await loadRoles();
}

function scopeLabel(scope: string) {
  const map: Record<string, string> = {
    self: '仅自己', group: '本组', store: '本店', company: '全公司', assigned: '指定店面', custom: '自定义',
  };
  return map[scope] || scope;
}
</script>

<template>
  <div class="system-view">
    <div class="page-header">
      <div>
        <div class="page-title">角色管理</div>
        <div class="page-desc">定义角色、数据范围与权限集合</div>
      </div>
      <div class="page-actions">
        <el-button v-permission="['system:role:edit']" type="primary" @click="openCreate">新增角色</el-button>
      </div>
    </div>

    <el-table :data="roles" v-loading="loading" class="card">
      <el-table-column prop="code" label="角色代码" />
      <el-table-column prop="name" label="角色名称" />
      <el-table-column label="数据范围">
        <template #default="{ row }">
          <span class="pill pill-blue">{{ scopeLabel(row.dataScope) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <span :class="['pill', row.status === 'enabled' ? 'pill-green' : 'pill-gray']">{{ row.status === 'enabled' ? '启用' : '禁用' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button v-permission="['system:role:edit']" size="small" type="primary" plain @click="openEdit(row)">编辑</el-button>
          <el-button v-if="!row.isBuiltin" size="small" type="danger" plain @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑角色' : '新增角色'" width="680px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="角色代码" required>
          <el-input v-model="form.code" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="角色名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="数据范围">
          <el-select v-model="form.dataScope" style="width: 100%;">
            <el-option label="仅自己" value="self" />
            <el-option label="本组" value="group" />
            <el-option label="本店" value="store" />
            <el-option label="全公司" value="company" />
            <el-option label="指定店面" value="assigned" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.dataScope === 'assigned'" label="指定店面">
          <el-select v-model="form.assignedStores" multiple style="width: 100%;">
            <el-option v-for="s in stores" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.dataScope === 'custom'" label="自定义规则">
          <el-input
            v-model="form.customScope"
            type="textarea"
            :rows="3"
            placeholder='{"store_id": [1,2]} 或 {"creator_id": "@me"}'
          />
        </el-form-item>
        <el-form-item label="权限">
          <el-tree-select
            v-model="form.permissionIds"
            :data="permissions"
            multiple
            :props="{ label: 'name', value: 'id', children: 'children' }"
            style="width: 100%;"
          />
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
