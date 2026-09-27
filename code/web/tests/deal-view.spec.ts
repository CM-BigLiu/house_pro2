import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, nextTick, type App } from 'vue';
import DealView from '@/views/finance/DealView.vue';
import { getDeals } from '@/api/deal';
import { asyncRoutes } from '@/router/asyncRoutes';
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/api/deal', () => ({ getDeals: vi.fn() }));
vi.mock('@/stores/dict', () => ({ useDictStore: () => ({ ensureLoaded: vi.fn().mockResolvedValue(undefined), getLabel: (_code: string, value: string) => value }) }));
let app: App | undefined;
const flush = async () => { await new Promise(resolve => setTimeout(resolve, 0)); await nextTick(); };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getDeals).mockResolvedValue({ list: [{ id: 1, contractCode: 'HT001', customerId: 1, customerName: '测试客户', customerPhone: '138****1234', propertyId: 1, propertyCode: 'ZJ001', propertyName: '测试房源', bizType: 'rent', signedAt: '2026-09-27', amount: 3000, deposit: 3000, responsibleEmployeeName: '负责经纪人', status: 'active' }], total: 1,
  stats: { total: 1, rentCount: 1, saleCount: 0, monthlyRent: 3000, saleAmount: 0 } }); });
afterEach(() => { app?.unmount(); document.body.innerHTML = ''; });
async function render() { const root = document.createElement('div'); document.body.append(root); app = createApp(DealView); app.directive('loading', {}); app.directive('permission', {}); app.component('ElDialog', { props: ['modelValue'], template: '<div v-if="modelValue"><slot/><slot name="footer"/></div>' }); app.config.warnHandler = () => {}; app.mount(root); await flush(); return root; }
describe('成交管理和财务功能退休', () => {
  it('仅注册新的成交入口，已删除模块不保留创建或编辑路由', () => {
    expect(asyncRoutes.find(route => route.path === '/finance/deal')?.meta?.permission).toBe('finance:deal');
    expect(asyncRoutes.some(route => /^\/finance\/(bill(?:\/|$)|daily-account|rent-increase|payout)/.test(route.path))).toBe(false);
  });
  it('租金和售房总价分别统计，展示合同快照和负责人', async () => {
    const root = await render(); expect(root.textContent).toContain('生效月租'); expect(root.textContent).toContain('生效售房总价'); expect(root.textContent).toContain('HT001'); expect(root.textContent).toContain('负责经纪人'); expect(root.textContent).toContain('合同生效'); expect(root.textContent).toContain('不代表实收款');
    const select = root.querySelector('select')!; select.value = 'sale'; select.dispatchEvent(new Event('change')); await nextTick();
    [...root.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === '筛选')!.click(); await flush();
    expect(getDeals).toHaveBeenLastCalledWith(expect.objectContaining({ bizType: 'sale', page: 1 }));
  });
  it('加载失败有可重试提示，不显示旧列表', async () => {
    vi.mocked(getDeals).mockRejectedValueOnce(new Error('offline')); const root = await render(); expect(root.textContent).toContain('加载失败'); expect(root.textContent).toContain('重试'); expect(root.textContent).not.toContain('HT001');
  });
});
