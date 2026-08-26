<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCustomers, createCustomer, type Customer } from '@/api/customer';
import { checkBlacklist } from '@/api/blacklist';
import { useDictStore } from '@/stores/dict';

const dictStore = useDictStore();
const list = ref<Customer[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const form = reactive<Partial<Customer>>({
  name: '', phone: '', identity: 'tenant', status: 'not_rented', source: '', remark: '',
});
const query = reactive({ keyword: '', identity: '' });

onMounted(async () => {
  await dictStore.ensureLoaded(['identity', 'customer_status', 'source_channel']);
  await load();
});

async function load() {
  loading.value = true;
  try {
    const res = await getCustomers(query);
    list.value = res.list;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, { name: '', phone: '', identity: 'tenant', status: 'not_rented', source: '', remark: '' });
  dialogVisible.value = true;
}

async function checkCustomerBlacklist() {
  if (!form.phone || form.phone.length < 7) return;
  const hit = await checkBlacklist(form.phone);
  if (hit) {
    ElMessageBox.confirm(
      `该客户命中黑名单：${hit.name}\n原因：${hit.reason}\n来源：${hit.source || '系统录入'}`,
      '黑名单预警',
      {
        confirmButtonText: '继续保存（需特批）',
        cancelButtonText: '取消',
        type: 'warning',
      },
    ).catch(() => {
      form.phone = '';
    });
  }
}

async function submit() {
  await createCustomer(form);
  ElMessage.success('创建成功');
  dialogVisible.value = false;
  await load();
}

function identityClass(id: string) {
  const map: Record<string, string> = {
    tenant: 'pill-blue',
    landlord: 'pill-green',
    shareholder: 'pill-purple',
    supplier: 'pill-orange',
  };
  return map[id] || 'pill-gray';
}
</script>

<template>
  <div class="house-view">
    <div class="page-header">
      <div>
        <div class="page-title">客户管理</div>
        <div class="page-desc">租客、房东、供应商等客户档案统一管理</div>
      </div>
      <div class="page-actions">
        <el-button type="primary" @click="openCreate">新增客户</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="姓名/电话" clearable @keyup.enter="load" />
      <el-select v-model="query.identity" placeholder="身份" clearable @change="load">
        <el-option
          v-for="item in dictStore.getItems('identity')"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <el-table :data="list" v-loading="loading" class="card">
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="phone" label="电话" />
      <el-table-column label="身份">
        <template #default="{ row }">
          <span :class="['pill', identityClass(row.identity)]">{{ dictStore.getLabel('identity', row.identity) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态">
        <template #default="{ row }">
          <span class="pill pill-gray">{{ dictStore.getLabel('customer_status', row.status) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="storeName" label="所属店面" />
      <el-table-column prop="employeeName" label="维护人" />
      <el-table-column prop="createdAt" label="创建时间" />
      <el-table-column label="操作" width="120">
        <template #default="{}">
          <el-button size="small" type="primary" plain>编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="新增客户" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="姓名" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" @blur="checkCustomerBlacklist" />
        </el-form-item>
        <el-form-item label="身份">
          <el-select v-model="form.identity" style="width: 100%;">
            <el-option
              v-for="item in dictStore.getItems('identity')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="form.source" style="width: 100%;">
            <el-option
              v-for="item in dictStore.getItems('source_channel')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
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
</style>
