import { Brackets } from 'typeorm';
import { SaleService } from './sale.service';
import { SaleStatus } from '../../../common/enums/status.enum';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSalePropertyDto, UpdateSalePropertyDto } from '../controllers/sale.controller';

function setup() {
  const item = { id: 1, status: 'pre_publish', salePrice: '1234567.89', buildingArea: '88.88', community: { name: 'QA' }, ownerName: 'QA', ownerPhone: '19900009091' };
  const qb: any = {};
  for (const key of ['leftJoinAndSelect', 'leftJoin', 'where', 'andWhere', 'orderBy', 'skip', 'take']) qb[key] = jest.fn().mockReturnValue(qb);
  qb.getManyAndCount = jest.fn().mockResolvedValue([[item], 1]);
  qb.getOne = jest.fn().mockResolvedValue(item);
  const repo = { createQueryBuilder: jest.fn().mockReturnValue(qb), update: jest.fn().mockResolvedValue({ affected: 1 }), create: jest.fn((v) => v), save: jest.fn((v) => v) };
  const blacklist = { check: jest.fn().mockResolvedValue([]) };
  return { service: new SaleService(repo as any, blacklist as any), qb, repo, blacklist };
}
const admin: any = { employeeId: 1, permissions: ['*'], dataScope: 'company', storeIds: [1] };

describe('sale functional regressions', () => {
  it('brackets keyword OR clauses before the self scope and supports the advertised fields', async () => {
    const { service, qb } = setup();
    const result = await service.findAll({ keyword: ' QA ' }, { ...admin, dataScope: 'self' });
    expect(qb.andWhere).toHaveBeenCalledWith('s.creatorId = :employeeId', { employeeId: 1 });
    const bracket = qb.andWhere.mock.calls.find(([v]: any[]) => v instanceof Brackets)[0];
    const sub = { orWhere: jest.fn() };
    bracket.whereFactory(sub);
    expect(sub.orWhere).toHaveBeenCalledWith('s.ownerName ILIKE :kw', { kw: '%QA%' });
    expect(sub.orWhere).toHaveBeenCalledWith('community.name ILIKE :kw', { kw: '%QA%' });
    expect(sub.orWhere).toHaveBeenCalledWith('s.roomNo ILIKE :kw', { kw: '%QA%' });
    expect(result.list[0]).toMatchObject({ totalPrice: 1234567.89, buildingArea: 88.88 });
  });
  it('does not allow an unprivileged list read', async () => {
    await expect(setup().service.findAll({}, { ...admin, permissions: [] })).rejects.toThrow('无操作权限');
  });
  it('rejects invalid pagination', async () => {
    await expect(setup().service.findAll({ page: -1 }, admin)).rejects.toThrow('分页参数');
  });
  it('filters legacy bargain records under the negotiation status', async () => {
    const { service, qb } = setup();
    await service.findAll({ status: 'price_negotiation' }, admin);
    expect(qb.andWhere).toHaveBeenCalledWith('s.status IN (:...statuses)', { statuses: ['price_negotiation', 'bargain'] });
  });
  it('persists edited location and price without writing the stale community relation', async () => {
    const { service, repo } = setup();
    await service.update(1, { communityId: 2, roomNo: 'QA2', salePrice: 9.99 }, admin);
    expect(repo.update).toHaveBeenCalledWith(1, { communityId: 2, roomNo: 'QA2', salePrice: 9.99 });
  });
  it('rejects status and ownership changes through editing, including the unified alias', async () => {
    const { service } = setup();
    await expect(service.update(1, { status: 'sold' }, admin)).rejects.toThrow('不可通过编辑');
    await expect(service.update(1, { creatorId: 2 }, admin)).rejects.toThrow('不可通过编辑');
  });
  it('checks the blacklist when changing the owner', async () => {
    const { service, repo, blacklist } = setup();
    blacklist.check.mockResolvedValue([{ mobile: '19900009092' }] as never);
    await expect(service.update(1, { ownerName: 'blocked' }, admin)).rejects.toThrow('业主信息命中黑名单');
    expect(repo.update).not.toHaveBeenCalled();
  });
  it('requires the status permission and enforces valid transitions', async () => {
    const { service } = setup();
    await expect(service.changeStatus(1, SaleStatus.PUBLISHED, { ...admin, permissions: ['sale:edit', 'house:sale'] })).rejects.toThrow('无操作权限');
    await expect(service.changeStatus(1, SaleStatus.SOLD, admin)).rejects.toThrow('不允许');
  });
  it('changes status using compare-and-swap and rejects a concurrent change', async () => {
    const { service, repo } = setup();
    await service.changeStatus(1, SaleStatus.PUBLISHED, admin);
    expect(repo.update).toHaveBeenCalledWith({ id: 1, status: 'pre_publish' }, { status: 'published' });
    repo.update.mockResolvedValue({ affected: 0 });
    await expect(service.changeStatus(1, SaleStatus.PUBLISHED, admin)).rejects.toThrow('已变化');
  });
  it('keeps all editable DTO fields, while rejecting direct status and negative price', async () => {
    const dto = plainToInstance(UpdateSalePropertyDto, { roomNo: 'QA2', communityId: 2, buildingArea: 88.88, salePrice: 100, orientation: 'south' });
    expect(await validate(dto, { whitelist: true })).toHaveLength(0);
    expect(dto).toMatchObject({ roomNo: 'QA2', communityId: 2, buildingArea: 88.88, salePrice: 100, orientation: 'south' });
    expect((await validate(plainToInstance(UpdateSalePropertyDto, { status: 'sold' }))).some((e) => e.property === 'status')).toBe(true);
    expect((await validate(plainToInstance(CreateSalePropertyDto, { salePrice: -1 }))).some((e) => e.property === 'salePrice')).toBe(true);
  });
});
