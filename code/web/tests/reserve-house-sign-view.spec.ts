import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, nextTick, type App } from 'vue';
import ReserveHouseView from '@/views/house/ReserveHouseView.vue';
import { getCommunities } from '@/api/community';

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('element-plus', () => ({ ElMessage: { success: vi.fn(), warning: vi.fn() } }));
vi.mock('@/stores/dict', () => ({
  useDictStore: () => ({ ensureLoaded: vi.fn(), getLabel: () => '' }),
}));
vi.mock('@/api/community', () => ({
  getCommunities: vi.fn().mockResolvedValue({ list: [], total: 0 }),
}));
vi.mock('@/api/organization', () => ({ getEmployees: vi.fn() }));
vi.mock('@/api/reserve-property', () => ({
  getReserveProperties: vi.fn().mockResolvedValue({
    list: [{
      id: 8, reserveType: 'rent', title: '测试储备房源', communityId: 3,
      communityName: '已有小区', address: '已有地址', roomNo: '', layout: '2室1厅',
      ownerName: '', ownerPhone: '', ownerQuote: 3000, status: 'not_rented',
      diskType: 'public', sourceChannel: '', source: '', storeId: 1, details: {},
    }],
    total: 1,
  }),
  signReserveProperty: vi.fn(),
  transferReserveProperty: vi.fn(),
}));

let app: App | undefined;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('储备房源拿房签约弹窗', () => {
  it('只显示储备房源中缺失的签约必填资料', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    app = createApp(ReserveHouseView);
    app.directive('permission', {});
    app.directive('loading', {});
    app.config.warnHandler = () => {};
    app.component('ElDialog', {
      props: ['modelValue'],
      template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>',
    });
    app.component('ElAlert', { props: ['title'], template: '<div>{{ title }}</div>' });
    app.component('ElForm', { template: '<form><slot /></form>' });
    app.component('ElFormItem', { props: ['label'], template: '<div :data-label="label"><slot /></div>' });
    app.mount(root);
    await new Promise(resolve => setTimeout(resolve, 0));
    await nextTick();

    const open = [...root.querySelectorAll('button')].find(button => button.textContent === '拿房签约');
    open!.click();
    await nextTick();

    expect(root.textContent).toContain('还需补充：房号、房东姓名');
    expect(root.querySelector('[data-label="房号"]')).not.toBeNull();
    expect(root.querySelector('[data-label="房东姓名"]')).not.toBeNull();
    expect(root.querySelector('[data-label="小区"]')).toBeNull();
    expect(root.querySelector('[data-label="地址"]')).toBeNull();
    expect(root.querySelector('[data-label="户型"]')).toBeNull();
    expect(root.querySelector('[data-label="房东押金"]')).not.toBeNull();
    expect(getCommunities).not.toHaveBeenCalled();
  });
});
