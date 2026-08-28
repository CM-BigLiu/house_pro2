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

const activeGroup = computed(() => {
  return userStore.menus.find((m) => m.id === activeTop.value);
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
    router.push(menu.path).catch((err) => console.warn('菜单跳转失败', menu.path, err));
    return;
  }
  // 无 path 的父菜单：跳转到第一个有 path 的子菜单
  const first = menu.children?.find((c: any) => c.path);
  if (first?.path) {
    router.push(first.path).catch((err) => console.warn('菜单跳转失败', first.path, err));
  }
}

function onSubClick(child: any) {
  if (child.path) {
    router.push(child.path).catch((err) => console.warn('子菜单跳转失败', child.path, err));
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
      <div class="logo">
        <img :src="logoUrl" alt="logo" />
      </div>
      <div class="brand-text">
        <div class="brand-title">房屋租售 ERP</div>
        <div class="brand-sub">Beta</div>
      </div>
    </div>

    <nav class="top-menu">
      <div
        v-for="menu in userStore.menus"
        :key="menu.id"
        class="top-item"
        :class="{ active: activeTop === menu.id }"
        @click="onTopClick(menu)"
      >
        <component :is="iconFor(menu.icon)" class="top-icon" :size="20" />
        <span class="top-label">{{ menu.label }}</span>
        <ChevronRight v-if="!menu.path" :size="14" class="top-arrow" />
      </div>
    </nav>

    <div class="sub-menu" v-if="activeGroup?.children?.length">
      <div class="sub-title">{{ activeGroup.label }}</div>
      <div
        v-for="child in activeGroup.children"
        :key="child.id"
        class="sub-item"
        :class="{ active: isActive(child.path) }"
        @click="onSubClick(child)"
      >
        <span class="sub-dot" :class="{ active: isActive(child.path) }" />
        <span>{{ child.label }}</span>
      </div>
    </div>

    <div class="side-footer">
      <div class="user-mini">
        <el-avatar :size="28" :src="userStore.userInfo?.avatar">{{ userStore.name?.[0] }}</el-avatar>
        <span class="user-name">{{ userStore.name }}</span>
      </div>
      <button class="logout-btn" @click="onLogout">
        <LogOut :size="16" />
      </button>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--side-bg);
  color: var(--side-text);
  display: flex;
  flex-direction: column;
  z-index: 100;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.logo {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--primary), #6ba3ff);
  display: grid;
  place-items: center;
  font-weight: 800;
  color: #fff;
  img {
    width: 20px;
    height: 20px;
    filter: brightness(0) invert(1);
  }
}
.brand-text {
  flex: 1;
}
.brand-title {
  font-size: 15px;
  font-weight: 700;
  color: #e6ecf6;
  letter-spacing: 0.3px;
}
.brand-sub {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}
.top-menu {
  padding: 14px 12px;
}
.top-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.18s ease;
  margin-bottom: 4px;
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #e6ecf6;
  }
  &.active {
    background: rgba(46, 107, 240, 0.18);
    color: #fff;
  }
}
.top-icon {
  flex-shrink: 0;
}
.top-label {
  flex: 1;
  font-size: 13.5px;
  font-weight: 600;
}
.top-arrow {
  opacity: 0.5;
}
.sub-menu {
  flex: 1;
  overflow: auto;
  padding: 10px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.sub-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #64748b;
  padding: 10px 12px 6px;
}
.sub-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.18s ease;
  color: #93a1b8;
  &:hover {
    background: rgba(255, 255, 255, 0.04);
    color: #e6ecf6;
  }
  &.active {
    background: rgba(46, 107, 240, 0.14);
    color: #fff;
  }
}
.sub-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #475569;
  &.active {
    background: var(--primary);
  }
}
.side-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.user-mini {
  display: flex;
  align-items: center;
  gap: 9px;
}
.user-name {
  font-size: 13px;
  color: #e6ecf6;
  font-weight: 600;
}
.logout-btn {
  color: #93a1b8;
  padding: 6px;
  border-radius: 6px;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
}
</style>
