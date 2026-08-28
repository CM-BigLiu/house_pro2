<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { getPartners, createPartner, updatePartner, type Partner } from '@/api/finance-report';

const list = ref<Partner[]>([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive<Partial<Partner>>({
  name: '', mobile: '', share: 0, invest: 0, profit: 0, dividend: 0, status: 'active', remark: '',
});
const query = reactive({ keyword: '', page: 1, pageSize: 20 });

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const res = await getPartners(query);
    list.value = res.list || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  isEdit.value = false;
  Object.assign(form, { name: '', mobile: '', share: 0, invest: 0, profit: 0, dividend: 0, status: 'active', remark: '' });
  dialogVisible.value = true;
}

function openEdit(item: Partner) {
  isEdit.value = true;
  Object.assign(form, { ...item });
  dialogVisible.value = true;
}

async function submit() {
  if (!form.name?.trim()) return ElMessage.warning('请填写姓名');
  if (isEdit.value) {
    await updatePartner(form.id!, form);
  } else {
    await createPartner(form);
  }
  ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
  dialogVisible.value = false;
  await load();
}
</script>

<template>
  <div class="finance-view">
    <div class="page-header">
      <div>
        <div class="page-title">合伙人</div>
        <div class="page-desc">合伙人信息、出资、分红记录管理</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" @click="openCreate">新增合伙人</button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="姓名/电话" clearable @keyup.enter="load" />
      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <el-table :data="list" v-loading="loading" class="card">
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="mobile" label="电话" />
      <el-table-column prop="share" label="占股(%)" />
      <el-table-column prop="invest" label="出资">
        <template #default="{ row }">¥{{ row.invest.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="profit" label="利润">
        <template #default="{ row }">¥{{ row.profit.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="dividend" label="分红">
        <template #default="{ row }">¥{{ row.dividend.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column label="状态">
        <template #default="{ row }">
          <span :class="['pill', row.status === 'active' ? 'pill-green' : 'pill-gray']">{{ row.status === 'active' ? '正常' : '退出' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button size="small" type="primary" plain @click="openEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar">
      <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" layout="total, prev, pager, next" @change="load" />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑合伙人' : '新增合伙人'" width="520px">
      <el-form :model="form" label-width="90px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="姓名" required>
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电话">
              <el-input v-model="form.mobile" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="占股(%)">
              <el-input-number v-model="form.share" :min="0" :max="100" :precision="2" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出资">
              <el-input-number v-model="form.invest" :min="0" :precision="2" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="利润">
              <el-input-number v-model="form.profit" :min="0" :precision="2" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分红">
              <el-input-number v-model="form.dividend" :min="0" :precision="2" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="isEdit" label="状态">
          <el-select v-model="form.status" style="width: 100%;">
            <el-option label="正常" value="active" />
            <el-option label="退出" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="btn btn-default" @click="dialogVisible = false">取消</button>
        <button class="btn btn-primary" @click="submit">确定</button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.finance-view { min-height: 100%; }
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
