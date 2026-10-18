import { attachRentalCardSummaries } from './rental-card-summary';
import { CashEntry, ContractSchedule } from '../../finance/entities/business-workflow.entity';
import { BusinessCharge } from '../../finance/entities/business-charge.entity';
import { Deal } from '../entities/deal.entity';
import { Checkout } from '../entities/checkout.entity';
import { chargeToday } from '../../finance/services/business-charges';
import { days } from '../../finance/services/business-calculation';

function builder(result: any[]) {
  const qb: any = { expressionMap: { aliases: [] } };
  for (const method of ['innerJoin', 'leftJoin', 'andWhere', 'where', 'orderBy', 'addOrderBy', 'select', 'addSelect']) qb[method] = jest.fn().mockReturnValue(qb);
  qb.getMany = jest.fn().mockResolvedValue(result);
  return qb;
}

/** 按实体返回对应行，模拟五类聚合查询；现金流为空时不触发第二段合同查询。 */
function managerWith(rows: { plans?: any[]; charges?: any[]; cash?: any[]; deals?: any[]; checkouts?: any[] }) {
  const mapped: any[] = [[ContractSchedule, rows.plans || []], [BusinessCharge, rows.charges || []], [CashEntry, rows.cash || []], [Deal, rows.deals || []], [Checkout, rows.checkouts || []]];
  return { getRepository: (entity: any) => ({ createQueryBuilder: () => builder(mapped.find(([type]) => type === entity)?.[1] || []) }) };
}

const user = { employeeId: 4, dataScope: 'company' } as any;
const today = chargeToday();

describe('租房卡片汇总（累计空置与委托标记）', () => {
  it('历次空置与当前空置天数求和', async () => {
    const rentals = [{ id: 1, status: 'vacant', createdAt: new Date('2024-01-01T00:00:00Z'), canViewLandlordInfo: true, rooms: [] }];
    const rows = {
      deals: [{ id: 10, propertyId: 1, roomId: null, leaseStart: '2026-08-15', workflowType: 'tenant', status: 'active' }],
      checkouts: [{ rentalSetId: 1, rentalRoomId: null, checkoutDate: '2026-08-01' }, { rentalSetId: 1, rentalRoomId: null, checkoutDate: '2026-09-20' }],
    };
    const [result] = await attachRentalCardSummaries(managerWith(rows) as any, rentals, user);
    expect(result.financialSummary.vacantDays).toBe(days('2026-08-01', '2026-08-15') + days('2026-09-20', today));
    expect(result.financialSummary.vacancySource).toBe('checkout');
    expect(result.financialSummary.vacantSince).toBe('2026-09-20');
  });

  it('从未出租时以登记日期起算累计空置', async () => {
    const rentals = [{ id: 2, status: 'vacant', createdAt: new Date('2026-10-09T00:00:00Z'), canViewLandlordInfo: true, rooms: [] }];
    const [result] = await attachRentalCardSummaries(managerWith({}) as any, rentals, user);
    expect(result.financialSummary.vacantDays).toBe(days('2026-10-09', today));
    expect(result.financialSummary.vacancySource).toBe('registered');
    expect(result.financialSummary.vacantSince).toBe('2026-10-09');
    expect(result.delegated).toBe(false);
  });

  it('已出租的房源不输出空置天数', async () => {
    const rentals = [{ id: 3, status: 'rented', createdAt: new Date('2024-01-01T00:00:00Z'), canViewLandlordInfo: true, rooms: [] }];
    const rows = { checkouts: [{ rentalSetId: 3, rentalRoomId: null, checkoutDate: '2026-01-01' }] };
    const [result] = await attachRentalCardSummaries(managerWith(rows) as any, rentals, user);
    expect(result.financialSummary.vacantDays).toBeUndefined();
    expect(result.financialSummary.vacancySource).toBeUndefined();
    expect(result.financialSummary.vacantSince).toBeUndefined();
  });

  it('存在生效或待终止的委托合同即标记 delegated', async () => {
    const rentals = [
      { id: 4, status: 'vacant', createdAt: new Date('2026-01-01T00:00:00Z'), canViewLandlordInfo: true, rooms: [] },
      { id: 5, status: 'vacant', createdAt: new Date('2026-01-01T00:00:00Z'), canViewLandlordInfo: true, rooms: [] },
    ];
    const rows = { deals: [
      { id: 20, propertyId: 4, roomId: null, workflowType: 'management', status: 'active', leaseStart: '2025-01-01' },
      { id: 21, propertyId: 5, roomId: null, workflowType: 'management', status: 'terminated', leaseStart: '2025-01-01' },
    ] };
    const results = await attachRentalCardSummaries(managerWith(rows) as any, rentals, user);
    expect(results[0].delegated).toBe(true);
    expect(results[1].delegated).toBe(false);
  });

  it('合租房间按 roomId 维度累计空置', async () => {
    const rentals = [{
      id: 6, status: 'active', createdAt: new Date('2024-01-01T00:00:00Z'), canViewLandlordInfo: true,
      rooms: [{ id: 61, status: 'vacant', createdAt: new Date('2024-01-01T00:00:00Z') }],
    }];
    const rows = {
      deals: [{ id: 30, propertyId: 6, roomId: 61, leaseStart: '2026-05-10', workflowType: 'tenant', status: 'active' }],
      checkouts: [{ rentalSetId: 6, rentalRoomId: 61, checkoutDate: '2026-05-01' }, { rentalSetId: 6, rentalRoomId: 61, checkoutDate: '2026-06-01' }],
    };
    const [result] = await attachRentalCardSummaries(managerWith(rows) as any, rentals, user);
    expect(result.rooms[0].financialSummary.vacantDays).toBe(days('2026-05-01', '2026-05-10') + days('2026-06-01', today));
    expect(result.rooms[0].financialSummary.vacancySource).toBe('checkout');
    expect(result.rooms[0].financialSummary.vacantSince).toBe('2026-06-01');
  });
});
