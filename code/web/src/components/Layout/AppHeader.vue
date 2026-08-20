<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import {
  Bell,
  MessageSquare,
  HelpCircle,
  Search,
} from 'lucide-vue-next';

const route = useRoute();
const userStore = useUserStore();

const pageTitle = computed(() => (route.meta.title as string) || '');
</script>

<template>
  <header class="header">
    <div class="header-left">
      <div class="page-title">{{ pageTitle }}</div>
    </div>

    <div class="header-center">
      <div class="search-box">
        <Search :size="15" class="search-icon" />
        <input type="text" placeholder="搜索房源、客源、小区…" />
      </div>
    </div>

    <div class="header-right">
      <button class="icon-btn">
        <el-badge :value="3" :max="99">
          <Bell :size="18" />
        </el-badge>
      </button>
      <button class="icon-btn">
        <MessageSquare :size="18" />
      </button>
      <button class="icon-btn">
        <HelpCircle :size="18" />
      </button>
      <div class="avatar-wrap">
        <el-avatar :size="30" :src="userStore.userInfo?.avatar">{{ userStore.name?.[0] }}</el-avatar>
        <span class="avatar-name">{{ userStore.name }}</span>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  position: sticky;
  top: 0;
  height: var(--header-height);
  margin-left: var(--sidebar-width);
  background: rgba(247, 249, 252, 0.82);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--ink-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 90;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.page-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--ink-900);
}
.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}
.search-box {
  width: 360px;
  max-width: 50%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  background: #fff;
  border: 1px solid var(--ink-200);
  border-radius: 999px;
  box-shadow: var(--shadow-xs);
  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 13px;
    background: transparent;
    color: var(--ink-700);
    &::placeholder {
      color: var(--ink-400);
    }
  }
}
.search-icon {
  color: var(--ink-400);
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon-btn {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--ink-600);
  &:hover {
    background: var(--ink-100);
    color: var(--ink-900);
  }
}
.avatar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  padding: 4px 10px 4px 5px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid var(--ink-200);
  cursor: pointer;
}
.avatar-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-800);
}
</style>
