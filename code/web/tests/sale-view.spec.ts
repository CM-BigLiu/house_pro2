import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, nextTick, type App } from 'vue';
import SaleView from '@/views/house/SaleView.vue';
import { getSaleProperties } from '@/api/sale';

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn() },
  ElMessageBox: { confirm: vi.fn() },
}));
vi.mock('@/stores/dict', () => ({
  useDictStore: () => ({
    ensureLoaded: vi.fn().mockResolvedValue(undefined),
    getLabel: (_type: string, value: string) => value,
  }),
}));
vi.mock('@/api/sale', () => ({
  getSaleProperties: vi.fn(),
  deleteSaleProperty: vi.fn(),
  changeSaleStatus: vi.fn(),
  exportSalePage: vi.fn(),
}));

let app: App | undefined;

beforeEach(() => {
  vi.mocked(getSaleProperties).mockResolvedValue({
    list: [{
      id: 1,
      code: 'SJ001',
      title: '随便起个名',
      communityName: '紫薇苑',
      propertyType: '住宅',
      building: '8',
      unit: '2',
      floor: '18',
      roomNo: '1801',
      layoutRooms: 3,
      layoutHalls: 2,
      layoutBathrooms: 1,
      layoutBalconies: 1,
      buildingArea: 80,
      orientation: 'south',
      decoration: 'fine',
      elevator: 'yes',
      totalPrice: 3000000,
      unitPrice: 37500,
      sourceChannel: 'other',
      ownerName: '代大',
      ownerPhone: '13999999999',
      storeId: 1,
      status: 'pre_publish',
      verified: false,
      isCitywideSale: false,
      createdAt: '2026-09-26',
    }],
    total: 1,
  });
});

afterEach(() => {
  app?.unmount();
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('售房管理列表', () => {
  it('在小区后显示带单位的楼栋、单元和房号', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    app = createApp(SaleView);
    app.directive('permission', {});
    app.config.warnHandler = () => {};
    app.mount(root);
    await new Promise(resolve => setTimeout(resolve, 0));
    await nextTick();

    expect(root.textContent).toContain('紫薇苑 · 8号楼2单元1801');
  });
});
