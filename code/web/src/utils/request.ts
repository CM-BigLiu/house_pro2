import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';

const request: AxiosInstance = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`;
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
  (error: AxiosError<{ message?: string }>) => {
    const { response } = error;
    let message = '网络异常，请稍后重试';
    if (response) {
      switch (response.status) {
        case 401:
          message = '登录已过期，请重新登录';
          useUserStore().logout();
          window.location.href = '/login';
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
