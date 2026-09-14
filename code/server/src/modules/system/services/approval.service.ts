import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, In, Repository, SelectQueryBuilder } from 'typeorm';
import { ApprovalRecord } from '../entities/approval-record.entity';
import { Employee } from '../entities/employee.entity';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { StateMachineService } from '../../../common/services/state-machine.service';
import { EventsGateway } from '../../events/events.gateway';
import { SaleProperty } from '../../house/entities/sale-property.entity';
import { RentalRoom } from '../../house/entities/rental-room.entity';
import { Bill } from '../../finance/entities/bill.entity';
import { Invoice } from '../../finance/entities/invoice.entity';

export interface SubmitApprovalInput {
  entityType: string;
  entityId: number;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  operatorId: number;
  remark?: string;
}

@Injectable()
export class ApprovalService {
  constructor(
    @InjectRepository(ApprovalRecord)
    private approvalRepo: Repository<ApprovalRecord>,
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(SaleProperty)
    private saleRepo: Repository<SaleProperty>,
    @InjectRepository(RentalRoom)
    private roomRepo: Repository<RentalRoom>,
    @InjectRepository(Bill)
    private billRepo: Repository<Bill>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    private stateMachine: StateMachineService,
    private eventsGateway: EventsGateway,
  ) {}

  async submit(input: SubmitApprovalInput): Promise<ApprovalRecord> {
    const pending = await this.approvalRepo.findOne({
      where: {
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        result: 'pending',
      },
    });
    if (pending) throw new BadRequestException('该业务已有待审批申请，请勿重复提交');
    const record = this.approvalRepo.create({
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      fromStatus: input.fromStatus || '',
      toStatus: input.toStatus || '',
      operatorId: input.operatorId,
      remark: input.remark || '',
      result: 'pending',
    });
    return this.approvalRepo.save(record);
  }

  async requestStatusChange(
    entityType: string,
    entityId: number,
    toStatus: string,
    user: CurrentUserPayload,
    remark?: string,
  ) {
    const repo = this.workflowRepository(entityType);
    const entity = await repo.findOne({ where: { id: entityId } });
    if (!entity) throw new NotFoundException('业务数据不存在');
    const fromStatus = String(entity.status);
    const check = this.stateMachine.transition(
      entityType,
      this.normalizeStatus(entityType, fromStatus),
      toStatus,
    );
    if (!check.success) throw new BadRequestException(check.message);
    return this.submit({
      entityType,
      entityId,
      action: 'change_status',
      fromStatus,
      toStatus,
      operatorId: user.employeeId,
      remark,
    });
  }

  async approve(id: number, user: CurrentUserPayload, remark?: string) {
    return this.review(id, 'approved', user, remark);
  }

