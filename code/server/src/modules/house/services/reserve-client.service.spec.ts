import { Customer } from '../entities/customer.entity';
import { ReserveClient } from '../entities/reserve-client.entity';
import { ReserveClientService } from './reserve-client.service';

function setup(existing: Partial<ReserveClient> = {}) {
  const customerRepo = {
    exist: jest.fn().mockResolvedValue(false),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 12, ...value })),
  };
  const reserveRepo = { update: jest.fn().mockResolvedValue({}) };
  const manager = {
    getRepository: jest.fn((entity) => entity === Customer ? customerRepo : entity === ReserveClient ? reserveRepo : undefined),
  };
  const transaction = jest.fn(async (callback) => callback(manager));
  const service = new ReserveClientService({ manager: { transaction } } as any, {} as any);
  jest.spyOn(service as any, 'findScoped').mockResolvedValue({
    id: 5, clientName: '测试客户', clientMobile: '13800138000', demandType: 'sale',
    status: 'not_rented', storeId: 2, salesmanId: 3, ...existing,
  });
  const user = { employeeId: 7 } as any;
  return { service, customerRepo, reserveRepo, transaction, user };
}

describe('储备客源转正式客户', () => {
  it('储备客源列表始终排除已转正式客户记录', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    const service = new ReserveClientService(
      { createQueryBuilder: jest.fn(() => qb) } as any,
      { find: jest.fn().mockResolvedValue([]) } as any,
    );

    await service.findAll({ demandType: 'rent', keyword: '测试', page: 1, pageSize: 20 }, { dataScope: 'company' } as any);

    expect(qb.where).toHaveBeenCalledWith('c.status <> :convertedStatus', { convertedStatus: 'converted' });
    expect(qb.andWhere).toHaveBeenCalledWith('c.demandType = :demandType', { demandType: 'rent' });
    expect(qb.andWhere).toHaveBeenCalledWith(
      '(c.clientName LIKE :kw OR c.clientMobile LIKE :kw)',
      { kw: '%测试%' },
    );
  });

  it('不填合同编号也能转为正式客户，不伪造已成交状态', async () => {
    const { service, customerRepo, reserveRepo, user } = setup();
    const result = await service.convert(5, {}, user);

    expect(customerRepo.exist).not.toHaveBeenCalled();
    expect(customerRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      customerType: 'buyer', status: 'active', relatedPropertyCode: undefined,
      contractEndDate: undefined,
    }));
    expect(reserveRepo.update).toHaveBeenCalledWith(5, { status: 'converted' });
    expect(result).toEqual({ reserveClientId: 5, customerId: 12, contractCode: undefined, status: 'converted' });
  });

  it('填入合同编号时保留编号与到期日，并检查重复', async () => {
    const { service, customerRepo, user } = setup({ demandType: 'rent' });
    const result = await service.convert(5, { contractCode: '  HT-001  ', contractEndDate: '2027-09-22' }, user);

    expect(customerRepo.exist).toHaveBeenCalledWith({ where: { relatedPropertyCode: 'HT-001' } });
    expect(customerRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      customerType: 'tenant', relatedPropertyCode: 'HT-001', contractEndDate: '2027-09-22',
    }));
    expect(result.contractCode).toBe('HT-001');
  });

  it('合同编号已被使用时不创建客户', async () => {
    const { service, customerRepo, reserveRepo, user } = setup();
    customerRepo.exist.mockResolvedValue(true);

    await expect(service.convert(5, { contractCode: 'HT-001' }, user)).rejects.toThrow('合同编号已存在');
    expect(customerRepo.save).not.toHaveBeenCalled();
    expect(reserveRepo.update).not.toHaveBeenCalled();
  });
});
