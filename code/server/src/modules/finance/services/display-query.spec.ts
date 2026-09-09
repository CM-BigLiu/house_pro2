import { BillService } from './bill.service';
import { FlowService } from './flow.service';
import { Brackets } from 'typeorm';

function repoFor(rows: any[]) {
  const qb: any = {};
  for (const key of ['where', 'andWhere', 'orderBy', 'skip', 'take']) qb[key] = jest.fn().mockReturnValue(qb);
  qb.getManyAndCount = jest.fn().mockResolvedValue([rows, rows.length]);
  return { qb, repo: { createQueryBuilder: jest.fn().mockReturnValue(qb) } as any };
}
const user: any = { employeeId: 1, dataScope: 'self', permissions: ['*'] };
describe('financial display and search regressions', () => {
  it('round-trips the displayed paid status and preserves actual paid amount', async () => {
    const { repo, qb } = repoFor([{ id: 1, status: 'received', amount: '100', actualAmount: '80', billSource: 'rent', bizType: 'sale', dueDate: '2026-09-09' }]);
    const result = await new BillService(repo).findAll({ status: 'paid', category: 'rent' }, user);
    expect(qb.where).toHaveBeenCalledWith('b.status = :status', { status: 'received' });
    expect(qb.andWhere).toHaveBeenCalledWith('b.billSource = :category', { category: 'rent' });
    expect(result.list[0]).toMatchObject({ status: 'paid', paidAmount: 80, category: 'rent', billDate: '2026-09-09' });
  });
  it('uses bracketed scoped bill keyword searches and validates date order', async () => {
    const { repo, qb } = repoFor([]);
    const service = new BillService(repo);
    await service.findAll({ keyword: 'QA' }, user);
    expect(qb.andWhere.mock.calls.some(([v]: any[]) => v instanceof Brackets)).toBe(true);
    expect(qb.andWhere).toHaveBeenCalledWith('b.creatorId = :employeeId', { employeeId: 1 });
    await expect(service.findAll({ dateStart: '2026-09-10', dateEnd: '2026-09-01' }, user)).rejects.toThrow('开始日期不能晚于');
  });
  it('maps income direction instead of rendering every flow as an expense', async () => {
    const { repo } = repoFor([{ id: 1, direction: 'income', amount: '9.99', remark: 'QA', createdAt: new Date('2026-09-09T00:00:00Z') }]);
    expect((await new FlowService(repo).findAll({}, user)).list[0]).toMatchObject({ type: 'income', amount: 9.99, title: 'QA', flowDate: '2026-09-09' });
  });
  it('retains flow type, keyword and scope together even when status is supplied', async () => {
    const { repo, qb } = repoFor([]);
    await new FlowService(repo).findAll({ keyword: ' QA ', type: 'income', status: 'pending' }, user);
    expect(qb.andWhere).toHaveBeenCalledWith('f.direction = :direction', { direction: 'income' });
    expect(qb.andWhere).toHaveBeenCalledWith('f.remark ILIKE :keyword', { keyword: '%QA%' });
    expect(qb.where).not.toHaveBeenCalled();
  });
});
