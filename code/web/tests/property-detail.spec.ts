import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, type App } from 'vue';
import PropertyDetailView from '@/views/house/PropertyDetailView.vue';
import { getHouseDetail } from '@/api/property-detail';

const { route } = vi.hoisted(() => ({ route: { name: 'RentDetail', params: { id: '2' }, query: {} as Record<string, string>, fullPath: '/house/rent/detail/2' } }));
vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/api/property-detail', () => ({ getHouseDetail: vi.fn() }));
vi.mock('@/stores/dict', () => ({ useDictStore: () => ({ ensureLoaded: vi.fn(), getLabel: (_: string, value: string) => value || '—' }) }));
let app: App;
const fixture = () => ({ property: { id: 2, code: 'ZJ002', communityName: '测试小区', bizType: 'shared', rooms: [{ id: 101, roomNo: 'A', tenantName: 'A租客' }, { id: 102, roomNo: 'B', tenantName: 'B租客' }] }, roomId: null as number | null, approvals: [], checkouts: [], operations: [] });
async function mount() {
  const root = document.createElement('div'); document.body.append(root);
  app = createApp(PropertyDetailView); app.directive('loading', {});
  app.component('ElEmpty', { props: ['description'], template: '<p>{{ description }}</p>' });
  app.component('RouterLink', { template: '<a><slot /></a>' });
  app.mount(root); await new Promise(resolve => setTimeout(resolve, 0)); return root;
}
beforeEach(() => { route.name = 'RentDetail'; route.query = {}; vi.clearAllMocks(); });
afterEach(() => { app?.unmount(); document.body.innerHTML = ''; });
describe('read-only property details', () => {
  it('shows all shared rooms and honest empty history states', async () => {
    vi.mocked(getHouseDetail).mockResolvedValue(fixture()); const root = await mount();
    expect(root.textContent).toContain('A租客'); expect(root.textContent).toContain('B租客');
    expect(root.textContent).toContain('暂无状态审批记录'); expect(root.textContent).toContain('暂无关联退租记录');
    expect(root.querySelector('input')).toBeNull();
  });
  it('selected room has its own details and workflow endpoint filter', async () => {
    route.query = { roomId: '101' }; const result = fixture(); result.roomId = 101;
    vi.mocked(getHouseDetail).mockResolvedValue(result); const root = await mount();
    expect(getHouseDetail).toHaveBeenCalledWith('rent', 2, 101);
    expect(root.textContent).toContain('A租客'); expect(root.textContent).not.toContain('B租客');
    expect(root.textContent).toContain('合租房间详情');
  });
  it('sale renders real approval result and remark', async () => {
    route.name = 'SaleDetail';
    vi.mocked(getHouseDetail).mockResolvedValue({ ...fixture(), property: { id: 2, code: 'S002', ownerName: '业主甲', salePrice: 1000000 }, approvals: [{ id: 3, entityType: 'sale_property', entityId: 2, action: 'change_status', fromStatus: 'pre_publish', toStatus: 'published', result: 'approved', operatorId: 1, remark: '资料齐全', createdAt: '2026-09-10' }] });
    const root = await mount(); expect(root.textContent).toContain('业主甲');
    expect(root.textContent).toContain('待发布 → 已发布'); expect(root.textContent).toContain('资料齐全');
    expect(root.textContent).not.toContain('退租与清算');
  });
  it('does not leave a blank page when the detail request fails', async () => {
    vi.mocked(getHouseDetail).mockRejectedValue(new Error('403')); const root = await mount();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('详情加载失败');
    expect([...root.querySelectorAll('button')].some(button => button.textContent === '重试')).toBe(true);
  });
});
