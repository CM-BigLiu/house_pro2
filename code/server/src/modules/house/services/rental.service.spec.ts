import { Brackets } from 'typeorm';
import { RentalService } from './rental.service';

function queryBuilderMock() {
  const qb: any = {};
  ['leftJoinAndSelect', 'where', 'andWhere', 'skip', 'take'].forEach((method) => {
    qb[method] = jest.fn().mockReturnValue(qb);
  });
  qb.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
  return qb;
}

describe('RentalService.findSets', () => {
  it.each([
    ['vacant', 'rs.bizType = :entireType AND rs.status IN (:...entireStatuses)', { entireType: 'entire', entireStatuses: ['active', 'vacant'] }],
    ['rented', 'rs.bizType = :entireType AND rs.status = :entireStatus', { entireType: 'entire', entireStatus: 'rented' }],
  ])('filters %s sets by entire-house status or any matching shared room', async (status, entireCondition, entireParams) => {
    const qb = queryBuilderMock();
    const service = new RentalService({ createQueryBuilder: jest.fn().mockReturnValue(qb) } as any, {} as any);
    await service.findSets({ status, bizType: 'shared' }, { employeeId: 1, dataScope: 'company' } as any);

    const statusCall = qb.andWhere.mock.calls.find(([condition]: [unknown]) => condition instanceof Brackets);
    expect(statusCall).toBeDefined();
    const sub = { where: jest.fn(), orWhere: jest.fn() } as any;
    sub.where.mockReturnValue(sub);
    (statusCall![0] as Brackets).whereFactory(sub);

    expect(sub.where).toHaveBeenCalledWith(entireCondition, entireParams);
    expect(sub.orWhere).toHaveBeenCalledWith(
      expect.stringContaining('status_room.set_id = rs.id AND status_room.status = :roomStatus'),
      { sharedType: 'shared', roomStatus: status },
    );
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('rs.rooms', 'rooms');
  });

  it('applies a parameterized keyword filter to rental and community fields', async () => {
    const qb = queryBuilderMock();
    const setRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb) } as any;
    const service = new RentalService(setRepo, {} as any);
    await service.findSets(
      { keyword: ' 汤臣 ', page: 1, pageSize: 20 },
      { employeeId: 1, dataScope: 'company', permissions: ['*'] } as any,
    );

    const bracketCall = qb.andWhere.mock.calls.find(([condition]: [unknown]) => condition instanceof Brackets);
    expect(bracketCall).toBeDefined();
    const bracket = bracketCall![0] as Brackets;
    const sub = {
      where: jest.fn(),
      orWhere: jest.fn(),
    } as any;
    sub.where.mockReturnValue(sub);
    sub.orWhere.mockReturnValue(sub);
    bracket.whereFactory(sub);

    expect(sub.where).toHaveBeenCalledWith('rs.code ILIKE :keyword', { keyword: '%汤臣%' });
    expect(sub.orWhere).toHaveBeenCalledWith('community.name ILIKE :keyword', { keyword: '%汤臣%' });
    expect(sub.orWhere).toHaveBeenCalledWith('rooms.roomNo ILIKE :keyword', { keyword: '%汤臣%' });
  });
});

describe('RentalService.updateSet', () => {
  it('normalizes blank optional dates before persisting an edited rental', async () => {
    const existing = {
      id: 1,
      code: 'CZ0001',
      storeId: 1,
      creatorId: 1,
      rooms: [{ id: 10, setId: 1, creatorId: 1, roomNo: 'A' }],
    } as any;
    const qb = queryBuilderMock();
    qb.getOne = jest.fn().mockResolvedValue(existing);

    const setTransactionRepo = {
      create: jest.fn((value) => value),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const roomTransactionRepo = {
      create: jest.fn((value) => value),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const manager = {
      getRepository: jest.fn((entity) => entity.name === 'RentalSet'
        ? setTransactionRepo
        : roomTransactionRepo),
    };
    const setRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      manager: {
        transaction: jest.fn(async (callback) => callback(manager)),
      },
    } as any;
    const service = new RentalService(setRepo, {} as any);
    jest.spyOn(service, 'findSet').mockResolvedValue(existing);

    await service.updateSet(1, {
      tenantLeaseStart: '',
      tenantLeaseEnd: '',
      landlordName: 'QA房东', landlordDeposit: 5000, tenantPhone: '13000000000', deposit: 1000,
      rooms: [{ id: 10, roomNo: 'A', leaseStart: '2026-09-09', leaseEnd: '', tenantName: 'QA租客' }],
    }, { employeeId: 1, dataScope: 'company', permissions: ['*'] } as any);

    expect(setTransactionRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      tenantLeaseStart: null,
      tenantLeaseEnd: null,
      landlordName: 'QA房东', landlordDeposit: 5000, tenantPhone: '13000000000', deposit: 1000,
    }));
    expect(roomTransactionRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      id: 10,
      leaseEnd: null,
      leaseStart: '2026-09-09', tenantName: 'QA租客',
    }));
  });
});

