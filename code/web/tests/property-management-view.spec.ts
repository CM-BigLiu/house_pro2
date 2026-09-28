import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, nextTick, type App } from 'vue';
import PropertyManagementView from '@/views/house/PropertyManagementView.vue';
import { getManagedProperties, getManagedTenants } from '@/api/property-management';
import { asyncRoutes } from '@/router/asyncRoutes';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/api/property-management', () => ({ getManagedProperties: vi.fn(), getManagedTenants: vi.fn() }));
vi.mock('@/stores/dict', () => ({ useDictStore: () => ({ ensureLoaded: vi.fn().mockResolvedValue(undefined), getItems: () => [], getLabel: (_code: string, value: string) => value }) }));

let app: App | undefined;
const flush = async () => { await new Promise(resolve => setTimeout(resolve, 0)); await nextTick(); };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getManagedProperties).mockResolvedValue({ list: [
    { id: 1, code: 'ZJ001', communityName: '紫薇苑', address: '悦兴街', bizType: 'shared', status: 'rented', leaseStart: '2026-10-01', leaseEnd: '2029-09-30', nextLandlordPaymentDate: '2026-08-01' },
    { id: 2, code: 'ZJ002', communityName: '整租房源', bizType: 'entire', status: 'vacant', leaseStart: null, leaseEnd: null, nextLandlordPaymentDate: null },
  ], total: 2, page: 1, pageSize: 20 });
  vi.mocked(getManagedTenants).mockResolvedValue({ list: [
    { key: 'room-1', rentalSetId: 1, rentalRoomId: 1, tenantName: '真实租客', tenantPhone: '138****1234', signedAt: '2026-09-27T10:00:00Z', nextRentPaymentDate: '2026-10-01' },
    { key: 'set-2', rentalSetId: 2, rentalRoomId: null, tenantName: '未登记签约租客', tenantPhone: null, signedAt: null, nextRentPaymentDate: null },
  ], total: 2, page: 1, pageSize: 20 });
});
afterEach(() => { app?.unmount(); document.body.innerHTML = ''; });
async function render() {
  const root = document.createElement('div'); document.body.append(root);
  app = createApp(PropertyManagementView);
  app.directive('loading', {});
  app.component('ElInput', { props: ['modelValue', 'placeholder'], emits: ['update:modelValue'], template: `<input :placeholder="placeholder" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />` });
  app.component('ElPagination', { props: ['total'], template: '<span>共 {{ total }} 条</span>' });
  app.config.warnHandler = () => {};
  app.mount(root); await flush(); return root;
}

describe('房管房管理页面', () => {
  it('默认展示所有租房类型、房东租期和实际应付账单日期', async () => {
    const root = await render();
    expect(root.querySelectorAll('[role="tab"]')).toHaveLength(2);
    expect(root.querySelector('[aria-selected="true"]')?.textContent).toBe('房管管理');
    expect(root.textContent).toContain('整租'); expect(root.textContent).toContain('合租');
    expect(root.textContent).toContain('2026-10-01'); expect(root.textContent).toContain('2029-09-30');
    expect(root.textContent).toContain('2026-08-01'); expect(root.textContent).toContain('逾期');
    expect(root.textContent).toContain('租期未登记'); expect(root.textContent).toContain('未生成租金账单');
    expect(getManagedProperties).toHaveBeenCalledWith({ keyword: '', page: 1, pageSize: 20 });
    root.querySelector('.property-row')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(push).toHaveBeenCalledWith({ path: '/house/rent/detail/1', query: { source: 'property-management' } });
    expect(root.querySelector('.management-actions')?.textContent).toContain('成交');
    const edit = [...root.querySelectorAll<HTMLButtonElement>('.management-actions button')].find(button => button.textContent === '编辑')!;
    edit.click();
    expect(push).toHaveBeenCalledWith({ path: '/house/rent/edit/1', query: { source: 'property-management' } });
  });

  it('切换客户管理展示租客、电话、真实签约时间和租金应付日', async () => {
    const root = await render();
    root.querySelector<HTMLButtonElement>('#tenants-tab')!.click(); await flush();
    expect(getManagedTenants).toHaveBeenCalledWith({ keyword: '', page: 1, pageSize: 20 });
    expect([...root.querySelectorAll('th')].map(item => item.textContent)).toEqual(['租客姓名', '联系电话', '签约时间', '下一次租金支付时间']);
    expect(root.textContent).toContain('真实租客'); expect(root.textContent).toContain('138****1234');
    expect(root.textContent).toContain('2026/09/27'); expect(root.textContent).toContain('2026-10-01');
    expect(root.textContent).toContain('未登记'); expect(root.textContent).toContain('未生成租金账单');
  });

  it('搜索会去空格并重置分页，失败显示重试而非伪装空数据', async () => {
    const root = await render();
    const input = root.querySelector('input')!; input.value = ' 紫薇苑 '; input.dispatchEvent(new Event('input')); await nextTick();
    root.querySelector<HTMLButtonElement>('.btn-primary')!.click(); await flush();
    expect(getManagedProperties).toHaveBeenLastCalledWith({ keyword: '紫薇苑', page: 1, pageSize: 20 });
    vi.mocked(getManagedTenants).mockRejectedValueOnce(new Error('network'));
    root.querySelector<HTMLButtonElement>('#tenants-tab')!.click(); await flush();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('数据加载失败');
    expect(root.textContent).not.toContain('暂无符合条件的租客');
    root.querySelector<HTMLButtonElement>('.load-error button')!.click(); await flush();
    expect(root.textContent).toContain('真实租客');
  });

  it('退休储备路由且新页面受独立菜单权限控制', () => {
    expect(asyncRoutes.some(route => /reserve/.test(route.path))).toBe(false);
    expect(asyncRoutes.find(route => route.path === '/house/property-management')?.meta?.permission).toBe('house:property_management');
  });
});
