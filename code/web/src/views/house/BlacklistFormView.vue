<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createBlacklist, getBlacklistItem, updateBlacklist, type Blacklist } from '@/api/blacklist';
import { useDictStore } from '@/stores/dict';

const router = useRouter();
const route = useRoute();
const dictStore = useDictStore();
const submitting = ref(false);
const isEdit = computed(() => Boolean(route.params.id));

const form = reactive<Partial<Blacklist>>({
  name: '', mobile: '', idCard: '', type: 'tenant', reason: '', source: '', status: 'active',
});

onMounted(async () => {
  await dictStore.ensureLoaded(['blacklist_type', 'blacklist_status']);
  if (isEdit.value) {
    const data = await getBlacklistItem(String(route.params.id));
    Object.assign(form, data);
  }
});

async function submit() {
  if (!form.name?.trim()) return ElMessage.warning('请填写姓名');
  if (!form.reason?.trim()) return ElMessage.warning('请填写原因');
  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateBlacklist(Number(route.params.id), form);
      ElMessage.success('保存成功');
    } else {
      await createBlacklist(form);
      ElMessage.success('创建成功');
    }
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
        <div class="page-title">{{ isEdit ? '编辑黑名单' : '新增黑名单' }}</div>
        <div class="page-desc">{{ isEdit ? '修改失信人员信息' : '填写失信人员信息' }}</div>
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
