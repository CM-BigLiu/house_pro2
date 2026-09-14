<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Bell, ChevronDown, ListTodo, LogOut, Menu } from 'lucide-vue-next';
import { useUserStore } from '../../stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const emit = defineEmits<{ 'toggle-sidebar': [] }>();

// Breadcrumb map: route path → Chinese label
const breadcrumbMap: Record<string, string> = {
  '/': '看板',
  '/dashboard': '看板',
  '/house/rent': '租房管理',
  '/house/sale': '售房管理',
  '/house/customer': '客源管理',
  '/house/community': '小区管理',
  '/house/blacklist': '黑名单',
  '/house/reserve-house': '储备房源',
  '/house/reserve-client': '储备客源',
  '/house/house-wizard': '房源录入',
  '/house/checkout': '退租管理',
  '/house/deposit': '押金管理',
  '/finance/bill': '账单管理',
  '/finance/daily-account': '流水管理',
  '/finance/arrears': '催收管理',
  '/finance/plan': '回款计划',
  '/finance/payout': '支出管理',
  '/finance/invoice': '发票管理',
  '/finance/profit': '利润分析',
  '/finance/income-cost': '收支管理',
  '/finance/performance': '绩效考核',
  '/finance/accounting': '财务核算',
  '/system/role': '角色管理',
  '/system/permission': '权限管理',
  '/system/employee': '员工管理',
  '/system/dict': '字典管理',
  '/system/store': '门店管理',
  '/system/config': '系统配置',
  '/system/log': '操作日志',
};

const breadcrumbs = computed(() => {
  const name = breadcrumbMap[route.path] || route.meta?.title as string || '';
  const segments: { label: string; path?: string }[] = [
    { label: '首页', path: route.path === '/home' ? undefined : '/home' },
  ];
  if (name && name !== '首页') {
    segments.push({ label: name });
  }
  return segments;
});

const user = computed(() => userStore.userInfo ?? { name: '用户' });
const initials = computed(() => {
  const n = user.value.name;
  return n ? n.charAt(0) : '用';
});

async function handleUserCommand(command: string) {
  if (command === 'todos') {
    await router.push('/home/todos');
    return;
  }
  if (command === 'logout') {
    await userStore.logout();
    await router.push('/login');
  }
}
</script>

<template>
  <header class="header">
    <div class="header-left">
      <button
        type="button"
        class="icon-btn menu-toggle"
        aria-label="打开导航菜单"
        aria-controls="app-sidebar"
        @click="emit('toggle-sidebar')"
      >
        <Menu :size="19" />
      </button>
      <div class="breadcrumb">
        <template v-for="(crumb, i) in breadcrumbs" :key="i">
          <router-link v-if="crumb.path" :to="crumb.path">{{ crumb.label }}</router-link>
          <span v-else class="current">{{ crumb.label }}</span>
          <span v-if="i < breadcrumbs.length - 1" class="sep">›</span>
        </template>
      </div>
    </div>
    <div class="header-right">
      <button type="button" class="icon-btn" aria-label="我的待办" title="我的待办" @click="router.push('/home/todos')">
        <Bell :size="17" />
      </button>
      <div class="header-divider"></div>
      <el-dropdown trigger="click" @command="handleUserCommand">
        <button type="button" class="user" aria-label="打开用户菜单">
          <span class="user-avatar">{{ initials }}</span>
          <span class="user-name">{{ user.name }}</span>
          <ChevronDown :size="13" class="user-chevron" />
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="todos"><ListTodo :size="15" />我的待办</el-dropdown-item>
            <el-dropdown-item command="logout" divided><LogOut :size="15" />退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  min-height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--ink-200);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--ink-400);
  font-size: 13px;
  white-space: nowrap;
}
.breadcrumb a {
  color: var(--ink-500);
  transition: color 0.15s;
}
.breadcrumb a:hover {
  color: var(--primary);
}
.breadcrumb .sep {
  color: var(--ink-300);
  font-size: 11px;
}
.breadcrumb .current {
  color: var(--ink-900);
  font-weight: 600;
}
.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
  max-width: 78%;
}
.menu-toggle { display: none; }
.icon-btn {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-500);
  border-radius: var(--radius-sm);
  position: relative;
  transition: all 0.15s;
  background: none;
  border: none;
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;
}
.icon-btn:hover { background: var(--ink-100); color: var(--ink-800); }
.icon-btn.is-active { background: var(--primary-soft); color: var(--primary); }
.header-divider {
  width: 1px;
  height: 20px;
  background: var(--ink-200);
  margin: 0 6px;
  flex: none;
}
.user {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 4px 10px 4px 4px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s;
  border: 1px solid transparent;
  background: transparent;
}
.user:hover { background: var(--ink-100); }
.user:focus-visible,
.icon-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  flex: none;
  background: linear-gradient(135deg, #4d8bff, #2e6bf0);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 2px 6px -1px rgba(46,107,240,0.4);
}
.user-name {
  font-size: 13px;
  color: var(--ink-700);
  font-weight: 600;
}
.user-chevron { color: var(--ink-400); }

@media (max-width: 768px) {
  .header { padding: 9px 14px; }
  .menu-toggle { display: inline-flex; }
  .breadcrumb { overflow: hidden; text-overflow: ellipsis; }
  .breadcrumb > * { flex: none; }
  .header-divider { margin: 0 2px; }
}

@media (max-width: 480px) {
  .user-name,
  .header-divider { display: none; }
  .user { padding-right: 4px; }
}
</style>
