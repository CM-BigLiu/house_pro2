<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, type FormInstance } from 'element-plus';
import { createSaleProperty, getSalePropertyForEdit, type SaleProperty, updateSaleProperty } from '@/api/sale';
import { uploadImage } from '@/api/wizard';
import { getCommunities, type Community } from '@/api/community';
import { generateHouseCode } from '@/utils/code';
import { useDictStore } from '@/stores/dict';
import { calculateUnitPrice, saleFormRules } from '@/utils/sale-form';
import { formatLayoutLabel, parseLayoutLabel } from '@/utils/layout-options';
import LayoutSelect from '@/components/LayoutSelect.vue';
import { SALE_TAX_OPTIONS, readSaleTaxFees, saleTaxLabel, type SaleTaxType } from '@/utils/sale-tax';

const router = useRouter();
const route = useRoute();
const editId = computed(() => Number(route.params.id) || undefined);
const loading = ref(true);
const loadError = ref('');
const formRef = ref<FormInstance>();
const dictStore = useDictStore();
const submitting = ref(false);
const uploadingImages = ref(0);
const communityOptions = ref<Community[]>([]);
const communitiesLoading = ref(false);

type SaleFormState = Omit<Partial<SaleProperty>, 'tags' | 'taxFees' | 'images' | 'emergencyContacts'> & {
  tags: string[];
  taxFees: NonNullable<SaleProperty['taxFees']>;
  images: string[];
  emergencyContacts: NonNullable<SaleProperty['emergencyContacts']>;
};

const form = reactive<SaleFormState>({
  code: generateHouseCode('SJ'), title: '', communityName: '', communityId: undefined,
  propertyType: '', building: '', unit: '', floor: '', totalFloor: undefined, roomNo: '',
  layoutRooms: 1, layoutHalls: 1, layoutBathrooms: 1, layoutBalconies: 0,
  buildingArea: 0, interiorArea: 0, orientation: '', decoration: '', elevator: 'yes', buildYear: undefined,
  totalPrice: 0, unitPrice: 0, floorPrice: 0, downPayment: 0, monthlyPayment: 0, loanAmount: 0,
  taxType: '', taxFees: [], debt: 0, certificateType: '', propertyRights: '', propertyTerm: '',
  certificateTerm: '', acceptedPaymentMethods: '', propertyStatus: '', sourceChannel: '', tags: [],
  description: '', ownerMentality: '', communityIntro: '', nearbySchool: '', taxDescription: '', advantages: '',
  ownerName: '', ownerIdCard: '', ownerPhone: '', ownerPhoneBackup: '', ownerRemark: '', emergencyContacts: [],
  viewingTime: '', viewingTimeAlt: '', followUpContent: '', maintainerId: undefined, storeId: undefined,
  status: 'pre_publish', qualityScore: 0, qualityLevel: '', verified: false, isCitywideSale: false,
  isRentSaleCoexist: false, isFusion: false, isPublic: false, isOnlyProperty: false, govVerifyCode: '', govVerifyStatus: '',
  vrUrl: '', videoUrl: '', images: [],
});

