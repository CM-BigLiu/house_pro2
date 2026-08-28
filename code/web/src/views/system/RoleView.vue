<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  getRoles, updateRole, getStores,
  type Role, type Store, type Permission,
} from '@/api/organization';
import { getPermissions } from '@/api/organization';

/* ── state ── */
const roles = ref<Role[]>([]);
const permissions = ref<Permission[]>([]);
const stores = ref<Store[]>([]);
const loading = ref(false);
const permLoading = ref(false);
const saving = ref(false);
const selectedRole = ref<Role | null>(null);

const router = useRouter();

/* ── lifecycle ── */
onMounted(async () => {
  await Promise.all([loadRoles(), loadPermissions(), loadStores()]);
});

/* ── data loading ── */
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
  permLoading.value = true;
  try {
    permissions.value = await getPermissions();
  } finally {
    permLoading.value = false;
  }
}

/* ── selection ── */
function selectRole(role: Role) {
  selectedRole.value = role;
  // spread the role's permission ids into local state for tree checkbox binding
  localPermIds.value = role.permissions?.map(p => p.id) || [];
  localDataScope.value = role.dataScope || 'self';
  localAssignedStores.value = role.assignedStores || [];
  localCustomScope.value = role.customScope || '';
}

const localPermIds = ref<number[]>([]);
const localDataScope = ref('self');
const localAssignedStores = ref<number[]>([]);
const localCustomScope = ref('');

/* ── perm tree helpers ── */
/** Flatten all leaf (action) permission IDs from the tree */
function collectLeafIds(nodes: Permission[]): number[] {
  const ids: number[] = [];
  function walk(list: Permission[]) {
    for (const n of list) {
      if (n.children && n.children.length) {
        walk(n.children);
      } else if (n.type === 'action') {
        ids.push(n.id);
      }
    }
  }
  walk(nodes);
  return ids;
}

function isIndeterminate(node: Permission): boolean {
  if (!node.children || !node.children.length) return false;
  const leafIds = collectLeafIds(node.children);
  const checked = leafIds.filter(id => localPermIds.value.includes(id));
  return checked.length > 0 && checked.length < leafIds.length;
}

function isAllChecked(node: Permission): boolean {
  if (!node.children || !node.children.length) return localPermIds.value.includes(node.id);
  const leafIds = collectLeafIds(node.children);
  return leafIds.length > 0 && leafIds.every(id => localPermIds.value.includes(id));
}

function toggleNode(node: Permission) {
  const ids = node.children?.length ? collectLeafIds(node.children) : [node.id];
  const allChecked = ids.every(id => localPermIds.value.includes(id));
  if (allChecked) {
    localPermIds.value = localPermIds.value.filter(id => !ids.includes(id));
  } else {
    for (const id of ids) {
      if (!localPermIds.value.includes(id)) localPermIds.value.push(id);
    }
  }
}

function toggleAction(action: Permission) {
  const idx = localPermIds.value.indexOf(action.id);
  if (idx === -1) localPermIds.value.push(action.id);
  else localPermIds.value.splice(idx, 1);
}

/* ── grouped permissions for the grid view ── */
interface PermGroup {
  module: string;
  children: Permission[];
}

const permGroups = computed<PermGroup[]>(() => {
  const map = new Map<string, Permission[]>();
  for (const p of permissions.value) {
    if (p.type !== 'menu') continue;
    if (!p.children || !p.children.length) continue;
    const key = p.module || p.name;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries()).map(([module, children]) => ({ module, children }));
});

const scopeRadios = [
  { value: 'self', label: '仅自己' },
  { value: 'group', label: '本组' },
  { value: 'store', label: '本店' },
  { value: 'company', label: '全公司' },
  { value: 'assigned', label: '指定店面' },
  { value: 'custom', label: '自定义' },
];

/* ── save from right panel ── */
async function saveRoleConfig() {
  if (!selectedRole.value) return;
  saving.value = true;
  try {
    await updateRole(selectedRole.value.id, {
      permissionIds: localPermIds.value,
      dataScope: localDataScope.value,
      assignedStores: localDataScope.value === 'assigned' ? localAssignedStores.value : [],
      customScope: localDataScope.value === 'custom' ? localCustomScope.value : undefined,
    });
    ElMessage.success('保存成功');
    await loadRoles();
    // re-select to keep view in sync
    const refreshed = roles.value.find(r => r.id === selectedRole.value!.id);
    if (refreshed) selectedRole.value = refreshed;
  } catch {
    // handled by request interceptor
  } finally {
    saving.value = false;
  }
}

/* ── dialog actions ── */
/* ── user count estimation (from permissions length) ── */
function userCount(role: Role): number {
  // Placeholder: API doesn't return user count currently; show permission count instead
  return role.permissions?.length || 0;
}
</script>

