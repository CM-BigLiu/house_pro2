import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { asyncRoutes } from './asyncRoutes';
import { canAccessRoute, type PermissionRequirement } from './permission';

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

  // 所有业务路由只注册一次；菜单权限和操作权限在每次导航时重新校验。
  // 这样切换账号后，前一个账号注册过的路由也不会残留放行。
  const routesReady = router.hasRoute('Home');
  if (!routesReady) {
    asyncRoutes.forEach((route) => router.addRoute(route));
    // 关键修复：重定向到解析后的目标路径，而不是 to.fullPath 原样回传。
    // 访问 / 时 fullPath 是 /，重注册后再导航 / 会再次触发 redirect: /home，
    // 与守卫的 next({path: '/'}) 形成无限循环（RangeError 栈溢出 → 白屏/跳登录）。
    if (to.path === '/') return next({ path: '/home', replace: true });
    return next({ path: to.path, query: to.query, hash: to.hash, replace: true });
  }

  const allowed = canAccessRoute(
    userStore.permissions,
    to.meta.permission as PermissionRequirement,
    to.meta.actionPermission as PermissionRequirement,
  );
  if (!allowed) {
    return next({ path: '/home', replace: true });
  }

  next();
});

export default router;
