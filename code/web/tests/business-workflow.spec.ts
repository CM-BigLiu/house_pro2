import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, createApp, inject, nextTick, provide, type App } from 'vue';
import ManagedBusinessView from '@/views/finance/ManagedBusinessView.vue';
import CashFlowView from '@/views/finance/CashFlowView.vue';
import BusinessReviewView from '@/views/finance/BusinessReviewView.vue';
import BusinessPerformanceView from '@/views/finance/BusinessPerformanceView.vue';
import PropertyConfigurationDialog from '@/components/PropertyConfigurationDialog.vue';
import FreeRentPeriod from '@/components/FreeRentPeriod.vue';
import {
  getBusinessCalendar,
  getBusinessPerformance,
  getCompanyCashFlow,
  getBusinessSubmissions,
  getPropertyConfiguration,
  getConfigurationEmployees,
  reviewBusinessSubmission,
  savePropertyConfiguration,
  settleSchedule,
  settleCharge,
  submitBusiness,
} from '@/api/business';
import { ElMessageBox } from 'element-plus';
const { billRoute } = vi.hoisted(() => ({ billRoute: { query: {} as Record<string, string> } }));
vi.mock('vue-router', () => ({ useRoute: () => billRoute, useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('@/stores/dict', () => ({ useDictStore: () => ({ ensureLoaded: vi.fn().mockResolvedValue(undefined), getLabel: (_: string, value: string) => value || '未登记' }) }));

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), warning: vi.fn() },
  ElMessageBox: { prompt: vi.fn() },
}));
vi.mock('@/stores/user', () => ({
  useUserStore: () => ({ name: '报送人', permissions: [] }),
}));
vi.mock('@/api/business', async (original) => ({
  ...(await original<typeof import('@/api/business')>()),
  getBusinessCalendar: vi.fn(),
  getBusinessPerformance: vi.fn(),
  getCompanyCashFlow: vi.fn(),
  getBusinessSubmissions: vi.fn(),
  getPropertyConfiguration: vi.fn(),
  getConfigurationEmployees: vi.fn(),
  reviewBusinessSubmission: vi.fn(),
  savePropertyConfiguration: vi.fn(),
  settleSchedule: vi.fn(),
  settleCharge: vi.fn(),
  submitBusiness: vi.fn(),
}));
let app: App | undefined;
const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};
const row = {
  id: 3,
  dealId: 1,
  propertyId: 8,
  propertyName: '真实房屋地址',
  direction: 'pay' as const,
  sequence: 1,
  dueDate: '2026-10-01',
  periodStart: '2026-10-01',
  periodEnd: '2026-10-31',
  amount: 100,
  remaining: 100,
  settledAmount: 0,
};
beforeEach(() => {
  vi.resetAllMocks();
  billRoute.query = {};
  vi.mocked(getBusinessCalendar).mockResolvedValue({
    period: '2026-10',
    buckets: [
      {
        direction: 'pay',
        period: '2026-10',
        amount: 100,
        count: 1,
        list: [row],
      },
      {
        direction: 'receive',
        period: '2026-10',
        amount: 0,
        count: 0,
        list: [],
      },
    ],
    overdue: [],
  });
  vi.mocked(getPropertyConfiguration).mockResolvedValue({ items: [] });
  vi.mocked(getConfigurationEmployees).mockResolvedValue([{ id: 7, name: '真实员工', code: '000007' }]);
  vi.mocked(getCompanyCashFlow).mockResolvedValue({
    accounts: ['bank_ccb', 'bank_rural', 'wechat', 'cash', 'corporate'].map(
      (code, i) => ({
        code,
        name: code,
        balance: i + 100,
        openingBalance: 0,
        movement: i + 100,
      }),
    ),
    history: [],
    scope: 'company',
  });
  vi.mocked(getBusinessSubmissions).mockResolvedValue([
    {
      id: 5,
      type: 'management',
      period: '2026-10',
      employeeName: '报送人',
      status: 'submitted',
      reviewNote: '',
      createdAt: '2026-10-01',
      snapshot: {
        buckets: [],
        payments: [
          {
            id: 1,
            propertyName: row.propertyName,
            direction: 'pay',
            paymentDate: '2026-10-01',
            amount: 100,
            accountCode: 'cash',
            payer: '公司',
            payerAccount: '公司账户',
            payee: '业主',
            payeeAccount: '业主账户',
          },
        ],
      },
    },
  ]);
});
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = '';
});
async function mount(component: any, props: any = {}) {
  const root = document.createElement('div');
  document.body.append(root);
  app = createApp(component, props);
  app.directive('permission', {});
  app.directive('loading', {});
  app.component('ElTable', {
    props: ['data'],
    setup(props: any) {
      provide(
        'rows',
        computed(() => props.data),
      );
    },
    template: '<div><slot /></div>',
  });
  app.component('ElTableColumn', {
    props: ['label', 'prop'],
    setup() {
      return { rows: inject('rows') };
    },
    template:
      '<div>{{label}}<div v-for="row in rows"><slot :row="row">{{row[prop]}}</slot></div></div>',
  });
  app.component('ElDialog', {
    props: ['modelValue', 'title'],
    template:
      '<section v-if="modelValue" :aria-label="title"><slot/><slot name="footer"/></section>',
  });
  app.component('ElButton', {
    props: ['disabled', 'loading'],
    template:
      '<button type="button" :disabled="disabled || loading"><slot/></button>',
  });
  app.component('ElFormItem', {
    props: ['label'],
    template: '<label :data-label="label">{{label}}<slot/></label>',
  });
  app.component('ElInput', {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(`update:modelValue`, $event.target.value)"/>',
  });
  app.component('ElInputNumber', {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input type="number" :value="modelValue" @input="$emit(`update:modelValue`, Number($event.target.value))"/>',
  });
  app.component('ElDatePicker', {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(`update:modelValue`, $event.target.value)"/>',
  });
  app.component('ElSelect', {
    props: { modelValue: [String, Number], allowCreate: Boolean },
    emits: ['update:modelValue'],
    template:
      '<input v-if="allowCreate" :value="modelValue" @input="$emit(`update:modelValue`, $event.target.value)"/><select v-else :value="modelValue" @change="$emit(`update:modelValue`, $event.target.selectedOptions[0]?.dataset.numeric === `true` ? Number($event.target.value) : $event.target.value)"><slot/></select>',
  });
  app.component('ElOption', {
    props: ['value', 'label'],
    template: '<option :value="value" :data-numeric="typeof value === `number`">{{label}}</option>',
  });
  app.component('ElAlert', {
    props: ['title'],
    template: '<p role="alert">{{title}}</p>',
  });
  for (const name of ['ElForm', 'ElRow', 'ElCol'])
    app.component(name, { template: '<div><slot/></div>' });
  app.config.warnHandler = () => {};
  app.mount(root);
  await flush();
  return root;
}
function button(root: Element, label: string) {
  return [...root.querySelectorAll<HTMLButtonElement>('button')].find(
    (el) => el.textContent?.trim() === label,
  )!;
}
async function fill(root: Element, label: string, value: string) {
  const el = root.querySelector<HTMLInputElement>(
    `[data-label="${label}"] input`,
  )!;
  el.value = value;
  el.dispatchEvent(new Event('input'));
  await flush();
}

