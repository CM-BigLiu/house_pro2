import { CustomerService } from './customer.service';

describe('CustomerService visibility for lists and appointment selection', () => {
  function setup() {
    const qb: any = {};
    for (const method of ['andWhere', 'leftJoin', 'orderBy', 'skip', 'take']) {
      qb[method] = jest.fn().mockReturnValue(qb);
    }
    qb.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
    qb.getOne = jest.fn().mockResolvedValue({ id: 42, name: '客户' });
    const service = new CustomerService({ createQueryBuilder: () => qb } as any, {} as any);
    return { service, qb };
  }

  it.each([
    ['self', 'c.creatorId = :employeeId', { employeeId: 7 }],
    ['store', 'c.store_id IN (:...storeIds)', { storeIds: [3] }],
    ['assigned', 'c.store_id IN (:...assignedStoreIds)', { assignedStoreIds: [4] }],
    ['group', 'customerGroup.id IN (:...customerGroupIds)', { customerGroupIds: [8] }],
  ])('uses the same %s visibility for listing and validating a selected customer', async (dataScope, clause, params) => {
    const { service, qb } = setup();
    const user: any = { employeeId: 7, dataScope, storeIds: [3], assignedStoreIds: [4], groupIds: [8] };
    await service.findAll({}, user);
    expect(qb.andWhere).toHaveBeenCalledWith(clause, params);

    qb.andWhere.mockClear();
    await service.findOne(42, user);
    expect(qb.andWhere).toHaveBeenCalledWith(clause, params);
    expect(qb.andWhere).toHaveBeenCalledWith('c.id = :id', { id: 42 });
  });

  it('lets company-scope users list all customers', async () => {
    const { service, qb } = setup();
    await service.findAll({}, { employeeId: 7, dataScope: 'company' } as any);
    expect(qb.andWhere).not.toHaveBeenCalled();
  });

  it.each(['group', 'store', 'assigned'])('falls back to self when %s assignments are empty', async (dataScope) => {
    const { service, qb } = setup();
    await service.findAll({}, { employeeId: 7, dataScope } as any);
    expect(qb.andWhere).toHaveBeenCalledWith('c.creatorId = :employeeId', { employeeId: 7 });
  });

  it('does not return an unscoped customer when selection is inaccessible', async () => {
    const { service, qb } = setup();
    qb.getOne.mockResolvedValue(null);
    await expect(service.findOne(99, { employeeId: 7, dataScope: 'self' } as any))
      .rejects.toThrow('客户不存在或无权访问');
  });
});
