import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { refreshToken as refreshTokenApi } from '@/api/auth';

const request: AxiosInstance = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// 单飞 (in-flight 合并) refresh: 并发 401 只触发一次刷新
// ---------------------------------------------------------------------------
let refreshingPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

function doRefresh(): Promise<{ accessToken: string; refreshToken: string }> {
  if (!refreshingPromise) {
    const userStore = useUserStore();
    const currentRefreshToken = userStore.refreshToken;
    refreshingPromise = refreshTokenApi({ refreshToken: currentRefreshToken })
      .then((res) => {
        userStore.setTokens(res.accessToken, res.refreshToken);
        return res;
      })
      .finally(() => {
        refreshingPromise = null;
      });
  }
  return refreshingPromise;
}

function redirectToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    if (userStore.accessToken) {
      config.headers.Authorization = `Bearer ${userStore.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

request.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && typeof data === 'object' && 'code' in data && 'data' in data) {
      if (data.code !== 0 && data.code !== 200) {
        ElMessage.error(data.message || '请求失败');
        return Promise.reject(new Error(data.message || '请求失败'));
      }
      return data.data;
    }
    return data;
  },
  async (error: AxiosError<{ message?: string }>) => {
    const { response, config } = error;

    // 401: access token 过期 → 单飞 refresh → 重放原请求
    if (response?.status === 401 && config && !(config as any).__isRetryAfterRefresh) {
      const userStore = useUserStore();
      // 本地已无 refresh token: 直接清登录态跳登录
      if (!userStore.refreshToken) {
        userStore.setTokens('', '');
        userStore.userInfo = null;
        userStore.menus = [];
        ElMessage.error('登录已过期，请重新登录');
        redirectToLogin();
        return Promise.reject(error);
      }
      try {
        await doRefresh();
      } catch (refreshError) {
        // refresh 失败 (无效/过期/已吊销): 清登录态跳登录
        userStore.setTokens('', '');
        userStore.userInfo = null;
        userStore.menus = [];
        ElMessage.error('登录已过期，请重新登录');
        redirectToLogin();
        return Promise.reject(error);
      }
      // 重放原请求 (换新 access token)
      (config as any).__isRetryAfterRefresh = true;
      config.headers = config.headers || ({} as any);
      (config.headers as any).Authorization = `Bearer ${useUserStore().accessToken}`;
      return request(config);
    }

    let message = '网络异常，请稍后重试';
    if (response) {
      switch (response.status) {
        case 401:
          message = '登录已过期，请重新登录';
          redirectToLogin();
          break;
        case 403:
          message = '没有权限执行该操作';
          break;
        case 500:
          message = response.data?.message || '服务器内部错误';
          break;
        default:
          message = response.data?.message || `请求失败 (${response.status})`;
      }
    }
    ElMessage.error(message);
    return Promise.reject(error);
  },
);

export default request;

export function get<T = unknown>(url: string, config?: AxiosRequestConfig) {
  return request.get<any, T>(url, config);
}

export function post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return request.post<any, T>(url, data, config);
}

export function put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return request.put<any, T>(url, data, config);
}

export function upload<T = unknown>(url: string, data: FormData, config?: AxiosRequestConfig) {
  return request.post<any, T>(url, data, {
    ...config,
    headers: {
      ...config?.headers,
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function del<T = unknown>(url: string, config?: AxiosRequestConfig) {
  return request.delete<any, T>(url, config);
}
