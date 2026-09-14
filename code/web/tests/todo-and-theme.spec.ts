import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, nextTick, type App } from 'vue';
import { compile } from 'sass';
import { resolve } from 'node:path';
import TodoView from '@/views/dashboard/TodoView.vue';
import LoginView from '@/views/login/LoginView.vue';
import { getTodos } from '@/api/dashboard';
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/api/dashboard', () => ({ getTodos: vi.fn() }));
vi.mock('@/stores/user', () => ({
  useUserStore: () => ({ isLoggedIn: false, login: vi.fn() }),
}));
let app: App | undefined;
afterEach(() => { app?.unmount(); document.body.innerHTML = ''; vi.clearAllMocks(); });
describe('待办与共享主题回归', () => {
  it('Sass 变量不再向每个 scoped 页面注入全局重置样式', () => {
    expect(compile(resolve('src/styles/variables.scss')).css.trim()).toBe('');
    expect(compile(resolve('src/styles/base.scss')).css).toContain('button {');
  });
  it('完整待办支持分页、优先级与关键词筛选', async () => {
    vi.mocked(getTodos).mockResolvedValue(Array.from({ length: 25 }, (_, index) => ({ id: String(index), title: `测试待办${index}`, priority: index === 24 ? 'high' : 'low', date: '2026-09-10' })));
    const root = document.createElement('div'); document.body.append(root);
    app = createApp(TodoView); app.directive('loading', {}); app.mount(root);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(getTodos).toHaveBeenCalledWith({ all: true });
    expect(root.querySelectorAll('tbody tr')).toHaveLength(20);
    const button = [...root.querySelectorAll('button')].find(button => button.textContent === '下一页')!;
    button.click(); await nextTick(); expect(root.querySelectorAll('tbody tr')).toHaveLength(5);
    const input = root.querySelector('input')!; input.value = '测试待办24'; input.dispatchEvent(new Event('input')); await nextTick();
    expect(root.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(root.textContent).toContain('测试待办24');
  });

  it('登录页支持浏览器自动填充、演示身份切换与密码可见性控制', async () => {
    const root = document.createElement('div'); document.body.append(root);
    app = createApp(LoginView); app.mount(root);

    const accountInput = root.querySelector<HTMLInputElement>('#login-account')!;
    const passwordInput = root.querySelector<HTMLInputElement>('#login-password')!;
    expect(accountInput.autocomplete).toBe('username');
    expect(passwordInput.autocomplete).toBe('current-password');

    const salesman = [...root.querySelectorAll<HTMLButtonElement>('.demo-account')]
      .find(button => button.textContent === 'salesman')!;
    salesman.click();
    await nextTick();
    expect(accountInput.value).toBe('salesman');
    expect(passwordInput.value).toBe('123456');

    root.querySelector<HTMLButtonElement>('.password-toggle')!.click();
    await nextTick();
    expect(passwordInput.type).toBe('text');
  });
});
