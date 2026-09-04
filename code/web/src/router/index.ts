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

  // 动态路由注册：以「首页路由是否已注册」为准
  const routesReady = router.hasRoute('Home');
  if (!routesReady) {
    const perms = userStore.permissions;
    const accessible = asyncRoutes.filter((route) => {
      const need = route.meta?.permission as string | undefined;
      if (!need) return true;
      return perms.includes('*') || perms.includes(need);
    });
    accessible.forEach((route) => router.addRoute(route));
    // 关键修复：重定向到解析后的目标路径，而不是 to.fullPath 原样回传。
    // 访问 / 时 fullPath 是 /，重注册后再导航 / 会再次触发 redirect: /home，
    // 与守卫的 next({path: '/'}) 形成无限循环（RangeError 栈溢出 → 白屏/跳登录）。
    const redirectPath = to.path === '/' ? '/home' : (to.fullPath || to.path);
    return next({ path: redirectPath, replace: true });
  }

  next();
});

export default router;
