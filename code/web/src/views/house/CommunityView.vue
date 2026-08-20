<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { getCommunities, createCommunity, type Community } from '@/api/community';

const list = ref<Community[]>([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const form = reactive<Partial<Community>>({
  name: '', alias: '', cityId: undefined, districtId: undefined, businessCircle: '', address: '', longitude: undefined, latitude: undefined,
});
const query = reactive({ keyword: '', page: 1, pageSize: 20 });

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const res = await getCommunities(query);
    list.value = res;
    total.value = res.length;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, { name: '', alias: '', cityId: undefined, districtId: undefined, businessCircle: '', address: '', longitude: undefined, latitude: undefined });
  dialogVisible.value = true;
}

async function submit() {
  if (!form.name?.trim()) return ElMessage.warning('请填写小区名称');
  await createCommunity(form);
  ElMessage.success('创建成功');
  dialogVisible.value = false;
  await load();
}
</script>

<template>
  <div class="house-view">
    <div class="page-header">
      <div>
        <div class="page-title">小区管理</div>
        <div class="page-desc">小区信息、楼栋结构、房源数量统计</div>
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="openCreate">新增小区</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="小区名称/地址" clearable @keyup.enter="load" />
      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <el-table :data="list" v-loading="loading" class="card">
      <el-table-column prop="name" label="小区名称" />
      <el-table-column prop="cityName" label="城市" />
      <el-table-column prop="district" label="区域" />
      <el-table-column prop="address" label="地址" show-overflow-tooltip />
      <el-table-column prop="buildingCount" label="楼栋数" />
      <el-table-column prop="roomCount" label="房间数" />
      <el-table-column label="操作" width="120">
        <template #default="{}">
          <el-button size="small" type="primary" plain>编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar">
      <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" layout="total, prev, pager, next" @change="load" />
    </div>

    <el-dialog v-model="dialogVisible" title="新增小区" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="小区名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="别名">
          <el-input v-model="form.alias" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input-number v-model="form.cityId" :min="1" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="区域">
          <el-input-number v-model="form.districtId" :min="1" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="商圈">
          <el-input v-model="form.businessCircle" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" />
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