describe('RentalService.createSet', () => {
  it('uses one transaction and normalizes optional dates without accepting caller ownership', async () => {
    const setRepo: any = { create: jest.fn(value => value), save: jest.fn(value => ({ ...value, id: 9 })) };
    const roomRepo: any = { create: jest.fn(value => value), save: jest.fn() };
    const transaction = jest.fn(async callback => callback({ getRepository: entity => entity.name === 'RentalSet' ? setRepo : roomRepo }));
    const service = new RentalService({ manager: { transaction } } as any, {} as any);
    await service.createSet({
      code: 'QA-CREATE', storeId: 1, creatorId: 999, leaseStart: '', leaseEnd: '',
      tenantLeaseStart: '', tenantLeaseEnd: '',
      rooms: [{ id: 88, roomNo: 'A', leaseStart: '', leaseEnd: '', creatorId: 999 }],
    }, { employeeId: 7, dataScope: 'store', storeIds: [1] } as any);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(setRepo.save).toHaveBeenCalledWith(expect.objectContaining({ creatorId: 7, leaseStart: null, tenantLeaseEnd: null }));
    expect(roomRepo.save).toHaveBeenCalledWith([expect.objectContaining({ setId: 9, creatorId: 7, leaseStart: null, leaseEnd: null })]);
    expect(roomRepo.save.mock.calls[0][0][0].id).toBeUndefined();
    await expect(service.createSet({ storeId: 2 }, { employeeId: 7, dataScope: 'store', storeIds: [1] } as any))
      .rejects.toMatchObject({ status: 403 });
  });
});

describe('RentalService.removeSet', () => {
  it('deletes only an unoccupied rental and removes its rooms first', async () => {
    const existing = { id: 3, status: 'vacant', rooms: [{ id: 30, status: 'vacant' }] } as any;
    const qb = queryBuilderMock();
    qb.getOne = jest.fn().mockResolvedValue(existing);
    const checkoutRepo = { exist: jest.fn().mockResolvedValue(false) };
    const roomRepo = { delete: jest.fn().mockResolvedValue({ affected: 1 }) };
    const rentalRepo = { delete: jest.fn().mockResolvedValue({ affected: 1 }) };
    const manager: any = {
      getRepository: jest.fn(entity => entity.name === 'Checkout' ? checkoutRepo : entity.name === 'RentalRoom' ? roomRepo : rentalRepo),
    };
    manager.transaction = jest.fn(async callback => callback(manager));
    const service = new RentalService({ createQueryBuilder: jest.fn().mockReturnValue(qb), manager } as any, {} as any);

    await expect(service.removeSet(3, { employeeId: 1, dataScope: 'company' } as any)).resolves.toEqual({ id: 3 });
    expect(roomRepo.delete).toHaveBeenCalledWith({ setId: 3 });
    expect(rentalRepo.delete).toHaveBeenCalledWith(3);
  });

  it('rejects deletion when the rental has tenant business', async () => {
    const qb = queryBuilderMock();
    qb.getOne = jest.fn().mockResolvedValue({ id: 4, status: 'rented', rooms: [] });
    const manager = { getRepository: jest.fn(() => ({ exist: jest.fn().mockResolvedValue(false) })) };
    const service = new RentalService({ createQueryBuilder: jest.fn().mockReturnValue(qb), manager } as any, {} as any);
    await expect(service.removeSet(4, { employeeId: 1, dataScope: 'company' } as any)).rejects.toThrow('不能删除');
  });
});
