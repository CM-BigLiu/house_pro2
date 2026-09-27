import { DataSource, QueryRunner } from 'typeorm';
import { CustomerWorkflowService } from '../modules/house/services/customer-workflow.service';
import { CustomerService } from '../modules/house/services/customer.service';
import { RentalAppointmentService } from '../modules/house/services/rental-appointment.service';
import { CheckoutService } from '../modules/house/services/checkout.service';
import { Customer } from '../modules/house/entities/customer.entity';
import { Deal } from '../modules/house/entities/deal.entity';
import { SaleAppointment } from '../modules/house/entities/sale-appointment.entity';
import { RentalAppointment } from '../modules/house/entities/rental-appointment.entity';
import { RentalAppointmentAction } from '../modules/house/entities/rental-appointment-action.entity';
import { RentalSet } from '../modules/house/entities/rental-set.entity';
import { Checkout } from '../modules/house/entities/checkout.entity';
import { Employee } from '../modules/system/entities/employee.entity';

/** 真实 PostgreSQL 事务回滚验证；所有新增记录显式指定隔离测试 ID，不消耗用户业务序列。 */
describe('客户约看 / 成交 / 解约 PostgreSQL 集成', () => {
  let ds: DataSource, runner: QueryRunner, workflow: CustomerWorkflowService, checkouts: CheckoutService;
  let generatedId = 191000010;
  const key = `customer-deals-int-${Date.now()}`;
  const user = { employeeId: 1, name: '集成测试负责人', dataScope: 'company', storeIds: [1], groupIds: [], permissions: ['*'] } as any;
  const contract = { leaseStart: '2026-10-01', leaseEnd: '2027-09-30', rent: 3000, deposit: 3000, paymentMethod: 'monthly' };
  const later = () => new Date(Date.now() + 86400000).toISOString();
  beforeAll(async () => {
    ds = new DataSource({ type: 'postgres', host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USERNAME || 'postgres', password: process.env.DB_PASSWORD || 'postgres', database: process.env.DB_DATABASE || 'house_pro',
      entities: [__dirname + '/../modules/**/*.entity.ts'], synchronize: false, logging: false });
    await ds.initialize(); runner = ds.createQueryRunner(); await runner.connect();
  }, 20000);
  beforeEach(async () => {
    await runner.startTransaction();
    const manager = runner.manager;
    for (const entity of [Deal, SaleAppointment, RentalAppointment, RentalAppointmentAction, Checkout]) {
      const repo = manager.getRepository(entity), original = repo.create.bind(repo) as any;
      jest.spyOn(repo, 'create').mockImplementation((data: any) => original({ id: generatedId++, ...data }));
    }
    const customers = new CustomerService(manager.getRepository(Customer), manager.getRepository(Employee));
    const rentals = new RentalAppointmentService(manager.getRepository(RentalAppointment), manager.getRepository(RentalSet), customers);
    checkouts = new CheckoutService(manager.getRepository(Checkout));
    workflow = new CustomerWorkflowService(manager.getRepository(Deal), customers, rentals, checkouts);
    await runner.query(`INSERT INTO house_community (id, name, "cityId") VALUES (191000001, $1, 1)`, [key]);
    await runner.query(`INSERT INTO house_customer (id, name, mobile, "customerType", status, creator_id, store_id)
      VALUES (191000001, $1, '13800001234', 'tenant', 'active', 1, 1), (191000002, $2, '13900001234', 'buyer', 'active', 1, 1),
      (191000003, $3, '13700001234', 'buyer', 'blacklist', 1, 1)`, [`${key}-租客`, `${key}-买家`, `${key}-黑名单`]);
    await runner.query(`INSERT INTO house_rental_set (id, code, "bizType", community_id, address, building, unit, "roomNo", layout, status, creator_id, store_id, group_id)
      VALUES (191000001, $1, 'entire', 191000001, '测试地址', '1', '1', '101', '1室1厅', 'vacant', 1, 1, 11)`, [`${key}-rent`]);
    await runner.query(`INSERT INTO house_sale (id, code, "propertyType", community_id, building, unit, floor, "roomNo", "layoutRooms", "layoutHalls", "layoutBathrooms", "layoutBalconies", "buildingArea", orientation, decoration, elevator, "salePrice", "sourceChannel", title, "ownerName", "ownerPhone", creator_id, store_id, status)
      VALUES (191000001, $1, 'residential', 191000001, '1', '1', '1', '102', 1, 1, 1, 0, 60, 'south', 'fine', 'yes', 100, 'online', $2, '测试房东', '', 1, 1, 'published')`, [`${key}-sale`, `${key}-售房`]);
  });
  afterEach(async () => { jest.restoreAllMocks(); if (runner.isTransactionActive) await runner.rollbackTransaction(); });
  afterAll(async () => { await runner?.release(); if (ds?.isInitialized) await ds.destroy(); });

  it('租房签约生成合同快照，解约待审批，审批后释放房源且保留合同', async () => {
    const appointment = await workflow.createAppointment(191000001, { propertyId: 191000001, scheduledAt: later() }, user);
    await workflow.sign(191000001, { appointmentId: appointment.id, ...contract, contractCode: `${key}-HT` }, user);
    const result = await workflow.findDeals({ keyword: key }, user);
    expect(result.total).toBe(1); expect(result.stats).toMatchObject({ rentCount: 1, saleCount: 0, monthlyRent: 3000, saleAmount: 0 });
    const deal = result.list[0]; expect(deal).toMatchObject({ bizType: 'rent', amount: 3000, customerId: 191000001, status: 'active' });
    expect((await runner.manager.getRepository(Customer).findOneBy({ id: 191000001 })).status).toBe('done');
    await expect(workflow.sign(191000001, { appointmentId: appointment.id, ...contract }, user)).rejects.toThrow('重复');
    await workflow.terminate(191000001, deal.id, { terminatedOn: '2026-10-02', reason: '工作调动' }, user);
    const pending = await runner.manager.getRepository(Deal).findOneBy({ id: deal.id });
    expect(pending.status).toBe('termination_pending');
    expect((await runner.manager.getRepository(RentalSet).findOneBy({ id: 191000001 })).tenantName).toBe(`${key}-租客`);
    await checkouts.confirm(pending.checkoutId, user);
    expect((await runner.manager.getRepository(Deal).findOneBy({ id: deal.id })).status).toBe('terminated');
    expect((await runner.manager.getRepository(RentalSet).findOneBy({ id: 191000001 })).tenantName).toBeNull();
    expect((await runner.manager.getRepository(Customer).findOneBy({ id: 191000001 })).status).toBe('active');
    expect((await workflow.findDeals({ keyword: key, status: 'terminated' }, user)).total).toBe(1);
  });

  it('买房客户约看、签约和解约在事务内同步房态，阻止重复提交和黑名单签约', async () => {
    await expect(workflow.createAppointment(191000003, { propertyId: 191000001, scheduledAt: later() }, user)).rejects.toThrow('黑名单');
    const appointment = await workflow.createAppointment(191000002, { propertyId: 191000001, scheduledAt: later() }, user);
    const deal = await workflow.sign(191000002, { appointmentId: appointment.id, amount: 2200000, contractCode: `${key}-XS` }, user) as Deal;
    expect(deal).toMatchObject({ bizType: 'sale', amount: 2200000, responsibleEmployeeId: 1, status: 'active' });
    expect((await runner.query('SELECT status FROM house_sale WHERE id = 191000001'))[0].status).toBe('sold');
    await expect(workflow.sign(191000002, { appointmentId: appointment.id, amount: 2200000 }, user)).rejects.toThrow('已签约');
    await workflow.terminate(191000002, deal.id, { terminatedOn: new Date().toLocaleDateString('sv-SE'), reason: '双方协商解约' }, user);
    expect((await runner.query('SELECT status FROM house_sale WHERE id = 191000001'))[0].status).toBe('published');
    expect((await runner.manager.getRepository(Customer).findOneBy({ id: 191000002 })).status).toBe('active');
    await expect(workflow.terminate(191000002, deal.id, { terminatedOn: '2026-10-01', reason: '重复' }, user)).rejects.toThrow('已解约');
  });

  it('按负责人和门店过滤合同、约看与房源选项，不能替其他客户签约', async () => {
    const appointment = await workflow.createAppointment(191000002, { propertyId: 191000001, scheduledAt: later() }, user);
    await expect(workflow.sign(191000001, { appointmentId: appointment.id, ...contract }, user)).rejects.toThrow('不属于该客户');
    await workflow.sign(191000002, { appointmentId: appointment.id, amount: 1000000 }, user);
    const stranger = { ...user, employeeId: 2, dataScope: 'self' };
    expect((await workflow.findDeals({ keyword: key }, stranger)).total).toBe(0);
    expect((await workflow.findDeals({ keyword: key }, { ...user, dataScope: 'store', storeIds: [2] })).total).toBe(0);
    expect((await workflow.findDeals({ keyword: key }, { ...user, dataScope: 'store', storeIds: [1] })).total).toBe(1);
    await expect(workflow.context(191000002, stranger)).rejects.toThrow('无权访问');
    const options = await workflow.propertyOptions(191000001, { keyword: key }, user);
    expect(options.total).toBe(1); expect(options.list[0]).toHaveProperty('code', `${key}-rent`);
    await expect(workflow.findDeals({ startDate: '2026-10-10', endDate: '2026-10-01' }, user)).rejects.toThrow('开始日期');
  });

  it('合同编号冲突整体回滚，不出租另一套房或将另一客户标记成交', async () => {
    const sale = await workflow.createAppointment(191000002, { propertyId: 191000001, scheduledAt: later() }, user);
    await workflow.sign(191000002, { appointmentId: sale.id, amount: 1000000, contractCode: `${key}-same` }, user);
    const rent = await workflow.createAppointment(191000001, { propertyId: 191000001, scheduledAt: later() }, user);
    await expect(workflow.sign(191000001, { appointmentId: rent.id, ...contract, contractCode: `${key}-same` }, user)).rejects.toThrow('合同编号');
    expect((await runner.manager.getRepository(RentalSet).findOneBy({ id: 191000001 })).status).toBe('vacant');
    expect((await runner.manager.getRepository(RentalAppointment).findOneBy({ id: rent.id })).status).toBe('scheduled');
    expect((await runner.manager.getRepository(Customer).findOneBy({ id: 191000001 })).status).toBe('active');
  });

  it('旧合同解约不能清空已经更换的租客', async () => {
    const appointment = await workflow.createAppointment(191000001, { propertyId: 191000001, scheduledAt: later() }, user);
    await workflow.sign(191000001, { appointmentId: appointment.id, ...contract }, user);
    const { list: [deal] } = await workflow.findDeals({ keyword: key }, user);
    await runner.manager.getRepository(RentalSet).update(191000001, { tenantName: '后来租客', tenantPhone: '13600001234' });
    await expect(workflow.terminate(191000001, deal.id, { terminatedOn: '2026-10-02', reason: '旧合同解约' }, user)).rejects.toThrow('不能影响新的租客');
    expect((await runner.manager.getRepository(RentalSet).findOneBy({ id: 191000001 })).tenantName).toBe('后来租客');
    expect((await runner.manager.getRepository(Deal).findOneBy({ id: deal.id })).status).toBe('active');
  });

  it('从房源发起退租自动关联当前合同，仍保留审批流程', async () => {
    const appointment = await workflow.createAppointment(191000001, { propertyId: 191000001, scheduledAt: later() }, user);
    await workflow.sign(191000001, { appointmentId: appointment.id, ...contract }, user);
    const { list: [deal] } = await workflow.findDeals({ keyword: key }, user);
    const checkout = await checkouts.create({ rentalSetId: 191000001, checkoutDate: '2026-10-02', reason: '房源入口退租' }, user);
    expect(checkout.contractCode).toBe(deal.contractCode);
    expect((await runner.manager.getRepository(Deal).findOneBy({ id: deal.id })).status).toBe('termination_pending');
    await checkouts.confirm(checkout.id, user);
    expect((await runner.manager.getRepository(Deal).findOneBy({ id: deal.id })).status).toBe('terminated');
  });

  it('分组范围可选择本组急售房源，但不能读取其他组合同', async () => {
    await runner.query(`INSERT INTO sys_group (id, name, store_id) VALUES (191000001, '隔离测试分组', 1)`);
    await runner.query(`INSERT INTO sys_employee_group ("sysEmployeeId", "sysGroupId") VALUES (1, 191000001)`);
    await runner.query(`UPDATE house_sale SET status = 'quick_sale' WHERE id = 191000001`);
    const scoped = { ...user, dataScope: 'group', groupIds: [191000001] };
    const options = await workflow.propertyOptions(191000002, { keyword: key }, scoped);
    expect(options.total).toBe(1);
    const appointment = await workflow.createAppointment(191000002, { propertyId: 191000001, scheduledAt: later() }, scoped);
    const deal = await workflow.sign(191000002, { appointmentId: appointment.id, amount: 1000000 }, scoped) as Deal;
    expect((await workflow.findDeals({ keyword: key }, scoped)).total).toBe(1);
    expect((await workflow.findDeals({ keyword: key }, { ...scoped, groupIds: [191000002] })).total).toBe(0);
    await expect(workflow.terminate(191000002, deal.id, { terminatedOn: '2026-10-01', reason: 'x'.repeat(256) }, scoped)).rejects.toThrow('255');
  });
});
