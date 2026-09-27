import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, nextTick, type App } from 'vue';
import CustomerView from '@/views/house/CustomerView.vue';
import CustomerWorkflowDialog from '@/components/CustomerWorkflowDialog.vue';
import { getCustomers } from '@/api/customer';
import { createCustomerAppointment, getCustomerPropertyOptions, getCustomerSigningContext, getCustomerWorkflowContext, signCustomer, terminateCustomerContract } from '@/api/deal';
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('vue-router', () => ({ useRouter: () => ({ push }), useRoute: () => ({ query: {} }) }));
vi.mock('@/api/customer', () => ({ getCustomers: vi.fn() }));
vi.mock('@/api/deal', () => ({ createCustomerAppointment: vi.fn(), getCustomerPropertyOptions: vi.fn(), getCustomerSigningContext: vi.fn(), getCustomerWorkflowContext: vi.fn(), signCustomer: vi.fn(), terminateCustomerContract: vi.fn() }));
vi.mock('@/stores/dict', () => ({ useDictStore: () => ({ ensureLoaded: vi.fn().mockResolvedValue(undefined), getItems: () => [{ label: '月付', value: 'monthly' }], getLabel: (_code: string, value: string) => value }) }));
vi.mock('@/stores/user', () => ({ useUserStore: () => ({ name: '测试经纪人' }) }));
const tenant = { id: 1, name: '租房测试客户', mobile: '138****1234', customerType: 'tenant', status: 'active', createdAt: '2026-09-27' };
const buyer = { ...tenant, id: 2, name: '买房测试客户', customerType: 'buyer' };
let app: App | undefined;
const flush = async () => { await new Promise(resolve => setTimeout(resolve, 0)); await nextTick(); };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCustomers).mockImplementation(async query => ({ list: [tenant, buyer].filter(row => !query?.customerType || row.customerType === query.customerType), total: query?.customerType ? 1 : 2 }));
  vi.mocked(getCustomerPropertyOptions).mockResolvedValue({ list: [{ id: 8, code: 'ZJ008', name: '测试房源' }], total: 1 });
  vi.mocked(getCustomerWorkflowContext).mockResolvedValue({ appointments: [{ id: 10, propertyCode: 'ZJ008', propertyName: '测试房源', scheduledAt: '2026-10-01T10:00:00Z', status: 'scheduled' }],
    contracts: [{ id: 3, contractCode: 'HT003', customerId: 1, customerName: tenant.name, propertyId: 8, propertyCode: 'ZJ008', propertyName: '测试房源', signedAt: '2026-09-27', bizType: 'rent', amount: 3000, deposit: 3000, responsibleEmployeeName: '测试经纪人', status: 'active' }] });
  vi.mocked(getCustomerSigningContext).mockResolvedValue({ bizType: 'entire', rooms: [] });
});
afterEach(() => { app?.unmount(); document.body.innerHTML = ''; });
async function mount(component: any, props: any = {}) {
  const root = document.createElement('div'); document.body.append(root); app = createApp(component, props);
  app.directive('loading', {}); app.directive('permission', {}); app.component('MoneyUppercase', { template: '<span />' });
  app.component('ElDialog', { props: ['modelValue'], template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>' });
  app.component('ElForm', { template: '<form @submit.prevent><slot /></form>' });
  app.component('ElFormItem', { props: ['label'], template: '<div :data-label="label"><span>{{ label }}</span><slot /></div>' });
  app.component('ElInput', { props: ['modelValue', 'type', 'placeholder'], emits: ['update:modelValue'], template: '<input :value="modelValue" :type="type === `textarea` ? `text` : type" :placeholder="placeholder" @input="$emit(`update:modelValue`, $event.target.value)" />' });
  app.component('ElDatePicker', { props: ['modelValue'], emits: ['update:modelValue'], template: '<input :value="modelValue" @input="$emit(`update:modelValue`, $event.target.value)" />' });
  app.component('ElSelect', { props: ['modelValue', 'placeholder'], emits: ['update:modelValue', 'change'], template: '<select :value="modelValue" @change="$emit(`update:modelValue`, /^\\d+$/.test($event.target.value) ? Number($event.target.value) : $event.target.value); $emit(`change`, Number($event.target.value))"><option value="">{{ placeholder }}</option><slot /></select>' });
  app.component('ElOption', { props: ['label', 'value', 'disabled'], template: '<option :value="value" :disabled="disabled">{{ label }}</option>' });
  app.component('ElButton', { props: ['disabled'], template: '<button type="button" :disabled="disabled"><slot /></button>' });
  app.component('ElAlert', { props: ['title'], template: '<p>{{ title }}</p>' });
  for (const name of ['ElRow', 'ElCol']) app.component(name, { template: '<div><slot /></div>' });
  app.config.warnHandler = () => {}; app.mount(root); await flush(); return root;
}
function button(root: Element, label: string) { return [...root.querySelectorAll<HTMLButtonElement>('button')].find(el => el.textContent?.trim() === label)!; }
async function input(root: Element, label: string, value: string) {
  const el = root.querySelector<HTMLInputElement>(`[data-label="${label}"] input`)!; el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); await flush();
}
async function select(root: Element, label: string, value: string) {
  const el = root.querySelector<HTMLSelectElement>(`[data-label="${label}"] select`)!; el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); await flush();
}

