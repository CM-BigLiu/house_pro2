import { syncLandlordFreeRent } from './landlord-free-rent';
import { Deal } from '../../house/entities/deal.entity';
import { ContractSchedule } from '../entities/business-workflow.entity';

function setup(settledAmount = 0) {
  const deal = { id: 1, leaseStart: '2026-10-01', leaseEnd: '2026-11-29', amount: 3000, details: { freeDays: [0, 0, 0, 0, 0] } };
  const plans = [{ id: 10, sequence: 1, periodStart: '2026-10-01', periodEnd: '2026-10-31', amount: 3000, settledAmount, status: 'pending' }];
  const qb = (data: unknown) => { const q: any = {}; for (const key of ['where', 'setLock', 'orderBy']) q[key] = jest.fn().mockReturnValue(q); q.getMany = jest.fn().mockResolvedValue(data); return q; };
  const deals = { createQueryBuilder: () => qb([deal]), save: jest.fn() }, schedules = { createQueryBuilder: () => qb(plans), update: jest.fn() };
  const manager: any = { getRepository: type => type === Deal ? deals : type === ContractSchedule ? schedules : null };
  const rental: any = { id: 1, freeRentRanges: [{ start: '2026-10-01', end: '2026-10-10' }] };
  return { manager, rental, deals, schedules };
}
describe('房源免租日期同步房东应付计划', () => {
  it('保留计划主键及实付金额，只自动更新应付及合同免租日期', async () => {
    const t = setup(500); await syncLandlordFreeRent(t.manager, t.rental);
    expect(t.schedules.update).toHaveBeenCalledWith(10, { amount: 2000, status: 'pending' });
    expect(t.deals.save).toHaveBeenCalledWith([expect.objectContaining({ details: expect.objectContaining({ freeRentRanges: t.rental.freeRentRanges }) })]);
  });
  it('免租导致新应付低于实付时整批拒绝，不改写计划或合同', async () => {
    const t = setup(2500); await expect(syncLandlordFreeRent(t.manager, t.rental)).rejects.toMatchObject({ status: 400 });
    expect(t.schedules.update).not.toHaveBeenCalled(); expect(t.deals.save).not.toHaveBeenCalled();
  });
});