  async reject(id: number, user: CurrentUserPayload, remark?: string) {
    return this.review(id, 'rejected', user, remark);
  }

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.approvalRepo.createQueryBuilder('a');
    if (query.result) qb.andWhere('a.result = :result', { result: query.result });
    if (query.entityType) qb.andWhere('a.entityType = :entityType', { entityType: query.entityType });
    const entityId = Number(query.entityId);
    if (Number.isFinite(entityId) && entityId > 0) {
      qb.andWhere('a.entityId = :entityId', { entityId });
    }
    await this.applyScope(qb, user);
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const [records, total] = await qb.orderBy('a.id', 'DESC').skip((page - 1) * pageSize).take(pageSize).getManyAndCount();
    return { list: await this.withEmployeeNames(records), total };
  }

  async findByEntity(entityType: string, entityId: number, user: CurrentUserPayload) {
    const qb = this.approvalRepo.createQueryBuilder('a')
      .where('a.entityType = :entityType', { entityType })
      .andWhere('a.entityId = :entityId', { entityId });
    await this.applyScope(qb, user);
    return this.withEmployeeNames(await qb.orderBy('a.id', 'DESC').getMany());
  }

  private async review(id: number, result: 'approved' | 'rejected', user: CurrentUserPayload, remark?: string) {
    const qb = this.approvalRepo.createQueryBuilder('a').where('a.id = :id', { id });
    await this.applyScope(qb, user);
    if (!await qb.getOne()) throw new NotFoundException('审批记录不存在或无权访问');

    const outcome = await this.approvalRepo.manager.transaction(async (manager) => {
      const approvalRepo = manager.getRepository(ApprovalRecord);
      const record = await approvalRepo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!record) throw new NotFoundException('审批记录不存在');
      if (record.result !== 'pending') throw new BadRequestException('该审批已经处理，不能重复操作');

      let appliedStatus = false;
      if (result === 'approved' && record.action === 'change_status') {
        await this.applyApprovedStatus(manager, record);
        appliedStatus = true;
      }

      record.approverId = user.employeeId;
      record.result = result;
      if (remark?.trim()) {
        const reviewRemark = `审批意见：${remark.trim()}`;
        record.remark = record.remark ? `${record.remark}\n${reviewRemark}` : reviewRemark;
      }
      return { record: await approvalRepo.save(record), appliedStatus };
    });

    if (outcome.appliedStatus) {
      const { entityType, entityId, toStatus: status } = outcome.record;
      this.eventsGateway.broadcastStatusChange({ entityType, entityId, status });
      this.eventsGateway.broadcastDashboardUpdate({ type: 'status_change', entityType, entityId, status });
    }
    return this.withEmployeeNames([outcome.record]).then((items) => items[0]);
  }

  private async applyApprovedStatus(manager: EntityManager, record: ApprovalRecord) {
    const repo = this.workflowRepository(record.entityType, manager);
    const entity = await repo.findOne({ where: { id: record.entityId } });
    if (!entity) throw new NotFoundException('待审批的业务数据不存在');
    if (String(entity.status) !== record.fromStatus) {
      throw new BadRequestException('业务状态已变化，该审批申请已失效');
    }
    const check = this.stateMachine.transition(
      record.entityType,
      this.normalizeStatus(record.entityType, record.fromStatus),
      record.toStatus,
    );
    if (!check.success) throw new BadRequestException(check.message);
    const updated = await repo.update(
      { id: record.entityId, status: record.fromStatus },
      { status: record.toStatus },
    );
    if (updated.affected !== 1) throw new BadRequestException('业务状态已变化，请刷新后重试');
  }

  private workflowRepository(entityType: string, manager?: EntityManager): Repository<any> {
    const get = <T>(entity: new () => T, fallback: Repository<T>) =>
      manager ? manager.getRepository(entity) : fallback;
    switch (entityType) {
      case 'sale_property': return get(SaleProperty, this.saleRepo);
      case 'rental_room': return get(RentalRoom, this.roomRepo);
      case 'bill': return get(Bill, this.billRepo);
      case 'invoice': return get(Invoice, this.invoiceRepo);
      default: throw new BadRequestException(`不支持的审批业务类型：${entityType}`);
    }
  }

  private normalizeStatus(entityType: string, status: string) {
    return entityType === 'sale_property'
      ? ({ selling: 'published', bargain: 'price_negotiation' })[status] || status
      : status;
  }

  private async applyScope(qb: SelectQueryBuilder<ApprovalRecord>, user: CurrentUserPayload) {
    if (user.dataScope === 'company') return;
    const employeeIds = await this.scopedEmployeeIds(user);
    qb.andWhere(new Brackets((sub) => {
      sub.where('a.operatorId IN (:...employeeIds)', { employeeIds })
        .orWhere('a.approverId = :employeeId', { employeeId: user.employeeId });
    }));
  }

  private async scopedEmployeeIds(user: CurrentUserPayload): Promise<number[]> {
    if (user.dataScope === 'self') return [user.employeeId];
    const qb = this.employeeRepo.createQueryBuilder('e').select('e.id', 'id').distinct(true);
    if (user.dataScope === 'group' && user.groupIds?.length) {
      qb.innerJoin('e.groups', 'g').where('g.id IN (:...ids)', { ids: user.groupIds });
    } else {
      const storeIds = user.dataScope === 'assigned' ? user.assignedStoreIds : user.storeIds;
      if (!storeIds?.length) return [user.employeeId];
      qb.innerJoin('e.stores', 's').where('s.id IN (:...ids)', { ids: storeIds });
    }
    const ids = (await qb.getRawMany()).map((item) => Number(item.id)).filter(Number.isFinite);
    return ids.length ? ids : [user.employeeId];
  }

  private async withEmployeeNames(records: ApprovalRecord[]) {
    const ids = [...new Set(records.flatMap((item) => [item.operatorId, item.approverId]).filter(Boolean))];
    const employees = ids.length ? await this.employeeRepo.find({ where: { id: In(ids) } }) : [];
    const names = new Map(employees.map((employee) => [employee.id, employee.name]));
    return records.map((record) => ({
      ...record,
      operatorName: names.get(record.operatorId) || '',
      approverName: names.get(record.approverId) || '',
    }));
  }
}
