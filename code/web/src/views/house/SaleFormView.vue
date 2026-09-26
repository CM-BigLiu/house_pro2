<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, type FormInstance } from 'element-plus';
import { createSaleProperty, updateSaleProperty, getSalePropertyForEdit, type SaleProperty } from '@/api/sale';
import { getCommunities, type Community } from '@/api/community';
import { generateHouseCode } from '@/utils/code';
import { useDictStore } from '@/stores/dict';
import { calculateUnitPrice, saleFormRules } from '@/utils/sale-form';
import { formatLayoutLabel, parseLayoutLabel } from '@/utils/layout-options';
import LayoutSelect from '@/components/LayoutSelect.vue';
import { SALE_TAX_OPTIONS, readSaleTaxFees, saleTaxLabel } from '@/utils/sale-tax';

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
  totalPrice: 0, unitPrice: 0, floorPrice: 0, taxType: '', taxFees: [], debt: 0, certificateType: '',
  sourceChannel: '', tags: [], description: '', ownerName: '', ownerPhone: '', ownerPhoneBackup: '',
  maintainerId: undefined, storeId: undefined, status: 'pre_publish', qualityScore: 0, qualityLevel: '',
  verified: false, isCitywideSale: false, images: [],
});
const tagInput = ref('');
const saleLayout = ref(formatLayoutLabel({ rooms: 1, halls: 1, bathrooms: 1, balconies: 0 }));
const selectedTaxTypes = computed({
  get: () => (form.taxFees || []).map(fee => fee.type),
  set: (types) => {
    const previous = new Map((form.taxFees || []).map(fee => [fee.type, fee]));
    form.taxFees = types.map(type => previous.get(type) || { type, amount: null });
  },
});
const legacyTaxLabel = computed(() => form.taxType && !SALE_TAX_OPTIONS.some(option => option.value === form.taxType)
  ? dictStore.getLabel('tax_type', form.taxType) : '');
const taxAmountRules = [{
  validator: (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
    const valid = value == null || (typeof value === 'number' && Number.isFinite(value) && value >= 0 && /^\d+(\.\d{1,2})?$/.test(String(value)));
    callback(valid ? undefined : new Error('金额须为非负数字，最多两位小数'));
  },
  trigger: ['blur', 'change'],
}];

function currentLayoutLabel() {
  return formatLayoutLabel({
    rooms: Number(form.layoutRooms ?? 0),
    halls: Number(form.layoutHalls ?? 0),
    bathrooms: Number(form.layoutBathrooms ?? 0),
    balconies: Number(form.layoutBalconies ?? 0),
  });
}

function isSaleLayoutValid(value: string) {
  return Boolean(parseLayoutLabel(value));
}

function onSaleLayoutChange(value: string) {
  const layout = parseLayoutLabel(value);
  if (!layout) return;
  form.layoutRooms = layout.rooms;
  form.layoutHalls = layout.halls;
  form.layoutBathrooms = layout.bathrooms;
  form.layoutBalconies = layout.balconies;
  saleLayout.value = formatLayoutLabel(layout);
}

function onInvalidSaleLayout() {
  saleLayout.value = currentLayoutLabel();
  ElMessage.warning('户型格式应为“2室1厅1卫”或“2室1厅1卫1阳台”');
}

watch([() => form.totalPrice, () => form.buildingArea], ([price, area]) => {
  form.unitPrice = calculateUnitPrice(price, area);
}, { immediate: true });

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
      form.taxFees = readSaleTaxFees(data);
      saleLayout.value = currentLayoutLabel();
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
    form.unitPrice = calculateUnitPrice(form.totalPrice, form.buildingArea);
    if (!await formRef.value?.validate().catch(() => false)) return;
    addTag();
    const payload = { ...form, taxFees: (form.taxFees || []).map(fee => ({ ...fee, amount: fee.amount ?? null })) };
    if (editId.value) await updateSaleProperty(editId.value, payload);
    else await createSaleProperty(payload);
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
      <p class="form-tip">红色 <span>*</span> 为必填项；户型可选择常用项或输入后按回车添加，税费、产证等未标星项可不填。</p>
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
          <el-col :span="12">
            <el-form-item label="户型" prop="layoutRooms">
              <LayoutSelect
                v-model="saleLayout"
                storage-key="house_sale_custom_layouts"
                :validate="isSaleLayoutValid"
                @change="onSaleLayoutChange"
                @invalid="onInvalidSaleLayout"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="面积(㎡)" prop="buildingArea">
              <PlainNumberInput v-model="form.buildingArea" :min="0" :precision="2" style="width: 100%;" />
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
              <div class="price-field">
                <PlainNumberInput v-model="form.totalPrice" :min="0" :precision="2" style="width: 100%;" />
                <MoneyUppercase :value="form.totalPrice" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单价(元/㎡)" prop="unitPrice">
              <div class="price-field">
                <PlainNumberInput v-model="form.unitPrice" :min="0" :precision="2" disabled style="width: 100%;" />
                <MoneyUppercase :value="form.unitPrice" />
                <div class="price-note">根据售价 ÷ 面积自动计算</div>
              </div>
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
          <el-col :span="24">
            <el-form-item label="税费">
              <div class="tax-field">
                <el-select v-model="selectedTaxTypes" multiple clearable placeholder="请选择税费（可多选）" style="width: 100%;">
                  <el-option v-for="item in SALE_TAX_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <div class="price-note">选择税种后填写对应金额，单位为元；暂不确定可留空。</div>
                <div v-if="legacyTaxLabel" class="price-note">原税费记录：{{ legacyTaxLabel }}，请按实际情况补充税种及金额。</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col v-for="(fee, index) in form.taxFees" :key="fee.type" :span="12">
            <el-form-item :label="saleTaxLabel(fee.type)" :prop="`taxFees.${index}.amount`" :rules="taxAmountRules">
              <div class="tax-amount">
                <PlainNumberInput v-model="fee.amount" :min="0" :precision="2" :aria-label="`${saleTaxLabel(fee.type)}金额`" placeholder="请输入金额" />
                <span>元</span>
              </div>
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
              <el-input v-model="tagInput" placeholder="输入后回车添加，也可直接保存" @keydown.enter.prevent @keyup.enter="addTag" style="width: 300px; max-width: 100%; margin-right: 8px;">
                <template #append><el-button @click="addTag">添加</el-button></template>
              </el-input>
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
.price-field { width: 100%; }
.tax-field { width: 100%; }
.tax-amount { display: flex; align-items: center; gap: 8px; width: 100%; }
.tax-amount :deep(.el-input) { flex: 1; }
.price-note { margin-top: 4px; color: var(--ink-400); font-size: 12px; line-height: 1.5; }
@media (max-width: 1100px) {
  .form-page :deep(.el-col) { flex: 0 0 100%; max-width: 100%; }
}
</style>
