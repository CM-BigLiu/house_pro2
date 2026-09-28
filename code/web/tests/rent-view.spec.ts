import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, nextTick, type App } from 'vue';
import RentView from '@/views/house/RentView.vue';
import { createRentalAppointment, followUpRentalAppointment, getRentalAppointmentSigningContext, getRentalAppointments,
  getRentalSets, recommendRentalAppointment, signRentalAppointment, type RentalAppointment } from '@/api/rental';
import { getCustomers, type Customer } from '@/api/customer';

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }));

vi.mock('vue-router', () => ({ useRouter: () => ({ push: routerPush }) }));
vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), info: vi.fn() },
  ElMessageBox: { confirm: vi.fn() },
}));
vi.mock('@/stores/dict', () => ({
  useDictStore: () => ({
    ensureLoaded: vi.fn().mockResolvedValue(undefined),
    getLabel: (_type: string, value?: string) => value || '',
    getItems: (type: string) => type === 'payment_method'
      ? [{ value: 'quarterly', label: '季付' }]
      : type === 'lease_term'
        ? [{ value: 'one_year', label: '1年' }]
        : [],
  }),
}));
vi.mock('@/stores/user', () => ({ useUserStore: () => ({ name: '超级管理员' }) }));
vi.mock('@/api/checkout', () => ({ createCheckout: vi.fn() }));
vi.mock('@/api/customer', () => ({ getCustomers: vi.fn() }));
vi.mock('@/api/organization', () => ({
  getStores: vi.fn().mockResolvedValue([{ id: 1, name: '张江店' }]),
  getEmployees: vi.fn().mockResolvedValue({
    list: [{ id: 4, name: '李芳' }, { id: 15, name: '王晓明' }],
    total: 2,
  }),
}));
vi.mock('@/api/rental', () => ({
  getRentalSets: vi.fn(),
  deleteRentalSet: vi.fn(),
  getRentalAppointments: vi.fn().mockResolvedValue({ list: [], total: 0 }),
  createRentalAppointment: vi.fn(),
  followUpRentalAppointment: vi.fn(),
  getRentalAppointmentSigningContext: vi.fn(),
  recommendRentalAppointment: vi.fn(),
  signRentalAppointment: vi.fn(),
}));

let app: App | undefined;

beforeEach(() => {
  vi.mocked(getCustomers).mockReset().mockResolvedValue({
    list: [{ id: 42, name: '可见客户', mobile: '13800001234' } as Customer], total: 1,
  });
  vi.mocked(createRentalAppointment).mockResolvedValue({ id: 10 } as any);
  vi.mocked(getRentalAppointments).mockResolvedValue({ list: [], total: 0 });
  vi.mocked(getRentalAppointmentSigningContext).mockResolvedValue({ bizType: 'entire', rooms: [] });
  vi.mocked(followUpRentalAppointment).mockResolvedValue({ id: 1 } as any);
  vi.mocked(signRentalAppointment).mockResolvedValue({ id: 5, status: 'signed' } as any);
  vi.mocked(recommendRentalAppointment).mockResolvedValue({ id: 6 } as any);
  vi.mocked(getRentalSets).mockResolvedValue({
    list: [
      {
        id: 1,
        code: 'ZJ001',
        bizType: 'entire',
        communityId: 1,
        communityName: '张江汤臣豪园',
        address: '张江路688号',
        building: '12',
        unit: '1',
        roomNo: '802',
        layout: '两室一厅',
        buildingArea: 85,
        decoration: 'fine',
        landlordRent: 4500,
        rent: 6200,
        status: 'rented',
        storeId: 1,
        landlordId: 1,
        landlordName: '陈建国',
        landlordPhone: '13800001111',
        tenantName: '李明',
        tenantPhone: '13800002222',
        tenantLeaseEnd: '2027-01-14',
        tenantPaymentMethod: 'quarterly',
        leaseTerm: 'one_year',
        operationStatus: 'normal',
        businessStatus: 'pending_collection',
        images: ['data:image/png;base64,aGVsbG8='],
        salesmanId: 4,
        housekeeperId: 15,
        createdAt: '2026-09-01',
        rooms: [],
      },
      {
        id: 2,
        code: 'ZJ002',
        bizType: 'shared',
        communityId: 1,
        communityName: '天赋领墅',
        address: '李冰路800弄',
        building: '2',
        unit: '2',
        roomNo: '601',
        layout: '三室两厅',
        landlordRent: 5000,
        status: 'rented',
        storeId: 1,
        landlordName: '李先生',
        landlordPhone: '13900001006',
        createdAt: '2026-09-02',
        rooms: [
          { id: 21, setId: 2, roomNo: 'A', roomType: '主卧独卫', rentPrice: 2300, status: 'vacant', createdAt: '2026-09-02' },
          { id: 22, setId: 2, roomNo: 'B', roomType: '次卧', rentPrice: 2000, status: 'rented', tenantName: '周女士', leaseEnd: '2027-03-12', createdAt: '2026-09-02' },
        ],
      },
    ],
    total: 2,
  });
});

