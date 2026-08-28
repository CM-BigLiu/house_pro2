<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getSaleProperties, type SaleProperty } from '@/api/sale';
import { useDictStore } from '@/stores/dict';
import { formatMoney } from '@/utils/format';

const router = useRouter();
const dictStore = useDictStore();
const list = ref<SaleProperty[]>([]);
const total = ref(0);
const loading = ref(false);
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
  router.push('/house/sale/create');
}

function openEdit(item: SaleProperty) {
  ElMessage.info('编辑功能待对接: ' + item.title);
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

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pre_publish: '待发布',
    not_rented: '未租',
    rented: '在租',
    sold: '已售',
    pause: '暂停',
    taken: '已收',
  };
  return map[status] || status;
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
        <button v-permission="['sale:add']" class="btn btn-primary" @click="openCreate">新房源录入</button>
        <button v-permission="['sale:export']" class="btn btn-default">导出</button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-group" style="flex: 1; min-width: 160px; max-width: 260px;">
        <span class="filter-label">搜索</span>
        <input
          v-model="query.keyword"
          class="input"
          placeholder="小区/房号/业主"
          @keyup.enter="load"
        />
      </div>
      <div class="filter-group">
        <span class="filter-label">状态</span>
        <select v-model="query.status" class="select" @change="load">
          <option value="">全部</option>
          <option v-for="item in dictStore.getItems('house_status')" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </div>
      <button class="btn btn-primary" @click="load">查询</button>
    </div>

    <div class="summary-row">
      <span class="summary-chip">共 <strong>{{ total }}</strong> 套房源</span>
    </div>

    <div class="house-grid" style="grid-template-columns: repeat(3, 1fr);">
      <div v-for="item in list" :key="item.id" class="detail-card">
        <div class="detail-card-header">
          <div>
            <div class="detail-card-title">{{ item.title }}</div>
            <div class="cell-sub" style="margin-top: 2px;">{{ item.communityName }} · {{ item.building }}{{ item.unit }}{{ item.roomNo }}</div>
          </div>
          <span :class="['pill', statusClass(item.status)]">{{ statusLabel(item.status) }}</span>
        </div>
        <div class="detail-card-body">
          <div class="field-grid" style="grid-template-columns: repeat(2, 1fr);">
            <div class="field-item">
              <span class="field-label">总价</span>
              <span class="field-value" style="color: var(--danger); font-weight: 700;">{{ formatMoney(item.totalPrice) }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">单价</span>
              <span class="field-value">{{ formatMoney(item.unitPrice) }}/m²</span>
            </div>
            <div class="field-item">
              <span class="field-label">面积</span>
              <span class="field-value">{{ item.buildingArea }} m²</span>
            </div>
            <div class="field-item">
              <span class="field-label">户型</span>
              <span class="field-value">{{ item.layoutRooms }}室{{ item.layoutHalls }}厅{{ item.layoutBathrooms }}卫</span>
            </div>
            <div class="field-item">
              <span class="field-label">装修</span>
              <span class="field-value">{{ dictStore.getLabel('decoration_level', item.decoration) }}</span>
            </div>
            <div class="field-item">
              <span class="field-label">业主</span>
              <span class="field-value">{{ item.ownerName }} {{ item.ownerPhone }}</span>
            </div>
          </div>
          <div class="house-tags" v-if="item.tags && item.tags.length">
            <span v-for="tag in item.tags" :key="tag" class="tag tag-blue">{{ tag }}</span>
          </div>
          <div class="house-actions" style="margin-top: 12px;">
            <button v-permission="['sale:edit']" class="btn btn-default btn-sm" @click="openEdit(item)">编辑</button>
            <button v-permission="['sale:changeStatus']" class="btn btn-default btn-sm">变更状态</button>
          </div>
        </div>
      </div>
      <div v-if="list.length === 0 && !loading" class="empty-state" style="grid-column: 1 / -1;">暂无房源数据</div>
    </div>

    <div class="card" style="margin-top: 16px;">
      <div class="table-footer">
        <span class="text-muted">共 {{ total }} 条</span>
        <div class="pagination">
          <button
            class="page-btn"
            :disabled="query.page <= 1"
            @click="query.page > 1 && (query.page--, load())"
          >‹</button>
          <button
            v-for="p in Math.max(1, Math.ceil(total / query.pageSize))"
            :key="p"
            :class="['page-btn', { active: p === query.page }]"
            @click="query.page = p; load()"
          >{{ p }}</button>
          <button
            class="page-btn"
            :disabled="query.page >= Math.ceil(total / query.pageSize)"
            @click="query.page < Math.ceil(total / query.pageSize) && (query.page++, load())"
          >›</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.house-view { min-height: 100%; }
</style>