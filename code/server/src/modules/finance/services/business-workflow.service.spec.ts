import { BusinessWorkflowService } from './business-workflow.service';
import {
  BusinessSubmission,
  CashAccount,
  CashEntry,
  ContractSchedule,
  PropertyConfiguration,
} from '../entities/business-workflow.entity';
import { Deal } from '../../house/entities/deal.entity';
import { Employee } from '../../system/entities/employee.entity';
import { RentalSet } from '../../house/entities/rental-set.entity';
import { contractDetailsTransformer } from '../../house/entities/contract-details';

function queryBuilder() {
  const qb: any = {};
  for (const key of [
    'andWhere',
    'where',
    'select',
    'addSelect',
    'innerJoin',
    'setLock',
    'orderBy',
    'addOrderBy',
    'groupBy',
    'take',
    'insert',
    'values',
    'orIgnore',
  ])
    qb[key] = jest.fn().mockReturnValue(qb);
  qb.getOne = jest.fn().mockResolvedValue(null);
  qb.getMany = jest.fn().mockResolvedValue([]);
  qb.getRawMany = jest.fn().mockResolvedValue([]);
  qb.getCount = jest.fn().mockResolvedValue(0);
  qb.execute = jest.fn().mockResolvedValue({});
  return qb;
}
function setup() {
  const repos = new Map<any, any>();
  for (const type of [
    BusinessSubmission,
    CashAccount,
    CashEntry,
    ContractSchedule,
    PropertyConfiguration,
    Deal,
    Employee,
    RentalSet,
  ]) {
    const qb = queryBuilder();
    repos.set(type, {
      qb,
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 1, ...value })),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      upsert: jest.fn(),
    });
  }
  const manager: any = {
    getRepository: (type: any) => repos.get(type),
    query: jest.fn(),
  };
  const ds: any = {
    manager,
    getRepository: manager.getRepository,
    transaction: jest.fn((fn) => fn(manager)),
  };
  return { service: new BusinessWorkflowService(ds), repos, ds, manager };
}
const user = {
  employeeId: 7,
  name: '真实报送人',
  permissions: ['*'],
  dataScope: 'self',
  storeIds: [1],
  groupIds: [2],
} as any;
const details = {
  ownerName: '业主',
  ownerIdCard: '110101199001011234',
  ownerAddress: '业主地址',
  ownerPhone: '13800001111',
  propertyAddress: '房屋地址',
  customerIdCard: '110101199001011235',
  customerAddress: '客户地址',
  paymentDate: '2026-10-01',
  freeDays: [0, 0, 0, 0, 0],
};
const payment = {
  requestKey: 'unique-payment-1',
  paymentDate: '2026-10-01',
  amount: 100,
  accountCode: 'cash',
  payerAccount: '支付账户',
  payer: '付款人',
  payeeAccount: '收款账户',
  payee: '收款人',
};

