import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// ---------------------------------------------------------------------------
// Mocks must be hoisted before importing modules under test
// ---------------------------------------------------------------------------
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
  getMenus: vi.fn(),
}));

vi.mock('@/utils/socket', () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

import * as authApi from '@/api/auth';
import { useUserStore } from '@/stores/user';

// ---------------------------------------------------------------------------
// V-frontend-1 / Task 6.1
//   为前端登录态 store + axios 拦截器编写测试:
//     - login 存双令牌
//     - 401 → 单飞 refresh → 重放原请求成功
//
// 红 phase 属性:
//   * LoginResult 尚未包含 accessToken / refreshToken 字段 (design.md 契约)
//   * authApi.refreshToken / authApi.logout 尚未实现
//   * axios 拦截器尚未支持 401 自动 refresh 重放
//   以下断言在生产代码补齐前必然失败, 这是预期结果
// ---------------------------------------------------------------------------

describe('auth-token-refresh: 双令牌登录态 store', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  it('login 成功后同时持久化 accessToken 与 refreshToken', async () => {
    const loginResult = {
      // design.md: AuthService.login 返回 { accessToken, refreshToken, user }
      accessToken: 'access-token-aaa',
      refreshToken: 'refresh-token-bbb',
      user: { id: 1, name: '张三', mobile: '138****0000', avatar: '' },
    };
    (authApi.login as ReturnType<typeof vi.fn>).mockResolvedValue(loginResult);
    (authApi.getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      employeeId: 1,
      name: '张三',
      mobile: '138****0000',
      avatar: '',
      storeIds: [],
      groupIds: [],
      dataScope: 'all',
      permissions: [],
    });
    (authApi.getMenus as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const store = useUserStore();
    await store.login({ mobile: '13800000000', password: 'pwd' });

    // 双令牌必须同时被 store 持有
    expect(store.accessToken).toBe('access-token-aaa');
    expect(store.refreshToken).toBe('refresh-token-bbb');

    // 双令牌必须同时被持久化 (刷新页面后仍能续期)
    expect(localStorage.getItem('house_access_token')).toBe('access-token-aaa');
    expect(localStorage.getItem('house_refresh_token')).toBe('refresh-token-bbb');
  });

  it('logout 调用后端 logout 接口并清空双令牌', async () => {
    localStorage.setItem('house_access_token', 'access-token-aaa');
    localStorage.setItem('house_refresh_token', 'refresh-token-bbb');
    (authApi.logout as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const store = useUserStore();
    store.accessToken = 'access-token-aaa';
    store.refreshToken = 'refresh-token-bbb';

    await store.logout();

    // design.md: 登出 -> POST /auth/logout (携带 refreshToken)
    expect(authApi.logout).toHaveBeenCalledWith({ refreshToken: 'refresh-token-bbb' });

    expect(store.accessToken).toBe('');
    expect(store.refreshToken).toBe('');
    expect(localStorage.getItem('house_access_token')).toBeNull();
    expect(localStorage.getItem('house_refresh_token')).toBeNull();
  });
});

describe('auth-token-refresh: axios 拦截器 401 单飞 refresh 重放', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.resetModules();
    setActivePinia(createPinia());
  });

  function seedTokens() {
    localStorage.setItem('house_access_token', 'expired-access-token');
    localStorage.setItem('house_refresh_token', 'valid-refresh-token');
  }

  async function importRequestModule() {
    // 每次重新 import, 确保拦截器在新 pinia / 新 mock 上重新挂载
    return await import('@/utils/request');
  }

  it('401 → 调 refresh → 重放原请求成功 (V-frontend-1)', async () => {
    seedTokens();

    const { default: request } = await importRequestModule();
    const store = useUserStore();

    // 首次请求携带过期 accessToken → 401; refresh 之后第二次成功
    const adapter = vi.fn(async (config: any) => {
      const auth: string = config?.headers?.Authorization || '';
      if (auth.includes('expired-access-token')) {
        const err: any = new Error('Request failed with status code 401');
        err.config = config;
        err.response = { status: 401, data: { code: 401, message: 'token expired', data: null } };
        err.isAxiosError = true;
        throw err;
      }
      // 重放时必须已换上新 access token
      expect(auth).toBe('Bearer fresh-access-token');
      return {
        data: { code: 0, message: 'success', data: { ok: true } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    });
    (request as any).defaults.adapter = adapter;

    (authApi.refreshToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      accessToken: 'fresh-access-token',
      refreshToken: 'rotated-refresh-token',
    });

    const result = await request.get('/auth/me');

    // refresh 端点被调用且只调用一次
    expect(authApi.refreshToken).toHaveBeenCalledTimes(1);
    expect(authApi.refreshToken).toHaveBeenCalledWith({ refreshToken: 'valid-refresh-token' });

    // 原请求重放成功返回 200 解包后的数据
    expect(result).toEqual({ ok: true });

    // store 与 localStorage 已更新为新双令牌
    expect(store.accessToken).toBe('fresh-access-token');
    expect(store.refreshToken).toBe('rotated-refresh-token');
    expect(localStorage.getItem('house_access_token')).toBe('fresh-access-token');
    expect(localStorage.getItem('house_refresh_token')).toBe('rotated-refresh-token');
  });

  it('并发 401 单飞合并: 多个并发请求只触发一次 refresh, 且都被重放成功', async () => {
    seedTokens();

    const { default: request } = await importRequestModule();

    let resolveRefresh: (v: any) => void = () => undefined;
    (authApi.refreshToken as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    const adapter = vi.fn(async (config: any) => {
      const auth: string = config?.headers?.Authorization || '';
      if (auth.includes('expired-access-token')) {
        const err: any = new Error('Request failed with status code 401');
        err.config = config;
        err.response = { status: 401, data: { code: 401, message: 'token expired', data: null } };
        err.isAxiosError = true;
        throw err;
      }
      return {
        data: { code: 0, message: 'success', data: { url: config.url } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    });
    (request as any).defaults.adapter = adapter;

    const p1 = request.get('/a');
    const p2 = request.get('/b');
    const p3 = request.get('/c');

    // 给拦截器一次事件循环, 让三个请求都进入 refresh 等待队列
    await new Promise((r) => setTimeout(r, 0));

    // 此刻 refresh 必须只被调一次 (单飞)
    expect(authApi.refreshToken).toHaveBeenCalledTimes(1);

    resolveRefresh({
      accessToken: 'fresh-access-token',
      refreshToken: 'rotated-refresh-token',
    });

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
    expect(r1).toEqual({ url: '/a' });
    expect(r2).toEqual({ url: '/b' });
    expect(r3).toEqual({ url: '/c' });

    // 全部完成后 refresh 仍然只被调一次
    expect(authApi.refreshToken).toHaveBeenCalledTimes(1);
  });

  it('refresh 失败 → 清空登录态 (accessToken / refreshToken 均清空)', async () => {
    seedTokens();

    const { default: request } = await importRequestModule();
    const store = useUserStore();

    (authApi.refreshToken as ReturnType<typeof vi.fn>).mockRejectedValue(
      Object.assign(new Error('Request failed with status code 401'), {
        response: { status: 401, data: { code: 401, message: 'refresh revoked', data: null } },
        isAxiosError: true,
      }),
    );

    const adapter = vi.fn(async (config: any) => {
      const err: any = new Error('Request failed with status code 401');
      err.config = config;
      err.response = { status: 401, data: { code: 401, message: 'token expired', data: null } };
      err.isAxiosError = true;
      throw err;
    });
    (request as any).defaults.adapter = adapter;

    await expect(request.get('/auth/me')).rejects.toBeTruthy();

    // design.md: 拦截器 refresh 失败 → 清登录态跳登录
    expect(store.accessToken).toBe('');
    expect(store.refreshToken).toBe('');
    expect(localStorage.getItem('house_access_token')).toBeNull();
    expect(localStorage.getItem('house_refresh_token')).toBeNull();
  });
});
