<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import {
  LayoutDashboard,
  Building2,
  Banknote,
  Settings,
  ChevronRight,
  LogOut,
} from 'lucide-vue-next';

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();

const iconMap: Record<string, any> = {
  layoutDashboard: LayoutDashboard,
  building2: Building2,
  banknote: Banknote,
  settings: Settings,
};

const activeTop = computed(() => {
  const path = route.path;
  if (path.startsWith('/house')) return 'house';
  if (path.startsWith('/finance')) return 'finance';
  if (path.startsWith('/system')) return 'system';
  return 'home';
});

function iconFor(name?: string) {
  return iconMap[name || ''];
}

function isActive(path?: string) {
  if (!path) return false;
  return route.path === path || route.path.startsWith(path + '/');
}

function onTopClick(menu: any) {
  if (menu.path) {
    router.push(menu.path).catch(() => {});
    return;
  }
  // 点击有子菜单的父项：切换展开/收起或跳转第一个子项
  const first = menu.children?.find((c: any) => c.path);
  if (first?.path) {
    router.push(first.path).catch(() => {});
  }
}

function onSubClick(child: any) {
  if (child.path) {
    router.push(child.path).catch(() => {});
  }
}

function onLogout() {
  userStore.logout();
  router.push('/login');
}

const logoUrl = ref('/logo.svg');
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-icon">
        <img :src="logoUrl" alt="logo" />
      </div>
      <div>
        <div class="brand-title">房屋租售 ERP</div>
        <div class="brand-sub">U-HOUSE · BETA</div>
      </div>
    </div>

    <nav class="nav">
      <div class="nav-label">主菜单</div>

      <template v-for="menu in userStore.menus" :key="menu.id">
        <!-- 一级菜单项 -->
        <div
          class="nav-item"
          :class="{ active: activeTop === menu.id }"
          @click="onTopClick(menu)"
        >
          <component :is="iconFor(menu.icon)" :size="20" />
          <span>{{ menu.label }}</span>
          <ChevronRight v-if="menu.children?.length" :size="14" class="nav-chevron" />
        </div>

        <!-- 二级子菜单：仅当该一级菜单被选中时显示 -->
        <div v-if="activeTop === menu.id && menu.children?.length" class="subnav-group">
          <div class="subnav-label">{{ menu.label }}</div>
          <div
            v-for="child in menu.children"
            :key="child.id"
            class="subnav-item"
            :class="{ active: isActive(child.path) }"
            @click="onSubClick(child)"
          >
            <span class="sub-dot" :class="{ active: isActive(child.path) }" />
            <span>{{ child.label }}</span>
          </div>
        </div>
      </template>
    </nav>

    <div class="sidebar-user">
      <el-avatar :size="28" :src="userStore.userInfo?.avatar" class="user-avatar">{{ userStore.name?.[0] }}</el-avatar>
      <div style="flex:1;min-width:0">
        <div class="su-name">{{ userStore.name }}</div>
        <div class="su-role">管理员</div>
      </div>
      <button class="logout-btn" @click="onLogout" title="退出登录">
        <LogOut :size="15" />
      </button>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  width: var(--sidebar-width); position: fixed; inset: 0 auto 0 0; z-index: 50;
  display: flex; flex-direction: column;
  background: linear-gradient(178deg, var(--side-bg) 0%, var(--side-bg-2) 60%, #0c1424 100%);
  color: var(--side-text);
  box-shadow: 4px 0 24px -12px rgba(8, 15, 34, 0.6);
}
.brand {
  height: var(--header-height); display: flex; align-items: center; gap: 11px;
  padding: 0 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); flex: none;
}
.brand-icon {
  width: 34px; height: 34px; border-radius: 9px; flex: none;
  background: linear-gradient(135deg, #4d8bff 0%, #2e6bf0 55%, #1e56d6 100%);
  display: flex; align-items: center; justify-content: center; color: #fff;
  box-shadow: 0 4px 12px -2px rgba(46, 107, 240, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.25);
  img { width: 18px; height: 18px; filter: brightness(0) invert(1); }
}
.brand-title { font-weight: 700; font-size: 15.5px; color: #f1f5fb; letter-spacing: 0.5px; }
.brand-sub { font-size: 10.5px; color: rgba(255, 255, 255, 0.35); letter-spacing: 1.5px; margin-top: 1px; }

.nav { flex: 1; overflow-y: auto; padding: 12px 12px 24px; }
.nav::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.12); }
.nav-label {
  padding: 10px 10px 6px; font-size: 10.5px; color: rgba(147, 161, 184, 0.55);
  text-transform: uppercase; letter-spacing: 1.6px;
}
.nav-item {
  display: flex; align-items: center; gap: 11px; padding: 9.5px 12px; margin-bottom: 2px;
  color: var(--side-text); border-radius: var(--radius-sm); position: relative;
  transition: background 0.18s, color 0.18s; font-size: 13.5px; cursor: pointer; user-select: none;
}
.nav-item:hover { background: rgba(255, 255, 255, 0.06); color: #e6ecf6; }
.nav-item.active {
  background: linear-gradient(90deg, rgba(46, 107, 240, 0.95), rgba(46, 107, 240, 0.75));
  color: #fff; font-weight: 600;
  box-shadow: 0 6px 16px -6px rgba(46, 107, 240, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.18);
}
.nav-chevron { margin-left: auto; opacity: 0.45; transition: transform 0.22s; width: 14px; height: 14px; }

/* subnav-group: 子菜单容器 - 缩进 + 左侧竖线区分 */
.subnav-group {
  margin: 2px 0 6px 8px;
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
}
.subnav-label {
  font-size: 10.5px; color: rgba(147, 161, 184, 0.4);
  padding: 6px 10px 4px; letter-spacing: 1.2px;
}
.subnav-item {
  display: flex; align-items: center; gap: 10px; padding: 7px 10px; margin: 1px 0;
  color: rgba(225, 232, 245, 0.7); border-radius: 6px; font-size: 13px;
  cursor: pointer; transition: all 0.15s; position: relative;
}
.subnav-item:hover { color: #e6ecf6; background: rgba(255, 255, 255, 0.05); }
.subnav-item.active {
  color: #7fa8ff; background: rgba(46, 107, 240, 0.14); font-weight: 600;
}
.sub-dot {
  width: 5px; height: 5px; border-radius: 50%; background: #475569; flex: none;
  &.active { background: #5b8cff; box-shadow: 0 0 6px rgba(91, 140, 255, 0.6); }
}

.sidebar-user {
  flex: none; margin: 10px 12px 14px; padding: 10px 12px; border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex; align-items: center; gap: 10px;
}
.sidebar-user :deep(.user-avatar) { background: rgba(91, 140, 255, 0.18); color: #9dbcff; }
.su-name { font-size: 12.5px; color: #e6ecf6; font-weight: 600; }
.su-role { font-size: 11px; color: rgba(147, 161, 184, 0.7); }

.logout-btn {
  color: #93a1b8; padding: 4px; border-radius: 6px; flex: none;
  &:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
}
</style>