describe('房管房支付、现金与财务审核界面', () => {
  it('显示押金和维修分项，分项支付调用费用接口，月份标题按余额汇总', async () => {
    vi.mocked(getBusinessCalendar).mockResolvedValue({ period: '2026-10', buckets: [{ direction: 'pay', period: '2026-10', amount: 999, count: 1, list: [{ ...row, billType: 'charge', categoryLabel: '维修', counterparty: '维修师傅', amount: 200, remaining: 150, settledAmount: 50 }] }], overdue: [] });
    const root = await mount(ManagedBusinessView);
    expect(root.querySelector('.month-card header')?.textContent).toContain('¥150.00');
    expect(root.textContent).toContain('维修 · 维修师傅');
    expect(root.textContent).not.toContain('第0期');
    button(root, '支付').click(); await flush();
    const dialog = root.querySelector('section[aria-label="登记支付"]')!;
    await fill(dialog, '支付账号', '公司账户'); await fill(dialog, '收款账号', '服务账户');
    button(dialog, '提交').click(); await flush();
    expect(settleCharge).toHaveBeenCalledWith(row.id, expect.objectContaining({ amount: 150, payee: '维修师傅' }));
    expect(settleSchedule).not.toHaveBeenCalled();
  });
  it('按年月日编辑年度免租，取消不会覆盖原免租天数', async () => {
    const update = vi.fn();
    const root = await mount(FreeRentPeriod, { modelValue: [45,30,0,0,0], start: '2026-10-01', 'onUpdate:modelValue': update });
    expect(root.textContent).toContain('75 天');
    button(root, '编辑').click(); await flush();
    const month = root.querySelectorAll<HTMLInputElement>('.free-year input')[1];
    month.value = '2'; month.dispatchEvent(new Event('input')); await flush();
    button(root, '取消').click(); await flush(); expect(update).not.toHaveBeenCalled();
    button(root, '编辑').click(); await flush();
    const changed = root.querySelectorAll<HTMLInputElement>('.free-year input')[1];
    changed.value = '2'; changed.dispatchEvent(new Event('input')); await flush();
    button(root, '保存免租期').click(); await flush();
    expect(update).toHaveBeenCalledWith([75,30,0,0,0]);
  });

  it('业绩提交后用于下载的列表与财务保存快照一致，不保留提交前旧金额', async () => {
    const empty = () => ({ amount: 0, commission: 0, details: [] });
    const initial = {
      employeeId: 7,
      employeeName: '报送人',
      employeeCode: '000007',
      regular: { amount: 100, commission: 20, details: [] },
      management: empty(),
      tenant: empty(),
      sale: empty(),
      totalAmount: 100,
      totalCommission: 20,
    };
    const saved = {
      ...initial,
      regular: { amount: 200, commission: 50, details: [] },
      totalAmount: 200,
      totalCommission: 50,
    };
    vi.mocked(getBusinessPerformance).mockResolvedValue({
      period: '2026-10',
      list: [initial],
    });
    vi.mocked(submitBusiness).mockResolvedValue({
      id: 8,
      type: 'performance',
      period: '2026-10',
      snapshot: { list: [saved] },
      status: 'submitted',
      reviewNote: '',
      employeeName: '报送人',
      createdAt: '2026-10-01',
    });
    const root = await mount(BusinessPerformanceView);
    expect(root.textContent).toContain('20.00');
    button(root, '财务提交').click();
    await flush();
    expect(root.textContent).toContain('总收入 ¥50.00');
    expect(root.textContent).not.toContain('20.00');
  });
  it('应付、应收使用不同颜色分区，并列出真实地址和未结金额', async () => {
    const root = await mount(ManagedBusinessView);
    expect(root.querySelector('.pay')?.textContent).toContain(row.propertyName);
    expect(root.querySelector('.receive')?.textContent).toContain(
      '租客收款信息',
    );
    expect(root.textContent).toContain('共 1 套');
  });
  it('标题汇总下面的待付账单，季付金额保留本期金额与部分实付，并传递房间筛选', async () => {
    billRoute.query = { propertyId: '8', roomId: '21' };
    vi.mocked(getBusinessCalendar).mockResolvedValue({ period: '2026-10', buckets: [{ direction: 'pay', period: '2026-10', amount: 1, count: 1, list: [{ ...row, monthlyRent: 7300, paymentMethod: 'quarterly', contractCode: 'WT-QUARTER', periodEnd: '2026-12-31', amount: 21900, settledAmount: 1000, remaining: 20900 }] }], overdue: [] });
    const root = await mount(ManagedBusinessView);
    expect(getBusinessCalendar).toHaveBeenCalledWith(expect.any(String), { propertyId: 8, roomId: 21 });
    expect(root.querySelector('.month-card header')?.textContent).toContain('¥20,900.00');
    expect(root.textContent).toContain('本期应付 ¥21,900.00');
    expect(root.textContent).toContain('已结 ¥1,000.00');
    expect(root.textContent).toContain('WT-QUARTER');
    expect(root.textContent).toContain('2026-12-31');
  });

  it('校验付款字段，重试沿用同一幂等编号，成功后刷新下一期', async () => {
    const root = await mount(ManagedBusinessView);
    button(root, '支付').click();
    await flush();
    const dialog = root.querySelector('section[aria-label="登记支付"]')!;
    button(dialog, '提交').click();
    await flush();
    expect(settleSchedule).not.toHaveBeenCalled();
    await fill(dialog, '支付金额', '40');
    await fill(dialog, '支付账号', '公司银行账户');
    await fill(dialog, '收款账号', '业主账户');
    await fill(dialog, '收款人', '业主');
    vi.mocked(settleSchedule).mockRejectedValueOnce(new Error('network'));
    button(dialog, '提交').click();
    await flush();
    const key = vi.mocked(settleSchedule).mock.calls[0][1].requestKey;
    expect(key).toBeTruthy();
    expect(root.querySelector('section[aria-label="登记支付"]')).not.toBeNull();
    button(dialog, '提交').click();
    await flush();
    expect(settleSchedule).toHaveBeenLastCalledWith(
      3,
      expect.objectContaining({
        requestKey: key,
        amount: 40,
        payer: '报送人',
        payee: '业主',
      }),
    );
    expect(getBusinessCalendar).toHaveBeenCalledTimes(2);
    expect(root.querySelector('section[aria-label="登记支付"]')).toBeNull();
  });

  it('加载失败不能提交财务快照，也不展示旧金额', async () => {
    vi.mocked(getBusinessCalendar).mockRejectedValueOnce(new Error('network'));
    const root = await mount(ManagedBusinessView);
    button(root, '财务提交').click();
    await flush();
    expect(root.textContent).toContain('加载失败');
    expect(submitBusiness).not.toHaveBeenCalled();
    expect(root.textContent).not.toContain(row.propertyName);
  });

  it('四个余额框，银行可切换建设银行与农商银行', async () => {
    const root = await mount(CashFlowView);
    expect(root.querySelectorAll('.balance-card')).toHaveLength(4);
    const bank = root.querySelector<HTMLSelectElement>('select')!;
    bank.value = 'bank_rural';
    bank.dispatchEvent(new Event('change'));
    await flush();
    expect(root.querySelector('.balance-card strong')?.textContent).toContain(
      '101',
    );
  });

  it('财务查看提交时的实际支付明细；退回发送原因', async () => {
    const root = await mount(BusinessReviewView);
    button(root, '查看').click();
    await flush();
    expect(root.textContent).toContain('本月实际收付款记录');
    expect(root.textContent).toContain(row.propertyName);
    vi.mocked(ElMessageBox.prompt).mockResolvedValue({
      value: '补充付款资料',
    } as any);
    button(root, '退回').click();
    await flush();
    expect(reviewBusinessSubmission).toHaveBeenCalledWith(
      5,
      'return',
      '补充付款资料',
    );
  });

  it('配置使用员工下拉并提交员工主键，非法金额禁止提交', async () => {
    const root = await mount(PropertyConfigurationDialog, { visible: true, propertyId: 8 });
    expect(getConfigurationEmployees).toHaveBeenCalledWith(8);
    const rows = root.querySelectorAll('.configuration-row');
    const input = rows[5].querySelector<HTMLInputElement>('input')!;
    input.value = '12.345'; input.dispatchEvent(new Event('input')); await flush();
    button(root, '直接提交').click(); await flush();
    expect(savePropertyConfiguration).not.toHaveBeenCalled();
    input.value = '123.45'; input.dispatchEvent(new Event('input'));
    const select = rows[5].querySelector<HTMLSelectElement>('select[aria-label="收房奖员工"]')!;
    expect(select.textContent).toContain('真实员工');
    select.value = '7'; select.dispatchEvent(new Event('change')); await flush();
    button(root, '直接提交').click(); await flush();
    expect(savePropertyConfiguration).toHaveBeenCalledWith(8, expect.arrayContaining([expect.objectContaining({ type: 'collection_bonus', amount: 123.45, recipientEmployeeId: 7 })]));
  });

  it('配置加载失败不能用默认零费用覆盖原配置', async () => {
    const root = await mount(PropertyConfigurationDialog, {
      visible: false,
      propertyId: 8,
    });
    // 真实父组件在打开对话框时触发加载。
    app!.unmount();
    app = undefined;
    root.remove();
    const { reactive } = await import('vue');
    const props = reactive({ visible: false, propertyId: 8 });
    const parent = {
      components: { PropertyConfigurationDialog },
      setup: () => ({ props }),
      template:
        '<PropertyConfigurationDialog :visible="props.visible" :property-id="props.propertyId"/>',
    };
    vi.mocked(getPropertyConfiguration).mockRejectedValueOnce(
      new Error('network'),
    );
    const host = await mount(parent);
    props.visible = true;
    await flush();
    expect(button(host, '直接提交').disabled).toBe(true);
    button(host, '直接提交').click();
    await flush();
    expect(savePropertyConfiguration).not.toHaveBeenCalled();
    expect(host.textContent).toContain('加载失败');
  });
});
