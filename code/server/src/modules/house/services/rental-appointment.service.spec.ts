import { RentalAppointmentService } from './rental-appointment.service';
import { NotFoundException } from '@nestjs/common';

function createQueryBuilder(result: any = null) {
  const qb: any = {};
  for (const method of ['where', 'andWhere', 'leftJoinAndSelect', 'orderBy', 'addOrderBy', 'skip', 'take']) {
    qb[method] = jest.fn().mockReturnValue(qb);
  }
  qb.getOne = jest.fn().mockResolvedValue(result);
  qb.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
  return qb;
}

describe('RentalAppointmentService', () => {
  it.each([
    ['company', undefined],
    ['store', 'appointment.storeId IN'],
    ['self', 'appointment.responsibleEmployeeId ='],
  ])('applies %s appointment record scope', async (dataScope, expectedWhere) => {
    const appointmentQb = createQueryBuilder();
    const service = new RentalAppointmentService(
      { createQueryBuilder: () => appointmentQb } as any,
      {} as any,
      {} as any,
    );
    await service.findAll({}, {
      employeeId: 7, name: '测试人员', mobile: 'test', dataScope,
      storeIds: [3], groupIds: [], assignedStoreIds: [], permissions: [],
    });
    const clauses = appointmentQb.andWhere.mock.calls.map((call: any[]) => String(call[0]));
    if (expectedWhere) expect(clauses.some((clause: string) => clause.includes(expectedWhere))).toBe(true);
    else expect(appointmentQb.andWhere).not.toHaveBeenCalled();
  });

  it('always assigns the employee who clicked as the responsible person', async () => {
    const rentalSet = {
      id: 4, code: 'BJ004', building: '2', unit: '1', roomNo: '301', storeId: 3, groupId: 8,
      community: { name: '海淀家园' }, rooms: [],
    };
    const rentalQb = createQueryBuilder(rentalSet);
    const save = jest.fn(async (value) => ({ id: 10, ...value }));
    const appointmentRepo = { create: jest.fn((value) => value), save };
    const service = new RentalAppointmentService(
      appointmentRepo as any,
      { createQueryBuilder: () => rentalQb } as any,
      {} as any,
    );
    const user: any = {
      employeeId: 12, name: '李经纪人', mobile: 'agent', dataScope: 'self',
      storeIds: [3], groupIds: [8], assignedStoreIds: [], permissions: [],
    };

    const result = await service.create({
      rentalSetId: 4,
      scheduledAt: new Date(Date.now() + 3_600_000).toISOString(),
      remark: '地铁口集合',
    }, user);

    expect(result).toMatchObject({
      responsibleEmployeeId: 12,
      responsibleEmployeeName: '李经纪人',
      storeId: 3,
      groupId: 8,
      propertyCode: 'BJ004',
      customerId: null,
      customerName: null,
    });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('rejects an appointment in the past', async () => {
    const service = new RentalAppointmentService({} as any, {} as any, {} as any);
    await expect(service.create({
      rentalSetId: 1,
      scheduledAt: new Date(Date.now() - 60_000).toISOString(),
    }, {} as any)).rejects.toThrow('约看时间必须晚于当前时间');
  });

  it('validates customer visibility with the current user and saves the server-sourced customer name', async () => {
    const user: any = { employeeId: 7, dataScope: 'self', name: '经纪人' };
    const findOne = jest.fn().mockResolvedValue({ id: 42, name: '可见客户' });
    const save = jest.fn(async (value) => value);
    const service = new RentalAppointmentService(
      { create: (value) => value, save } as any,
      { createQueryBuilder: () => createQueryBuilder({ id: 4, code: 'BJ004', rooms: [] }) } as any,
      { findOne } as any,
    );

    const result = await service.create({
      rentalSetId: 4, customerId: 42, customerName: '伪造姓名',
      scheduledAt: new Date(Date.now() + 3_600_000).toISOString(),
    } as any, user);

    expect(findOne).toHaveBeenCalledWith(42, user);
    expect(result).toMatchObject({ customerId: 42, customerName: '可见客户' });
  });

  it('rejects an inaccessible customer before saving the appointment', async () => {
    const save = jest.fn();
    const service = new RentalAppointmentService(
      { create: (value) => value, save } as any,
      { createQueryBuilder: () => createQueryBuilder({ id: 4, code: 'BJ004', rooms: [] }) } as any,
      { findOne: jest.fn().mockRejectedValue(new NotFoundException('客户不存在或无权访问')) } as any,
    );

    await expect(service.create({
      rentalSetId: 4, customerId: 99,
      scheduledAt: new Date(Date.now() + 3_600_000).toISOString(),
    }, { employeeId: 7, dataScope: 'self' } as any)).rejects.toThrow('客户不存在或无权访问');
    expect(save).not.toHaveBeenCalled();
  });
});
