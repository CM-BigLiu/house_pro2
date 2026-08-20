<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getSaleProperties, createSaleProperty, updateSaleProperty, type SaleProperty } from '@/api/sale';
import { useDictStore } from '@/stores/dict';
import { formatMoney } from '@/utils/format';

const dictStore = useDictStore();
const list = ref<SaleProperty[]>([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive<Partial<SaleProperty>>({});
const query = reactive({ keyword: '', status: '', page: 1, pageSize: 20 });

onMounted(async () => {
  await dictStore.ensureLoaded(['house_status', 'decoration_level', 'orientation', 'source_channel', 'tax_type', 'certificate_type']);
  await load();
});

async function load() {
  loading.value = true;
  try {
    const res = await getSaleProperties(query);
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  isEdit.value = false;
  Object.assign(form, {
    code: '', title: '', communityName: '', building: '', unit: '', floor: '', roomNo: '',
    layoutRooms: 1, layoutHalls: 1, layoutBathrooms: 1, layoutBalconies: 0,
    buildingArea: 0, orientation: '', decoration: '', elevator: 'yes', buildYear: undefined,
    totalPrice: 0, unitPrice: 0, floorPrice: 0, taxType: '', debt: 0, certificateType: '',
    sourceChannel: '', tags: [], description: '', ownerName: '', ownerPhone: '', ownerPhoneBackup: '',
    maintainerId: undefined, storeId: 1, status: 'pre_publish', qualityScore: 0, qualityLevel: '',
    verified: false, isCitywideSale: false, images: [],
  });
  dialogVisible.value = true;
}

function openEdit(item: SaleProperty) {
  isEdit.value = true;
  Object.assign(form, { ...item });
  dialogVisible.value = true;
}

async function submit() {
  if (!form.title?.trim()) return ElMessage.warning('请填写标题');
  if (!form.ownerName?.trim()) return ElMessage.warning('请填写业主');
  if (isEdit.value) {
    await updateSaleProperty(form.id!, form);
  } else {
    await createSaleProperty(form);
  }
  ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
  dialogVisible.value = false;
  await load();
}

const tagInput = ref('');
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

function statusClass(status: string) {
  const map: Record<string, string> = {
    pre_publish: 'pill-gray',
    not_rented: 'pill-green',
    rented: 'pill-blue',
    sold: 'pill-purple',
    pause: 'pill-gray',
    taken: 'pill-orange',
  };
  return map[status] || 'pill-gray';
}
</script>

<template>
  <div class="house-view">
    <div class="page-header">
      <div>
        <div class="page-title">售房管理</div>
        <div class="page-desc">管理在售房源信息、价格、状态及业主联系方式</div>
      </div>
      <div class="page-actions">
        <el-button v-permission="['sale:add']" type="primary" @click="openCreate">新房源录入</el-button>
        <el-button v-permission="['sale:export']">导出</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="小区/房号/业主" clearable @keyup.enter="load" />
      <el-select v-model="query.status" placeholder="状态" clearable @change="load">
        <el-option v-for="item in dictStore.getItems('house_status')" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
    </div>

    <div class="card-list">
      <div v-for="item in list" :key="item.id" class="house-card">
        <div class="card-header">
          <div class="card-title">{{ item.title }}</div>
          <span :class="['pill', statusClass(item.status)]">{{ dictStore.getLabel('house_status', item.status) }}</span>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="info-label">总价</span>
            <span class="info-value price">{{ formatMoney(item.totalPrice) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">单价</span>
            <span class="info-value">{{ formatMoney(item.unitPrice) }}/m²</span>
          </div>
          <div class="info-row">
            <span class="info-label">面积</span>
            <span class="info-value">{{ item.buildingArea }} m²</span>
          </div>
          <div class="info-row">
            <span class="info-label">户型</span>
            <span class="info-value">{{ item.layoutRooms }}室{{ item.layoutHalls }}厅{{ item.layoutBathrooms }}卫</span>
          </div>
          <div class="info-row">
            <span class="info-label">装修</span>
            <span class="info-value">{{ dictStore.getLabel('decoration_level', item.decoration) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">业主</span>
            <span class="info-value">{{ item.ownerName }} {{ item.ownerPhone }}</span>
          </div>
        </div>
        <div class="card-footer">
          <el-button v-permission="['sale:edit']" size="small" type="primary" plain @click="openEdit(item)">编辑</el-button>
          <el-button v-permission="['sale:changeStatus']" size="small">变更状态</el-button>
        </div>
      </div>
    </div>

    <div class="pagination-bar">
      <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" layout="total, prev, pager, next" @change="load" />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑房源' : '新房源录入'" width="720px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="房源编码" required>
              <el-input v-model="form.code" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="房源标题" required>
              <el-input v-model="form.title" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="小区">
              <el-input v-model="form.communityName" />
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
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.house-view { min-height: 100%; }
.card-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.house-card {
  background: #fff;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow-sm);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.card-title {
  font-weight: 700;
  color: var(--ink-900);
  font-size: 14px;
}
.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.info-label { color: var(--ink-500); }
.info-value {
  color: var(--ink-700);
  &.price { color: var(--danger); font-weight: 700; }
}
.card-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
@media (max-width: 1200px) {
  .card-list { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .card-list { grid-template-columns: 1fr; }
}
</style>
