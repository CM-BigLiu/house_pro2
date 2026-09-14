import { ApprovalService } from './approval.service';
import { ApprovalRecord } from '../entities/approval-record.entity';
import { Invoice } from '../../finance/entities/invoice.entity';
import { StateMachineService } from '../../../common/services/state-machine.service';

const user: any = {
  employeeId: 1,
  name: '审批人',
  permissions: ['*'],
  dataScope: 'company',
  storeIds: [],
  assignedStoreIds: [],
  groupIds: [],
};

function setup() {
  const record: any = {
    id: 9,
    entityType: 'invoice',
    entityId: 3,
    action: 'change_status',
    fromStatus: 'pending',
    toStatus: 'processing',
    operatorId: 2,
    approverId: null,
    remark: '',
    result: 'pending',
    createdAt: new Date('2026-09-10T00:00:00Z'),
  };
  const qb: any = {};
  for (const method of ['where', 'andWhere', 'orderBy', 'skip', 'take']) {
    qb[method] = jest.fn().mockReturnValue(qb);
  }
  qb.getOne = jest.fn().mockResolvedValue(record);
  qb.getManyAndCount = jest.fn().mockResolvedValue([[record], 1]);
  qb.getMany = jest.fn().mockResolvedValue([record]);

  const approvalTxRepo = {
    findOne: jest.fn().mockResolvedValue(record),
    save: jest.fn(async (value) => value),
  };
  const invoiceRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 3, status: 'pending' }),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  const manager = {
    getRepository: jest.fn((entity) => entity === ApprovalRecord ? approvalTxRepo : invoiceRepo),
  };
  const approvalRepo: any = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((value) => ({ id: 9, createdAt: record.createdAt, ...value })),
    save: jest.fn(async (value) => value),
    manager: { transaction: jest.fn((callback) => callback(manager)) },
  };
  const employeeRepo: any = { find: jest.fn().mockResolvedValue([]) };
  const unusedRepo: any = { findOne: jest.fn(), update: jest.fn() };
  const events: any = {
    broadcastStatusChange: jest.fn(),
    broadcastDashboardUpdate: jest.fn(),
  };
  const service = new ApprovalService(
    approvalRepo,
    employeeRepo,
    unusedRepo,
    unusedRepo,
    unusedRepo,
    invoiceRepo as any,
    new StateMachineService(),
    events,
  );
  return { service, record, approvalRepo, approvalTxRepo, invoiceRepo, events };
}

describe('approval workflow', () => {
  it('creates a pending request without changing the business status', async () => {
    const { service, approvalRepo, invoiceRepo } = setup();
    const result = await service.requestStatusChange('invoice', 3, 'processing', user, '请审批');
    expect(result).toMatchObject({ result: 'pending', fromStatus: 'pending', toStatus: 'processing' });
    expect(approvalRepo.save).toHaveBeenCalled();
    expect(invoiceRepo.update).not.toHaveBeenCalled();
  });

  it('applies the requested status atomically when approved', async () => {
    const { service, invoiceRepo, events } = setup();
    const result = await service.approve(9, user, '同意');
    expect(invoiceRepo.update).toHaveBeenCalledWith(
      { id: 3, status: 'pending' },
      { status: 'processing' },
    );
    expect(result).toMatchObject({ result: 'approved', approverId: 1 });
    expect(events.broadcastStatusChange).toHaveBeenCalledWith({
      entityType: 'invoice', entityId: 3, status: 'processing',
    });
  });

  it('keeps the business status unchanged when rejected', async () => {
    const { service, invoiceRepo } = setup();
    const result = await service.reject(9, user, '资料不全');
    expect(invoiceRepo.update).not.toHaveBeenCalled();
    expect(result).toMatchObject({ result: 'rejected', approverId: 1 });
  });

  it('approves a legacy selling status using its original stored value for the update', async () => {
    const { service, record, invoiceRepo } = setup();
    Object.assign(record, { entityType: 'sale_property', fromStatus: 'selling', toStatus: 'off_shelf' });
    invoiceRepo.findOne.mockResolvedValue({ id: 3, status: 'selling' });
    await service.approve(9, user);
    expect(invoiceRepo.update).toHaveBeenCalledWith({ id: 3, status: 'selling' }, { status: 'off_shelf' });
  });

  it('rejects a duplicate pending request for the same business action', async () => {
    const { service, approvalRepo } = setup();
    approvalRepo.findOne.mockResolvedValue({ id: 8, result: 'pending' });
    await expect(service.requestStatusChange('invoice', 3, 'processing', user)).rejects.toThrow('已有待审批申请');
  });
});
