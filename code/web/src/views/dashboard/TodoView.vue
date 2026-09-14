<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getTodos, type TodoItem } from '@/api/dashboard';
const router = useRouter();
const todos = ref<TodoItem[]>([]);
const loading = ref(false);
const error = ref('');
const keyword = ref('');
const priority = ref('');
const page = ref(1);
const labels: Record<string, string> = { high: '高', medium: '中', low: '低' };
const filtered = computed(() => todos.value.filter(item => item.title.includes(keyword.value.trim()) && (!priority.value || item.priority === priority.value)));
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 20)));
const rows = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20));
watch([keyword, priority], () => { page.value = 1; });
async function load() {
  loading.value = true; error.value = '';
  try { todos.value = await getTodos({ all: true }); page.value = 1; }
  catch { error.value = '待办加载失败，请重试'; }
  finally { loading.value = false; }
}
onMounted(load);
</script>
<template>
  <div class="house-view">
    <div class="page-header"><div><div class="page-title">我的待办</div><div class="page-desc">查看当前账号数据范围内的全部待办事项</div></div><div class="page-actions"><button class="btn btn-default" @click="router.push('/home')">返回首页</button><button class="btn btn-primary" :disabled="loading" @click="load">刷新</button></div></div>
    <div class="filter-bar"><input v-model="keyword" class="input" placeholder="搜索待办内容" /><select v-model="priority" class="select" aria-label="优先级"><option value="">全部优先级</option><option v-for="(label, value) in labels" :key="value" :value="value">{{ label }}</option></select><button class="btn btn-default btn-sm" @click="keyword = ''; priority = ''">重置</button></div>
    <div v-if="error" role="alert" class="card card-body">{{ error }} <button class="btn btn-primary btn-sm" @click="load">重试</button></div>
    <div v-else class="card table-wrap" v-loading="loading"><table class="data-table"><thead><tr><th>待办事项</th><th>优先级</th><th>日期</th></tr></thead><tbody><tr v-for="item in rows" :key="item.id"><td>{{ item.title }}</td><td><span :class="['pill', item.priority === 'high' ? 'pill-red' : item.priority === 'medium' ? 'pill-orange' : 'pill-blue']">{{ labels[item.priority] || item.priority }}</span></td><td>{{ item.date || '—' }}</td></tr><tr v-if="!rows.length && !loading"><td colspan="3">暂无符合条件的待办</td></tr></tbody></table></div>
    <div class="table-footer"><span>共 {{ filtered.length }} 条</span><div class="pagination"><button class="page-btn" :disabled="page <= 1" @click="page--">上一页</button><span>{{ page }} / {{ pages }}</span><button class="page-btn" :disabled="page >= pages" @click="page++">下一页</button></div></div>
  </div>
</template>
