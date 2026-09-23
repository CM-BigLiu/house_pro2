import { BadRequestException } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { ReservePropertyService } from './reserve-property.service';
import { sanitizeReserveDetails } from './reserve-details';

const user = { employeeId: 7, dataScope: 'company', storeIds: [1] } as any;

function queryBuilderMock(item?: any) {
  const qb: any = {};
  ['leftJoinAndSelect', 'where', 'andWhere', 'skip', 'take'].forEach(method => {
    qb[method] = jest.fn().mockReturnValue(qb);
  });
  qb.getOne = jest.fn().mockResolvedValue(item);
  qb.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
  return qb;
}

describe('储备房源类型与可选详情', () => {
  it('租房详情只保留租房字段和合法的合租房间', () => {
    expect(sanitizeReserveDetails('rent', {
      bizType: 'shared', landlordDeposit: 5000, rent: 2000, rooms: [{ roomNo: 'A', rentPrice: 1000, ignored: 'x' }],
      title: '售房标题', creatorId: 999,
    })).toEqual({ bizType: 'shared', landlordDeposit: 5000, rent: 2000, rooms: [{ roomNo: 'A', rentPrice: 1000 }] });
    expect(sanitizeReserveDetails('rent', { deposit: 1500 })).toEqual({ landlordDeposit: 1500 });
    expect(() => sanitizeReserveDetails('rent', { rooms: [{ rentPrice: -1 }] })).toThrow(BadRequestException);
  });

  it('售房详情只保留售房字段，拒绝非法数值和标签', () => {
    expect(sanitizeReserveDetails('sale', {
      title: '测试房源', layoutRooms: 2, unitPrice: 12500, tags: [' 学区 ', ''],
      tenantName: '不应带入的租客',
    })).toEqual({ title: '测试房源', layoutRooms: 2, unitPrice: 12500, tags: ['学区'] });
    expect(() => sanitizeReserveDetails('sale', { unitPrice: -10 })).toThrow(BadRequestException);
    expect(() => sanitizeReserveDetails('sale', { tags: [123] })).toThrow(BadRequestException);
  });

  it('新建售房储备默认未售，旧调用未传类型时默认租房', async () => {
    const repo: any = {
      create: jest.fn(value => value),
      save: jest.fn(value => Promise.resolve({ ...value, id: 1 })),
    };
    const service = new ReservePropertyService(repo, {} as any);
    await service.create({ storeId: 1, reserveType: 'sale', details: { title: '待售房源' } }, user);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      reserveType: 'sale', status: 'not_sold', details: { title: '待售房源' }, creatorId: 7,
    }));
    await service.create({ storeId: 1, address: '测试地址' }, user);
    expect(repo.create).toHaveBeenLastCalledWith(expect.objectContaining({
      reserveType: 'rent', status: 'not_rented', details: {},
    }));
    await expect(service.create({ storeId: 1 }, user)).rejects.toThrow(BadRequestException);
  });

  it('切换储备类型时清除旧类型详情并重设状态', async () => {
    const existing = {
      id: 4, storeId: 1, creatorId: 7, reserveType: 'rent', status: 'not_rented',
      address: '测试地址', details: { bizType: 'shared', rooms: [{ roomNo: 'A' }] },
    };
    const qb = queryBuilderMock(existing);
    const repo: any = { createQueryBuilder: jest.fn().mockReturnValue(qb), save: jest.fn() };
    const service = new ReservePropertyService(repo, {} as any);
    jest.spyOn(service, 'findOne').mockResolvedValue({} as any);

    await service.update(4, { reserveType: 'sale', details: { title: '待售', tenantName: '旧租客' } }, user);
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({
      reserveType: 'sale', status: 'not_sold', details: { title: '待售' }, creatorId: 7,
    }));
    expect(repo.save.mock.calls[0][0].community).toBeUndefined();
  });

  it('售房储备不能进入租房签约流程', async () => {
    const qb = queryBuilderMock({ id: 5, reserveType: 'sale', status: 'not_sold' });
    const service = new ReservePropertyService({ createQueryBuilder: jest.fn().mockReturnValue(qb) } as any, {} as any);
    await expect(service.signContract(5, {
      bizType: 'entire', leaseStart: '2026-09-01', leaseEnd: '2027-08-31', landlordRent: 1000,
    }, user)).rejects.toThrow(BadRequestException);
  });

  it('签约时可补齐储备房源缺失的必填资料并同步保存', async () => {
    const existing = {
      id: 6, reserveType: 'rent', status: 'not_rented', details: { deposit: 1500 },
      storeId: 1, creatorId: 7,
    };
    const qb = queryBuilderMock(existing);
    const setRepo = {
      exist: jest.fn().mockResolvedValue(false),
      create: jest.fn(value => value),
      save: jest.fn(async value => ({ ...value, id: 20 })),
    };
    const roomRepo = {
      create: jest.fn(value => value),
      save: jest.fn(async value => value),
    };
    const reserveRepo = { update: jest.fn().mockResolvedValue({}) };
    const manager = {
      getRepository: jest.fn(entity => {
        if (entity.name === 'RentalSet') return setRepo;
        if (entity.name === 'RentalRoom') return roomRepo;
        return reserveRepo;
      }),
    };
    const repo: any = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      manager: { transaction: jest.fn(async callback => callback(manager)) },
    };
    const service = new ReservePropertyService(repo, {} as any);

    await service.signContract(6, {
      bizType: 'entire', leaseStart: '2026-09-23', leaseEnd: '2027-09-22',
      landlordRent: 3000, communityId: 8, address: '测试路 1 号',
      roomNo: '101', layout: '2室1厅', ownerName: '测试房东',
    }, user);

    expect(setRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      communityId: 8, address: '测试路 1 号', roomNo: '101',
      layout: '2室1厅', landlordName: '测试房东', landlordDeposit: 1500, deposit: 0,
    }));
    expect(roomRepo.create).toHaveBeenCalledWith(expect.objectContaining({ depositAmount: 0 }));
    expect(reserveRepo.update).toHaveBeenCalledWith(6, expect.objectContaining({
      status: 'taken', communityId: 8, address: '测试路 1 号',
      roomNo: '101', layout: '2室1厅', ownerName: '测试房东',
    }));
  });

  it('签约资料仍有缺失时一次提示全部缺失项', async () => {
    const qb = queryBuilderMock({
      id: 7, reserveType: 'rent', status: 'not_rented', details: {}, storeId: 1,
    });
    const service = new ReservePropertyService({ createQueryBuilder: jest.fn().mockReturnValue(qb) } as any, {} as any);

    await expect(service.signContract(7, {
      bizType: 'entire', leaseStart: '2026-09-23', leaseEnd: '2027-09-22', landlordRent: 3000,
    }, user)).rejects.toThrow('请补充签约必填信息：小区、地址、房号、户型、房东姓名');
  });

  it('列表租售类型筛选与关键字条件按分组添加', async () => {
    const qb = queryBuilderMock();
    const service = new ReservePropertyService({ createQueryBuilder: jest.fn().mockReturnValue(qb) } as any, {} as any);
    await service.findAll({ reserveType: 'sale', keyword: ' 待售 ' }, user);
    expect(qb.andWhere).toHaveBeenCalledWith('r.reserveType = :reserveType', { reserveType: 'sale' });
    const bracket = qb.andWhere.mock.calls.find(([condition]: [unknown]) => condition instanceof Brackets);
    expect(bracket).toBeDefined();
  });

  it('仅允许删除尚未流转的储备房源', async () => {
    const availableQb = queryBuilderMock({ id: 8, status: 'not_rented', reserveType: 'rent' });
    const availableRepo: any = {
      createQueryBuilder: jest.fn().mockReturnValue(availableQb),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    await expect(new ReservePropertyService(availableRepo, {} as any).remove(8, user)).resolves.toEqual({ id: 8 });
    expect(availableRepo.delete).toHaveBeenCalledWith(8);

    const signedQb = queryBuilderMock({ id: 9, status: 'taken', reserveType: 'rent' });
    const signedRepo: any = { createQueryBuilder: jest.fn().mockReturnValue(signedQb), delete: jest.fn() };
    await expect(new ReservePropertyService(signedRepo, {} as any).remove(9, user)).rejects.toThrow('不能删除');
    expect(signedRepo.delete).not.toHaveBeenCalled();
  });
});