describe('业务工作流校验与记账', () => {
  const configurationItems = () => ['cleaning', 'repair', 'renovation', 'furniture', 'appliance', 'collection_bonus', 'rental_bonus'].map(type => ({ type, amount: type === 'collection_bonus' ? 100.25 : 0, recipientEmployeeId: type === 'collection_bonus' ? 7 : undefined, recipient: '伪造姓名', channel: 'cash', remark: '' }));
  it('奖励使用员工主键校验并保存真实姓名', async () => {
    const { service, repos } = setup();
    repos.get(RentalSet).qb.getOne.mockResolvedValue({ isManaged: true, storeId: 1 });
    repos.get(Employee).find.mockResolvedValue([{ id: 7, name: '真实员工', status: 'normal', stores: [], groups: [] }]);
    const result = await service.saveConfiguration(8, configurationItems(), user);
    expect(result.items.find(row => row.type === 'collection_bonus')).toMatchObject({ recipientEmployeeId: 7, recipient: '真实员工', amount: 100.25 });
  });
  it('不能给停用或数据范围外的员工配置奖励', async () => {
    const { service, repos } = setup();
    repos.get(RentalSet).qb.getOne.mockResolvedValue({ isManaged: true, storeId: 1 });
    repos.get(Employee).find.mockResolvedValue([{ id: 7, name: '停用员工', status: 'disabled', stores: [], groups: [] }]);
    await expect(service.saveConfiguration(8, configurationItems(), user)).rejects.toMatchObject({ status: 403 });
    expect(repos.get(PropertyConfiguration).save).not.toHaveBeenCalled();
  });
  it.each([-1, 1.234, Number.NaN, '12', '1e3'])('配置金额拒绝非法输入 %s', async amount => {
    const { service, ds } = setup();
    const items = configurationItems();
    items[0].amount = amount as any;
    await expect(service.saveConfiguration(8, items, user)).rejects.toMatchObject({ status: 400 });
    expect(ds.transaction).not.toHaveBeenCalled();
  });
  it('合同详情使用UTF-8往返加密，不存储明文身份证和账号', () => {
    const encrypted = contractDetailsTransformer.to(details);
    expect(encrypted).toMatch(/^enc:/);
    expect(encrypted).not.toContain(details.ownerIdCard);
    expect(contractDetailsTransformer.from(encrypted)).toEqual(details);
  });

  it.each([
    null,
    [],
    { freeDays: 'abcde' },
    { freeDays: [1] },
    { commissionAmount: -1 },
    { commissionRatio: 101 },
    { occupants: 2, maxOccupants: 1 },
    { ownerIdCard: 123 },
    { ownerPhone: {} },
  ])('拒绝畸形合同详情 %j', (value) => {
    expect(() => setup().service.validateDetails(value as any)).toThrow();
  });

  it('普租须业主和客户资料齐全，承租不要求重复填写业主资料', () => {
    const { service } = setup();
    expect(() => service.validateRentalDetails({}, false)).toThrow();
    expect(() => service.validateRentalDetails(details, false)).not.toThrow();
    expect(() =>
      service.validateRentalDetails({ ...details, ownerName: '' }, true),
    ).not.toThrow();
    expect(() =>
      service.validateRentalDetails({ ...details, paymentDate: '' }, true),
    ).toThrow();
  });

  it('部分付款保留本期待办，结清后推进；流水归原报送人而非代办财务', async () => {
    const { service, repos } = setup();
    const row = {
      id: 4,
      dealId: 3,
      sequence: 1,
      amount: 300,
      settledAmount: 0,
      status: 'pending',
      direction: 'pay',
      employeeId: 2,
      storeId: 1,
    };
    repos.get(ContractSchedule).qb.getOne.mockResolvedValue(row);
    repos.get(Deal).findOne.mockResolvedValue({ status: 'active' });
    await service.settle(4, payment, user);
    expect(row.settledAmount).toBe(100);
    expect(row.status).toBe('pending');
    expect(repos.get(CashEntry).save).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: 2, direction: 'pay', amount: 100 }),
    );
    await service.settle(
      4,
      { ...payment, requestKey: 'next', amount: 200 },
      user,
    );
    expect(row.settledAmount).toBe(300);
    expect(row.status).toBe('paid');
    expect(repos.get(CashAccount).qb.orIgnore).toHaveBeenCalled();
  });

  it('相同请求编号幂等返回原流水，不重复增加结算金额', async () => {
    const { service, repos } = setup();
    const row = { id: 4, settledAmount: 100, status: 'paid' };
    const entry = { ...payment, scheduleId: 4 };
    repos.get(ContractSchedule).qb.getOne.mockResolvedValue(row);
    repos.get(CashEntry).findOne.mockResolvedValue(entry);
    expect(await service.settle(4, payment, user)).toBe(entry);
    expect(repos.get(CashEntry).save).not.toHaveBeenCalled();
    expect(row.settledAmount).toBe(100);
    await expect(
      service.settle(4, { ...payment, amount: 90 }, user),
    ).rejects.toThrow('重复请求编号');
  });

  it('超额付款和跳过前期均不写流水', async () => {
    const { service, repos } = setup();
    repos.get(ContractSchedule).qb.getOne.mockResolvedValue({
      dealId: 3,
      sequence: 2,
      amount: 100,
      settledAmount: 1,
      status: 'pending',
    });
    repos.get(Deal).findOne.mockResolvedValue({ status: 'active' });
    await expect(service.settle(4, payment, user)).rejects.toThrow('不能超过');
    repos.get(ContractSchedule).qb.getCount.mockResolvedValue(1);
    await expect(
      service.settle(4, { ...payment, amount: 99 }, user),
    ).rejects.toThrow('前一期');
    expect(repos.get(CashEntry).save).not.toHaveBeenCalled();
  });

  it('无数据权限和已结束合同均拒绝付款', async () => {
    const { service, repos } = setup();
    await expect(service.settle(4, payment, user)).rejects.toThrow('无权操作');
    repos
      .get(ContractSchedule)
      .qb.getOne.mockResolvedValue({ dealId: 3, status: 'pending' });
    repos.get(Deal).findOne.mockResolvedValue({ status: 'terminated' });
    await expect(service.settle(4, payment, user)).rejects.toThrow(
      '合同已结束',
    );
  });

  it('公司现金余额等于期初加实际收入减支付；局部范围不泄露公司期初', async () => {
    const { service, repos } = setup();
    repos
      .get(CashAccount)
      .find.mockResolvedValue([{ code: 'cash', openingBalance: '1000.00' }]);
    repos
      .get(CashEntry)
      .qb.getRawMany.mockResolvedValue([{ code: 'cash', movement: '-100.50' }]);
    expect(
      (await service.cashFlow({ ...user, dataScope: 'company' })).accounts.find(
        (row) => row.code === 'cash',
      ).balance,
    ).toBe(899.5);
    expect(
      (await service.cashFlow(user)).accounts.find(
        (row) => row.code === 'cash',
      ),
    ).toMatchObject({ openingBalance: 0, balance: -100.5 });
  });

  it('配置修改按发生月记金额差额，不移动历史费用', async () => {
    const { service, repos } = setup();
    repos
      .get(RentalSet)
      .qb.getOne.mockResolvedValue({ isManaged: true, storeId: 1 });
    repos.get(PropertyConfiguration).findOne.mockResolvedValue({
      items: [{ amount: 100 }],
      adjustments: [{ occurredOn: '2026-01-01', amount: 100 }],
    });
    const items = [
      'cleaning',
      'repair',
      'renovation',
      'furniture',
      'appliance',
      'collection_bonus',
      'rental_bonus',
    ].map((type, index) => ({
      type,
      amount: index === 0 ? 150 : 0,
      remark: '',
    }));
    const result = await service.saveConfiguration(8, items, user);
    expect(result.adjustments).toEqual([
      expect.objectContaining({ occurredOn: '2026-01-01', amount: 100 }),
      expect.objectContaining({ amount: 50 }),
    ]);
  });

  it('房管房溢价包括其他经纪人签的承租合同，成本调整归发生月', async () => {
    const { service, repos } = setup();
    repos.get(Deal).createQueryBuilder.mockImplementation((alias) => {
      const qb = queryBuilder();
      qb.getMany.mockResolvedValue(
        alias === 'tenant'
          ? [
              {
                propertyId: 8,
                leaseStart: '2026-10-01',
                leaseEnd: '2027-09-30',
                amount: 4100,
              },
            ]
          : [
              {
                id: 1,
                workflowType: 'management',
                propertyId: 8,
                leaseStart: '2026-10-01',
                leaseEnd: '2027-09-30',
                amount: 3100,
                signedAt: new Date('2026-09-01'),
                status: 'active',
                details: { freeDays: [10, 0, 0, 0, 0] },
                responsibleEmployeeId: 7,
                responsibleEmployeeName: user.name,
              },
            ],
      );
      return qb;
    });
    repos.get(PropertyConfiguration).find.mockResolvedValue([
      {
        propertyId: 8,
        items: [{ amount: 300 }],
        adjustments: [
          { occurredOn: '2026-09-01', amount: 100 },
          { occurredOn: '2026-10-02', amount: 200 },
        ],
      },
    ]);
    const { list } = await service.performance('2026-10', user);
    expect(list[0]).toMatchObject({
      employeeId: 7,
      employeeCode: '000007',
      management: { amount: 1730 },
    });
    expect(list[0].management.details[0]).toMatchObject({
      premium: 1000,
      freeAmount: 930,
      costs: 200,
    });
  });

  it('普租/承租佣金依分成计算并归真实报送员工', async () => {
    const { service, repos } = setup();
    repos.get(Deal).qb.getMany.mockResolvedValue([
      {
        bizType: 'rent',
        workflowType: 'regular',
        signedAt: new Date('2026-10-01'),
        responsibleEmployeeId: 7,
        responsibleEmployeeName: user.name,
        details: {
          commissionAmount: 1000,
          performanceRatio: 80,
          commissionRatio: 25,
        },
        status: 'active',
      },
    ]);
    expect((await service.performance('2026-10', user)).list[0]).toMatchObject({
      employeeName: user.name,
      regular: { amount: 800, commission: 200 },
      totalAmount: 800,
      totalCommission: 200,
    });
  });

  it('买卖分摊使用尾差归成交人，计佣总金额精确守恒', async () => {
    const { service, repos } = setup();
    repos.get(Deal).qb.getMany.mockResolvedValue([
      {
        bizType: 'sale',
        workflowType: 'sale',
        amount: 0.01,
        signedAt: new Date('2026-10-01'),
        details: {
          entryEmployeeId: 7,
          closingEmployeeId: 8,
          entryRatio: 50,
          closingRatio: 50,
          commissionRatio: 0,
        },
        status: 'active',
      },
    ]);
    const { list } = await service.performance('2026-10', user);
    expect(list.reduce((sum, row) => sum + row.sale.amount, 0)).toBe(0.01);
  });

  it('跨类型提交不得借用其他修改权限', async () => {
    await expect(
      setup().service.submit('performance', '2026-10', {
        ...user,
        permissions: ['finance:arrears:modify'],
      }),
    ).rejects.toThrow('无权提交');
  });

  it('管理员代报的买卖收入归参与员工，本人查询不暴露其他人的分配', async () => {
    const { service, repos } = setup();
    repos.get(Deal).createQueryBuilder.mockImplementation((alias) => {
      const qb = queryBuilder();
      qb.getMany.mockResolvedValue(
        alias === 'allocation'
          ? [
              {
                id: 12,
                bizType: 'sale',
                workflowType: 'sale',
                status: 'active',
                amount: 1000,
                signedAt: new Date('2026-10-01'),
                details: {
                  entryEmployeeId: 7,
                  entryEmployeeName: '签报时姓名',
                  closingEmployeeId: 8,
                  entryRatio: 40,
                  closingRatio: 60,
                  commissionRatio: 25,
                },
              },
            ]
          : [],
      );
      return qb;
    });
    const { list } = await service.performance('2026-10', user);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      employeeId: 7,
      employeeName: '签报时姓名',
      sale: { amount: 400, commission: 100 },
    });
  });

  it('手工买卖拒绝缺失比例及非整数员工编号，避免计算NaN', async () => {
    const { service } = setup();
    await expect(
      service.manualSale(
        {
          amount: 100,
          address: '地址',
          details: {
            entryEmployeeId: 7,
            closingEmployeeId: 8,
            closingRatio: 100,
          },
        },
        user,
      ),
    ).rejects.toThrow('请选择录入人');
    await expect(
      service.manualSale(
        {
          amount: 100,
          address: '地址',
          details: {
            entryEmployeeId: 7.5,
            closingEmployeeId: 8,
            entryRatio: 50,
            closingRatio: 50,
          },
        },
        user,
      ),
    ).rejects.toThrow('请选择录入人');
  });

  it('已经保存的月份快照不能重复提交，退回后才可以重报', async () => {
    const { service, repos, manager } = setup();
    repos.get(BusinessSubmission).qb.getCount.mockResolvedValue(1);
    await expect(
      service.submit('performance', '2026-10', user),
    ).rejects.toThrow('不能重复报送');
    expect(manager.query).toHaveBeenCalledWith(
      'SELECT pg_advisory_xact_lock($1)',
      [7],
    );
    repos.get(BusinessSubmission).qb.getCount.mockResolvedValue(0);
    expect(await service.submit('performance', '2026-10', user)).toMatchObject({
      type: 'performance',
      status: 'submitted',
      employeeId: 7,
      snapshot: { period: '2026-10', list: [] },
    });
  });

  it('财务保存/退回只能处理待审记录，退回必须写原因', async () => {
    const { service, repos } = setup();
    const row = { status: 'submitted' } as any;
    repos.get(BusinessSubmission).qb.getOne.mockResolvedValue(row);
    await expect(service.review(1, 'return', '', user)).rejects.toThrow(
      '退回须填写原因',
    );
    expect(await service.review(1, 'return', '请核对', user)).toMatchObject({
      status: 'returned',
      reviewedBy: 7,
      reviewNote: '请核对',
    });
    await expect(service.review(1, 'save', '', user)).rejects.toThrow(
      '已经处理',
    );
  });
});
