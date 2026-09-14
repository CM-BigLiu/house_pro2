import { CheckoutService } from './checkout.service';
import { Checkout } from '../entities/checkout.entity';
import { RentalRoom } from '../entities/rental-room.entity';
import { RentalSet } from '../entities/rental-set.entity';
import { Deposit } from '../entities/deposit.entity';
import { Community } from '../entities/community.entity';

const user: any = { employeeId: 1, dataScope: 'company', storeIds: [1], groupIds: [], assignedStoreIds: [] };

function queryBuilder(result: () => any) {
  const qb: any = {};
  for (const method of ['where', 'andWhere', 'setLock']) qb[method] = jest.fn().mockReturnValue(qb);
  qb.getOne = jest.fn(async () => result());
  return qb;
}

function setup(entire = false) {
  const rentalSet: any = { id: 2, bizType: entire ? 'entire' : 'shared', status: 'rented', storeId: 3,
    tenantName: '整租租客', tenantPhone: '13800000000', tenantLeaseStart: '2026-01-01', tenantLeaseEnd: '2026-12-31' };
  const room: any = { id: 101, setId: 2, status: 'rented', tenantId: 8, tenantName: '房间租客', tenantPhone: '13800000001',
    leaseStart: '2026-01-01', leaseEnd: '2026-12-31', cohabitantIds: [9] };
  const record: any = { id: 5, rentalSetId: 2, rentalRoomId: entire ? null : 101, status: 'pending', expectedDepositAmount: 0, storeId: 3, houseInfo: '测试小区 1-1-101', tenantName: '房间租客' };
  const deposits: any[] = [];
  const depositQb = { where: jest.fn().mockReturnThis(), setLock: jest.fn().mockReturnThis(), getMany: jest.fn(async () => deposits) };
  const qb = queryBuilder(() => record);
  const checkoutTxRepo = { createQueryBuilder: jest.fn(() => qb), create: jest.fn(data => ({ id: 5, ...data })),
    save: jest.fn(async data => ({ ...data })) };
  const roomRepo = { findOne: jest.fn(async () => room), save: jest.fn(async data => data) };
  const setRepo = { createQueryBuilder: jest.fn(() => queryBuilder(() => rentalSet)), save: jest.fn(async data => data) };
  const manager: any = { getRepository: jest.fn(entity => {
    if (entity === Checkout) return checkoutTxRepo;
    if (entity === RentalRoom) return roomRepo;
    if (entity === RentalSet) return setRepo;
    if (entity === Deposit) return { createQueryBuilder: () => depositQb };
    if (entity === Community) return { findOne: async () => ({ name: '测试小区' }) };
    throw new Error('Unexpected repository');
  }) };
  const transaction = jest.fn(async callback => callback(manager));
  const service = new CheckoutService({ manager: { transaction } } as any);
  const input: any = { rentalSetId: 2, rentalRoomId: entire ? undefined : 101, tenantName: '前端快照',
    houseInfo: '测试小区 1-1-101', checkoutDate: '2026-09-10' };
  return { service, input, room, rentalSet, record, qb, checkoutTxRepo, roomRepo, setRepo, transaction, deposits };
}

