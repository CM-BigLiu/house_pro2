<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createReserveProperty, type ReserveProperty } from '@/api/reserve-property';
import { getCommunities, type Community } from '@/api/community';
import { useDictStore } from '@/stores/dict';

const router = useRouter();
const dictStore = useDictStore();
const submitting = ref(false);

const communityOptions = ref<Community[]>([]);
const communitiesLoading = ref(false);

const form = reactive<Partial<ReserveProperty> & { communityId?: number; address?: string }>({
  title: '', communityName: '', communityId: undefined, address: '', ownerName: '', ownerPhone: '',
  expectedPrice: 0, status: 'not_rented', diskType: 'public', source: '',
});

onMounted(async () => {
  await dictStore.ensureLoaded(['house_status', 'disk_type', 'source_channel']);
  await loadCommunities();
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
  if (!form.title?.trim()) return ElMessage.warning('请填写标题');
  submitting.value = true;
  try {
    await createReserveProperty(form);
    ElMessage.success('创建成功');
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
        <div class="page-title">录入储备房源</div>
        <div class="page-desc">填写储备期房源基本信息</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/house/reserve-house')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card" style="padding: 24px;">
      <el-form :model="form" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" />
        </el-form-item>
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
        <el-form-item label="业主">
          <el-input v-model="form.ownerName" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.ownerPhone" />
        </el-form-item>
        <el-form-item label="期望价">
          <el-input-number v-model="form.expectedPrice" :min="0" controls-position="right" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="盘源">
          <el-select v-model="form.diskType" style="width: 100%;">
            <el-option v-for="item in dictStore.getItems('disk_type')" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="form.source" style="width: 100%;">
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