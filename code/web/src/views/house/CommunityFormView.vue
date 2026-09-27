<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { createCommunity, getCommunity, type Community, updateCommunity } from '@/api/community';
import { getCities } from '@/api/organization';

const router = useRouter();
const route = useRoute();
const formRef = ref<FormInstance>();
const submitting = ref(false);
const loading = ref(false);
const cities = ref<{ id: number; name: string }[]>([]);
const isEdit = computed(() => Boolean(route.params.id));

type CommunityForm = Omit<Pick<Community,
  'name' | 'alias' | 'cityId' | 'district' | 'businessCircle' | 'address' |
  'propertyType' | 'supplement' | 'photos'
>, 'photos'> & { photos: string[] };

const form = reactive<CommunityForm>({
  name: '', alias: '', cityId: undefined, district: '', businessCircle: '',
  address: '', propertyType: '', supplement: '', photos: ['', ''],
});

const propertyTypes = ['普通住宅', '别墅', '商住两用', '车位', '商铺', '写字楼', '厂房', '土地'];
const rules: FormRules = {
  name: [{ required: true, whitespace: true, message: '请填写小区名称', trigger: 'blur' }],
  cityId: [{ required: true, type: 'integer', min: 1, message: '请选择城市', trigger: 'change' }],
  district: [{ required: true, whitespace: true, message: '请填写区域', trigger: 'blur' }],
  address: [{ required: true, whitespace: true, message: '请填写详细地址', trigger: 'blur' }],
};

onMounted(async () => {
  loading.value = true;
  try {
    cities.value = await getCities();
    if (!isEdit.value) return;
    const detail = await getCommunity(Number(route.params.id));
    Object.assign(form, {
      name: detail.name || '', alias: detail.alias || '', cityId: detail.cityId,
      district: detail.district || detail.area || '', businessCircle: detail.businessCircle || '',
      address: detail.address || '', propertyType: detail.propertyType || '',
      supplement: detail.supplement || '', photos: detail.photos?.length ? [...detail.photos] : ['', ''],
    });
  } catch {
    ElMessage.error('加载小区数据失败');
    if (isEdit.value) router.replace('/house/community');
  } finally {
    loading.value = false;
  }
});

function addPhoto() {
  if (form.photos.length >= 10) return;
  form.photos.push('');
}

function removePhoto(index: number) {
  form.photos.splice(index, 1);
  if (!form.photos.length) form.photos = [''];
}

async function submit() {
  if (!await formRef.value?.validate().catch(() => false)) return;
  const photos = (form.photos || []).map(item => item.trim()).filter(Boolean);
  if (!isEdit.value && photos.length > 0 && photos.length < 2) {
    return ElMessage.warning('相关照片填写后至少需要 2 张');
  }
  const payload: CommunityForm = {
    ...form,
    name: form.name.trim(), alias: form.alias?.trim(), district: form.district?.trim(),
    businessCircle: form.businessCircle?.trim(), address: form.address?.trim(),
    supplement: form.supplement?.trim(), photos,
  };
  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateCommunity(Number(route.params.id), payload);
      ElMessage.success('小区信息修改成功');
    } else {
      await createCommunity(payload);
      ElMessage.success('小区申请已创建');
    }
    router.push('/house/community');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="form-page" v-loading="loading">
    <div class="page-header">
      <div>
        <div class="page-title">{{ isEdit ? '编辑小区' : '申请添加小区' }}</div>
        <div class="page-desc">维护小区位置、物业类型与相关照片</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-default" @click="router.push('/house/community')">返回</button>
        <button class="btn btn-primary" :disabled="submitting || loading" @click="submit">{{ isEdit ? '保存修改' : '确认提交' }}</button>
      </div>
    </div>

    <div class="form-shell">
      <div class="form-tip">红色 <span>*</span> 为必填项；照片支持填写可访问的 JPG、PNG、BMP、JPEG 地址，最多 10 张。</div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" scroll-to-error>
        <section class="form-section">
          <div class="section-heading"><span>01</span><div><strong>小区信息</strong><small>与参考系统的小区申请字段一致</small></div></div>
          <el-row :gutter="16">
            <el-col :span="12"><el-form-item label="小区名称" prop="name"><el-input v-model="form.name" maxlength="100" placeholder="请输入小区名称" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="小区别名"><el-input v-model="form.alias" maxlength="100" placeholder="可填写常用别名" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="城市" prop="cityId"><el-select v-model="form.cityId" filterable placeholder="请选择城市" style="width:100%"><el-option v-for="city in cities" :key="city.id" :label="city.name" :value="city.id" /></el-select></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="区域" prop="district"><el-input v-model="form.district" placeholder="如：朝阳区" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="商圈"><el-input v-model="form.businessCircle" placeholder="如：双桥" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="物业类型"><el-select v-model="form.propertyType" clearable placeholder="请选择物业类型" style="width:100%"><el-option v-for="item in propertyTypes" :key="item" :label="item" :value="item" /></el-select></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="详细地址" prop="address"><el-input v-model="form.address" type="textarea" :rows="2" maxlength="100" show-word-limit placeholder="请输入街道、门牌号等详细地址" /></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="补充说明"><el-input v-model="form.supplement" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="可补充小区别名、楼栋分期、入口位置等信息" /></el-form-item></el-col>
          </el-row>
        </section>

        <section class="form-section">
          <div class="section-heading"><span>02</span><div><strong>相关照片</strong><small>建议包含小区大门和楼栋照片</small></div><button type="button" class="btn btn-default btn-sm" :disabled="(form.photos?.length || 0) >= 10" @click="addPhoto">添加照片地址</button></div>
          <div class="photo-list">
            <div v-for="(_photo, index) in form.photos" :key="index" class="photo-row">
              <el-input v-model="form.photos[index]" :placeholder="`照片 ${index + 1} URL`" />
              <button type="button" class="btn btn-ghost btn-sm" @click="removePhoto(index)">移除</button>
            </div>
          </div>
        </section>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-page { min-height: 100%; }
.form-shell { padding: 20px; border: 1px solid var(--ink-200); border-radius: var(--radius); background: #fff; }
.form-tip { margin-bottom: 18px; color: var(--ink-500); font-size: 13px; }
.form-tip span { color: var(--danger); }
.form-section + .form-section { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--ink-100); }
.section-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
.section-heading > span { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 8px; color: #fff; background: var(--primary); font-size: 12px; font-weight: 700; }
.section-heading strong, .section-heading small { display: block; }
.section-heading small { color: var(--ink-400); font-size: 11px; }
.section-heading .btn { margin-left: auto; }
.photo-list { display: grid; gap: 10px; }
.photo-row { display: flex; align-items: center; gap: 8px; }
@media (max-width: 900px) { .form-page :deep(.el-col) { flex: 0 0 100%; max-width: 100%; } }
</style>
