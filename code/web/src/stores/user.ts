import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as loginApi, getMe, getMenus, type LoginForm, type UserInfo, type MenuItem } from '@/api/auth';
import { connectSocket, disconnectSocket } from '@/utils/socket';

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('house_token') || '');
  const userInfo = ref<UserInfo | null>(null);
  const menus = ref<MenuItem[]>([]);
  const loading = ref(false);

  const isLoggedIn = computed(() => !!token.value);
  const permissions = computed(() => userInfo.value?.permissions || []);
  const name = computed(() => userInfo.value?.name || '');

  const setToken = (value: string) => {
    token.value = value;
    localStorage.setItem('house_token', value);
  };

  const login = async (form: LoginForm) => {
    loading.value = true;
    try {
      const res = await loginApi(form);
      setToken(res.token);
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

  const logout = () => {
    disconnectSocket();
    token.value = '';
    userInfo.value = null;
    menus.value = [];
    localStorage.removeItem('house_token');
  };

  return {
    token,
    userInfo,
    menus,
    loading,
    isLoggedIn,
    permissions,
    name,
    login,
    fetchUserInfo,
    fetchMenus,
    logout,
  };
});
