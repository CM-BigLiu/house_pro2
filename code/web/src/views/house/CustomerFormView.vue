<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { createCustomer, type Customer } from '@/api/customer';
import { checkBlacklist } from '@/api/blacklist';
import { useDictStore } from '@/stores/dict';

const router = useRouter();
const dictStore = useDictStore();
const submitting = ref(false);

const form = reactive<Partial<Customer>>({
  name: '', phone: '', identity: 'tenant', status: 'not_rented', source: '', remark: '',
});

onMounted(async () => {
  await dictStore.ensureLoaded(['identity', 'customer_status', 'source_channel']);
});

async function checkCustomerBlacklist() {
  if (!form.phone || form.phone.length < 7) return;
  const hits = (await checkBlacklist(form.phone)) || [];
  const hit = hits[0];
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
  submitting.value = true;
  try {
    await createCustomer(form);
    ElMessage.success('创建成功');
    router.push('/house/customer');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">新增客源</div>
        <div class="page-desc">填写客户基本信息</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/house/customer')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card" style="padding: 24px;">
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
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-page { min-height: 100%; }
</style>