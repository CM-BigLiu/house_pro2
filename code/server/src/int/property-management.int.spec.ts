import { DataSource, QueryRunner } from 'typeorm';
import { PropertyManagementService } from '../modules/house/services/property-management.service';
import { RentalSet } from '../modules/house/entities/rental-set.entity';
import { RentalRoom } from '../modules/house/entities/rental-room.entity';
import { Community } from '../modules/house/entities/community.entity';
import { RentalService } from '../modules/house/services/rental.service';

/** 使用独立事务验证真实 PostgreSQL 查询；负数 ID 不消耗业务序列，所有测试数据最终回滚。 */
describe('房管房管理 PostgreSQL 集成', () => {
  let ds: DataSource;
  let runner: QueryRunner;
  let service: PropertyManagementService;
  const keyword = `management-int-${Date.now()}`;
  const company = { employeeId: 1001, dataScope: 'company', roleCodes: ['company_admin'], permissions: ['house:property_management'] } as any;

  beforeAll(async () => {
    ds = new DataSource({ type: 'postgres', host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432), username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres', database: process.env.DB_DATABASE || 'house_pro',
      entities: [RentalSet, RentalRoom, Community], synchronize: false, logging: false });
    await ds.initialize();
    runner = ds.createQueryRunner(); await runner.connect(); await runner.startTransaction();
    service = new PropertyManagementService(runner.manager.getRepository(RentalSet));
    await runner.query(`INSERT INTO house_community (id, name, "cityId") VALUES (-900001, $1, 1)`, [keyword]);
    await runner.query(`INSERT INTO house_rental_set
      (id, code, "bizType", community_id, address, building, unit, "roomNo", layout, status,
       creator_id, store_id, group_id, "landlordName", "leaseStart", "leaseEnd", "tenantName", "tenantPhone", "tenantLeaseStart", "tenantLeaseEnd")
      VALUES (-900001, $1, 'entire', -900001, '测试地址', '1', '1', '101', '1室1厅', 'rented', 1001, 1, 11, '测试房东', '2026-10-01', '2029-09-30', $2, '13800001234', '2026-10-01', '2027-09-30'),
      (-900002, $3, 'shared', -900001, '测试地址', '1', '1', '102', '2室1厅', 'rented', 1002, 1, 12, '测试房东', '2026-10-01', '2029-09-30', NULL, NULL, NULL, NULL),
      (-900003, $4, 'entire', -900001, '测试地址', '1', '1', '103', '1室1厅', 'rented', 1002, 2, 12, '测试房东', NULL, NULL, $5, '13900001234', NULL, NULL)`,
    [`${keyword}-entire`, `${keyword}-张租客`, `${keyword}-shared`, `${keyword}-other`, `${keyword}-其他店租客`]);
    await runner.query(`UPDATE house_rental_set SET is_managed = true WHERE id IN (-900001, -900002, -900003)`);
    await runner.query(`INSERT INTO house_rental_room (id, set_id, "roomNo", status, creator_id, "tenantName", "tenantPhone", "leaseStart", "leaseEnd") VALUES
      (-900001, -900002, 'A', 'rented', 1002, $1, '13700001234', '2026-10-01', '2027-09-30'),
      (-900002, -900002, 'B', 'rented', 1002, $2, '13600001234', '2026-10-01', '2027-09-30'),
      (-900003, -900002, 'C', 'vacant', 1002, '   ', NULL, NULL, NULL)`, [`${keyword}-A租客`, `${keyword}-B租客`]);
    await runner.query(`INSERT INTO house_rental_appointment (id, rental_set_id, rental_room_id, customer_name, property_code, property_name,
      scheduled_at, responsible_employee_id, responsible_employee_name, store_id, status, signed_at) VALUES
      (-900001, -900001, NULL, $1, $2, '测试房源', now(), 1001, '测试', 1, 'signed', '2026-09-27T10:00:00Z'),
      (-900002, -900002, -900001, $3, $4, '测试房源', now(), 1002, '测试', 1, 'signed', '2025-09-27T10:00:00Z')`,
    [`${keyword}-张租客`, `${keyword}-entire`, `${keyword}-A租客`, `${keyword}-shared`]);
    await runner.query(`INSERT INTO house_rental_appointment_action (id, appointment_id, action, content, employee_id, employee_name, details) VALUES
      (-900001, -900001, 'sign', '测试签约', 1001, '测试', '{"leaseStart":"2026-10-01","leaseEnd":"2027-09-30"}'),
      (-900002, -900002, 'sign', '历史合同', 1002, '测试', '{"leaseStart":"2025-10-01","leaseEnd":"2026-09-30"}')`);
    const bills = [
      [-900001, `${keyword}-entire`, '2026-10-01', 'pending_pay', '企业', '测试房东', 0, 'rent', 1],
      [-900002, `${keyword}-entire`, '2026-09-20', 'paid', '企业', '测试房东', 1000, 'rent', 1],
      [-900003, `${keyword}-entire`, '2026-09-21', 'pending_pay', '企业', '测试房东', 0, 'deposit', 1],
      [-900004, `${keyword}-entire`, '2026-10-15', 'pending_receive', `${keyword}-张租客`, '企业', 0, 'rent', 1],
      [-900005, `${keyword}-shared-A`, '2026-09-01', 'overdue', `${keyword}-A租客`, '企业', 0, 'rent', 1],
      [-900006, `${keyword}-shared-B`, '2026-11-01', 'partial', `${keyword}-B租客`, '企业', 500, 'rent', 1],
      [-900007, `${keyword}-shared-A`, '2026-08-01', 'pending_receive', '以前的租客', '企业', 0, 'rent', 1],
      [-900008, `${keyword}-entire`, '2026-08-01', 'pending_pay', '企业', '测试房东', 0, 'rent', 2],
    ];
    for (const [id, code, date, status, payer, payee, actual, source, store] of bills) {
      await runner.query(`INSERT INTO fin_bill (id, store_id, "bizType", "bizId", "roomCode", "billSource", "dueDate", status, payer, payee, amount, "actualAmount", creator_id)
        VALUES ($1, $2, 'rent', $3, $3, $4, $5, $6, $7, $8, 1000, $9, 1001)`, [id, store, code, source, date, status, payer, payee, actual]);
    }
  }, 20000);

  afterAll(async () => {
    if (runner?.isTransactionActive) await runner.rollbackTransaction();
    if (runner) await runner.release();
    if (ds?.isInitialized) await ds.destroy();
  });

  it('房东日期为纯日期，排除已支付、押金和其他门店账单', async () => {
    const result = await service.properties({ keyword }, company);
    expect(result.total).toBe(3);
    expect(result.list.find(row => row.id === -900001)).toMatchObject({ leaseStart: '2026-10-01', leaseEnd: '2029-09-30', nextLandlordPaymentDate: '2026-10-01' });
    expect(result.list.find(row => row.id === -900002)?.nextLandlordPaymentDate).toBeNull();
  });

  it('合租每个实际租客分别展示，不串房间、旧租客或历史合同', async () => {
    const result = await service.tenants({ keyword }, company);
    expect(result.total).toBe(4);
    const entire = result.list.find(row => row.key === 'set--900001');
    expect(entire.nextRentPaymentDate).toBe('2026-10-15');
    expect(entire.signedAt.toISOString()).toBe('2026-09-27T10:00:00.000Z');
    expect(result.list.find(row => row.key === 'room--900001')).toMatchObject({ nextRentPaymentDate: '2026-09-01', signedAt: null });
    expect(result.list.find(row => row.key === 'room--900002')).toMatchObject({ nextRentPaymentDate: '2026-11-01', signedAt: null });
  });

  it('非管理员无论数据范围都只能查看自己填写的房源及其租客，分页无重复', async () => {
    for (const dataScope of ['company', 'store', 'self', 'group', 'assigned']) {
      const user = { ...company, roleCodes: [], dataScope, storeIds: [1], groupIds: [12], assignedStoreIds: [1, 2] };
      expect((await service.tenants({ keyword }, user)).total).toBe(1);
      expect((await service.properties({ keyword }, user)).total).toBe(1);
    }
    const first = await service.tenants({ keyword, page: 1, pageSize: 2 }, company);
    const second = await service.tenants({ keyword, page: 2, pageSize: 2 }, company);
    expect(new Set([...first.list, ...second.list].map(row => row.key)).size).toBe(4);
    expect(first.total).toBe(4); expect(second.total).toBe(4);
  });

  it('真实保存的托管切换即时同步两个页签；取消不删除房源，重新托管不重复', async () => {
    const rental = new RentalService(runner.manager.getRepository(RentalSet), runner.manager.getRepository(RentalRoom));
    const owner = { ...company, roleCodes: [] };
    const other = { ...owner, employeeId: 1003 };
    expect((await service.properties({ keyword }, other)).total).toBe(0);
    const hidden = await rental.findSet(-900001, other);
    expect(hidden).not.toHaveProperty('landlordName');
    expect(hidden).not.toHaveProperty('leaseStart');
    await expect(rental.updateSet(-900001, { isManaged: false }, other)).rejects.toMatchObject({ status: 403 });
    await rental.updateSet(-900001, { isManaged: false }, owner);
    expect((await service.properties({ keyword }, owner)).total).toBe(0);
    expect((await service.tenants({ keyword }, owner)).total).toBe(0);
    expect(await rental.findSet(-900001, owner)).toMatchObject({ id: -900001, landlordName: '测试房东', isManaged: false });
    for (let i = 0; i < 2; i++) {
      await rental.updateSet(-900001, { isManaged: true, landlordPhone: '13800000000', landlordRent: 1000, landlordPaymentMethod: 'monthly' }, owner);
    }
    expect((await service.properties({ keyword }, owner)).total).toBe(1);
    expect((await service.tenants({ keyword }, owner)).total).toBe(1);
  });
});
