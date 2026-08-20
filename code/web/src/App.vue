<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from './components/Layout/AppSidebar.vue';
import AppHeader from './components/Layout/AppHeader.vue';

const route = useRoute();
const isLogin = computed(() => route.path === '/login');
</script>

<template>
  <div class="app">
    <template v-if="!isLogin">
      <AppSidebar />
      <div class="main">
        <AppHeader />
        <main class="content">
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
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
  max-width: 1680px;
  width: 100%;
  margin: 0 auto;
}
</style>
