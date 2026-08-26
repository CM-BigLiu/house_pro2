import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { asyncRoutes } from './asyncRoutes';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/login/LoginView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

let dynamicAdded = false;

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore();

  if (to.meta.public) {
    return next();
  }

  if (!userStore.isLoggedIn) {
    return next('/login');
  }

  // 刷新后 store 中 userInfo 为空，需要重新拉取
  if (!userStore.userInfo && userStore.token) {
    try {
      await userStore.fetchUserInfo();
      await userStore.fetchMenus();
    } catch {
      userStore.logout();
      return next('/login');
    }
  }

  if (!dynamicAdded) {
    const perms = userStore.permissions;
    const accessible = asyncRoutes.filter((route) => {
      const need = route.meta?.permission as string | undefined;
      if (!need) return true;
      return perms.includes('*') || perms.includes(need);
    });
    accessible.forEach((route) => router.addRoute(route));
    dynamicAdded = true;
    // 动态路由刚注册，需要以 replace 方式重新导航到目标地址
    const redirectPath = to.fullPath || to.path;
    return next({ path: redirectPath, replace: true });
  }

  next();
});

export default router;