<template>
  <div class="role-config">
    <!-- page header -->
    <div class="page-header">
      <div class="page-title-wrap">
        <div class="page-title">角色管理</div>
        <div class="page-subtitle">定义角色、数据范围与权限集合</div>
      </div>
      <div class="page-actions">
        <button v-permission="['system:role:edit']" class="btn btn-primary" @click="router.push('/system/role/create')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新增角色
        </button>
      </div>
    </div>

    <!-- split layout -->
    <div class="split-layout">
      <!-- ====== left: role list ====== -->
      <div class="tree-panel">
        <div class="card">
          <div class="card-header">
            <span class="card-title">角色列表</span>
            <span class="card-badge">{{ roles.length }}</span>
          </div>
          <div class="card-body" v-loading="loading">
            <div
              v-for="role in roles"
              :key="role.id"
              class="role-list"
            >
              <div
                class="role-item"
                :class="{ active: selectedRole?.id === role.id }"
                @click="selectRole(role)"
              >
                <div class="role-item-head">
                  <span class="role-item-name">{{ role.name }}</span>
                  <span class="role-item-code">{{ role.code }}</span>
                  <span v-if="role.isBuiltin" class="pill pill-orange">内置</span>
                </div>
                <div class="role-item-meta">
                  <span class="role-item-stat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    {{ userCount(role) }} 项权限
                  </span>
                  <span :class="['pill', role.status === 'enabled' ? 'pill-green' : 'pill-gray']">
                    {{ role.status === 'enabled' ? '启用' : '禁用' }}
                  </span>
                </div>
              </div>
            </div>
            <div v-if="!roles.length && !loading" class="card-empty">暂无角色</div>
          </div>
        </div>
      </div>

      <!-- ====== right: permission config ====== -->
      <div class="split-main">
        <div v-if="selectedRole" class="card role-detail">
          <!-- detail header -->
          <div class="card-header">
            <div class="role-detail-title">
              <span class="role-detail-name">{{ selectedRole.name }}</span>
              <span :class="['pill', selectedRole.status === 'enabled' ? 'pill-green' : 'pill-gray']">
                {{ selectedRole.status === 'enabled' ? '启用' : '禁用' }}
              </span>
            </div>
            <div class="role-detail-code">代码：{{ selectedRole.code }}</div>
          </div>

          <div class="card-body" v-loading="permLoading">
            <!-- permission groups -->
            <div class="perm-groups">
              <div v-for="group in permGroups" :key="group.module" class="perm-group">
                <div class="perm-group-title">{{ group.module }}</div>
                <div class="perm-tree">
                  <div v-for="menu in group.children" :key="menu.id" class="perm-parent">
                    <label class="perm-parent-label">
                      <input
                        type="checkbox"
                        :checked="isAllChecked(menu)"
                        :indeterminate.prop="isIndeterminate(menu)"
                        @change="toggleNode(menu)"
                      />
                      <span>{{ menu.name }}</span>
                    </label>
                    <div v-if="menu.children && menu.children.length" class="perm-actions">
                      <label v-for="act in menu.children" :key="act.id" class="perm-action-item">
                        <input
                          type="checkbox"
                          :checked="localPermIds.includes(act.id)"
                          @change="toggleAction(act)"
                        />
                        <span>{{ act.name }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="!permGroups.length" class="card-empty">暂无权限数据</div>
            </div>

            <!-- data scope -->
            <div class="scope-section">
              <div class="scope-label">数据范围</div>
              <div class="scope-radios">
                <label v-for="sr in scopeRadios" :key="sr.value" class="scope-radio">
                  <input
                    type="radio"
                    :value="sr.value"
                    v-model="localDataScope"
                  />
                  <span>{{ sr.label }}</span>
                </label>
              </div>

              <!-- assigned stores -->
              <div v-if="localDataScope === 'assigned'" class="scope-extras">
                <el-select v-model="localAssignedStores" multiple placeholder="选择指定店面" style="width:100%">
                  <el-option v-for="s in stores" :key="s.id" :label="s.name" :value="s.id" />
                </el-select>
              </div>

              <!-- custom scope -->
              <div v-if="localDataScope === 'custom'" class="scope-extras">
                <el-input
                  v-model="localCustomScope"
                  type="textarea"
                  :rows="2"
                  placeholder='{"store_id": [1,2]} 或 {"creator_id": "@me"}'
                />
              </div>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn btn-primary" :disabled="saving" @click="saveRoleConfig">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>

        <!-- empty state -->
        <div v-else class="card card-empty-state">
          <div class="empty-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--ink-400)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="empty-text">请从左侧选择一个角色进行权限配置</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ═══════════════════════════════════════════════
   Role Config – Two‑Column Layout
   ═══════════════════════════════════════════════ */
.role-config {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── page header ── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.page-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.page-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--ink-900);
  letter-spacing: -0.02em;
}
.page-subtitle {
  font-size: 13px;
  color: var(--ink-500);
}

