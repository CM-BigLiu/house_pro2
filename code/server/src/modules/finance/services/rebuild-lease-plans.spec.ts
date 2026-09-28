import { rebuildPendingLeasePlans } from '../../../../scripts/rebuild-lease-plans';
import { ContractSchedule } from '../entities/business-workflow.entity';

function setup() {
  const rows: any[] = [{ id: 1, dealId: 2, sequence: 1, direction: 'pay', status: 'pending',
    periodStart: '2026-09-28', periodEnd: '2026-12-27', dueDate: '2026-09-28', amount: 6133.33, settledAmount: 6000 }];
  const deals: any[] = [{ id: 2, leaseStart: '2026-09-28', leaseEnd: '2028-09-27', amount: 4000, paymentMethod: 'quarterly', details: { paymentDate: '2026-09-28', freeDays: [45,30,0,0,0] } }];
  const query: any = { getMany: async () => rows };
  for (const key of ['innerJoin','where','orderBy','setLock']) query[key] = jest.fn(() => query);
  const repo = { createQueryBuilder: () => query, create: value => value,
    update: jest.fn(async (id, value) => Object.assign(rows.find(row => row.id === id), value)),
    save: jest.fn(async value => { const row = { ...value, id: rows.length + 1 }; rows.push(row); return row; }),
  };
  const ds: any = { transaction: work => work({ getRepository: entity => entity === ContractSchedule ? repo : { find: async () => deals } }) };
  return { ds, rows, deals, repo };
}
describe('真实日历重排未结计划', () => {
  it('已结清一月底首期后，后续付款始终保留原始31号锚点', async () => {
    const { ds, rows, deals } = setup();
    Object.assign(deals[0], { leaseStart: '2026-01-31', leaseEnd: '2026-06-30', paymentMethod: 'monthly', details: { paymentDate: '2026-01-31', freeDays: [0,0,0,0,0] } });
    Object.assign(rows[0], { status: 'paid', amount: 4000, settledAmount: 4000, periodStart: '2026-01-31', periodEnd: '2026-02-27', dueDate: '2026-01-31' });
    rows.push({ ...rows[0], id: 2, sequence: 2, status: 'pending', settledAmount: 0, periodStart: '2026-02-28', periodEnd: '2026-03-29', dueDate: '2026-03-02' });
    await rebuildPendingLeasePlans(ds, true);
    expect(rows.find(row => row.sequence === 2).dueDate).toBe('2026-02-28');
    expect(rows.find(row => row.sequence === 3).dueDate).toBe('2026-03-31');
  });
  it('默认只预览；季付按日历月份，已有6000元实付保持不变', async () => {
    const { ds, repo } = setup();
    const changes = await rebuildPendingLeasePlans(ds);
    expect(changes[0]).toMatchObject({ action: 'update', id: 1, next: { periodEnd: '2026-12-27', amount: 6000, status: 'paid' }, remaining: 0 });
    expect(changes).toHaveLength(8);
    expect(repo.update).not.toHaveBeenCalled(); expect(repo.save).not.toHaveBeenCalled();
  });
  it('应用后完整覆盖原租期，末期按原结束日截断且重复运行无差额', async () => {
    const { ds, rows } = setup();
    await rebuildPendingLeasePlans(ds, true);
    expect(rows[0].settledAmount).toBe(6000);
    expect(rows[7]).toMatchObject({ sequence: 8, periodEnd: '2028-09-27', amount: 12000 });
    expect(await rebuildPendingLeasePlans(ds, true)).toEqual([]);
  });
  it('新金额低于实付时，在写入任何计划前整批停止', async () => {
    const { ds, rows, repo } = setup(); rows[0].settledAmount = 6100;
    await expect(rebuildPendingLeasePlans(ds, true)).rejects.toThrow('已结金额超过');
    expect(repo.update).not.toHaveBeenCalled(); expect(repo.save).not.toHaveBeenCalled();
  });
  it('已结清历史期保持原日期，后续从其结束日之后连续排期', async () => {
    const { ds, rows } = setup(); rows[0].status = 'paid'; rows[0].settledAmount = 6133.33;
    rows.push({ ...rows[0], id: 2, sequence: 2, status: 'pending', settledAmount: 0, periodStart: '2026-12-28', periodEnd: '2027-03-27', dueDate: '2026-12-28', amount: 12000 });
    await rebuildPendingLeasePlans(ds, true);
    expect(rows[0].periodEnd).toBe('2026-12-27');
    expect(rows[1].periodStart).toBe('2026-12-28');
    expect(await rebuildPendingLeasePlans(ds, true)).toEqual([]);
  });
});
