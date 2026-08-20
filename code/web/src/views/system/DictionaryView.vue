<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { getDicts, getDictItems, createDict, updateDict, createDictItem, deleteDictItem, type Dict, type DictItem } from '@/api/system';

const dicts = ref<Dict[]>([]);
const items = ref<DictItem[]>([]);
const loading = ref(false);
const activeDict = ref<Dict | null>(null);
const dialogVisible = ref(false);
const itemDialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive<Partial<Dict>>({ code: '', name: '', description: '' });
const itemForm = reactive<Partial<DictItem>>({ value: '', label: '', sort: 1, enabled: true });

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
  items.value = await getDictItems(dict.code);
}

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

function openCreateItem() {
  Object.assign(itemForm, { value: '', label: '', sort: items.value.length + 1, enabled: true, dictCode: activeDict.value?.code });
  itemDialogVisible.value = true;
}

async function submitItem() {
  await createDictItem(itemForm);
  ElMessage.success('保存成功');
  itemDialogVisible.value = false;
  if (activeDict.value) await selectDict(activeDict.value);
}

async function removeItem(item: DictItem) {
  await deleteDictItem(item.id);
  ElMessage.success('删除成功');
  if (activeDict.value) await selectDict(activeDict.value);
}
</script>

<template>
  <div class="system-view">
    <div class="page-header">
      <div>
        <div class="page-title">字典管理</div>
        <div class="page-desc">维护业务枚举值，字段驱动无需改代码</div>
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
            <el-button v-permission="['system:dictionary:edit']" size="small" type="primary" plain @click="openCreateItem">新增字典项</el-button>
            <el-button v-permission="['system:dictionary:edit']" size="small" @click="openEdit(activeDict!)">编辑</el-button>
          </div>
        </div>
        <el-table :data="items" size="small">
          <el-table-column prop="value" label="值" />
          <el-table-column prop="label" label="显示名" />
          <el-table-column prop="sort" label="排序" width="80" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <span :class="['pill', row.enabled ? 'pill-green' : 'pill-gray']">{{ row.enabled ? '启用' : '禁用' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button link type="danger" size="small" @click="removeItem(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
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

    <el-dialog v-model="itemDialogVisible" title="新增字典项" width="480px">
      <el-form :model="itemForm" label-width="80px">
        <el-form-item label="值" required>
          <el-input v-model="itemForm.value" />
        </el-form-item>
        <el-form-item label="显示名" required>
          <el-input v-model="itemForm.label" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="itemForm.sort" :min="1" controls-position="right" style="width: 100%;" />
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
@media (max-width: 768px) {
  .dict-layout { grid-template-columns: 1fr; }
}
</style>
