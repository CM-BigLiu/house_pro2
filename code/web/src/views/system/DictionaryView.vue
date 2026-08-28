<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getDicts,
  getDictItems,
  createDictItem,
  updateDictItem,
  deleteDictItem,
  type Dict,
  type DictItem,
} from '@/api/system';

const dicts = ref<Dict[]>([]);
const treeData = ref<DictItem[]>([]);
const flatItems = ref<DictItem[]>([]);
const loading = ref(false);
const activeDict = ref<Dict | null>(null);
const itemDialogVisible = ref(false);
const isItemEdit = ref(false);
const itemForm = reactive<Partial<DictItem>>({
  value: '',
  label: '',
  parentValue: '',
  sort: 1,
  enabled: true,
  dictCode: '',
});

const router = useRouter();

onMounted(loadDicts);

async function loadDicts() {
  loading.value = true;
  try {
    dicts.value = await getDicts();
    if (dicts.value.length && !activeDict.value) {
      selectDict(dicts.value[0]);
    }
  } finally {
    loading.value = false;
  }
}

async function selectDict(dict: Dict) {
  activeDict.value = dict;
  const data = await getDictItems(dict.code, true);
  treeData.value = data;
  flatItems.value = buildFlat(data);
}

function buildFlat(nodes: DictItem[]): DictItem[] {
  const list: DictItem[] = [];
  for (const node of nodes) {
    list.push(node);
    if (node.children?.length) {
      list.push(...buildFlat(node.children));
    }
  }
  return list;
}

function collectDescendantValues(node: DictItem): string[] {
  const values: string[] = [];
  if (node.children?.length) {
    for (const child of node.children) {
      values.push(child.value);
      values.push(...collectDescendantValues(child));
    }
  }
  return values;
}

const parentValueOptions = computed(() => {
  const editingValue = isItemEdit.value ? itemForm.value : undefined;
  const exclude = new Set<string>();
  if (editingValue) {
    exclude.add(editingValue);
    const node = flatItems.value.find((i) => i.value === editingValue);
    if (node) {
      collectDescendantValues(node).forEach((v) => exclude.add(v));
    }
  }
  return flatItems.value.filter((i) => !exclude.has(i.value));
});

function openEdit(dict: Dict) {
  router.push(`/system/dictionary/create?edit=${dict.id}`);
}
function openCreateItem(parentValue?: string) {
  isItemEdit.value = false;
  Object.assign(itemForm, {
    id: undefined,
    value: '',
    label: '',
    parentValue: parentValue || '',
    sort: (flatItems.value.length || 0) + 1,
    enabled: true,
    dictCode: activeDict.value?.code,
  });
  itemDialogVisible.value = true;
}

function openEditItem(row: DictItem) {
  isItemEdit.value = true;
  Object.assign(itemForm, { ...row });
  itemDialogVisible.value = true;
}

async function submitItem() {
  const payload = { ...itemForm };
  if (!payload.parentValue) delete payload.parentValue;
  if (isItemEdit.value) {
    await updateDictItem(payload.id!, payload);
  } else {
    await createDictItem(payload);
  }
  ElMessage.success('保存成功');
  itemDialogVisible.value = false;
  if (activeDict.value) await selectDict(activeDict.value);
}

async function removeItem(data: DictItem) {
  if (data.children?.length) {
    ElMessage.warning('请先删除下级字典项');
    return;
  }
  try {
    await ElMessageBox.confirm('确定删除该字典项吗？', '提示', { type: 'warning' });
    await deleteDictItem(data.id);
    ElMessage.success('删除成功');
    if (activeDict.value) await selectDict(activeDict.value);
  } catch (e) {
    // cancel
  }
}
</script>

<template>
  <div class="system-view">
    <div class="page-header">
      <div>
        <div class="page-title">字典管理</div>
        <div class="page-desc">维护业务枚举值与级联树形结构</div>
      </div>
      <div class="page-actions">
        <button v-permission="['system:dictionary:edit']" class="btn btn-primary" @click="router.push('/system/dictionary/create')">新增字典</button>
      </div>
    </div>

    <div class="split-layout">
      <!-- Left: dict type list -->
      <aside class="tree-panel">
        <div class="card-title">字典类型</div>
        <ul class="tree">
          <li
            v-for="dict in dicts"
            :key="dict.id"
            :class="{ active: activeDict?.id === dict.id }"
            @click="selectDict(dict)"
          >
            <span>
              <span>{{ dict.name }}</span>
              <span class="tree-count">{{ dict.code }}</span>
            </span>
          </li>
        </ul>
      </aside>

      <!-- Right: dict items table -->
      <div class="split-main">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>{{ activeDict?.name || '请选择字典' }}</span>
              <span v-if="activeDict" class="text-muted" style="font-weight: 400;">{{ activeDict.code }}</span>
            </div>
            <div style="display: flex; gap: 8px;">
              <button v-permission="['system:dictionary:edit']" class="btn btn-primary btn-sm" @click="openCreateItem()">新增字典项</button>
              <button v-permission="['system:dictionary:edit']" class="btn btn-default btn-sm" @click="openEdit(activeDict!)">编辑</button>
            </div>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 40%;">字典键 / 标签</th>
                  <th style="width: 20%;">字典值</th>
                  <th style="width: 80px;">排序</th>
                  <th style="width: 80px;">状态</th>
                  <th style="width: 140px;">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="flatItems.length === 0">
                  <td colspan="5" style="text-align: center; padding: 48px 0; color: var(--ink-400);">暂无字典项</td>
                </tr>
                <tr v-for="data in flatItems" :key="data.id">
                  <td>
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span class="cell-main">{{ data.label }}</span>
                      <span v-if="data.parentValue" class="cell-sub">({{ data.parentValue }})</span>
                    </div>
                  </td>
                  <td><span class="mono">{{ data.value }}</span></td>
                  <td><span class="mono">{{ data.sort }}</span></td>
                  <td>
                    <span :class="['pill', data.enabled ? 'pill-green' : 'pill-gray']">{{ data.enabled ? '启用' : '禁用' }}</span>
                  </td>
                  <td>
                    <div class="operation-cell">
                      <button
                        v-permission="['system:dictionary:edit']"
                        class="btn btn-ghost btn-sm"
                        @click="openCreateItem(data.value)"
                      >新增子项</button>
                      <button
                        v-permission="['system:dictionary:edit']"
                        class="btn btn-default btn-sm"
                        @click="openEditItem(data)"
                      >编辑</button>
                      <button
                        v-permission="['system:dictionary:edit']"
                        class="btn btn-danger btn-sm"
                        @click="removeItem(data)"
                      >删除</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Dict item edit dialog -->
    <el-dialog v-model="itemDialogVisible" :title="isItemEdit ? '编辑字典项' : '新增字典项'" width="480px">
      <el-form :model="itemForm" label-width="80px">
        <el-form-item label="值" required>
          <el-input v-model="itemForm.value" :disabled="isItemEdit" />
        </el-form-item>
        <el-form-item label="显示名" required>
          <el-input v-model="itemForm.label" />
        </el-form-item>
        <el-form-item label="上级项">
          <el-select v-model="itemForm.parentValue" clearable style="width: 100%;" placeholder="无（作为根节点）">
            <el-option v-for="i in parentValueOptions" :key="i.value" :label="`${i.label} (${i.value})`" :value="i.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="itemForm.sort" :min="1" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="itemForm.enabled" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="btn btn-default" @click="itemDialogVisible = false">取消</button>
        <button class="btn btn-primary" @click="submitItem">确定</button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.system-view { min-height: 100%; }
</style>