describe('checkout submission and approval', () => {
  it('blocks settlement with pending deposits even if called directly', async () => {
    const ctx = setup(); ctx.record.status = 'confirmed';
    ctx.deposits.push({ ...ctx.record, status: 'pending', depositAmount: 1000 });
    await expect(ctx.service.complete(5, user)).rejects.toThrow('未处置');
    expect(ctx.checkoutTxRepo.save).not.toHaveBeenCalled();
  });
  it.each(['refunded', 'deducted'])('allows settlement only after disposition: %s', async status => {
    const ctx = setup(); ctx.record.status = 'confirmed'; ctx.record.expectedDepositAmount = 1000;
    ctx.deposits.push({ ...ctx.record, status, depositAmount: 1000 });
    expect((await ctx.service.complete(5, user)).status).toBe('completed');
  });
  it('blocks positive or unknown deposit when no matching deposit exists', async () => {
    const ctx = setup(); ctx.record.status = 'confirmed'; ctx.record.expectedDepositAmount = 1000;
    await expect(ctx.service.complete(5, user)).rejects.toThrow('未找到对应押金');
    ctx.record.expectedDepositAmount = null;
    await expect(ctx.service.complete(5, user)).rejects.toThrow('未找到对应押金');
  });
  it.each([false, true])('marks the target as pending approval immediately (entire=%s)', async entire => {
    const ctx = setup(entire);
    ctx.qb.getOne.mockResolvedValue(null);
    const result = await ctx.service.create(ctx.input, user);
    expect((entire ? ctx.rentalSet : ctx.room).status).toBe('checkout');
    expect(result).toMatchObject({ status: 'pending', storeId: 3, rentalSetId: 2 });
    expect(ctx.transaction).toHaveBeenCalledTimes(1);
    if (!entire) expect(ctx.rentalSet.status).toBe('rented');
  });

  it.each([false, true])('releases the target on approval, before settlement (entire=%s)', async entire => {
    const ctx = setup(entire);
    const target = entire ? ctx.rentalSet : ctx.room;
    target.status = 'checkout';
    const result = await ctx.service.confirm(5, user);
    expect(result.status).toBe('confirmed');
    expect(target).toMatchObject({ status: 'vacant', tenantName: null, tenantPhone: null });
    if (!entire) {
      expect(ctx.room).toMatchObject({ tenantId: null, leaseStart: null, leaseEnd: null, cohabitantIds: null });
      expect(ctx.setRepo.save).not.toHaveBeenCalled();
    } else {
      expect(ctx.rentalSet).toMatchObject({ tenantLeaseStart: null, tenantLeaseEnd: null });
    }
  });

  it('refuses a repeated submission after the first has changed the room status', async () => {
    const ctx = setup();
    ctx.qb.getOne.mockResolvedValue(null);
    await ctx.service.create(ctx.input, user);
    await expect(ctx.service.create(ctx.input, user)).rejects.toThrow('仅已出租');
    expect(ctx.checkoutTxRepo.save).toHaveBeenCalledTimes(1);
  });

  it('refuses another pending request even if a stale editor reset the room status', async () => {
    const ctx = setup();
    await expect(ctx.service.create(ctx.input, user)).rejects.toThrow('已有待审批');
    expect(ctx.roomRepo.save).not.toHaveBeenCalled();
  });

  it('rejects missing room links without changing the parent property', async () => {
    const ctx = setup();
    ctx.roomRepo.findOne.mockResolvedValue(null);
    await expect(ctx.service.create(ctx.input, user)).rejects.toThrow('房间不存在');
    expect(ctx.setRepo.save).not.toHaveBeenCalled();
  });

  it('does not approve twice or release a new occupant after the status changed', async () => {
    const ctx = setup();
    await expect(ctx.service.confirm(5, user)).rejects.toThrow('状态已变化');
    ctx.record.status = 'confirmed';
    await expect(ctx.service.confirm(5, user)).rejects.toThrow('仅待审批');
    expect(ctx.roomRepo.save).not.toHaveBeenCalled();
  });

  it('settles an old checkout without touching the room or its new occupant', async () => {
    const ctx = setup();
    ctx.record.status = 'confirmed';
    const before = { ...ctx.room };
    const result = await ctx.service.complete(5, user);
    expect(result.status).toBe('completed');
    expect(ctx.room).toEqual(before);
    expect(ctx.roomRepo.findOne).not.toHaveBeenCalled();
    expect(ctx.roomRepo.save).not.toHaveBeenCalled();
  });

  it('requires an explicit property link instead of silently skipping the room update', async () => {
    const ctx = setup();
    await expect(ctx.service.create({ ...ctx.input, rentalSetId: undefined }, user)).rejects.toThrow('必须关联');
    ctx.record.rentalSetId = null;
    await expect(ctx.service.confirm(5, user)).rejects.toThrow('未关联房源');
  });
});
