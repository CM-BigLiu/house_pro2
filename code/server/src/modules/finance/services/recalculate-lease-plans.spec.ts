import { recalculatePendingLeasePlans } from '../../../../scripts/recalculate-lease-plans';
import { ContractSchedule } from '../entities/business-workflow.entity';

function setup(overrides = {}) {
  const rows = [{
    id: 1, dealId: 2, direction: 'pay', status: 'pending',
    periodStart: '2026-09-28', periodEnd: '2026-12-27',
    amount: 6064.52, settledAmount: 6000, ...overrides,
  }];
  const query: any = { getMany: jest.fn(async () => rows) };
  for (const name of ['innerJoin', 'where', 'andWhere', 'orderBy', 'setLock'])
    query[name] = jest.fn(() => query);
  const update = jest.fn(async (id, change) => Object.assign(rows.find(row => row.id === id), change));
  const deals = [{
    id: 2, leaseStart: '2026-09-28', leaseEnd: '2028-09-27', amount: 4000,
    details: { freeDays: [45, 30, 0, 0, 0] },
  }];
  const manager = {
    getRepository: (entity) => entity === ContractSchedule
      ? { createQueryBuilder: () => query, update }
      : { findBy: async () => deals },
  };
  const ds: any = { transaction: work => work(manager) };
  return { ds, rows, deals, query, update };
}

describe('30天口径存量计划重算', () => {
  it('默认只预览6133.33与133.33差额，不写入数据库', async () => {
    const { ds, update, query } = setup();
    expect(await recalculatePendingLeasePlans(ds)).toEqual([{
      id: 1, dealId: 2, previousAmount: 6064.52, nextAmount: 6133.33,
      settledAmount: 6000, remaining: 133.33,
    }]);
    expect(update).not.toHaveBeenCalled();
    expect(query.where).toHaveBeenCalledWith('schedule.status = :status', { status: 'pending' });
    expect(query.andWhere).toHaveBeenCalledWith('deal.status IN (:...statuses)', { statuses: ['active', 'termination_pending'] });
    expect(query.setLock).toHaveBeenCalledWith('pessimistic_write', undefined, ['schedule']);
  });

  it('更新应付金额且保留实付金额，再次运行没有差额', async () => {
    const { ds, update, rows } = setup();
    await recalculatePendingLeasePlans(ds, true);
    expect(update).toHaveBeenCalledWith(1, { amount: 6133.33, status: 'pending' });
    expect(rows[0].settledAmount).toBe(6000);
    expect(await recalculatePendingLeasePlans(ds, true)).toEqual([]);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('新金额等于已结金额时同步结清状态', async () => {
    const { ds, update } = setup({ amount: 6200, settledAmount: 6133.33 });
    await recalculatePendingLeasePlans(ds, true);
    expect(update).toHaveBeenCalledWith(1, { amount: 6133.33, status: 'paid' });
  });

  it('任意计划已结金额超过新金额时，整批拒绝且不改实付', async () => {
    const { ds, rows, update } = setup();
    rows.push({ ...rows[0], id: 3, amount: 6200, settledAmount: 6150 });
    await expect(recalculatePendingLeasePlans(ds, true)).rejects.toThrow('已结金额超过');
    expect(update).not.toHaveBeenCalled();
    expect(rows[1].settledAmount).toBe(6150);
  });

  it('合同日期不完整时不会把原计划静默清零', async () => {
    const { ds, deals, update } = setup();
    deals[0].leaseStart = null;
    await expect(recalculatePendingLeasePlans(ds, true)).rejects.toThrow('租期不完整');
    expect(update).not.toHaveBeenCalled();
  });

  it('应收计划不扣除业主免租期', async () => {
    const { ds } = setup({ direction: 'receive', amount: 12000, settledAmount: 0 });
    expect(await recalculatePendingLeasePlans(ds)).toEqual([]);
  });
});
