<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, ArrowRight, Check, MapPin, Home, User, FileText } from 'lucide-vue-next';
import { getCommunities, getCommunityBuildings, getCommunityUnits, getCommunityFloors, getCommunityRooms, type Community } from '@/api/community';
import { createRentalSet, createSaleProperty, createReserveProperty, uploadImage } from '@/api/wizard';
import { checkBlacklist } from '@/api/blacklist';
import { useDictStore } from '@/stores/dict';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const dictStore = useDictStore();
const userStore = useUserStore();

const activeStep = ref(0);
const submitting = ref(false);
const communityOptions = ref<Community[]>([]);
const communitiesLoading = ref(false);
const buildingOptions = ref<{ id: number; name: string }[]>([]);
const unitOptions = ref<{ id: number; name: string }[]>([]);
const floorOptions = ref<{ id: number; name: string }[]>([]);
const roomOptions = ref<{ id: number; name: string }[]>([]);

const form = reactive({
  type: 'rent',
  communityId: undefined as number | undefined,
  buildingId: undefined as number | undefined,
  unitId: undefined as number | undefined,
  floorId: undefined as number | undefined,
  roomId: undefined as number | undefined,
  building: '',
  unit: '',
  roomNo: '',
  floor: '',
  layoutRooms: 1,
  layoutHalls: 1,
  layoutBathrooms: 1,
  layoutBalconies: 0,
  buildingArea: undefined as number | undefined,
  interiorArea: undefined as number | undefined,
  totalFloor: undefined as number | undefined,
  decoration: '',
  orientation: '',
  elevator: 'yes',
  propertyType: 'resale',
  bizType: 'entire',
  rentPrice: undefined as number | undefined,
  depositAmount: undefined as number | undefined,
  totalPrice: undefined as number | undefined,
  ownerQuote: undefined as number | undefined,
  salePrice: undefined as number | undefined,
  unitPrice: undefined as number | undefined,
  expectedPrice: undefined as number | undefined,
  ownerName: '',
  ownerIdCard: '',
  ownerPhone: '',
  ownerPhoneBackup: '',
  sourceChannel: '',
  diskType: 'public',
  title: '',
  remark: '',
  tags: [] as string[],
  viewingTime: '',
  viewingTimeAlt: '',
  vrUrl: '',
  videoUrl: '',
  images: [] as string[],
});

const steps = [
  { title: '选择房源类型', description: '租房/售房/储备', icon: FileText },
  { title: '填写位置信息', description: '小区、楼栋、房号', icon: MapPin },
  { title: '填写房屋信息', description: '面积、价格、装修', icon: Home },
  { title: '填写业主信息', description: '联系方式与备注', icon: User },
];

const currentCommunity = computed(() => communityOptions.value.find((c) => c.id === form.communityId));
const currentAddress = computed(() => {
  const parts = [currentCommunity.value?.name, form.building && `${form.building}栋`, form.unit && `${form.unit}单元`, form.roomNo].filter(Boolean);
  return parts.join(' ') || '';
});

async function handleImageUpload(options: any) {
  try {
    const res = await uploadImage(options.file);
    form.images.push(res.url);
    ElMessage.success('上传成功');
  } catch {
    ElMessage.error('上传失败');
  }
}

function removeImage(index: number) {
  form.images.splice(index, 1);
}

const TEMPLATE_KEY = 'house_wizard_templates';
const savedTemplates = ref<string[]>([]);

function loadTemplates() {
  const raw = localStorage.getItem(TEMPLATE_KEY);
  savedTemplates.value = raw ? JSON.parse(raw) : [];
}

function saveTemplate() {
  if (!form.remark.trim()) return;
  const list = [...savedTemplates.value];
  if (!list.includes(form.remark)) {
    list.unshift(form.remark);
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(list.slice(0, 10)));
    savedTemplates.value = list.slice(0, 10);
    ElMessage.success('模板已保存');
  }
}

function applyTemplate(text: string) {
  form.remark = text;
}

onMounted(async () => {
  await dictStore.ensureLoaded(['decoration_level', 'orientation', 'source_channel', 'disk_type', 'house_tag']);
  await loadCommunities();
  loadTemplates();
});