/* ── split layout ── */
.split-layout {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

/* ── left panel ── */
.tree-panel {
  width: 300px;
  flex-shrink: 0;
  .card { margin-bottom: 0; }
  .card-body {
    padding: 4px 8px 8px;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
  }
}

/* ── right panel ── */
.split-main {
  flex: 1;
  min-width: 0;
}

/* ── role list ── */
.role-list { display: flex; flex-direction: column; gap: 2px; }

.role-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  border-left: 3px solid transparent;

  &:hover {
    background: var(--ink-50);
  }

  &.active {
    background: var(--primary-soft);
    border-left-color: var(--primary);
  }
}

.role-item-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.role-item-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink-800);
}

.role-item-code {
  font-size: 12px;
  color: var(--ink-400);
  font-family: var(--font-num);
}

.role-item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.role-item-stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--ink-500);
  svg { flex-shrink: 0; }
}

/* ── role detail ── */
.role-detail {
  display: flex;
  flex-direction: column;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-body { flex: 1; }
}

.role-detail-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-detail-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink-900);
}

.role-detail-code {
  font-size: 12px;
  color: var(--ink-400);
  font-family: var(--font-num);
}

/* ── permission groups grid ── */
.perm-groups {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.perm-group {
  background: var(--ink-50);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  border: 1px solid var(--ink-200);
}

.perm-group-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-800);
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--ink-200);
}

.perm-tree {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.perm-parent {
  label.perm-parent-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-700);
    cursor: pointer;
    padding: 2px 0;
    user-select: none;

    input[type="checkbox"] {
      accent-color: var(--primary);
      width: 15px; height: 15px;
    }
  }
}

.perm-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 4px 0 0 22px;
}

.perm-action-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--ink-600);
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  background: #fff;
  border: 1px solid var(--ink-200);
  user-select: none;
  transition: all 0.12s;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  input[type="checkbox"] {
    accent-color: var(--primary);
    width: 13px; height: 13px;
  }
}

/* ── data scope ── */
.scope-section {
  border-top: 1px solid var(--ink-200);
  padding-top: 16px;
}

.scope-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-800);
  margin-bottom: 10px;
}

.scope-radios {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.scope-radio {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--ink-600);
  cursor: pointer;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--ink-200);
  background: #fff;
  transition: all 0.12s;
  user-select: none;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  input[type="radio"] {
    accent-color: var(--primary);
    width: 14px; height: 14px;
  }

  &:has(input:checked) {
    border-color: var(--primary);
    background: var(--primary-soft);
    color: var(--primary);
    font-weight: 600;
  }
}

.scope-extras {
  margin-top: 10px;
}

/* ── card / shared ── */
.card {
  background: #fff;
  border-radius: var(--radius);
  border: 1px solid var(--ink-200);
  box-shadow: var(--shadow-xs);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--ink-100);
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-800);
}

.card-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 11px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-num);
}

.card-body {
  padding: 12px 16px 16px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--ink-100);
  gap: 8px;
}

.card-empty {
  text-align: center;
  padding: 32px 0;
  color: var(--ink-400);
  font-size: 13px;
}

.card-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;

  .empty-icon {
    margin-bottom: 12px;
    display: flex;
    justify-content: center;
  }

  .empty-text {
    color: var(--ink-400);
    font-size: 14px;
    text-align: center;
  }
}

/* ── pill badges ── */
.pill {
  display: inline-flex;
  align-items: center;
  font-size: 11.5px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 10px;
  line-height: 1.5;
}
.pill-green {
  color: var(--success);
  background: var(--success-soft);
}
.pill-gray {
  color: var(--ink-500);
  background: var(--ink-100);
}
.pill-blue {
  color: var(--primary);
  background: var(--primary-soft);
}
.pill-orange {
  color: var(--warning);
  background: var(--warning-soft);
}

/* ── buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  transition: all 0.15s;
  white-space: nowrap;
  cursor: pointer;
  font-family: inherit;
  border: none;
  outline: none;

  &:disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}
.btn-primary {
  background: var(--primary);
  color: #fff;
  &:hover { background: var(--primary-dark); }
}
.btn-plain {
  background: transparent;
  color: var(--ink-600);
  border: 1px solid var(--ink-200);
  &:hover { background: var(--ink-50); border-color: var(--ink-300); }
}

/* ── override element loading ── */
:deep(.el-loading-mask) {
  border-radius: var(--radius);
  background: rgba(255,255,255,0.7);
}
</style>