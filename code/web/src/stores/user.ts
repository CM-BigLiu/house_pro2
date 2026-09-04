import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  login as loginApi,
  logout as logoutApi,
  getMe,
  getMenus,
  type LoginForm,
  type UserInfo,
  type MenuItem,
} from '@/api/auth';
import { connectSocket, disconnectSocket } from '@/utils/socket';

export const useUserStore = defineStore('user', () => {
  const accessToken = ref(localStorage.getItem('house_access_token') || '');
  const refreshToken = ref(localStorage.getItem('house_refresh_token') || '');
  const userInfo = ref<UserInfo | null>(null);
  const menus = ref<MenuItem[]>([]);
  const loading = ref(false);

  // 向后兼容: 旧调用方 (router / socket / request) 读取的 token 即 accessToken
  const token = computed(() => accessToken.value);

  const isLoggedIn = computed(() => !!accessToken.value);
  const permissions = computed(() => userInfo.value?.permissions || []);
  const name = computed(() => userInfo.value?.name || '');

  const setTokens = (access: string, refresh: string) => {
    accessToken.value = access;
    refreshToken.value = refresh;
    if (access) {
      localStorage.setItem('house_access_token', access);
    } else {
      localStorage.removeItem('house_access_token');
    }
    if (refresh) {
      localStorage.setItem('house_refresh_token', refresh);
    } else {
      localStorage.removeItem('house_refresh_token');
    }
  };

  const login = async (form: LoginForm) => {
    loading.value = true;
    try {
      const res = await loginApi(form);
      setTokens(res.accessToken, res.refreshToken);
      await fetchUserInfo();
      await fetchMenus();
      connectSocket();
      return true;
    } finally {
      loading.value = false;
    }
  };

  const fetchUserInfo = async () => {
    userInfo.value = await getMe();
  };

  const fetchMenus = async () => {
    menus.value = await getMenus();
  };

  const logout = async () => {
    disconnectSocket();
    const refresh = refreshToken.value;
    // 先清空本地登录态，后端登出失败也不影响本地清理
    setTokens('', '');
    userInfo.value = null;
    menus.value = [];
    if (refresh) {
      try {
        await logoutApi({ refreshToken: refresh });
      } catch {
        // 忽略后端登出失败 (refresh 已过期等场景)
      }
    }
  };

  return {
    accessToken,
    refreshToken,
    token,
    userInfo,
    menus,
    loading,
    isLoggedIn,
    permissions,
    name,
    setTokens,
    login,
    fetchUserInfo,
    fetchMenus,
    logout,
  };
});