async function loadCommunities(keyword = '') {
  communitiesLoading.value = true;
  try {
    communityOptions.value = (await getCommunities({ keyword })).list;
  } finally {
    communitiesLoading.value = false;
  }
}

async function onCommunityChange(id: number) {
  form.buildingId = undefined;
  form.unitId = undefined;
  form.floorId = undefined;
  form.roomId = undefined;
  form.building = '';
  form.unit = '';
  form.roomNo = '';
  form.floor = '';
  unitOptions.value = [];
  floorOptions.value = [];
  roomOptions.value = [];
  buildingOptions.value = id ? await getCommunityBuildings(id) : [];
}

async function onBuildingChange(id: number) {
  form.unitId = undefined;
  form.floorId = undefined;
  form.roomId = undefined;
  form.unit = '';
  form.roomNo = '';
  form.floor = '';
  floorOptions.value = [];
  roomOptions.value = [];
  const b = buildingOptions.value.find((item) => item.id === id);
  form.building = b?.name || '';
  unitOptions.value = id ? await getCommunityUnits(id) : [];
}

async function onUnitChange(id: number) {
  form.floorId = undefined;
  form.roomId = undefined;
  form.roomNo = '';
  form.floor = '';
  roomOptions.value = [];
  const u = unitOptions.value.find((item) => item.id === id);
  form.unit = u?.name || '';
  floorOptions.value = id ? await getCommunityFloors(id) : [];
}

async function onFloorChange(id: number) {
  form.roomId = undefined;
  form.roomNo = '';
  const f = floorOptions.value.find((item) => item.id === id);
  form.floor = f?.name || '';
  roomOptions.value = id ? await getCommunityRooms(id) : [];
}

function onRoomChange(id: number) {
  const r = roomOptions.value.find((item) => item.id === id);
  form.roomNo = r?.name || '';
}

function next() {
  if (!validateStep(activeStep.value)) return;
  if (activeStep.value < steps.length - 1) {
    activeStep.value++;
  } else {
    submit();
  }
}

function prev() {
  if (activeStep.value > 0) activeStep.value--;
}

function validateStep(step: number): boolean {
  if (step === 1) {
    if (!form.communityId) { ElMessage.warning('请选择小区'); return false; }
    if (!form.buildingId) { ElMessage.warning('请选择楼栋'); return false; }
    if (!form.roomId) { ElMessage.warning('请选择房号'); return false; }
  }
  if (step === 2) {
    if (!form.buildingArea || form.buildingArea <= 0) { ElMessage.warning('请填写建筑面积'); return false; }
    if (!form.decoration) { ElMessage.warning('请选择装修'); return false; }
    if (form.type === 'rent' && (!form.rentPrice || form.rentPrice <= 0)) { ElMessage.warning('请填写月租'); return false; }
    if (form.type === 'sale' && (!form.totalPrice || form.totalPrice <= 0)) { ElMessage.warning('请填写售价'); return false; }
    if (form.type === 'reserve' && (!form.expectedPrice || form.expectedPrice <= 0)) { ElMessage.warning('请填写期望价'); return false; }
  }
  if (step === 3) {
    if (!form.ownerName.trim()) { ElMessage.warning('请填写业主姓名'); return false; }
    if (!form.ownerPhone.trim()) { ElMessage.warning('请填写业主电话'); return false; }
    if (!form.sourceChannel) { ElMessage.warning('请选择来源渠道'); return false; }
  }
  return true;
}

function toggleTag(value: string) {
  if (form.tags.includes(value)) {
    form.tags = form.tags.filter((t) => t !== value);
  } else {
    form.tags.push(value);
  }
}

async function checkOwnerBlacklist() {
  if (!form.ownerPhone || form.ownerPhone.length < 7) return;
  const hit = await checkBlacklist(form.ownerPhone);
  if (hit) {
    ElMessageBox.confirm(
      `该业主/客户命中黑名单：${hit.name}\n原因：${hit.reason}\n来源：${hit.source || '系统录入'}`,
      '黑名单预警',
      {
        confirmButtonText: '继续录入（需特批）',
        cancelButtonText: '取消',
        type: 'warning',
      },
    ).catch(() => {
      form.ownerPhone = '';
    });
  }
}

