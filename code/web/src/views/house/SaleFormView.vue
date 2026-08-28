<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createSaleProperty, type SaleProperty } from '@/api/sale';
import { getCommunities, type Community } from '@/api/community';
import { generateHouseCode } from '@/utils/code';
import { useDictStore } from '@/stores/dict';

const router = useRouter();
const dictStore = useDictStore();
const submitting = ref(false);

const communityOptions = ref<Community[]>([]);
const communitiesLoading = ref(false);

const form = reactive<Partial<SaleProperty>>({
  code: generateHouseCode('SJ'), title: '', communityName: '', communityId: undefined, building: '', unit: '', floor: '', roomNo: '',
  layoutRooms: 1, layoutHalls: 1, layoutBathrooms: 1, layoutBalconies: 0,
  buildingArea: 0, orientation: '', decoration: '', elevator: 'yes', buildYear: undefined,
  totalPrice: 0, unitPrice: 0, floorPrice: 0, taxType: '', debt: 0, certificateType: '',
  sourceChannel: '', tags: [], description: '', ownerName: '', ownerPhone: '', ownerPhoneBackup: '',
  maintainerId: undefined, storeId: 1, status: 'pre_publish', qualityScore: 0, qualityLevel: '',
  verified: false, isCitywideSale: false, images: [],
});
const tagInput = ref('');

onMounted(async () => {
  await dictStore.ensureLoaded(['house_status', 'decoration_level', 'orientation', 'source_channel', 'tax_type', 'certificate_type']);
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
}

function addTag() {
  const val = tagInput.value.trim();
  if (val && !form.tags?.includes(val)) {
    form.tags?.push(val);
  }
  tagInput.value = '';
}
function removeTag(tag: string) {
  form.tags = form.tags?.filter((t) => t !== tag);
}

async function submit() {
  if (!form.title?.trim()) return ElMessage.warning('请填写标题');
  if (!form.ownerName?.trim()) return ElMessage.warning('请填写业主');
  submitting.value = true;
  try {
    await createSaleProperty(form);
    ElMessage.success('创建成功');
    router.push('/house/sale');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <div class="page-title">新房源录入</div>
        <div class="page-desc">填写在售房源详细信息</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/house/sale')">返回</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">保存</button>
      </div>
    </div>

    <div class="card" style="padding: 24px;">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="房源编码" required>
              <el-input v-model="form.code" readonly placeholder="系统自动生成">
                <template #append>
                  <el-button @click="form.code = generateHouseCode('SJ')">重新生成</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="房源标题" required>
              <el-input v-model="form.title" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
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
          </el-col>
          <el-col :span="12">
            <el-form-item label="房源类型">
              <el-input v-model="form.propertyType" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="楼栋">
              <el-input v-model="form.building" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="单元">
              <el-input v-model="form.unit" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="楼层">
              <el-input v-model="form.floor" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="房号">
              <el-input v-model="form.roomNo" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="室">
              <el-input-number v-model="form.layoutRooms" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="厅">
              <el-input-number v-model="form.layoutHalls" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="卫">
              <el-input-number v-model="form.layoutBathrooms" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="阳台">
              <el-input-number v-model="form.layoutBalconies" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="面积">
              <el-input-number v-model="form.buildingArea" :min="0" :precision="2" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="装修">
              <el-select v-model="form.decoration" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('decoration_level')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="朝向">
              <el-select v-model="form.orientation" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('orientation')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="售价">
              <el-input-number v-model="form.totalPrice" :min="0" :precision="2" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单价">
              <el-input-number v-model="form.unitPrice" :min="0" :precision="2" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="电梯">
              <el-radio-group v-model="form.elevator">
                <el-radio label="yes">有</el-radio>
                <el-radio label="no">无</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税费">
              <el-select v-model="form.taxType" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('tax_type')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产证">
              <el-select v-model="form.certificateType" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('certificate_type')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="业主">
              <el-input v-model="form.ownerName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电话">
              <el-input v-model="form.ownerPhone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源">
              <el-select v-model="form.sourceChannel" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('source_channel')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="全城区售">
              <el-switch v-model="form.isCitywideSale" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
          <el-form-item label="标签">
            <el-input v-model="tagInput" placeholder="输入后回车添加" @keyup.enter="addTag" style="width: 200px; margin-right: 8px;" />
            <el-tag v-for="tag in form.tags" :key="tag" closable @close="removeTag(tag)" style="margin-right: 6px;">{{ tag }}</el-tag>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="form.description" type="textarea" :rows="2" />
          </el-form-item>
        </el-row>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-page { min-height: 100%; }
</style>