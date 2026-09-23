import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, nextTick, type App } from 'vue';
import ReserveClientView from '@/views/house/ReserveClientView.vue';
import { convertReserveClient, getReserveClients } from '@/api/reserve-client';

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('element-plus', () => ({ ElMessage: { success: vi.fn(), warning: vi.fn() } }));
vi.mock('@/stores/dict', () => ({
  useDictStore: () => ({
    ensureLoaded: vi.fn().mockResolvedValue(undefined),
    getItems: () => [],
    getLabel: () => '',
  }),
}));
vi.mock('@/api/reserve-client', () => ({
  getReserveClients: vi.fn()
    .mockResolvedValueOnce({
      list: [{ id: 5, clientName: '测试客户', clientMobile: '13800138000', status: 'not_rented', demandType: 'rent' }],
      total: 1,
    })
    .mockResolvedValue({ list: [], total: 0 }),
  convertReserveClient: vi.fn().mockResolvedValue({ customerId: 12, status: 'converted' }),
  addReserveClientFollowUp: vi.fn(),
}));

let app: App | undefined;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('储备客源转正式客户', () => {
  it('不填写合同信息也能提交转换', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    app = createApp(ReserveClientView);
    app.directive('permission', {});
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

    expect(getReserveClients).toHaveBeenCalled();
    const convert = [...root.querySelectorAll('button')].find(button => button.textContent === '转正式客户');
    expect(convert).toBeDefined();
    convert!.click();
    await nextTick();
    expect(root.textContent).toContain('不会自动生成合同');

    const confirm = [...root.querySelectorAll('button')].find(button => button.textContent === '确认转为正式客户');
    confirm!.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(convertReserveClient).toHaveBeenCalledWith(5, {});
    expect(getReserveClients).toHaveBeenCalledTimes(2);
    expect(root.textContent).not.toContain('测试客户');
  });
});
