import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, nextTick, type App } from 'vue';
import HomeView from '@/views/dashboard/HomeView.vue';
import { getOverview, getRankings, getTodos, getWarnings } from '@/api/dashboard';

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('element-plus', () => ({ ElMessage: { info: vi.fn() } }));
vi.mock('vue-echarts', () => ({ default: { template: '<div data-testid="chart" />' } }));
vi.mock('@/stores/user', () => ({ useUserStore: () => ({ permissions: ['*'], userInfo: { name: '测试管理员' } }) }));
vi.mock('@/api/dashboard', () => ({ getOverview: vi.fn(), getWarnings: vi.fn(), getRankings: vi.fn(), getTodos: vi.fn() }));

let app: App | undefined;
afterEach(() => { app?.unmount(); document.body.innerHTML = ''; vi.resetAllMocks(); });

async function render(overview: unknown) {
  vi.mocked(getOverview).mockResolvedValue(overview as Awaited<ReturnType<typeof getOverview>>);
  vi.mocked(getWarnings).mockResolvedValue([]);
  vi.mocked(getRankings).mockResolvedValue({ performance: [{ name: '张伟', value: 98500 }] });
  vi.mocked(getTodos).mockResolvedValue([{ id: '1', title: '完成合同续签', priority: 'high' }]);
  const errors = vi.fn();
  const root = document.createElement('div');
  document.body.append(root);
  app = createApp(HomeView);
  app.config.errorHandler = errors;
  app.mount(root);
  await new Promise(resolve => setTimeout(resolve, 0));
  await nextTick();
  return { root, errors };
}

describe('首页渲染', () => {
  it('缺少旧接口中的图表和大卡片字段时仍显示首页，不整页空白', async () => {
    const { root, errors } = await render({ totalRent: { value: '126.8' } });
    expect(errors).not.toHaveBeenCalled();
    expect(root.textContent).toContain('测试管理员，欢迎回来');
    expect(root.textContent).toContain('暂无收支数据');
    expect(root.textContent).toContain('完成合同续签');
  });

  it('完整接口显示指标、图表、排行和待办', async () => {
    const { root, errors } = await render({
      kpis: [{ label: '在管房源', value: 25, unit: '套' }],
      charts: { monthly: [{ month: '2026-09', income: 10000, expense: 5000 }] },
      smallCards: [], bigCards: [{ title: '出租率', value: '90%' }],
    });
    expect(errors).not.toHaveBeenCalled();
    expect(root.textContent).toContain('在管房源');
    expect(root.textContent).toContain('90%');
    expect(root.textContent).toContain('张伟');
    expect(root.textContent).toContain('完成合同续签');
    expect(root.querySelector('[data-testid="chart"]')).not.toBeNull();
  });

  it('接口失败时显示重试入口', async () => {
    vi.mocked(getOverview).mockRejectedValueOnce(new Error('服务不可用'));
    const { root, errors } = await render({});
    expect(errors).not.toHaveBeenCalled();
    expect(root.textContent).toContain('首页数据加载失败');
    const retry = Array.from(root.querySelectorAll('button')).find(button => button.textContent === '重新加载');
    expect(retry).toBeDefined();
    retry!.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(root.textContent).toContain('欢迎回来');
  });
});