async function submit() {
  submitting.value = true;
  try {
    const storeId = userStore.userInfo?.storeIds?.[0] || 1;
    if (form.type === 'rent') {
      await createRentalSet({
        code: generateCode('R'),
        bizType: form.bizType,
        communityId: form.communityId!,
        address: currentAddress.value,
        building: form.building,
        unit: form.unit,
        roomNo: form.roomNo,
        layout: `${form.layoutRooms}室${form.layoutHalls}厅${form.layoutBathrooms}卫`,
        buildingArea: form.buildingArea,
        decoration: form.decoration,
        landlordRent: form.rentPrice,
        storeId,
        rooms: [{
          roomNo: form.roomNo,
          rentPrice: form.rentPrice,
          listedPrice: form.rentPrice,
          depositAmount: form.depositAmount,
        }],
      });
    } else if (form.type === 'sale') {
      await createSaleProperty({
        code: generateCode('S'),
        propertyType: form.propertyType,
        communityId: form.communityId!,
        building: form.building,
        unit: form.unit,
        floor: form.floor,
        roomNo: form.roomNo,
        layoutRooms: form.layoutRooms,
        layoutHalls: form.layoutHalls,
        layoutBathrooms: form.layoutBathrooms,
        layoutBalconies: form.layoutBalconies,
        buildingArea: form.buildingArea,
        interiorArea: form.interiorArea,
        totalFloor: form.totalFloor,
        orientation: form.orientation,
        decoration: form.decoration,
        elevator: form.elevator,
        salePrice: form.totalPrice,
        unitPrice: form.unitPrice,
        sourceChannel: form.sourceChannel,
        title: form.title || currentAddress.value,
        ownerName: form.ownerName,
        ownerIdCard: form.ownerIdCard,
        ownerPhone: form.ownerPhone,
        ownerPhoneBackup: form.ownerPhoneBackup,
        viewingTime: form.viewingTime,
        viewingTimeAlt: form.viewingTimeAlt,
        vrUrl: form.vrUrl,
        videoUrl: form.videoUrl,
        images: form.images,
        storeId,
        tags: form.tags,
        description: form.remark,
      });
    } else {
      await createReserveProperty({
        storeId,
        communityId: form.communityId,
        address: currentAddress.value,
        roomNo: form.roomNo,
        layout: `${form.layoutRooms}室${form.layoutHalls}厅${form.layoutBathrooms}卫`,
        buildingArea: form.buildingArea,
        decoration: form.decoration,
        ownerName: form.ownerName,
        ownerPhone: form.ownerPhone,
        ownerQuote: form.expectedPrice,
        sourceChannel: form.sourceChannel,
        diskType: form.diskType,
      });
    }
    ElMessage.success('房源录入成功');
    const routeMap: Record<string, string> = { rent: '/house/rent', sale: '/house/sale', reserve: '/house/reserve-house' };
    router.push(routeMap[form.type]);
  } finally {
    submitting.value = false;
  }
}

