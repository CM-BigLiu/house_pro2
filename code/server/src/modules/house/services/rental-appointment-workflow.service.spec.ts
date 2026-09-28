import { RentalAppointmentService } from './rental-appointment.service';

function setup(input: { appointment?: any; rental?: any; room?: any } = {}) {
  const appointment = input.appointment === null ? null : { id: 5, rentalSetId: 4, customerId: 42, status: 'scheduled', ...input.appointment };
  const rental = { id: 4, code: 'BJ004', bizType: 'entire', status: 'vacant', storeId: 3, rooms: [], ...input.rental };
  function qb(result: any) {
    const query: any = {};
    for (const method of ['andWhere', 'where', 'setLock', 'leftJoinAndSelect']) query[method] = jest.fn().mockReturnValue(query);
    query.getOne = jest.fn().mockResolvedValue(result);
    return query;
  }
  const appointmentQb = qb(appointment);
  const rentalQb = qb(rental);
  const repo = { createQueryBuilder: () => appointmentQb, create: (value: any) => value,
    save: jest.fn(async (value: any) => ({ id: value.id || 9, ...value })), manager: {} as any };
  const setRepo = { createQueryBuilder: () => rentalQb, save: jest.fn(async (value) => value) };
  const actionRepo = { create: (value) => value, save: jest.fn(async (value) => value) };
  const roomRepo = { findOne: jest.fn().mockResolvedValue(input.room || { id: 30, setId: 4, status: 'vacant' }), save: jest.fn() };
  const manager: any = { getRepository: (entity) => ({ RentalAppointment: repo, RentalSet: setRepo,
    RentalAppointmentAction: actionRepo, RentalRoom: roomRepo,
    Deal: { create: (value) => value, save: jest.fn(async value => value) }, Customer: { update: jest.fn() } }[entity.name]) };
  repo.manager.transaction = jest.fn(async (callback) => callback(manager));
  const findOne = jest.fn().mockResolvedValue({ id: 42, name: '真实客户', mobile: '13800001234', customerType: 'tenant' });
  const service = new RentalAppointmentService(repo as any, setRepo as any, { findOne } as any);
  return { service, repo, setRepo, actionRepo, roomRepo, appointmentQb, rentalQb, findOne };
}

const user: any = { employeeId: 7, name: '当前经纪人', dataScope: 'self', storeIds: [3], groupIds: [], permissions: [] };
const contract = { leaseStart: '2026-10-01', leaseEnd: '2027-09-30', rent: 4500, deposit: 4500, paymentMethod: 'monthly' };

describe('Rental appointment workflow', () => {
  it('returns the authorized customer contact and selects managed-tenant contract fields', async () => {
    const test = setup({ rental: { isManaged: true }, appointment: { customerName: '旧姓名', propertyName: '约看房屋地址' } });
    const result = await test.service.signingContext(5, user);
    expect(test.findOne).toHaveBeenCalledWith(42, user);
    expect(result).toMatchObject({ customerName: '真实客户', customerPhone: '13800001234', workflowType: 'tenant', propertyAddress: '约看房屋地址' });
  });
  it('checks record scope before creating a follow-up', async () => {
    const test = setup({ appointment: null });
    await expect(test.service.followUp(5, '客户满意', user)).rejects.toMatchObject({ status: 403 });
    expect(test.appointmentQb.andWhere).toHaveBeenCalledWith('appointment.responsibleEmployeeId = :employeeId', { employeeId: 7 });
    expect(test.actionRepo.save).not.toHaveBeenCalled();
  });

  it('records the acting employee and completes the viewing in the same transaction', async () => {
    const test = setup();
    await test.service.followUp(5, '  客户满意  ', user);
    expect(test.repo.manager.transaction).toHaveBeenCalledTimes(1);
    expect(test.actionRepo.save).toHaveBeenCalledWith(expect.objectContaining({ appointmentId: 5, action: 'follow_up', content: '客户满意', employeeId: 7 }));
    expect(test.repo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }));
    expect(test.appointmentQb.setLock).toHaveBeenCalledWith('pessimistic_write');
  });

  it('updates the entire rental from the authorized customer and persists contract details', async () => {
    const test = setup();
    const result = await test.service.sign(5, { ...contract, tenantName: '伪造姓名', tenantPhone: '13900000000' }, user);
    expect(test.findOne).toHaveBeenCalledWith(42, user);
    expect(test.setRepo.save).toHaveBeenCalledWith(expect.objectContaining({ tenantName: '真实客户', tenantPhone: '13800001234',
      tenantLeaseStart: contract.leaseStart, tenantLeaseEnd: contract.leaseEnd, rent: 4500, status: 'rented' }));
    expect(result).toMatchObject({ status: 'signed', customerName: '真实客户' });
    expect(test.actionRepo.save).toHaveBeenCalledWith(expect.objectContaining({ action: 'sign', details: expect.objectContaining({ rent: 4500, leaseEnd: contract.leaseEnd }) }));
  });

  it('prevents signing the same appointment twice', async () => {
    const test = setup({ appointment: { status: 'signed' } });
    await expect(test.service.sign(5, contract, user)).rejects.toMatchObject({ status: 409 });
    expect(test.setRepo.save).not.toHaveBeenCalled();
    expect(test.actionRepo.save).not.toHaveBeenCalled();
  });

  it('never overwrites a tenant in an occupied shared room', async () => {
    const test = setup({ rental: { bizType: 'shared' }, room: { id: 30, status: 'rented', tenantName: '已有租客' } });
    await expect(test.service.sign(5, { ...contract, rentalRoomId: 30 }, user)).rejects.toMatchObject({ status: 409 });
    expect(test.roomRepo.save).not.toHaveBeenCalled();
    expect(test.repo.save).not.toHaveBeenCalled();
  });

  it('records a shared-room lease with the selected customer', async () => {
    const test = setup({ rental: { bizType: 'shared' } });
    await test.service.sign(5, { ...contract, rentalRoomId: 30 }, user);
    expect(test.roomRepo.save).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 42, tenantName: '真实客户', leaseEnd: contract.leaseEnd, status: 'rented' }));
    expect(test.repo.save).toHaveBeenCalledWith(expect.objectContaining({ rentalRoomId: 30, status: 'signed' }));
  });

  it('rejects reversed lease dates before any transaction or write', async () => {
    const test = setup();
    await expect(test.service.sign(5, { ...contract, leaseEnd: '2026-09-30' }, user)).rejects.toMatchObject({ status: 400 });
    expect(test.repo.manager.transaction).not.toHaveBeenCalled();
  });

  it('recommends with the original customer and creates a separately assigned appointment', async () => {
    const test = setup();
    const result = await test.service.recommend(5, { rentalSetId: 4, scheduledAt: new Date(Date.now() + 3600000).toISOString() }, user);
    expect(test.findOne).toHaveBeenCalledWith(42, user);
    expect(result).toMatchObject({ sourceAppointmentId: 5, customerId: 42, responsibleEmployeeId: 7, status: 'scheduled' });
    expect(test.actionRepo.save).toHaveBeenCalledWith(expect.objectContaining({ action: 'recommend', details: expect.objectContaining({ recommendedAppointmentId: 9 }) }));
  });

  it('rejects an attempt to switch the customer of a recommendation', async () => {
    const test = setup();
    await expect(test.service.recommend(5, { rentalSetId: 4, customerId: 99, scheduledAt: new Date(Date.now() + 3600000).toISOString() }, user)).rejects.toThrow('保持原约看的客户');
    expect(test.repo.save).not.toHaveBeenCalled();
  });
});
