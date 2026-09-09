import { CommunityService } from './community.service';

function builder(rows: any[] = []) {
  const qb: any = {};
  ['select', 'addSelect', 'where', 'andWhere', 'groupBy', 'skip', 'take', 'orderBy'].forEach(method => {
    qb[method] = jest.fn().mockReturnValue(qb);
  });
  qb.getRawMany = jest.fn().mockResolvedValue(rows);
  return qb;
}

describe('CommunityService scoped listing metrics', () => {
  it('uses actual rental and sale counts, not building or unit totals', async () => {
    const communities = builder();
    communities.getManyAndCount = jest.fn().mockResolvedValue([[{ id: 1, unitCount: 40, buildingCount: 10 }], 1]);
    const rentals = builder([{ id: '1', count: '2' }]);
    const sales = builder([{ id: '1', count: '1' }]);
    const repo: any = {
      createQueryBuilder: () => communities,
      manager: { getRepository: entity => ({ createQueryBuilder: () => entity.name === 'RentalSet' ? rentals : sales }) },
    };
    const service = new CommunityService(repo, {} as any, {} as any, {} as any, {} as any);
    const result = await service.findAll({ cityId: 1, businessCircle: 'QA商圈' }, { employeeId: 9, dataScope: 'self' } as any);
    expect(result.list[0]).toMatchObject({ currentRentCount: 2, currentSaleCount: 1 });
    expect(rentals.andWhere).toHaveBeenCalledWith('rs.creatorId = :employeeId', { employeeId: 9 });
    expect(sales.andWhere).toHaveBeenCalledWith('s.creatorId = :employeeId', { employeeId: 9 });
    expect(communities.andWhere).toHaveBeenCalledWith('c.businessCircle = :businessCircle', { businessCircle: 'QA商圈' });
  });
});