function generateCode(prefix: string) {
  const now = new Date();
  const suffix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 9000) + 1000)}`;
  return `${prefix}${suffix}`;
}
</script>

<template>
  <div class="wizard-view">
    <div class="page-header">
      <div>
        <div class="page-title">房源录入向导</div>
        <div class="page-desc">统一 4 步录入流程，支持租房、售房、储备房源快速建档</div>
      </div>
    </div>

    <div class="card wizard-card">
      <el-steps :active="activeStep" finish-status="success">
        <el-step v-for="step in steps" :key="step.title" :title="step.title" :description="step.description">
          <template #icon>
            <component :is="step.icon" :size="18" />
          </template>
        </el-step>
      </el-steps>

      <div class="wizard-body">
        <!-- 步骤 1 -->
        <div v-if="activeStep === 0" class="step-form">
          <div class="type-options">
            <div
              v-for="type in [
                { value: 'rent', label: '租房', desc: '长租公寓 / 分散式房间' },
                { value: 'sale', label: '售房', desc: '二手房 / 新房销售' },
                { value: 'reserve', label: '储备房源', desc: '拿房签约前储备' },
              ]"
              :key="type.value"
              class="type-option"
              :class="{ active: form.type === type.value }"
              @click="form.type = type.value"
            >
              <div class="type-label">{{ type.label }}</div>
              <div class="type-desc">{{ type.desc }}</div>
              <Check v-if="form.type === type.value" class="type-check" :size="18" />
            </div>
          </div>
        </div>

        <!-- 步骤 2 -->
        <div v-if="activeStep === 1" class="step-form">
          <el-form :model="form" label-width="110px">
            <el-form-item label="小区" required>
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
            <el-row :gutter="16">
              <el-col :span="6">
                <el-form-item label="楼栋" required>
                  <el-select v-model="form.buildingId" placeholder="选择楼栋" style="width: 100%;" @change="onBuildingChange">
                    <el-option v-for="item in buildingOptions" :key="item.id" :label="item.name" :value="item.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="单元">
                  <el-select v-model="form.unitId" placeholder="选择单元" style="width: 100%;" @change="onUnitChange">
                    <el-option v-for="item in unitOptions" :key="item.id" :label="item.name" :value="item.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="楼层">
                  <el-select v-model="form.floorId" placeholder="选择楼层" style="width: 100%;" @change="onFloorChange">
                    <el-option v-for="item in floorOptions" :key="item.id" :label="item.name" :value="item.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="房号" required>
                  <el-select v-model="form.roomId" placeholder="选择房号" style="width: 100%;" @change="onRoomChange">
                    <el-option v-for="item in roomOptions" :key="item.id" :label="item.name" :value="item.id" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="地址预览">
              <el-input v-model="currentAddress" disabled />
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤 3 -->
        <div v-if="activeStep === 2" class="step-form">
          <el-form :model="form" label-width="110px">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="建筑面积" required>
                  <el-input-number v-model="form.buildingArea" :min="0" :precision="2" style="width: 100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="套内面积">
                  <el-input-number v-model="form.interiorArea" :min="0" :precision="2" style="width: 100%;" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="总楼层">
                  <el-input-number v-model="form.totalFloor" :min="0" :precision="0" style="width: 100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="装修" required>
                  <el-select v-model="form.decoration" placeholder="装修" style="width: 100%;">
                    <el-option v-for="item in dictStore.getItems('decoration_level')" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :span="6">
                <el-form-item label="室">
                  <el-input-number v-model="form.layoutRooms" :min="0" style="width: 100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="厅">
                  <el-input-number v-model="form.layoutHalls" :min="0" style="width: 100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="卫">
                  <el-input-number v-model="form.layoutBathrooms" :min="0" style="width: 100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="阳台">
                  <el-input-number v-model="form.layoutBalconies" :min="0" style="width: 100%;" />
                </el-form-item>
              </el-col>
            </el-row>

            <template v-if="form.type === 'rent'">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="月租" required>
                    <el-input-number v-model="form.rentPrice" :min="0" :precision="2" style="width: 100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="押金">
                    <el-input-number v-model="form.depositAmount" :min="0" :precision="2" style="width: 100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="租赁方式">
                <el-radio-group v-model="form.bizType">
                  <el-radio label="entire">整租</el-radio>
                  <el-radio label="shared">合租</el-radio>
                </el-radio-group>
              </el-form-item>
            </template>

            <template v-if="form.type === 'sale'">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="售价" required>
                    <el-input-number v-model="form.totalPrice" :min="0" :precision="2" style="width: 100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="单价">
                    <el-input-number v-model="form.unitPrice" :min="0" :precision="2" style="width: 100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="朝向">
                    <el-select v-model="form.orientation" placeholder="朝向" style="width: 100%;">
                      <el-option v-for="item in dictStore.getItems('orientation')" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="电梯">
                    <el-radio-group v-model="form.elevator">
                      <el-radio label="yes">有</el-radio>
                      <el-radio label="no">无</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="房源标签">
                <div class="tag-grid">
                  <div
                    v-for="item in dictStore.getItems('house_tag')"
                    :key="item.value"
                    :class="['tag-checkbox', { active: form.tags.includes(item.value) }]"
                    @click="toggleTag(item.value)"
                  >
                    {{ item.label }}
                  </div>
                </div>
              </el-form-item>
            </template>

            <template v-if="form.type === 'reserve'">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="期望价" required>
                    <el-input-number v-model="form.expectedPrice" :min="0" :precision="2" style="width: 100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="公私盘">
                    <el-radio-group v-model="form.diskType">
                      <el-radio label="public">公盘</el-radio>
                      <el-radio label="private">私盘</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>
            </template>
          </el-form>
        </div>

        <!-- 步骤 4 -->
        <div v-if="activeStep === 3" class="step-form">
          <el-form :model="form" label-width="110px">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="业主姓名" required>
                  <el-input v-model="form.ownerName" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="业主身份证">
                  <el-input v-model="form.ownerIdCard" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="业主电话" required>
                  <el-input v-model="form.ownerPhone" @blur="checkOwnerBlacklist" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="备用电话">
                  <el-input v-model="form.ownerPhoneBackup" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="来源渠道" required>
              <el-select v-model="form.sourceChannel" placeholder="来源渠道" style="width: 100%;">
                <el-option v-for="item in dictStore.getItems('source_channel')" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="form.type === 'sale'" label="房源标题">
              <el-input v-model="form.title" :placeholder="currentAddress" />
            </el-form-item>
            <el-row :gutter="16" v-if="form.type === 'sale'">
              <el-col :span="12">
                <el-form-item label="首选带看时间">
                  <el-input v-model="form.viewingTime" placeholder="如 2026-08-30 10:00" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="备选带看时间">
                  <el-input v-model="form.viewingTimeAlt" placeholder="如 2026-08-30 14:00" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16" v-if="form.type === 'sale'">
              <el-col :span="12">
                <el-form-item label="VR 链接">
                  <el-input v-model="form.vrUrl" placeholder="https://..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="视频链接">
                  <el-input v-model="form.videoUrl" placeholder="https://..." />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item v-if="form.type === 'sale'" label="房源图片">
              <el-upload
                action="#"
                :http-request="handleImageUpload"
                :show-file-list="false"
                accept="image/*"
                multiple
              >
                <el-button type="primary" plain>上传图片</el-button>
              </el-upload>
              <div class="image-preview-list" v-if="form.images.length">
                <div v-for="(url, idx) in form.images" :key="idx" class="image-preview-item">
                  <img :src="url" class="image-preview-img" />
                  <span class="image-preview-del" @click="removeImage(idx)">×</span>
                </div>
              </div>
            </el-form-item>
            <el-form-item label="备注/模板">
              <div class="template-bar">
                <el-button type="primary" link @click="saveTemplate">保存为模板</el-button>
                <el-dropdown v-if="savedTemplates.length" @command="applyTemplate">
                  <el-button type="primary" link>应用模板</el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-for="(t, i) in savedTemplates" :key="i" :command="t">{{ t.slice(0, 20) }}...</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <el-input v-model="form.remark" type="textarea" :rows="4" />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div class="wizard-actions">
        <el-button v-if="activeStep > 0" @click="prev">
          <ArrowLeft :size="14" /> 上一步
        </el-button>
        <el-button type="primary" :loading="submitting" @click="next">
          {{ activeStep === steps.length - 1 ? '完成录入' : '下一步' }}
          <ArrowRight v-if="activeStep < steps.length - 1" :size="14" />
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.wizard-view { min-height: 100%; }
.wizard-card {
  background: #fff;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius);
  padding: 28px 32px;
  box-shadow: var(--shadow-sm);
}
.wizard-body {
  margin-top: 32px;
  min-height: 320px;
}
.step-form {
  max-width: 720px;
  margin: 0 auto;
}
.type-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.type-option {
  position: relative;
  padding: 22px 20px;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    border-color: var(--primary);
  }
  &.active {
    border-color: var(--primary);
    background: var(--primary-soft);
  }
}
.type-label {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink-900);
}
.type-desc {
  font-size: 12px;
  color: var(--ink-500);
  margin-top: 6px;
}
.type-check {
  position: absolute;
  top: 12px;
  right: 12px;
  color: var(--primary);
}
.wizard-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 28px;
}
.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag-checkbox {
  padding: 6px 12px;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  color: var(--ink-700);
  transition: all 0.2s ease;
  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }
  &.active {
    border-color: var(--primary);
    background: var(--primary-soft);
    color: var(--primary);
  }
}
.template-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 8px;
}
.image-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.image-preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--ink-200);
}
.image-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.image-preview-del {
  position: absolute;
  top: 2px;
  right: 4px;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
@media (max-width: 768px) {
  .type-options {
    grid-template-columns: 1fr;
  }
  .wizard-card {
    padding: 18px;
  }
}
</style>
