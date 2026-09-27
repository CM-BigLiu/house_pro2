import { RentalService } from './rental.service';
import { RENTAL_LANDLORD_FIELDS } from '../../../common/utils/rental-privacy.util';

const owner = { employeeId: 7, dataScope: 'company', permissions: [] } as any;
const other = { ...owner, employeeId: 8 };
const base = { id: 1, creatorId: 7, storeId: 1, bizType: 'entire', code: 'ZJ-TEST', rooms: [],
  landlordName: '测试房东', landlordPhone: '13800000000', landlordRent: 1000, landlordDeposit: 500,
  leaseStart: '2026-01-01', leaseEnd: '2027-01-01', landlordPaymentMethod: 'monthly',
  followUpContent: '私有跟进', isManaged: false };

function setup() {
  const record = { ...base };
  const qb: any = {};
  for (const method of ['leftJoinAndSelect', 'where', 'andWhere', 'orderBy', 'skip', 'take']) qb[method] = jest.fn().mockReturnValue(qb);
  qb.getOne = jest.fn(async () => ({ ...record }));
  qb.getManyAndCount = jest.fn(async () => [[{ ...record }], 1]);
  const save = jest.fn(async value => Object.assign(record, value));
  const repo = { create: jest.fn(value => value), save };
  const transaction = jest.fn(async callback => callback({ getRepository: () => repo }));
  const service = new RentalService({ createQueryBuilder: () => qb, manager: { transaction } } as any, {} as any);
  return { service, record, save, qb, transaction };
}

describe('租房托管与房东隐私', () => {
  it('托管、重复托管、取消托管保存同一档案，不删除房源', async () => {
    const { service, record } = setup();
    await service.updateSet(1, { isManaged: true }, owner);
    expect(record.isManaged).toBe(true);
    await service.updateSet(1, { isManaged: true }, owner);
    await service.updateSet(1, { isManaged: false }, owner);
    expect(record).toMatchObject({ id: 1, isManaged: false, landlordName: '测试房东' });
  });

  it('取消托管无需补齐遗留合同信息', async () => {
    const { service, record } = setup();
    record.leaseStart = ''; record.isManaged = true;
    await expect(service.updateSet(1, { isManaged: false }, owner)).resolves.toMatchObject({ isManaged: false });
  });

  it('禁止通过写接口更改他人私有字段及托管状态，但允许保存普通字段', async () => {
    const { service, transaction, record } = setup();
    for (const field of RENTAL_LANDLORD_FIELDS) {
      await expect(service.updateSet(1, { [field]: null }, other)).rejects.toMatchObject({ status: 403 });
    }
    expect(transaction).not.toHaveBeenCalled();
    await service.updateSet(1, { address: '新地址' }, other);
    expect(record.landlordName).toBe('测试房东');
  });

  it.each([owner, { ...other, roleCodes: ['super_admin'] }, { ...other, roleCodes: ['company_admin'] }])('填写人和管理员能看私有信息 %j', async user => {
    const { service } = setup();
    expect(await service.findSet(1, user)).toMatchObject({ canViewLandlordInfo: true, landlordName: '测试房东' });
  });

  it('全公司数据权限不能读取他人私有字段，列表和详情一致', async () => {
    const { service } = setup();
    const detail = await service.findSet(1, other);
    const { list } = await service.findSets({}, other);
    for (const record of [detail, list[0]]) {
      expect(record.canViewLandlordInfo).toBe(false);
      for (const field of RENTAL_LANDLORD_FIELDS) expect(record).not.toHaveProperty(field);
      expect(record.code).toBe('ZJ-TEST');
    }
  });

  it('不完整合同不能托管，保存失败不会改变状态', async () => {
    const { service, record, save } = setup();
    await expect(service.updateSet(1, { isManaged: true, landlordPhone: '' }, owner)).rejects.toMatchObject({ status: 400 });
    expect(save).not.toHaveBeenCalled();
    save.mockRejectedValueOnce(new Error('数据库失败'));
    await expect(service.updateSet(1, { isManaged: true }, owner)).rejects.toThrow('数据库失败');
    expect(record.isManaged).toBe(false);
  });

  it('房东电话搜索只搜索本人记录', async () => {
    const { service, qb } = setup();
    await service.findSets({ landlordPhone: '138' }, other);
    expect(qb.andWhere).toHaveBeenCalledWith('rs.creatorId = :landlordOwnerId', { landlordOwnerId: 8 });
  });
});
