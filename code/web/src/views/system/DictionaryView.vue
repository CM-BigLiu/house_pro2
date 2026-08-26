<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getDicts,
  getDictItems,
  createDict,
  updateDict,
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
const dialogVisible = ref(false);
const itemDialogVisible = ref(false);
const isEdit = ref(false);
const isItemEdit = ref(false);
const form = reactive<Partial<Dict>>({ code: '', name: '', description: '' });
const itemForm = reactive<Partial<DictItem>>({
  value: '',
  label: '',
  parentValue: '',
  sort: 1,
  enabled: true,
  dictCode: '',
});

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

function openCreate() {
  isEdit.value = false;
  Object.assign(form, { code: '', name: '', description: '' });
  dialogVisible.value = true;
}

function openEdit(dict: Dict) {
  isEdit.value = true;
  Object.assign(form, { ...dict });
  dialogVisible.value = true;
}

async function submit() {
  if (isEdit.value) {
    await updateDict(form.id!, form);
  } else {
    await createDict(form);
  }
  ElMessage.success('保存成功');
  dialogVisible.value = false;
  await loadDicts();
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

async function toggleEnabled(row: DictItem) {
  try {
    await updateDictItem(row.id, { enabled: !row.enabled });
    ElMessage.success('状态已更新');
    if (activeDict.value) await selectDict(activeDict.value);
  } catch (e) {
    // reload keeps consistency
  }
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
        <el-button v-permission="['system:dictionary:edit']" type="primary" @click="openCreate">新增字典</el-button>
      </div>
    </div>

    <div class="dict-layout">
      <div class="dict-list card">
        <div class="list-header">字典类型</div>
        <div
          v-for="dict in dicts"
          :key="dict.id"
          class="dict-item"
          :class="{ active: activeDict?.id === dict.id }"
          @click="selectDict(dict)"
        >
          <span class="dict-name">{{ dict.name }}</span>
          <span class="dict-code">{{ dict.code }}</span>
        </div>
      </div>

      <div class="dict-detail card">
        <div class="detail-header">
          <div>
            <div class="detail-title">{{ activeDict?.name }}</div>
            <div class="detail-code">{{ activeDict?.code }}</div>
          </div>
          <div class="detail-actions">
            <el-button v-permission="['system:dictionary:edit']" size="small" type="primary" plain @click="openCreateItem()">新增字典项</el-button>
            <el-button v-permission="['system:dictionary:edit']" size="small" @click="openEdit(activeDict!)">编辑</el-button>
          </div>
        </div>

        <el-tree :data="treeData" node-key="value" default-expand-all class="dict-tree">
          <template #default="{ data }">
            <div class="tree-node">
              <div class="tree-label">
                <span class="label-text">{{ data.label }}</span>
                <span class="value-text">{{ data.value }}</span>
              </div>
              <div class="tree-meta">
                <span class="sort-text">排序 {{ data.sort }}</span>
                <el-switch
                  v-permission="['system:dictionary:edit']"
                  :model-value="data.enabled"
                  inline-prompt
                  active-text="启"
                  inactive-text="禁"
                  size="small"
                  @change="toggleEnabled(data)"
                />
                <el-button v-permission="['system:dictionary:edit']" link type="primary" size="small" @click.stop="openCreateItem(data.value)">新增子项</el-button>
                <el-button v-permission="['system:dictionary:edit']" link size="small" @click.stop="openEditItem(data)">编辑</el-button>
                <el-button v-permission="['system:dictionary:edit']" link type="danger" size="small" @click.stop="removeItem(data)">删除</el-button>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑字典' : '新增字典'" width="520px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="编码" required>
          <el-input v-model="form.code" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>

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
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitItem">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.system-view { min-height: 100%; }
.dict-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
}
.dict-list, .dict-detail {
  padding: 16px;
}
.list-header, .detail-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-900);
  margin-bottom: 12px;
}
.dict-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  &:hover { background: var(--ink-50); }
  &.active { background: var(--primary-soft); }
}
.dict-name { font-size: 13px; font-weight: 600; color: var(--ink-800); }
.dict-code { font-size: 11px; color: var(--ink-400); }
.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}
.detail-code { font-size: 12px; color: var(--ink-400); margin-top: 2px; }
.detail-actions { display: flex; gap: 8px; }
.dict-tree {
  .tree-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 1;
    min-width: 0;
  }
  .tree-label {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .label-text { font-size: 13px; color: var(--ink-800); }
  .value-text { font-size: 11px; color: var(--ink-400); }
  .tree-meta {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .sort-text { font-size: 11px; color: var(--ink-400); }
}
@media (max-width: 768px) {
  .dict-layout { grid-template-columns: 1fr; }
  .tree-meta { display: none; }
}
</style>
