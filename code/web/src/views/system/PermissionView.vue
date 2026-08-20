<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getPermissions, type Permission } from '@/api/organization';

const permissions = ref<Permission[]>([]);
const loading = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    permissions.value = await getPermissions();
  } finally {
    loading.value = false;
  }
});

function typeClass(type: string) {
  const map: Record<string, string> = {
    menu: 'pill-blue',
    action: 'pill-green',
    data: 'pill-orange',
  };
  return map[type] || 'pill-gray';
}

function typeLabel(type: string) {
  const map: Record<string, string> = { menu: '菜单', action: '操作', data: '数据' };
  return map[type] || type;
}
</script>

<template>
  <div class="system-view">
    <div class="page-header">
      <div>
        <div class="page-title">权限管理</div>
        <div class="page-desc">系统权限点清单，支持按模块查看菜单与操作权限</div>
      </div>
    </div>

    <el-table :data="permissions" v-loading="loading" class="card" row-key="id" :tree-props="{ children: 'children' }">
      <el-table-column prop="name" label="权限名称" min-width="180" />
      <el-table-column prop="code" label="权限代码" min-width="180" />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <span :class="['pill', typeClass(row.type)]">{{ typeLabel(row.type) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="module" label="模块" width="120" />
      <el-table-column prop="path" label="路由" min-width="160" />
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.system-view { min-height: 100%; }
</style>
