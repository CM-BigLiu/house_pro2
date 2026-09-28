import { BusinessCharge } from '../entities/business-charge.entity';
import { IncomeCostReportService } from './income-cost-report.service';
import { CashEntry, ContractSchedule, PropertyConfiguration } from '../entities/business-workflow.entity';
import { FinanceFlow } from '../archive/finance-flow.entity';
import { Bill } from '../archive/bill.entity';
import { Deposit } from '../../house/entities/deposit.entity';
import { Checkout } from '../../house/entities/checkout.entity';
import { Deal } from '../../house/entities/deal.entity';
import { IncomeCost } from '../entities/income-cost.entity';
import { PaymentPlan } from '../entities/payment-plan.entity';

function setup() {
  const data = new Map<any, any[]>([
    [BusinessCharge, []],
    [CashEntry, [{ id: 1, scheduleId: 1, direction: 'receive', amount: 600, paymentDate: '2026-09-10' }, { id: 2, direction: 'pay', amount: 100, paymentDate: '2026-09-10' }]],
    [ContractSchedule, [{ id: 1, dealId: 1, propertyName: '测试房源', amount: 9000 }]],
    [Bill, [{ id: 7, bizId: 'D2' }]],
    [FinanceFlow, [{ id: 1, billId: 7, direction: 'income', bizType: 'deposit', amount: 200, occurredOn: '2026-09-05', status: 'completed' }, { id: 2, direction: 'income', bizType: 'rent', amount: 400, occurredOn: '2026-09-05', status: 'completed' }, { id: 3, direction: 'income', amount: 9999, occurredOn: '2026-09-05', status: 'pending' }]],
    [Deposit, [{ id: 1, contractCode: 'D1', depositAmount: 300, depositDate: '2026-09-03', refundDate: '2026-09-10', status: 'refunded' }, { id: 2, contractCode: 'D2', depositAmount: 200, depositDate: '2026-09-05', status: 'deducted' }]],
    [Checkout, [{ id: 1, contractCode: 'D1', settlementAmount: 25, completedAt: new Date('2026-09-10T02:00:00Z'), status: 'completed' }, { id: 2, settlementAmount: 1000, status: 'pending' }]],
    [PropertyConfiguration, [{ id: 1, adjustments: [{ occurredOn: '2026-09-03', amount: 150 }, { occurredOn: '2026-09-10', amount: -50 }, { occurredOn: '2026-08-10', amount: 80 }], items: [{ amount: 180 }] }]],
    [Deal, [{ id: 1, contractCode: 'D1', workflowType: 'tenant', status: 'active', signedAt: new Date('2026-09-03T10:00:00Z'), details: { commissionAmount: 50 } }, { id: 2, workflowType: 'sale', signedAt: new Date('2026-09-03T10:00:00Z'), details: { commissionAmount: 500 } }, { id: 3, workflowType: 'management', details: { commissionAmount: 999 } }]],
    [PaymentPlan, [{ id: 1, planType: 'receive', totalAmount: 9999, completedAmount: 60, auditTime: '2026-09-03' }]],
    [IncomeCost, [{ id: 1, period: '2026-09', rentIncome: 40, otherCost: 10, totalIncome: 9999, totalCost: 9999 }]],
  ]);
  const builders: any[] = [];
  const repos = new Map([...data.entries()].map(([type, records]) => {
    const qb: any = { getMany: jest.fn(async () => records), andWhere: jest.fn().mockReturnThis() };
    builders.push(qb);
    return [type, { find: async () => records, createQueryBuilder: () => qb }];
  }));
  return { service: new IncomeCostReportService({ getRepository: type => repos.get(type) } as any), builders, data };
}
describe('业务收支成本实时汇总', () => {
  const user: any = { dataScope: 'self', employeeId: 1 };
  it('只计实际金额，跨来源去重、押金退还及成本冲减，保留来源明细', async () => {
    const t = setup(), report = await t.service.report('2026-09', user);
    expect(report).toMatchObject({ totalIncome: 2175, totalCost: 510, net: 1665 });
    expect(report.list.find(row => row.id === 'cash:1')).toMatchObject({ reference: 'D1', propertyName: '测试房源', amount: 600 });
    expect(report.list.filter(row => row.reference === 'D2')).toHaveLength(1);
    expect(report.list.find(row => row.id === 'configuration:1:1')).toMatchObject({ direction: 'expense', amount: -50 });
    expect(report.list.some(row => row.id === 'checkout:2' || row.id === 'deal:3:commission')).toBe(false);
    expect(new Set(report.list.map(row => row.id)).size).toBe(report.list.length);
    expect(await t.service.report('2026-09', user)).toEqual(report);
  });
  it('所有有金额的业务来源都限制当前账号数据范围', async () => {
    const t = setup(); await t.service.report('2026-09', user);
    expect(t.builders.filter(q => q.andWhere.mock.calls.length)).toHaveLength(10);
    t.builders.filter(q => q.andWhere.mock.calls.length).forEach(q => expect(q.andWhere).toHaveBeenCalledWith(expect.stringContaining('= :employeeId'), { employeeId: 1 }));
  });
  it('退款和配置修改后不保留旧合计，其他月份不漏算', async () => {
    const t = setup(); t.data.get(Deposit)[0].status = 'pending';
    expect((await t.service.report('2026-09', user)).totalCost).toBe(210);
    expect(await t.service.report('2026-08', user)).toMatchObject({ totalIncome: 0, totalCost: 80, net: -80 });
  });
  it('历史账单有实缴但缺少流水时补计，已有流水的账单不重复计入', async () => {
    const t = setup();
    Object.assign(t.data.get(Bill)[0], { actualAmount: 200, status: 'received', updatedAt: new Date('2026-09-05T02:00:00Z') });
    t.data.get(Bill).push({ id: 8, actualAmount: 120, status: 'received', bizType: 'rent', updatedAt: new Date('2026-09-05T02:00:00Z') });
    const report = await t.service.report('2026-09', user);
    expect(report.totalIncome).toBe(2295);
    expect(report.list.some(row => row.id === 'bill:7')).toBe(false);
    expect(report.list.find(row => row.id === 'bill:8')).toMatchObject({ amount: 120, source: '历史账单已缴（无流水）' });
  });
  it('拒绝无效月份', async () => {
    await expect(setup().service.report('2026-13', user)).rejects.toThrow('月份格式');
  });
  it('押金和佣金只按实收计入，配置支付不重复计成本，部分押金历史与新收款正确去重', async () => {
    const t = setup();
    t.data.get(BusinessCharge).push({ id: 10, dealId: 1, category: 'tenant_deposit', propertyName: '测试房源' }, { id: 11, dealId: 1, category: 'commission' }, { id: 12, category: 'repair' });
    t.data.get(CashEntry).push({ id: 3, chargeId: 10, direction: 'receive', paymentDate: '2026-09-10', amount: 100 }, { id: 4, chargeId: 11, direction: 'receive', paymentDate: '2026-09-10', amount: 20 }, { id: 5, chargeId: 12, direction: 'pay', paymentDate: '2026-09-10', amount: 100 });
    const report = await t.service.report('2026-09', user);
    expect(report.list.find(row => row.id === 'deposit:1:receive').amount).toBe(200);
    expect(report.list.find(row => row.id === 'cash:3')).toMatchObject({ category: '租房押金', amount: 100 });
    expect(report.list.find(row => row.id === 'cash:4')).toMatchObject({ category: '佣金', amount: 20 });
    expect(report.list.some(row => row.id === 'deal:1:commission' || row.id === 'cash:5')).toBe(false);
    expect(report).toMatchObject({ totalIncome: 2145, totalCost: 510 });
  });
});