describe('客户分类和约看、签约、解约', () => {
  it('租房和买房分类分别位于第二、第三位置，按类型查询且保留其他状态分类', async () => {
    const root = await mount(CustomerView);
    expect([...root.querySelectorAll('.status-tab')].map(el => el.textContent)).toEqual(['全部客户', '租房客户', '买房客户', '有效客户', '已成交', '已失效', '黑名单']);
    button(root, '租房客户').click(); await flush(); expect(getCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ customerType: 'tenant', status: '', page: 1 }));
    expect(root.querySelectorAll('tbody tr')).toHaveLength(1); expect(root.textContent).not.toContain(buyer.name);
    button(root, '买房客户').click(); await flush(); expect(getCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ customerType: 'buyer', status: '' }));
    button(root, '有效客户').click(); await flush(); expect(getCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ customerType: '', status: 'active' }));
    expect([...root.querySelector('tbody tr .operations')!.querySelectorAll('button')].map(el => el.textContent?.trim())).toEqual(['编辑', '约看', '签约', '解约']);
  });

  it('约看提交当前客户 ID、选中的房源和时间，不传入伪造负责人', async () => {
    const root = await mount(CustomerWorkflowDialog, { visible: true, customer: tenant, action: 'appointment' });
    expect(root.textContent).toContain('测试经纪人'); expect(getCustomerPropertyOptions).toHaveBeenCalledWith(1, { keyword: '', page: 1, pageSize: 20 });
    await select(root, '约看房源', '8'); await input(root, '约看时间', '2099-10-01T18:00:00');
    button(root, '确认约看').click(); await flush();
    expect(createCustomerAppointment).toHaveBeenCalledWith(1, expect.objectContaining({ propertyId: 8, scheduledAt: expect.stringContaining('2099-10-01') }));
    expect(vi.mocked(createCustomerAppointment).mock.calls[0][1]).not.toHaveProperty('responsibleEmployeeId');
  });

  it('签约先校验表单；买房金额按元提交，租房提交租期和付款方式', async () => {
    const root = await mount(CustomerWorkflowDialog, { visible: true, customer: tenant, action: 'sign' });
    button(root, '确认签约').click(); await flush(); expect(signCustomer).not.toHaveBeenCalled();
    await select(root, '关联约看', '10'); await input(root, '租期开始', '2026-10-01'); await input(root, '租期结束', '2027-09-30');
    await input(root, '月租金（元/月）', '3000.50'); await input(root, '押金（元）', '3000'); await select(root, '付款方式', 'monthly');
    button(root, '确认签约').click(); await flush();
    expect(signCustomer).toHaveBeenCalledWith(1, expect.objectContaining({ appointmentId: 10, rent: 3000.5, deposit: 3000, paymentMethod: 'monthly', leaseStart: '2026-10-01', leaseEnd: '2027-09-30' }));
    app!.unmount(); app = undefined; root.remove();
    const saleRoot = await mount(CustomerWorkflowDialog, { visible: true, customer: buyer, action: 'sign' });
    expect(saleRoot.textContent).toContain('成交总价（元，非万元）'); await select(saleRoot, '关联约看', '10'); await input(saleRoot, '成交总价（元，非万元）', '2200000');
    button(saleRoot, '确认签约').click(); await flush(); expect(signCustomer).toHaveBeenLastCalledWith(2, expect.objectContaining({ amount: 2200000 }));
  });

  it('解约选择生效合同并提交原因，租房明确提示审批和押金清算', async () => {
    const root = await mount(CustomerWorkflowDialog, { visible: true, customer: tenant, action: 'terminate' });
    expect(root.textContent).toContain('审批后释放房源'); expect(root.textContent).toContain('押金');
    button(root, '提交解约申请').click(); await flush(); expect(terminateCustomerContract).not.toHaveBeenCalled();
    await input(root, '解约日期', '2026-10-02'); await input(root, '解约原因', '工作调动');
    button(root, '提交解约申请').click(); await flush(); expect(terminateCustomerContract).toHaveBeenCalledWith(1, { dealId: 3, terminatedOn: '2026-10-02', reason: '工作调动' });
  });
});
