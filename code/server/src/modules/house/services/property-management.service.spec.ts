import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PropertyManagementQueryDto } from '../controllers/property-management.controller';
import { PropertyManagementService } from './property-management.service';

function builder(rows = []) {
  const qb: any = {};
  for (const method of ['leftJoin', 'from', 'andWhere', 'select', 'addSelect', 'orderBy', 'addOrderBy', 'offset', 'limit']) {
    qb[method] = jest.fn().mockReturnValue(qb);
  }
  qb.getCount = jest.fn().mockResolvedValue(3);
  qb.getRawMany = jest.fn().mockResolvedValue(rows);
  qb.getRawOne = jest.fn().mockResolvedValue({ total: '3' });
  qb.clone = jest.fn().mockReturnValue(qb);
  return qb;
}

describe('房管房管理', () => {
  const baseUser = { employeeId: 4, permissions: ['house:property_management'], dataScope: 'company' } as any;

  it('房源只选择展示字段、房东租期和未结清应付租金账单', async () => {
    const qb = builder([{ id: 1, nextLandlordPaymentDate: null }]);
    const service = new PropertyManagementService({ createQueryBuilder: () => qb } as any);
    const result = await service.properties({ keyword: ' 小区 ', page: 2, pageSize: 20 }, baseUser);
    expect(result.total).toBe(3);
    expect(qb.andWhere).toHaveBeenCalledWith('rs.isManaged = :isManaged', { isManaged: true });
    expect(qb.andWhere).toHaveBeenCalledWith('rs.creatorId = :employeeId', { employeeId: 4 });
    expect(qb.andWhere).toHaveBeenCalledWith(expect.stringContaining('ILIKE'), { keyword: '%小区%' });
    expect(qb.offset).toHaveBeenCalledWith(20);
    const sql = qb.addSelect.mock.calls[0][0];
    expect(sql).toContain('MIN(b."dueDate")');
    expect(sql).toContain("b.status = 'pending_pay'");
    expect(sql).toContain('b.amount > COALESCE(b."actualAmount", 0)');
    expect(sql).toContain('b.store_id = rs.store_id');
    expect(qb.select.mock.calls[0][0].join(' ')).not.toMatch(/Phone|IdCard|BankCard/);
  });

  it.each([
    [{ dataScope: 'self' }, 'tenant.creator_id = :employeeId', { employeeId: 4 }],
    [{ dataScope: 'store', storeIds: [1] }, 'tenant.creator_id = :employeeId', { employeeId: 4 }],
    [{ dataScope: 'group', groupIds: [2] }, 'tenant.creator_id = :employeeId', { employeeId: 4 }],
    [{ dataScope: 'assigned', assignedStoreIds: [3] }, 'tenant.creator_id = :employeeId', { employeeId: 4 }],
    [{ dataScope: 'company' }, 'tenant.creator_id = :employeeId', { employeeId: 4 }],
    [{ dataScope: 'store', storeIds: [] }, 'tenant.creator_id = :employeeId', { employeeId: 4 }],
  ])('租客查询遵守范围 %j', async (scope, condition, params) => {
    const qb = builder();
    const service = new PropertyManagementService({ manager: { createQueryBuilder: () => qb } } as any);
    await service.tenants({}, { ...baseUser, ...scope });
    expect(qb.andWhere).toHaveBeenCalledWith(condition, params);
  });

  it('整租、合租合同合并后统一计数、分页，签约时间不冒用租期开始日期', async () => {
    const qb = builder([{ key: 'room-1', signedAt: null }]);
    const service = new PropertyManagementService({ manager: { createQueryBuilder: () => qb } } as any);
    const result = await service.tenants({ keyword: ' 租客 ', page: 3, pageSize: 10 }, baseUser);
    const sql = qb.from.mock.calls[0][0];
    expect(sql).toContain('UNION ALL');
    expect(sql.match(/rs.is_managed = true/g)).toHaveLength(2);
    expect(sql).toContain(`rs."bizType" = 'entire'`);
    expect(sql).toContain(`rs."bizType" = 'shared'`);
    expect(sql).toContain('MAX(a.signed_at)');
    expect(sql).toContain(`act.details->>'leaseStart' = rr."leaseStart"::text`);
    expect(sql).toContain(`b.payer = rr."tenantName"`);
    expect(sql).toContain(`rs.code || '-' || rr."roomNo"`);
    expect(sql).toContain('fin_contract_schedule');
    expect(sql).toContain('d.room_id IS NOT DISTINCT FROM rr.id');
    expect(sql).toContain(`NULLIF(TRIM(rr."tenantName"), '') IS NOT NULL`);
    expect(qb.offset).toHaveBeenCalledWith(20);
    expect(qb.limit).toHaveBeenCalledWith(10);
    expect(result).toEqual({ list: [{ key: 'room-1', signedAt: null }], total: 3, page: 3, pageSize: 10 });
  });

  it.each([{ page: '0' }, { page: '-1' }, { pageSize: '101' }, { pageSize: '1.5' }, { keyword: 'x'.repeat(101) }])('拒绝无效分页参数 %j', async (query) => {
    expect((await validate(plainToInstance(PropertyManagementQueryDto, query))).length).toBeGreaterThan(0);
  });

  it('分页参数转换为数字并提供默认值', async () => {
    const query = plainToInstance(PropertyManagementQueryDto, { page: '2' });
    expect(await validate(query)).toHaveLength(0);
    expect(query).toMatchObject({ page: 2, pageSize: 20 });
  });

  it.each(['super_admin', 'company_admin'])('管理员 %s 可查看所有已托管房源和租客', async role => {
    const qb = builder();
    const service = new PropertyManagementService({ createQueryBuilder: () => qb, manager: { createQueryBuilder: () => qb } } as any);
    const user = { ...baseUser, roleCodes: [role] };
    await service.properties({}, user);
    await service.tenants({}, user);
    expect(qb.andWhere.mock.calls.some(([sql]) => sql.includes('creator'))).toBe(false);
  });
});
