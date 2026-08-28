<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createBlacklist, type Blacklist } from '@/api/blacklist';
import { useDictStore } from '@/stores/dict';

const router = useRouter();
const dictStore = useDictStore();
const submitting = ref(false);

const form = reactive<Partial<Blacklist>>({
  name: '', mobile: '', idCard: '', type: 'tenant', reason: '', source: '', status: 'active',
});

onMounted(async () => {
  await dictStore.ensureLoaded(['blacklist_type', 'blacklist_status']);
});

async function submit() {
  if (!form.name?.trim()) return ElMessage.warning('请填写姓名');
  if (!form.reason?.trim()) return ElMessage.warning('请填写原因');
  submitting.value = true;
  try {
    await createBlacklist(form);
    ElMessage.success('创建成功');
    router.push('/house/blacklist');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">新增黑名单</div>
        <div class="page-desc">填写失信人员信息</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/house/blacklist')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card" style="padding: 24px;">
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
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-page { min-height: 100%; }
</style>