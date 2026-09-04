<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '../../stores/user';

const route = useRoute();
const userStore = useUserStore();

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
  const segments: { label: string; path?: string }[] = [{ label: '首页', path: '/' }];
  if (name && route.path !== '/') {
    segments.push({ label: name });
  }
  return segments;
});

const user = computed(() => userStore.userInfo ?? { name: '用户' });
const initials = computed(() => {
  const n = user.value.name;
  return n ? n.charAt(0) : '用';
});
</script>

<template>
  <header class="header">
    <div class="header-left">
      <div class="breadcrumb">
        <template v-for="(crumb, i) in breadcrumbs" :key="i">
          <router-link v-if="crumb.path" :to="crumb.path">{{ crumb.label }}</router-link>
          <span v-else class="current">{{ crumb.label }}</span>
          <span v-if="i < breadcrumbs.length - 1" class="sep">›</span>
        </template>
      </div>
    </div>
    <div class="header-right">
      <button class="icon-btn is-active" title="消息">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span class="badge"></span>
      </button>
      <button class="icon-btn" title="通知">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      </button>
      <div class="header-divider"></div>
      <div class="user">
        <span class="user-avatar">{{ initials }}</span>
        <span class="user-name">{{ user.name }}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--ink-300)"><path d="m6 9 6 6 6-6"/></svg>
      </div>
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
.badge {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 8px;
  height: 8px;
  background: var(--danger);
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(220,38,38,0.2);
}
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
}
.user:hover { background: var(--ink-100); }
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
</style>