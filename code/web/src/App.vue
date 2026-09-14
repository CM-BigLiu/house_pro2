<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from './components/Layout/AppSidebar.vue';
import AppHeader from './components/Layout/AppHeader.vue';

const route = useRoute();
const isLogin = computed(() => route.path === '/login');
const sidebarOpen = ref(false);

watch(() => route.fullPath, () => {
  sidebarOpen.value = false;
});
</script>

<template>
  <div class="app">
    <template v-if="!isLogin">
      <a class="skip-link" href="#main-content">跳到主内容</a>
      <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
      <button
        v-if="sidebarOpen"
        type="button"
        class="sidebar-backdrop"
        aria-label="关闭导航菜单"
        @click="sidebarOpen = false"
      />
      <div class="main">
        <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
        <main id="main-content" class="content" tabindex="-1">
          <router-view v-slot="{ Component }">
            <component :is="Component" :key="route.fullPath" />
          </router-view>
        </main>
      </div>
    </template>
    <router-view v-else />
  </div>
</template>

<style scoped lang="scss">
.app {
  display: flex;
  min-height: 100vh;
}
.main {
  flex: 1;
  min-width: 0;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.content {
  flex: 1;
  padding: 22px 24px 40px;
  overflow: auto;
}
.skip-link {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 1000;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-160%);
  transition: transform 0.15s;
}
.skip-link:focus { transform: translateY(0); }
.sidebar-backdrop { display: none; }

@media (max-width: 768px) {
  .main { margin-left: 0; }
  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 45;
    width: 100%;
    height: 100%;
    padding: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(2px);
  }
}
</style>
