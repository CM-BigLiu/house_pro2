<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Building2, ChevronLeft, ChevronRight, MapPin, Plus, RotateCcw, Search } from 'lucide-vue-next';
import { deleteCommunity as deleteCommunityApi, getCommunities, type Community, type CommunityQuery } from '@/api/community';
import { getCities } from '@/api/organization';

const router = useRouter();
const list = ref<Community[]>([]);
const total = ref(0);
const loading = ref(false);
const deletingId = ref<number>();
const cities = ref<{ id: number; name: string }[]>([]);
const propertyTypes = ['普通住宅', '别墅', '商住两用', '车位', '商铺', '写字楼', '厂房', '土地'];

const query = reactive<CommunityQuery & { page: number; pageSize: number }>({
  cityId: '', district: '', businessCircle: '', propertyType: '', keyword: '', page: 1, pageSize: 10,
});
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / query.pageSize)));
const cityNames = computed(() => new Map(cities.value.map(item => [item.id, item.name])));

onMounted(async () => {
  const [cityResult] = await Promise.allSettled([getCities()]);
  cities.value = cityResult.status === 'fulfilled' ? cityResult.value : [];
  await load();
});

async function load() {
  loading.value = true;
  try {
    const result = await getCommunities(query);
    list.value = result.list;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function search() { query.page = 1; load(); }
function reset() {
  Object.assign(query, { cityId: '', district: '', businessCircle: '', propertyType: '', keyword: '', page: 1, pageSize: query.pageSize });
  load();
}
function goToPage(page: number) {
  const target = Math.max(1, Math.min(pageCount.value, page));
  if (target === query.page) return;
  query.page = target;
  load();
}
function openCreate() { router.push('/house/community/create'); }
function editCommunity(item: Community) { router.push(`/house/community/edit/${item.id}`); }
function cityName(item: Community) { return item.cityName || (item.cityId ? cityNames.value.get(item.cityId) : '') || '-'; }

async function deleteCommunity(item: Community) {
  try {
    await ElMessageBox.confirm(`确认删除“小区 ${item.name}”？`, '删除确认', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    });
    deletingId.value = item.id;
    await deleteCommunityApi(item.id);
    if (list.value.length === 1 && query.page > 1) query.page--;
    await load();
    ElMessage.success('删除成功');
  } catch {
    // 用户取消时保持列表不变。
  } finally {
    deletingId.value = undefined;
  }
}
</script>

<template>
  <div class="community-page">
    <div class="page-header">
      <div>
        <div class="page-title">小区管理</div>
        <div class="page-desc">维护城市、区域、商圈、详细地址与物业类型</div>
      </div>
      <div class="page-actions">
        <button v-permission="['house:community:create']" class="btn btn-primary" @click="openCreate"><Plus :size="16" />申请添加小区</button>
      </div>
    </div>

    <div class="tabs"><button class="tab active">小区列表 <span class="tab-count">{{ total }}</span></button></div>

    <section class="filter-panel">
      <div class="filter-grid">
        <label class="filter-field"><span>城市</span><el-select v-model="query.cityId" clearable filterable placeholder="全部城市"><el-option v-for="city in cities" :key="city.id" :label="city.name" :value="city.id" /></el-select></label>
        <label class="filter-field"><span>区域</span><el-input v-model="query.district" clearable placeholder="请输入区域" @keyup.enter="search" /></label>
        <label class="filter-field"><span>商圈</span><el-input v-model="query.businessCircle" clearable placeholder="请输入商圈" @keyup.enter="search" /></label>
        <label class="filter-field"><span>物业类型</span><el-select v-model="query.propertyType" clearable placeholder="全部类型"><el-option v-for="item in propertyTypes" :key="item" :label="item" :value="item" /></el-select></label>
        <label class="filter-field filter-keyword"><span>综合查询</span><el-input v-model="query.keyword" clearable placeholder="小区名称、别名、详细地址" @keyup.enter="search" /></label>
        <div class="filter-actions"><button class="btn btn-primary" @click="search"><Search :size="15" />查询</button><button class="btn btn-default" @click="reset"><RotateCcw :size="15" />重置</button></div>
      </div>
    </section>

    <section class="table-card" v-loading="loading">
      <div class="table-summary"><Building2 :size="16" />共 <strong>{{ total }}</strong> 个小区</div>
      <div class="table-wrap">
        <table class="data-table community-table">
          <thead><tr><th>城市</th><th>小区名称</th><th>区域</th><th>商圈</th><th>详细地址</th><th>物业类型</th><th>房源</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="item in list" :key="item.id">
              <td>{{ cityName(item) }}</td>
              <td><div class="community-name"><Building2 :size="16" /><div><strong>{{ item.name }}</strong><small v-if="item.alias">别名：{{ item.alias }}</small></div></div></td>
              <td>{{ item.district || item.area || '-' }}</td>
              <td>{{ item.businessCircle || '-' }}</td>
              <td><span class="address"><MapPin :size="14" />{{ item.address || '-' }}</span></td>
              <td><span class="tag tag-blue">{{ item.propertyType || '普通住宅' }}</span></td>
              <td><span class="metric">租 {{ item.currentRentCount ?? 0 }}</span><span class="metric sale">售 {{ item.currentSaleCount ?? 0 }}</span></td>
              <td class="actions"><button v-permission="['house:community:edit']" class="btn btn-sm btn-default" @click="editCommunity(item)">编辑</button><button v-permission="['house:community:delete']" class="btn btn-sm btn-ghost" :disabled="deletingId === item.id" @click="deleteCommunity(item)">删除</button></td>
            </tr>
            <tr v-if="!loading && !list.length"><td colspan="8"><div class="empty-state">暂无小区数据</div></td></tr>
          </tbody>
        </table>
      </div>
      <div class="table-footer">
        <span class="text-muted">共 {{ total }} 条 · 第 {{ query.page }} / {{ pageCount }} 页</span>
        <div class="pagination"><button class="page-btn" :disabled="query.page <= 1" @click="goToPage(query.page - 1)"><ChevronLeft :size="15" /></button><button class="page-btn active">{{ query.page }}</button><button class="page-btn" :disabled="query.page >= pageCount" @click="goToPage(query.page + 1)"><ChevronRight :size="15" /></button></div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.community-page { min-height: 100%; }
.tabs { margin-bottom: 12px; border-bottom: 1px solid var(--ink-200); }
.tab { padding: 10px 18px; border: 0; border-bottom: 2px solid transparent; color: var(--ink-500); background: transparent; font-weight: 600; }
.tab.active { border-color: var(--primary); color: var(--primary); }
.tab-count { margin-left: 4px; padding: 1px 7px; border-radius: 10px; background: var(--ink-100); font-size: 11px; }
.filter-panel, .table-card { border: 1px solid var(--ink-200); border-radius: var(--radius); background: #fff; }
.filter-panel { margin-bottom: 14px; padding: 16px; }
.filter-grid { display: grid; grid-template-columns: repeat(4, minmax(150px, 1fr)); gap: 12px; align-items: end; }
.filter-field { display: grid; gap: 6px; color: var(--ink-500); font-size: 12px; }
.filter-keyword { grid-column: span 2; }
.filter-actions { display: flex; gap: 8px; }
.table-summary { display: flex; align-items: center; gap: 6px; padding: 14px 16px; border-bottom: 1px solid var(--ink-100); color: var(--ink-500); font-size: 13px; }
.table-summary strong { color: var(--ink-900); }
.community-table { min-width: 1050px; }
.community-name { display: flex; align-items: flex-start; gap: 8px; min-width: 170px; }
.community-name strong, .community-name small { display: block; }
.community-name small { margin-top: 3px; color: var(--ink-400); font-size: 11px; }
.address { display: inline-flex; align-items: flex-start; gap: 4px; min-width: 180px; color: var(--ink-600); }
.metric { display: inline-block; margin-right: 5px; padding: 2px 6px; border-radius: 4px; color: #b45309; background: #fff7ed; font-size: 11px; }
.metric.sale { color: #b91c1c; background: #fef2f2; }
.actions { white-space: nowrap; }
.actions .btn + .btn { margin-left: 4px; }
.table-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-top: 1px solid var(--ink-100); }
@media (max-width: 1100px) { .filter-grid { grid-template-columns: repeat(2, minmax(180px, 1fr)); } }
@media (max-width: 680px) { .filter-grid { grid-template-columns: 1fr; } .filter-keyword { grid-column: auto; } }
</style>