afterEach(() => {
  app?.unmount();
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

async function render() {
  const root = document.createElement('div');
  document.body.append(root);
  app = createApp(RentView);
  app.directive('permission', {});
  app.component('ElDialog', {
    props: ['modelValue', 'title'],
    template: '<section v-if="modelValue" :aria-label="title"><slot /><slot name="footer" /></section>',
  });
  app.component('ElSelect', {
    props: ['modelValue', 'remoteMethod', 'ariaLabel', 'disabled'],
    emits: ['update:modelValue', 'change'],
    template: `<div><input v-if="remoteMethod" :aria-label="ariaLabel === '推荐房源' ? '搜索房源' : '搜索客户'" @input="remoteMethod($event.target.value)" />
      <select :aria-label="ariaLabel || '约看客户'" :disabled="disabled" :value="modelValue || ''" @change="$emit('update:modelValue', ariaLabel === '付款方式' ? $event.target.value : ($event.target.value ? Number($event.target.value) : undefined)); $emit('change', Number($event.target.value))">
        <option value="">请选择客户</option><slot />
      </select><slot name="footer" /></div>`,
  });
  app.component('ElOption', {
    props: ['value', 'label', 'disabled'],
    template: '<option :value="value" :disabled="disabled">{{ label }}</option>',
  });
  app.component('ElForm', { props: ['model', 'labelPosition'], template: '<form :data-label-position="labelPosition" @submit.prevent><slot /></form>' });
  app.component('ElFormItem', { props: ['label'], template: '<div class="el-form-item"><label>{{ label }}<slot /></label></div>' });
  app.component('ElInput', {
    props: ['modelValue', 'type', 'placeholder', 'maxlength'], emits: ['update:modelValue'],
    template: '<input :type="type || \'text\'" :placeholder="placeholder" :maxlength="maxlength" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  });
  app.component('ElDatePicker', {
    props: ['modelValue', 'ariaLabel'], emits: ['update:modelValue'],
    template: '<input type="date" :aria-label="ariaLabel" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  });
  app.config.warnHandler = () => {};
  app.mount(root);
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
  return root;
}

describe('租房管理页面', () => {
  it('同时展示整租、合租房间，并对联系电话脱敏', async () => {
    const root = await render();

    expect(root.textContent).toContain('租房管理');
    expect(root.textContent).toContain('张江汤臣豪园');
    expect(root.textContent).toContain('12栋1单元802');
    expect(root.textContent).toContain('A房 · 主卧独卫');
    expect(root.textContent).toContain('138****2222');
    expect(root.textContent).not.toContain('13800002222');
  });

  it('只保留租房业务并使用列表视图展示', async () => {
    const root = await render();

    expect(root.textContent).not.toContain('二手房');
    expect(root.textContent).not.toContain('房东信息');
    for (const label of ['基本信息', '房屋用途', '房源状态', '发布时间', '维护人', '操作']) {
      expect(root.textContent).toContain(label);
    }
    expect(root.querySelector('.resource-table')).not.toBeNull();
    expect(root.querySelector('.rental-card')).toBeNull();
    expect(root.querySelector<HTMLImageElement>('.house-cover img')?.src).toContain('data:image/png;base64,aGVsbG8=');
  });

  it('提供参考页中的多条件筛选和运营字段', async () => {
    const root = await render();

    for (const label of ['门店/支队', '房号', '房源码', '业务员', '管家', '缴费方式', '租赁期限', '托管状态', '业务状态']) {
      expect(root.textContent).toContain(label);
    }
    expect(root.textContent).toContain('张江店');
    expect(root.textContent).toContain('李芳');
    expect(root.textContent).toContain('王晓明');
    expect(root.textContent).toContain('待收款');
  });

  it('精简多余视图和批量操作，并提供北京区域筛选', async () => {
    const root = await render();

    expect(root.textContent).not.toContain('默认视图');
    expect(root.textContent).not.toContain('公司视图');
    expect(root.textContent).not.toContain('我的预录入房源');
    expect(root.textContent).not.toContain('批量录入租客');
    expect(root.querySelector('.batch-bar')).toBeNull();
    for (const district of ['东城区', '朝阳区', '海淀区', '通州区', '延庆区']) {
      expect(root.textContent).toContain(district);
    }
    expect(root.querySelector('.district-chip.active')?.textContent).toContain('全部区域');
  });

  it('双击房源行进入详情，并展示约看入口', async () => {
    const root = await render();
    const row = root.querySelector<HTMLElement>('.resource-row');

    expect(root.textContent).toContain('约看记录');
    expect(root.querySelector('.appointment-link')?.textContent).toContain('约看');
    row?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(routerPush).toHaveBeenCalledWith('/house/rent/detail/2');
  });

  it('保存下拉选择的客户 ID，并在下次约看时清空选择', async () => {
    const root = await render();
    root.querySelector<HTMLButtonElement>('.appointment-link')!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const dialog = root.querySelector<HTMLElement>('section[aria-label="创建约看"]')!;
    const select = dialog.querySelector<HTMLSelectElement>('select')!;
    expect(getCustomers).toHaveBeenCalledWith({ keyword: '', page: 1, pageSize: 20 });
    expect(select.textContent).toContain('可见客户');
    expect(select.textContent).toContain('138****1234');
    expect(select.textContent).not.toContain('13800001234');
    select.value = '42';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await nextTick();
    dialog.querySelector<HTMLButtonElement>('.btn-primary')!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(createRentalAppointment).toHaveBeenCalledWith(expect.objectContaining({ rentalSetId: 2, customerId: 42 }));

    root.querySelector<HTMLButtonElement>('.appointment-link')!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(root.querySelector<HTMLSelectElement>('select[aria-label="约看客户"]')!.value).toBe('');
  });

  it('支持加载下一页可见客户，不把选项截断在第一页', async () => {
    vi.mocked(getCustomers).mockResolvedValueOnce({
      list: Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: `客户${i + 1}`, mobile: '' } as Customer)), total: 21,
    }).mockResolvedValueOnce({ list: [{ id: 21, name: '下一页客户', mobile: '' } as Customer], total: 21 });
    const root = await render();
    root.querySelector<HTMLButtonElement>('.appointment-link')!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.querySelector<HTMLButtonElement>('.customer-load-more')!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getCustomers).toHaveBeenLastCalledWith({ keyword: '', page: 2, pageSize: 20 });
    expect(root.querySelector('select[aria-label="约看客户"]')!.textContent).toContain('下一页客户');
    expect(root.querySelector('.customer-load-more')).toBeNull();
  });

  it('搜索时忽略迟到的旧结果，防止覆盖最新客户列表', async () => {
    const root = await render();
    root.querySelector<HTMLButtonElement>('.appointment-link')!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    let resolveOld!: (value: { list: Customer[]; total: number }) => void;
    vi.mocked(getCustomers).mockReturnValueOnce(new Promise((resolve) => { resolveOld = resolve; }))
      .mockResolvedValueOnce({ list: [{ id: 51, name: '新结果', mobile: '' } as Customer], total: 1 });
    const search = root.querySelector<HTMLInputElement>('input[aria-label="搜索客户"]')!;
    search.value = '旧';
    search.dispatchEvent(new Event('input'));
    search.value = '新';
    search.dispatchEvent(new Event('input'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    resolveOld({ list: [{ id: 52, name: '旧结果', mobile: '' } as Customer], total: 1 });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getCustomers).toHaveBeenLastCalledWith({ keyword: '新', page: 1, pageSize: 20 });
    const options = root.querySelector('select[aria-label="约看客户"]')!.textContent;
    expect(options).toContain('新结果');
    expect(options).not.toContain('旧结果');
  });
});

describe('约看记录业务操作', () => {
  const record = { id: 5, rentalSetId: 2, customerId: 42, customerName: '可见客户', propertyName: '测试房源',
    propertyCode: 'BJ004', scheduledAt: '2026-09-28T10:00:00Z', responsibleEmployeeName: '经纪人', status: 'scheduled' } as RentalAppointment;

  async function openRecords() {
    vi.mocked(getRentalAppointments).mockResolvedValue({ list: [record], total: 1 });
    const root = await render();
    [...root.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === '约看记录')!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    return root;
  }

  it('将跟进内容保存到当前约看记录', async () => {
    const root = await openRecords();
    [...root.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === '约看结束 / 跟进')!.click();
    await nextTick();
    const dialog = root.querySelector('section[aria-label="约看后跟进"]')!;
    const input = dialog.querySelector<HTMLTextAreaElement>('textarea')!;
    input.value = '客户希望月底入住';
    input.dispatchEvent(new Event('input'));
    dialog.querySelector<HTMLButtonElement>('.btn-primary')!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(followUpRentalAppointment).toHaveBeenCalledWith(5, '客户希望月底入住');
    expect(root.querySelector('section[aria-label="约看后跟进"]')).toBeNull();
  });

  it('签约提交租期和金额，并使用原约看的客户', async () => {
    const root = await openRecords();
    [...root.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === '成交')!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const dialog = root.querySelector('section[aria-label="普租成交"]')!;
    expect(dialog.querySelector('form')?.getAttribute('data-label-position')).toBe('top');
    expect(dialog.querySelectorAll('.sign-form-section')).toHaveLength(2);
    expect(dialog.textContent).toContain('合同与收款信息');
    const dates = dialog.querySelectorAll<HTMLInputElement>('input[type="date"]');
    dates[0].value = '2026-10-01'; dates[0].dispatchEvent(new Event('input'));
    dates[1].value = '2027-09-30'; dates[1].dispatchEvent(new Event('input'));
    const rent = dialog.querySelector<HTMLInputElement>('input[type="number"]')!;
    rent.value = '6000'; rent.dispatchEvent(new Event('input'));
    const payment = dialog.querySelector<HTMLSelectElement>('select')!;
    payment.value = 'quarterly'; payment.dispatchEvent(new Event('change'));
    for (const [label, value] of [['业主姓名', '业主'], ['业主身份证', '110101199001011234'], ['业主通讯地址', '业主地址'], ['业主电话', '13800001111'], ['房屋地址', '测试房源地址'], ['客户身份证', '110101199001011235'], ['客户通讯地址', '客户地址']]) {
      const field = [...dialog.querySelectorAll('label')].find(el => el.textContent?.trim() === label)!.querySelector<HTMLInputElement>('input')!;
      field.value = value; field.dispatchEvent(new Event('input'));
    }
    dialog.querySelector<HTMLButtonElement>('.btn-primary')!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(signRentalAppointment).toHaveBeenCalledWith(5, expect.objectContaining({ leaseStart: '2026-10-01', leaseEnd: '2027-09-30',
      rent: 6000, deposit: 0, paymentMethod: 'quarterly', tenantName: undefined, tenantPhone: undefined }));
  });

  it('再次推荐保留客户并提交新选房源', async () => {
    const root = await openRecords();
    [...root.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === '再次推荐')!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const dialog = root.querySelector('section[aria-label="再次推荐"]')!;
    const customer = dialog.querySelector<HTMLSelectElement>('select[aria-label="约看客户"]')!;
    expect(customer.disabled).toBe(true);
    expect(customer.value).toBe('42');
    const rental = dialog.querySelector<HTMLSelectElement>('select[aria-label="推荐房源"]')!;
    rental.value = '1'; rental.dispatchEvent(new Event('change'));
    await nextTick();
    dialog.querySelector<HTMLButtonElement>('.btn-primary')!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(recommendRentalAppointment).toHaveBeenCalledWith(5, expect.objectContaining({ rentalSetId: 1, customerId: 42 }));
    expect(createRentalAppointment).not.toHaveBeenCalled();
  });
});
