<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createReserveProperty, getReservePropertyForEdit, updateReserveProperty, type ReserveProperty } from '@/api/reserve-property';
import { getCommunities, type Community } from '@/api/community';
import { useDictStore } from '@/stores/dict';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const route = useRoute();
const dictStore = useDictStore();
const userStore = useUserStore();
const submitting = ref(false);
const loading = ref(false);
const editId = computed(() => Number(route.params.id) || 0);
const isEdit = computed(() => editId.value > 0);

const communityOptions = ref<Community[]>([]);
const communitiesLoading = ref(false);
const form = reactive<Partial<ReserveProperty>>({
  communityId: undefined, address: '', roomNo: '', layout: '', buildingArea: undefined,
  decoration: '', ownerName: '', ownerPhone: '', ownerQuote: 0,
  diskType: 'public', sourceChannel: '', keyStatus: '',
});

onMounted(async () => {
  await dictStore.ensureLoaded(['disk_type', 'source_channel', 'decoration_level']);
  await loadCommunities();
  if (isEdit.value) {
    loading.value = true;
    try {
      Object.assign(form, await getReservePropertyForEdit(editId.value));
    } catch {
      router.push('/house/reserve-house');
    } finally {
      loading.value = false;
    }
  }
});

async function loadCommunities(keyword = '') {
  communitiesLoading.value = true;
  try {
    communityOptions.value = (await getCommunities({ keyword })).list;
  } finally {
    communitiesLoading.value = false;
  }
}

function onCommunityChange(id: number) {
  const c = communityOptions.value.find((item) => item.id === id);
  form.communityName = c?.name || '';
  form.address = c?.address || '';
}

async function submit() {
  if (!form.address?.trim() || !form.roomNo?.trim() || !form.layout?.trim()) return ElMessage.warning('请填写地址、门牌号和户型');
  if (!form.ownerName?.trim() || !form.sourceChannel) return ElMessage.warning('请填写业主和来源渠道');
  submitting.value = true;
  try {
    if (isEdit.value) await updateReserveProperty(editId.value, form);
    else await createReserveProperty({ ...form, storeId: userStore.userInfo?.storeIds?.[0] || 0 });
    ElMessage.success(isEdit.value ? '保存成功' : '创建成功');
    router.push('/house/reserve-house');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">{{ isEdit ? '编辑储备房源' : '录入储备房源' }}</div>
        <div class="page-desc">维护储备期房源基础资料；签约和归属变更请在列表执行</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/house/reserve-house')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card" style="padding: 24px;" v-loading="loading">
      <el-form :model="form" label-width="90px">
        <el-form-item label="小区">
          <el-select
            v-model="form.communityId"
            filterable
            remote
            :remote-method="loadCommunities"
            placeholder="选择小区"
            :loading="communitiesLoading"
            style="width: 100%;"
            @change="onCommunityChange"
          >
            <el-option v-for="c in communityOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder="选择小区后自动带出" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="门牌号" required><el-input v-model="form.roomNo" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="户型" required><el-input v-model="form.layout" placeholder="如：2室1厅1卫" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="建筑面积"><el-input-number v-model="form.buildingArea" :min="0" style="width: 100%;" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="装修"><el-select v-model="form.decoration" clearable style="width: 100%;"><el-option v-for="item in dictStore.getItems('decoration_level')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
        </el-row>
        <el-form-item label="业主">
          <el-input v-model="form.ownerName" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.ownerPhone" />
        </el-form-item>
        <el-form-item label="期望价">
          <el-input-number v-model="form.ownerQuote" :min="0" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="盘源">
          <el-select v-model="form.diskType" style="width: 100%;">
            <el-option v-for="item in dictStore.getItems('disk_type')" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="form.sourceChannel" style="width: 100%;">
            <el-option v-for="item in dictStore.getItems('source_channel')" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-page { min-height: 100%; }
</style>
