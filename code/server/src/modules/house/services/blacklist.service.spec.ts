import { BlacklistService } from './blacklist.service';

describe('BlacklistService keyword pagination', () => {
  function setup() {
    const qb: any = {};
    ['where', 'andWhere', 'orderBy', 'skip', 'take'].forEach(method => {
      qb[method] = jest.fn().mockReturnValue(qb);
    });
    qb.getMany = jest.fn().mockResolvedValue([
      { id: 3, name: '无关项' },
      { id: 2, name: '测试甲' },
      { id: 1, name: '测试乙', idCard: 'TEST-ID' },
    ]);
    qb.getManyAndCount = jest.fn().mockResolvedValue([[], 3]);
    const service = new BlacklistService({ createQueryBuilder: () => qb } as any);
    const user = { employeeId: 7, dataScope: 'self', permissions: ['house:blacklist'] } as any;
    return { service, user, qb };
  }

  it('matches before paging and counts only scoped matches', async () => {
    const { service, user, qb } = setup();
    const result = await service.findAll({ keyword: '测试', page: 2, pageSize: 1 }, user);
    expect(result.total).toBe(2);
    expect(result.list.map(item => item.id)).toEqual([1]);
    expect(qb.skip).not.toHaveBeenCalled();
    expect(qb.andWhere).toHaveBeenCalledWith(expect.stringContaining('createdBy'), expect.anything());
  });

  it('returns zero total for no matches and can search decrypted identity fields', async () => {
    const { service, user } = setup();
    expect(await service.findAll({ keyword: '不存在' }, user)).toEqual({ list: [], total: 0 });
    expect((await service.findAll({ keyword: 'TEST-ID' }, user)).total).toBe(1);
  });
});
