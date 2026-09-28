import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick, reactive, type App } from 'vue';
import RentFormView from '@/views/house/RentFormView.vue';
import { createRentalSet, getRentalSet, updateRentalSet } from '@/api/rental';
import { rentalFormErrors, rentalLandlordFields } from '@/utils/rental-form';

const { route, replace, push } = vi.hoisted(() => ({ route: { params: { id: '1' }, query: {}, fullPath: '/house/rent/edit/1' }, replace: vi.fn(), push: vi.fn() }));
vi.mock('vue-router', () => ({ useRoute: () => reactive(route), useRouter: () => ({ replace, push }) }));
vi.mock('element-plus', () => ({ ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
vi.mock('@/stores/user', () => ({ useUserStore: () => ({ userInfo: { employeeId: 7, storeIds: [1] } }) }));
vi.mock('@/stores/dict', () => ({ useDictStore: () => ({ ensureLoaded: vi.fn().mockResolvedValue(undefined), getItems: () => [] }) }));
vi.mock('@/api/rental', () => ({ getRentalSet: vi.fn(), updateRentalSet: vi.fn(), createRentalSet: vi.fn(), getRentalDistricts: vi.fn().mockResolvedValue([]) }));
vi.mock('@/api/community', () => ({ getCommunities: vi.fn().mockResolvedValue({ list: [] }) }));
vi.mock('@/api/organization', () => ({ getStores: vi.fn().mockResolvedValue([]), getEmployees: vi.fn().mockResolvedValue({ list: [] }) }));
vi.mock('@/api/wizard', () => ({ uploadImage: vi.fn() }));

const base: any = { id: 1, code: 'ZJ-TEST', creatorId: 7, bizType: 'entire', communityId: 1,
  address: '测试地址', building: '1', unit: '1', roomNo: '101', layout: '一室一厅', buildingArea: 50,
  landlordName: '测试房东', landlordPhone: '13800000000', landlordRent: 1000, landlordDeposit: 500,
  leaseStart: '2026-01-01', leaseEnd: '2027-01-01', landlordPaymentMethod: 'monthly',
  canViewLandlordInfo: true, isManaged: false, storeId: 1, rooms: [], status: 'vacant' };
let app: App | undefined;
const flush = async () => { await new Promise(resolve => setTimeout(resolve, 0)); await nextTick(); };
beforeEach(() => {
  vi.clearAllMocks(); route.params.id = '1'; route.fullPath = '/house/rent/edit/1';
  vi.mocked(getRentalSet).mockResolvedValue({ ...base });
  vi.mocked(updateRentalSet).mockImplementation(async (_id, data) => ({ ...base, ...data }));
  vi.mocked(createRentalSet).mockResolvedValue({ ...base, id: 9, isManaged: true });
});
afterEach(() => { app?.unmount(); document.body.innerHTML = ''; });
async function render() {
  const root = document.createElement('div'); document.body.appendChild(root);
  app = createApp(RentFormView);
  app.component('ElForm', defineComponent({ setup(_props, { slots, expose }) {
    expose({ validate: () => Promise.resolve(true) }); return () => h('form', slots.default?.());
  } }));
  for (const name of ['ElRow', 'ElCol']) app.component(name, { template: '<div><slot /></div>' });
  app.component('ElTable', { template: '<div><slot /></div>' });
  app.component('ElTableColumn', { render: () => h('span') });
  app.component('ElFormItem', { props: ['label'], template: '<div :data-label="label">{{ label }}<slot /></div>' });
  app.component('ElInput', { props: ['modelValue'], emits: ['update:modelValue'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' });
  app.component('ElSelect', { props: ['modelValue'], emits: ['update:modelValue', 'change'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.placeholder === \'选择小区\' ? Number($event.target.value) : $event.target.value)" @change="$emit(\'change\', $event.target.value)" />' });
  app.config.warnHandler = () => {}; app.mount(root); await flush(); return root;
}
const button = (root: HTMLElement, label: string) => [...root.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent === label)!;

describe('租房托管表单', () => {
  it('首次切换合租默认三间，分别为主卧、次卧、小卧并随房源保存', async () => {
    const root = await render(); button(root, '合租').click(); await flush();
    button(root, '保存').click(); await flush();
    const payload = vi.mocked(updateRentalSet).mock.calls[0][1];
    expect(payload.rooms?.map(room => [room.roomNo, room.roomType])).toEqual([['1', 'master'], ['2', 'second'], ['3', 'small']]);
    expect(payload.rooms?.every(room => typeof room.privateBathroom === 'boolean' && typeof room.balcony === 'boolean')).toBe(true);
  });
  it('首次跟进后显示托管；保存成功变取消托管，取消只写托管状态', async () => {
    const root = await render();
    expect(root.querySelector('.landlord-section')?.textContent).toContain('首次跟进');
    button(root, '托管').click(); await flush();
    expect(updateRentalSet).toHaveBeenCalledWith('1', expect.objectContaining({ isManaged: true, landlordName: '测试房东' }));
    expect(button(root, '取消托管')).toBeTruthy(); expect(push).not.toHaveBeenCalled();
    button(root, '取消托管').click(); await flush();
    expect(updateRentalSet).toHaveBeenLastCalledWith('1', { isManaged: false });
    expect(button(root, '托管')).toBeTruthy();
  });

  it('请求失败保留状态，重复点击只提交一次，刷新恢复已保存状态', async () => {
    vi.mocked(getRentalSet).mockResolvedValue({ ...base, isManaged: true });
    vi.mocked(updateRentalSet).mockRejectedValueOnce(new Error('失败'));
    const root = await render(); const cancel = button(root, '取消托管');
    cancel.click(); cancel.click(); await flush();
    expect(updateRentalSet).toHaveBeenCalledTimes(1);
    expect(button(root, '取消托管')).toBeTruthy();
    button(root, '取消托管').click(); await flush(); expect(button(root, '托管')).toBeTruthy();
  });

  it('他人不显示私有区块，保存基本信息不提交隐藏字段或覆盖房东资料', async () => {
    const hidden = { ...base, canViewLandlordInfo: false };
    for (const key of rentalLandlordFields) delete hidden[key];
    vi.mocked(getRentalSet).mockResolvedValue(hidden);
    const root = await render();
    expect(root.querySelector('.landlord-section')).toBeNull();
    button(root, '保存').click(); await flush();
    const payload = vi.mocked(updateRentalSet).mock.calls[0][1];
    for (const key of rentalLandlordFields) expect(payload).not.toHaveProperty(key);
    expect(payload.address).toBe('测试地址');
    expect(rentalFormErrors(hidden, '', '', false)).toEqual({});
  });

  it('新房源托管后进入该房源编辑页，继续操作不会再次新建', async () => {
    route.params.id = ''; route.fullPath = '/house/rent/create';
    const root = await render();
    const fill = (placeholder: string, value: string) => {
      const input = root.querySelector<HTMLInputElement>(`input[placeholder="${placeholder}"]`)!;
      input.value = value; input.dispatchEvent(new Event('input'));
    };
    fill('请输入房东姓名', '测试房东'); fill('请输入房东电话', '13800000000');
    fill('选择缴费方式', 'monthly'); fill('请输入承租价', '1000');
    fill('选择小区', '1');
    fill('选择小区后自动带出', '测试地址');
    fill('请输入面积', '50');
    fill('请选择或输入户型', '1室1厅1卫');
    root.querySelector<HTMLInputElement>('input[placeholder="请选择或输入户型"]')!.dispatchEvent(new Event('change'));
    for (const label of ['楼栋', '单元', '房号']) {
      const input = root.querySelector<HTMLInputElement>(`[data-label="${label}"] input`)!;
      input.value = '1'; input.dispatchEvent(new Event('input'));
    }
    button(root, '一年').click(); await flush();
    vi.mocked(getRentalSet).mockResolvedValue({ ...base, id: 9, isManaged: true });
    replace.mockImplementation(async path => {
      const current = reactive(route); current.params.id = '9'; current.fullPath = path;
    });
    button(root, '托管').click(); await flush();
    expect(createRentalSet).toHaveBeenCalledTimes(1);
    expect(createRentalSet).toHaveBeenCalledWith(expect.objectContaining({ isManaged: true }));
    expect(replace).toHaveBeenCalledWith('/house/rent/edit/9');
    button(root, '取消托管').click(); await flush();
    expect(updateRentalSet).toHaveBeenLastCalledWith('9', { isManaged: false });
    expect(createRentalSet).toHaveBeenCalledTimes(1);
  });
});
