<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, type FormInstance } from 'element-plus';
import { createSaleProperty, updateSaleProperty, getSalePropertyForEdit, type SaleProperty } from '@/api/sale';
import { getCommunities, type Community } from '@/api/community';
import { generateHouseCode } from '@/utils/code';
import { useDictStore } from '@/stores/dict';
import { saleFormRules } from '@/utils/sale-form';

const router = useRouter();
const route = useRoute();
const editId = computed(() => Number(route.params.id) || undefined);
const loading = ref(true);
const loadError = ref('');
const formRef = ref<FormInstance>();
const dictStore = useDictStore();
const submitting = ref(false);

const communityOptions = ref<Community[]>([]);
const communitiesLoading = ref(false);

const form = reactive<Partial<SaleProperty>>({
  code: generateHouseCode('SJ'), title: '', communityName: '', communityId: undefined, propertyType: '', building: '', unit: '', floor: '', roomNo: '',
  layoutRooms: 1, layoutHalls: 1, layoutBathrooms: 1, layoutBalconies: 0,
  buildingArea: 0, orientation: '', decoration: '', elevator: 'yes', buildYear: undefined,
  totalPrice: 0, unitPrice: 0, floorPrice: 0, taxType: '', debt: 0, certificateType: '',
  sourceChannel: '', tags: [], description: '', ownerName: '', ownerPhone: '', ownerPhoneBackup: '',
  maintainerId: undefined, storeId: undefined, status: 'pre_publish', qualityScore: 0, qualityLevel: '',
  verified: false, isCitywideSale: false, images: [],
});
const tagInput = ref('');

async function initialize() {
  loading.value = true;
  loadError.value = '';
  try {
    await Promise.all([
      dictStore.ensureLoaded(['property_type', 'decoration_level', 'orientation', 'source_channel', 'tax_type', 'certificate_type']),
      loadCommunities(),
    ]);
    if (editId.value) {
      const data = await getSalePropertyForEdit(editId.value);
      Object.assign(form, Object.fromEntries(Object.keys(form).map((key) => [key, (data as unknown as Record<string, unknown>)[key] ?? (form as Record<string, unknown>)[key]])));
      if (data.communityId && !communityOptions.value.some((c) => c.id === data.communityId)) {
        communityOptions.value.push({ id: data.communityId, name: data.communityName } as Community);
      }
    }
  } catch {
    loadError.value = '加载表单数据失败，请重试';
  } finally {
    loading.value = false;
  }
}
onMounted(initialize);

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
  if (submitting.value || loading.value || loadError.value) return;
  for (const key of ['title', 'building', 'unit', 'floor', 'roomNo', 'ownerName', 'ownerPhone'] as const) {
    if (typeof form[key] === 'string') form[key] = form[key]!.trim();
  }
  submitting.value = true;
  try {
    if (!await formRef.value?.validate().catch(() => false)) return;
    if (editId.value) await updateSaleProperty(editId.value, form);
    else await createSaleProperty(form);
    ElMessage.success(editId.value ? '修改成功' : '创建成功');
    router.push('/house/sale');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page" v-loading="loading">
    <div class="page-header">
      <div>
        <div class="page-title">{{ editId ? '编辑售房' : '新房源录入' }}</div>
        <div class="page-desc">填写在售房源详细信息</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/house/sale')">返回</button>
        <button class="btn btn-primary" :disabled="submitting || loading || !!loadError" @click="submit">保存</button>
      </div>
    </div>

    <div class="card" style="padding: 24px;">
      <div v-if="loadError" role="alert" class="load-error">{{ loadError }} <el-button link type="primary" @click="initialize">重新加载</el-button></div>
      <p class="form-tip">红色 <span>*</span> 为必填项；户型数量允许填 0，税费、产证等未标星项可不填。</p>
      <el-form ref="formRef" :model="form" :rules="saleFormRules" label-width="100px" scroll-to-error>
        <div class="section-title">房源信息</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="房源编码" prop="code">
              <el-input v-model="form.code" readonly placeholder="系统自动生成">
                <template v-if="!editId" #append>
                  <el-button @click="form.code = generateHouseCode('SJ')">重新生成</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="房源标题" prop="title">
              <el-input v-model="form.title" :maxlength="255" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="小区" prop="communityId">
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
            <el-form-item label="房源类型" prop="propertyType">
              <el-select v-model="form.propertyType" placeholder="请选择房源类型" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('property_type')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="楼栋" prop="building">
              <el-input v-model="form.building" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="单元" prop="unit">
              <el-input v-model="form.unit" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="楼层" prop="floor">
              <el-input v-model="form.floor" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="房号" prop="roomNo">
              <el-input v-model="form.roomNo" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="室" prop="layoutRooms">
              <el-input-number v-model="form.layoutRooms" :min="0" :precision="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="厅" prop="layoutHalls">
              <el-input-number v-model="form.layoutHalls" :min="0" :precision="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="卫" prop="layoutBathrooms">
              <el-input-number v-model="form.layoutBathrooms" :min="0" :precision="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="阳台" prop="layoutBalconies">
              <el-input-number v-model="form.layoutBalconies" :min="0" :precision="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="面积(㎡)" prop="buildingArea">
              <el-input-number v-model="form.buildingArea" :min="0" :precision="2" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="装修" prop="decoration">
              <el-select v-model="form.decoration" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('decoration_level')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="朝向" prop="orientation">
              <el-select v-model="form.orientation" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('orientation')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="售价(元)" prop="totalPrice">
              <el-input-number v-model="form.totalPrice" :min="0" :precision="2" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单价(元/㎡)" prop="unitPrice">
              <el-input-number v-model="form.unitPrice" :min="0" :precision="2" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="电梯" prop="elevator">
              <el-radio-group v-model="form.elevator">
                <el-radio value="yes">有</el-radio>
                <el-radio value="no">无</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税费">
              <el-select v-model="form.taxType" clearable placeholder="请选择税费" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('tax_type')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产证">
              <el-select v-model="form.certificateType" clearable placeholder="请选择产证" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('certificate_type')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="section-title">业主信息</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="业主" prop="ownerName">
              <el-input v-model="form.ownerName" :maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电话" prop="ownerPhone">
              <el-input v-model="form.ownerPhone" placeholder="11 位业主手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="section-title">来源与补充信息</div>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="来源" prop="sourceChannel">
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
          <el-col :span="24">
            <el-form-item label="标签">
              <el-input v-model="tagInput" placeholder="输入后回车添加" @keyup.enter="addTag" style="width: 200px; margin-right: 8px;" />
              <el-tag v-for="tag in form.tags" :key="tag" closable @close="removeTag(tag)" style="margin-right: 6px;">{{ tag }}</el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.description" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-page { min-height: 100%; }
.form-tip { margin: 0 0 20px; color: #909399; font-size: 13px; }
.form-tip span, .load-error { color: #f56c6c; }
@media (max-width: 1100px) {
  .form-page :deep(.el-col) { flex: 0 0 100%; max-width: 100%; }
}
</style>
