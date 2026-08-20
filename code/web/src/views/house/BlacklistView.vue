<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getBlacklist, createBlacklist, updateBlacklist, deleteBlacklist, type Blacklist } from '@/api/blacklist';
import { useDictStore } from '@/stores/dict';

const dictStore = useDictStore();
const list = ref<Blacklist[]>([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive<Partial<Blacklist>>({
  name: '', mobile: '', idCard: '', type: 'tenant', reason: '', source: '', status: 'active',
});
const query = reactive({ keyword: '', type: '', status: '', page: 1, pageSize: 20 });

onMounted(async () => {
  await dictStore.ensureLoaded(['blacklist_type', 'blacklist_status']);
  await load();
});

async function load() {
  loading.value = true;
  try {
    const res = await getBlacklist(query);
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  isEdit.value = false;
  Object.assign(form, { name: '', mobile: '', idCard: '', type: 'tenant', reason: '', source: '', status: 'active' });
  dialogVisible.value = true;
}

function openEdit(item: Blacklist) {
  isEdit.value = true;
  Object.assign(form, { ...item });
  dialogVisible.value = true;
}

async function submit() {
  if (!form.name?.trim()) return ElMessage.warning('请填写姓名');
  if (!form.reason?.trim()) return ElMessage.warning('请填写原因');
  if (isEdit.value) {
    await updateBlacklist(form.id!, form);
  } else {
    await createBlacklist(form);
  }
  ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
  dialogVisible.value = false;
  await load();
}

async function remove(item: Blacklist) {
  await ElMessageBox.confirm(`确认移除黑名单「${item.name}」？`, '提示');
  await deleteBlacklist(item.id);
  ElMessage.success('已移除');
  await load();
}

function typeClass(type: string) {
  const map: Record<string, string> = {
    tenant: 'pill-blue',
    landlord: 'pill-green',
    supplier: 'pill-orange',
    other: 'pill-gray',
  };
  return map[type] || 'pill-gray';
}
</script>

<template>
  <div class="house-view">
    <div class="page-header">
      <div>
        <div class="page-title">黑名单管理</div>
        <div class="page-desc">租客、房东、供应商等失信人员统一管理</div>
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="openCreate">新增黑名单</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="姓名/电话/身份证" clearable @keyup.enter="load" />
      <el-select v-model="query.type" placeholder="类型" clearable @change="load">
        <el-option v-for="item in dictStore.getItems('blacklist_type')" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="query.status" placeholder="状态" clearable @change="load">
        <el-option v-for="item in dictStore.getItems('blacklist_status')" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <el-table :data="list" v-loading="loading" class="card">
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="mobile" label="电话" />
      <el-table-column prop="idCard" label="身份证" />
      <el-table-column label="类型">
        <template #default="{ row }">
          <span :class="['pill', typeClass(row.type)]">{{ dictStore.getLabel('blacklist_type', row.type) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="reason" label="原因" show-overflow-tooltip />
      <el-table-column prop="source" label="来源" />
      <el-table-column label="状态">
        <template #default="{ row }">
          <span :class="['pill', row.status === 'active' ? 'pill-red' : 'pill-gray']">{{ dictStore.getLabel('blacklist_status', row.status) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" type="primary" plain @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" plain @click="remove(row)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @change="load"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑黑名单' : '新增黑名单'" width="520px">
      <el-form :model="form" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名" required>
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" required>
              <el-select v-model="form.type" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('blacklist_type')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="电话">
              <el-input v-model="form.mobile" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证">
              <el-input v-model="form.idCard" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="原因" required>
          <el-input v-model="form.reason" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="来源">
          <el-input v-model="form.source" />
        </el-form-item>
        <el-form-item v-if="isEdit" label="状态">
          <el-select v-model="form.status" style="width: 100%;">
            <el-option v-for="item in dictStore.getItems('blacklist_status')" :key="item.value" :label="item.label" :value="item.value" />
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
.house-view { min-height: 100%; }
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