const tagInput = ref('');
const saleLayout = ref(formatLayoutLabel({ rooms: 1, halls: 1, bathrooms: 1, balconies: 0 }));
const recommendedTags = ['满五唯一', '满五', '满二唯一', '满二', '不满二', '近地铁', '钥匙房', '急售', '带车位', '附近学校', '带花园', '复式', '置换'];
const selectedTaxTypes = computed<SaleTaxType[]>({
  get: () => (form.taxFees || []).map(fee => fee.type),
  set: (types: SaleTaxType[]) => {
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
    rooms: Number(form.layoutRooms ?? 0), halls: Number(form.layoutHalls ?? 0),
    bathrooms: Number(form.layoutBathrooms ?? 0), balconies: Number(form.layoutBalconies ?? 0),
  });
}
function isSaleLayoutValid(value: string) { return Boolean(parseLayoutLabel(value)); }
function onSaleLayoutChange(value: string) {
  const layout = parseLayoutLabel(value);
  if (!layout) return;
  Object.assign(form, {
    layoutRooms: layout.rooms, layoutHalls: layout.halls,
    layoutBathrooms: layout.bathrooms, layoutBalconies: layout.balconies,
  });
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
      Object.assign(form, Object.fromEntries(Object.keys(form).map(key => [key, (data as unknown as Record<string, unknown>)[key] ?? (form as Record<string, unknown>)[key]])));
      form.taxFees = readSaleTaxFees(data);
      form.tags = [...(data.tags || [])];
      form.images = [...(data.images || [])];
      form.emergencyContacts = [...(data.emergencyContacts || [])];
      saleLayout.value = currentLayoutLabel();
      if (data.communityId && !communityOptions.value.some(item => item.id === data.communityId)) {
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
  try { communityOptions.value = (await getCommunities({ keyword })).list; }
  finally { communitiesLoading.value = false; }
}
function onCommunityChange(id: number) {
  const community = communityOptions.value.find(item => item.id === id);
  form.communityName = community?.name || '';
}
function addTag(value = tagInput.value) {
  const tag = value.trim();
  if (tag && !form.tags?.includes(tag)) (form.tags ||= []).push(tag);
  tagInput.value = '';
}
function removeTag(tag: string) { form.tags = form.tags?.filter(item => item !== tag); }
function toggleRecommendedTag(tag: string) { form.tags?.includes(tag) ? removeTag(tag) : addTag(tag); }
function addEmergencyContact() {
  (form.emergencyContacts ||= []).push({ name: '', phone: '', relation: '' });
}
function removeEmergencyContact(index: number) { form.emergencyContacts?.splice(index, 1); }
function addImage() {
  if ((form.images?.length || 0) < 20) (form.images ||= []).push('');
}
function removeImage(index: number) { form.images?.splice(index, 1); }
async function handleImageUpload(options: { file: File }) {
  if ((form.images?.length || 0) + uploadingImages.value >= 20) {
    ElMessage.warning('最多上传 20 张房源图片');
    return;
  }
  if (!options.file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件');
    return;
  }
  if (options.file.size > 2 * 1024 * 1024) {
    ElMessage.warning('单张图片不能超过 2MB');
    return;
  }

  uploadingImages.value += 1;
  try {
    const result = await uploadImage(options.file);
    (form.images ||= []).push(result.url);
    ElMessage.success('图片上传成功');
  } catch {
    // 请求层已给出具体错误信息。
  } finally {
    uploadingImages.value -= 1;
  }
}

async function submit() {
  if (submitting.value || loading.value || loadError.value) return;
  for (const key of ['title', 'building', 'unit', 'floor', 'roomNo', 'ownerName', 'ownerPhone'] as const) {
    if (typeof form[key] === 'string') form[key] = form[key]!.trim();
  }
  form.unitPrice = calculateUnitPrice(form.totalPrice, form.buildingArea);
  if (!await formRef.value?.validate().catch(() => false)) return;
  addTag();
  submitting.value = true;
  try {
    const payload = {
      ...form,
      taxFees: (form.taxFees || []).map(fee => ({ ...fee, amount: fee.amount ?? null })),
      images: (form.images || []).map(item => item.trim()).filter(Boolean),
      emergencyContacts: (form.emergencyContacts || []).filter(item => item.name?.trim() || item.phone?.trim()),
    };
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
      <div><div class="page-title">{{ editId ? '编辑二手房源' : '二手房源录入' }}</div><div class="page-desc">按照参考系统补齐楼盘、价值、特色与业主带看信息</div></div>
      <div class="page-actions"><button class="btn btn-default" @click="router.push('/house/sale')">返回</button><button class="btn btn-primary" :disabled="submitting || loading || !!loadError" @click="submit">保存</button></div>
    </div>

    <div class="form-shell">
      <div v-if="loadError" role="alert" class="load-error">{{ loadError }} <el-button link type="primary" @click="initialize">重新加载</el-button></div>
      <div class="form-tip">红色 <span>*</span> 为必填项；售价以元保存，单价根据售价与建筑面积自动计算。</div>
      <el-form ref="formRef" :model="form" :rules="saleFormRules" label-position="top" scroll-to-error>
        <section class="form-section">
          <div class="section-heading"><span>01</span><div><strong>楼盘与基本信息</strong><small>楼栋房号、户型面积和房屋现状</small></div></div>
          <el-row :gutter="14">
            <el-col :span="8"><el-form-item label="房源编码" prop="code"><el-input v-model="form.code" readonly><template v-if="!editId" #append><el-button @click="form.code = generateHouseCode('SJ')">重新生成</el-button></template></el-input></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="小区" prop="communityId"><el-select v-model="form.communityId" filterable remote :remote-method="loadCommunities" :loading="communitiesLoading" placeholder="小区名称、别名、地址" style="width:100%" @change="onCommunityChange"><el-option v-for="item in communityOptions" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="房屋用途" prop="propertyType"><el-select v-model="form.propertyType" placeholder="请选择房屋用途" style="width:100%"><el-option v-for="item in dictStore.getItems('property_type')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="楼栋" prop="building"><el-input v-model="form.building" placeholder="栋座" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="单元" prop="unit"><el-input v-model="form.unit" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="楼层" prop="floor"><el-input v-model="form.floor" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="房号" prop="roomNo"><el-input v-model="form.roomNo" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="总楼层"><PlainNumberInput v-model="form.totalFloor" :min="0" :precision="0" style="width:100%" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="户型" prop="layoutRooms"><LayoutSelect v-model="saleLayout" storage-key="house_sale_custom_layouts" :validate="isSaleLayoutValid" @change="onSaleLayoutChange" @invalid="onInvalidSaleLayout" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="建筑年代"><PlainNumberInput v-model="form.buildYear" :min="1900" :max="2100" :precision="0" style="width:100%" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="面积(㎡)" prop="buildingArea"><PlainNumberInput v-model="form.buildingArea" :min="0" :precision="2" style="width:100%" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="使用面积(㎡)"><PlainNumberInput v-model="form.interiorArea" :min="0" :precision="2" style="width:100%" /></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="装修" prop="decoration"><el-select v-model="form.decoration" style="width:100%"><el-option v-for="item in dictStore.getItems('decoration_level')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="朝向" prop="orientation"><el-select v-model="form.orientation" style="width:100%"><el-option v-for="item in dictStore.getItems('orientation')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="电梯" prop="elevator"><el-radio-group v-model="form.elevator"><el-radio value="yes">有</el-radio><el-radio value="no">无</el-radio></el-radio-group></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="房源现状"><el-select v-model="form.propertyStatus" clearable style="width:100%"><el-option label="业主自住" value="owner_occupied" /><el-option label="租客居住" value="tenanted" /><el-option label="空置" value="vacant" /></el-select></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="来源" prop="sourceChannel"><el-select v-model="form.sourceChannel" style="width:100%"><el-option v-for="item in dictStore.getItems('source_channel')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          </el-row>
        </section>

        <section class="form-section">
          <div class="section-heading"><span>02</span><div><strong>房源价值</strong><small>售价、底价、贷款、产权与税费</small></div></div>
          <el-row :gutter="14">
            <el-col :span="8"><el-form-item label="售价(元)" prop="totalPrice"><div class="price-field"><PlainNumberInput v-model="form.totalPrice" :min="0" :precision="2" style="width:100%" /><MoneyUppercase :value="form.totalPrice" /></div></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="单价(元/㎡)" prop="unitPrice"><div class="price-field"><PlainNumberInput v-model="form.unitPrice" :min="0" :precision="2" disabled style="width:100%" /><MoneyUppercase :value="form.unitPrice" /><div class="price-note">售价 ÷ 建筑面积自动计算</div></div></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="底价(元)"><PlainNumberInput v-model="form.floorPrice" :min="0" :precision="2" style="width:100%" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="首付(元)"><PlainNumberInput v-model="form.downPayment" :min="0" :precision="2" style="width:100%" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="月供(元/月)"><PlainNumberInput v-model="form.monthlyPayment" :min="0" :precision="2" style="width:100%" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="可贷金额(元)"><PlainNumberInput v-model="form.loanAmount" :min="0" :precision="2" style="width:100%" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="产权信息"><el-input v-model="form.propertyRights" placeholder="商品房/经济适用房等" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="产证"><el-select v-model="form.certificateType" clearable style="width:100%"><el-option v-for="item in dictStore.getItems('certificate_type')" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="产权年限"><el-input v-model="form.propertyTerm" placeholder="如：70年" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="产证年限"><el-input v-model="form.certificateTerm" placeholder="如：满五年" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="是否唯一"><el-switch v-model="form.isOnlyProperty" active-text="是" inactive-text="否" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="接受付款方式"><el-input v-model="form.acceptedPaymentMethods" placeholder="全款/贷款/组合贷" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="欠款金额(元)"><PlainNumberInput v-model="form.debt" :min="0" :precision="2" style="width:100%" /></el-form-item></el-col>
            <el-col :span="16"><el-form-item label="税费"><div class="tax-field"><el-select v-model="selectedTaxTypes" multiple clearable placeholder="请选择税费（可多选）" style="width:100%"><el-option v-for="item in SALE_TAX_OPTIONS" :key="item.value" :label="item.label" :value="item.value" /></el-select><div v-if="legacyTaxLabel" class="price-note">原税费记录：{{ legacyTaxLabel }}</div></div></el-form-item></el-col>
            <el-col v-for="(fee, index) in form.taxFees" :key="fee.type" :span="8"><el-form-item :label="saleTaxLabel(fee.type)" :prop="`taxFees.${index}.amount`" :rules="taxAmountRules"><div class="tax-amount"><PlainNumberInput v-model="fee.amount" :min="0" :precision="2" :aria-label="`${saleTaxLabel(fee.type)}金额`" /><span>元</span></div></el-form-item></el-col>
          </el-row>
        </section>

        <section class="form-section">
          <div class="section-heading"><span>03</span><div><strong>特色信息</strong><small>标题、房源介绍和平台展示标签</small></div></div>
          <el-row :gutter="14">
            <el-col :span="24"><el-form-item label="房源标题" prop="title"><el-input v-model="form.title" maxlength="255" show-word-limit placeholder="系统展示标题" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="房源介绍"><el-input v-model="form.description" type="textarea" :rows="4" maxlength="500" show-word-limit /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="业主心态"><el-input v-model="form.ownerMentality" type="textarea" :rows="4" maxlength="500" show-word-limit /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="小区介绍"><el-input v-model="form.communityIntro" type="textarea" :rows="3" maxlength="200" show-word-limit /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="附近学校"><el-input v-model="form.nearbySchool" type="textarea" :rows="3" maxlength="200" show-word-limit /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="税费介绍"><el-input v-model="form.taxDescription" type="textarea" :rows="3" maxlength="200" show-word-limit /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="房源优势"><el-input v-model="form.advantages" type="textarea" :rows="3" maxlength="200" show-word-limit /></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="标签"><div class="tag-editor"><div class="recommended-tags"><button v-for="tag in recommendedTags" :key="tag" type="button" :class="['tag-choice', { active: form.tags?.includes(tag) }]" @click="toggleRecommendedTag(tag)">{{ tag }}</button></div><el-input v-model="tagInput" placeholder="输入自定义标签后回车" @keydown.enter.prevent @keyup.enter="addTag()"><template #append><el-button @click="addTag()">添加</el-button></template></el-input><div><el-tag v-for="tag in form.tags" :key="tag" closable @close="removeTag(tag)">{{ tag }}</el-tag></div></div></el-form-item></el-col>
          </el-row>
        </section>

        <section class="form-section">
          <div class="section-heading"><span>04</span><div><strong>业主与带看信息</strong><small>联系方式、带看安排和首次跟进</small></div><button type="button" class="btn btn-default btn-sm" @click="addEmergencyContact">添加紧急联系人</button></div>
          <el-row :gutter="14">
            <el-col :span="8"><el-form-item label="业主" prop="ownerName"><el-input v-model="form.ownerName" maxlength="50" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="电话" prop="ownerPhone"><el-input v-model="form.ownerPhone" maxlength="11" placeholder="11 位业主手机号" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="备用电话"><el-input v-model="form.ownerPhoneBackup" maxlength="11" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="业主身份证"><el-input v-model="form.ownerIdCard" maxlength="18" placeholder="选填" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="首选带看时间"><el-input v-model="form.viewingTime" placeholder="如：周末 09:00-12:00" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="备选带看时间"><el-input v-model="form.viewingTimeAlt" placeholder="如：工作日 18:00 后" /></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="业主备注"><el-input v-model="form.ownerRemark" type="textarea" :rows="2" maxlength="500" show-word-limit /></el-form-item></el-col>
            <el-col v-for="(contact, index) in form.emergencyContacts" :key="index" :span="24"><div class="contact-row"><el-input v-model="contact.name" placeholder="联系人姓名" /><el-input v-model="contact.phone" maxlength="11" placeholder="联系人电话" /><el-input v-model="contact.relation" placeholder="关系" /><button type="button" class="btn btn-ghost btn-sm" @click="removeEmergencyContact(index)">移除</button></div></el-col>
            <el-col :span="24"><el-form-item label="跟进内容"><el-input v-model="form.followUpContent" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="记录业主需求、议价情况或下一步计划" /></el-form-item></el-col>
          </el-row>
        </section>

        <section class="form-section">
          <div class="section-heading"><span>05</span><div><strong>房源媒体与发布设置</strong><small>可直接上传图片，首张图用于列表封面</small></div><div class="image-actions"><el-upload action="#" accept="image/*" multiple :show-file-list="false" :http-request="handleImageUpload" :disabled="(form.images?.length || 0) + uploadingImages >= 20"><button type="button" class="btn btn-primary btn-sm" :disabled="(form.images?.length || 0) + uploadingImages >= 20">{{ uploadingImages ? '上传中…' : '上传图片' }}</button></el-upload><button type="button" class="btn btn-default btn-sm" :disabled="(form.images?.length || 0) >= 20" @click="addImage">添加图片地址</button></div></div>
          <el-row :gutter="14">
            <el-col :span="12"><el-form-item label="VR 地址"><el-input v-model="form.vrUrl" placeholder="https://" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="视频地址"><el-input v-model="form.videoUrl" placeholder="https://" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="政府核验码"><el-input v-model="form.govVerifyCode" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="官方核验"><el-select v-model="form.govVerifyStatus" clearable style="width:100%"><el-option label="待核验" value="pending" /><el-option label="已验真" value="verified" /><el-option label="无需验真" value="not_required" /></el-select></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="发布设置"><div class="switches"><el-switch v-model="form.isCitywideSale" active-text="全城联卖" /><el-switch v-model="form.isRentSaleCoexist" active-text="租售同存" /><el-switch v-model="form.isFusion" active-text="融合房源" /></div></el-form-item></el-col>
            <el-col v-for="(image, index) in form.images" :key="index" :span="12"><div class="image-row"><img v-if="image" :src="image" :alt="`房源图片 ${index + 1}`" class="image-preview" /><span v-if="image.startsWith('data:image/')" class="image-uploaded">已上传图片 {{ index + 1 }}</span><el-input v-else v-model="form.images[index]" :placeholder="`房源图片 ${index + 1} URL`" /><button type="button" class="btn btn-ghost btn-sm" @click="removeImage(index)">移除</button></div></el-col>
          </el-row>
        </section>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-page { min-height: 100%; }
.form-shell { padding: 22px; border: 1px solid var(--ink-200); border-radius: var(--radius); background: #fff; }
.form-tip { margin: 0 0 18px; color: var(--ink-500); font-size: 13px; }
.form-tip span, .load-error { color: var(--danger); }
.form-section + .form-section { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--ink-100); }
.section-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.section-heading > span { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 8px; color: #fff; background: var(--primary); font-size: 12px; font-weight: 700; }
.section-heading strong, .section-heading small { display: block; }
.section-heading small { color: var(--ink-400); font-size: 11px; }
.section-heading .btn { margin-left: auto; }
.image-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.image-actions .btn { margin-left: 0; }
.price-field, .tax-field, .tag-editor { width: 100%; }
.tax-amount, .contact-row, .image-row { display: flex; align-items: center; gap: 8px; width: 100%; }
.price-note { margin-top: 4px; color: var(--ink-400); font-size: 12px; }
.recommended-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.tag-choice { padding: 4px 10px; border: 1px solid var(--ink-200); border-radius: 14px; color: var(--ink-600); background: #fff; cursor: pointer; }
.tag-choice.active { border-color: var(--primary); color: var(--primary); background: #eef4ff; }
.tag-editor :deep(.el-tag) { margin: 8px 6px 0 0; }
.switches { display: flex; flex-wrap: wrap; gap: 12px; }
.image-row { margin-bottom: 12px; }
.image-preview { width: 88px; height: 66px; flex: none; border: 1px solid var(--ink-200); border-radius: 7px; object-fit: cover; }
.image-uploaded { flex: 1; color: var(--ink-500); font-size: 12px; }
@media (max-width: 1100px) { .form-page :deep(.el-col) { flex: 0 0 100%; max-width: 100%; } }
</style>
