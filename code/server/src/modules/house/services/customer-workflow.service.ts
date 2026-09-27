import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { Customer } from '../entities/customer.entity';
import { Deal } from '../entities/deal.entity';
import { SaleAppointment } from '../entities/sale-appointment.entity';
import { SaleProperty } from '../entities/sale-property.entity';
import { RentalSet } from '../entities/rental-set.entity';
import { RentalAppointment } from '../entities/rental-appointment.entity';
import { CustomerService } from './customer.service';
import { RentalAppointmentService, SignRentalAppointmentInput } from './rental-appointment.service';
import { CheckoutService } from './checkout.service';

export type CustomerSigningInput = Partial<SignRentalAppointmentInput> & { appointmentId: number; amount?: number };

@Injectable()
export class CustomerWorkflowService {
  constructor(@InjectRepository(Deal) private deals: Repository<Deal>,
    private customers: CustomerService, private rentals: RentalAppointmentService, private checkouts: CheckoutService) {}

  private scoped<T extends { id: number }>(repo: Repository<T>, user: CurrentUserPayload) {
    const qb = repo.createQueryBuilder('record');
    applyDataScope(qb, user, 'record', { ownerField: 'responsibleEmployeeId', storeField: 'storeId', groupField: 'groupId' });
    return qb;
  }

  private async customer(id: number, user: CurrentUserPayload, writing = false) {
    const customer = await this.customers.findOne(id, user);
    if (!['tenant', 'buyer'].includes(customer.customerType)) throw new BadRequestException('仅租房客户和买房客户支持此操作');
    if (writing && (customer.isBlacklist || ['blacklist', 'invalid'].includes(customer.status))) {
      throw new BadRequestException('黑名单或已失效客户不能约看、签约');
    }
    return customer;
  }

  async context(id: number, user: CurrentUserPayload) {
    const customer = await this.customer(id, user);
    const repo = this.deals.manager.getRepository(customer.customerType === 'tenant' ? RentalAppointment : SaleAppointment);
    const appointments = await this.scoped(repo as Repository<any>, user)
      .andWhere('record.customerId = :customerId', { customerId: id })
      .andWhere('record.status IN (:...statuses)', { statuses: ['scheduled', 'completed'] })
      .orderBy('record.scheduledAt', 'DESC').getMany();
    const contracts = await this.scoped(this.deals, user).andWhere('record.customerId = :customerId', { customerId: id })
      .andWhere('record.status = :status', { status: 'active' }).orderBy('record.signedAt', 'DESC').getMany();
    return { appointments, contracts };
  }

  async propertyOptions(id: number, query: any, user: CurrentUserPayload) {
    const customer = await this.customer(id, user);
    const renting = customer.customerType === 'tenant';
    const repo = this.deals.manager.getRepository(renting ? RentalSet : SaleProperty);
    const qb = repo.createQueryBuilder('property').leftJoin('property.community', 'community');
    // 售房表无 group_id，分组权限由录入人的分组限定，不允许跨组选择。
    if (!renting && user.dataScope === 'group' && user.groupIds?.length) {
      qb.innerJoin('sys_employee', 'owner', 'owner.id = property.creatorId')
        .innerJoin('owner.groups', 'ownerGroup').andWhere('ownerGroup.id IN (:...groups)', { groups: user.groupIds }).distinct(true);
    } else applyDataScope(qb, user, 'property', { ownerField: 'creatorId', storeField: 'storeId', groupField: 'groupId' });
    qb.andWhere('property.status IN (:...statuses)', { statuses: renting ? ['active', 'vacant', 'reserved', 'rented'] : ['selling', 'published', 'bargain', 'price_negotiation', 'quick_sale'] });
    const keyword = query.keyword?.trim();
    if (keyword) qb.andWhere(new Brackets(sub => sub.where('property.code ILIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('property.title ILIKE :keyword', { keyword: `%${keyword}%` }).orWhere('community.name ILIKE :keyword', { keyword: `%${keyword}%` })));
    const page = Math.max(1, Number(query.page) || 1), pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const [rows, total] = await qb.select(['property.id', 'property.code', 'property.title', 'property.status',
      'property.building', 'property.unit', 'property.roomNo', 'community.id', 'community.name'])
      .orderBy('property.id', 'DESC').skip((page - 1) * pageSize).take(pageSize).getManyAndCount();
    return { list: rows.map(row => ({ id: row.id, code: row.code, name: row.title || [row.community?.name,
      row.building ? `${row.building}栋` : '', row.unit ? `${row.unit}单元` : '', row.roomNo].filter(Boolean).join('') || row.code })), total };
  }

  async createAppointment(id: number, input: { propertyId: number; scheduledAt: string; remark?: string }, user: CurrentUserPayload) {
    const customer = await this.customer(id, user, true);
    if (customer.customerType === 'tenant') {
      return this.rentals.create({ rentalSetId: input.propertyId, customerId: id, scheduledAt: input.scheduledAt, remark: input.remark }, user);
    }
    const scheduledAt = new Date(input.scheduledAt);
    if (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) throw new BadRequestException('约看时间必须晚于当前时间');
    const property = await this.saleProperty(input.propertyId, user);
    if (!['selling', 'published', 'bargain', 'price_negotiation', 'quick_sale'].includes(property.status)) throw new BadRequestException('该售房当前不可约看');
    const repo = this.deals.manager.getRepository(SaleAppointment);
    return repo.save(repo.create({ salePropertyId: property.id, customerId: id, customerName: customer.name,
      propertyCode: property.code, propertyName: property.title || property.code, scheduledAt, status: 'scheduled',
      responsibleEmployeeId: user.employeeId, responsibleEmployeeName: user.name, storeId: property.storeId,
      groupId: user.groupIds?.[0] ?? null, remark: input.remark?.trim() || null }));
  }

  private async saleProperty(id: number, user: CurrentUserPayload, manager = this.deals.manager, lock = false) {
    const qb = manager.getRepository(SaleProperty).createQueryBuilder('property').where('property.id = :id', { id });
    if (user.dataScope === 'group' && user.groupIds?.length) {
      qb.andWhere('property.creatorId IN (SELECT "sysEmployeeId" FROM sys_employee_group WHERE "sysGroupId" IN (:...groupIds))', { groupIds: user.groupIds });
    } else applyDataScope(qb, user, 'property', { ownerField: 'creatorId', storeField: 'storeId' });
    const property = await (lock ? qb.setLock('pessimistic_write') : qb).getOne();
    if (!property) throw new ForbiddenException('售房不存在或无权操作');
    return property;
  }

  async signingContext(customerId: number, appointmentId: number, user: CurrentUserPayload) {
    await this.customer(customerId, user);
    const appointment = await this.scoped(this.deals.manager.getRepository(RentalAppointment), user)
      .andWhere('record.id = :id AND record.customerId = :customerId', { id: appointmentId, customerId }).getOne();
    if (!appointment) throw new ForbiddenException('约看记录不存在或不属于该客户');
    return this.rentals.signingContext(appointmentId, user);
  }

  async sign(id: number, input: CustomerSigningInput, user: CurrentUserPayload) {
    const customer = await this.customer(id, user, true);
    if (customer.customerType === 'tenant') {
      await this.signingContext(id, input.appointmentId, user);
      return this.rentals.sign(input.appointmentId, input as SignRentalAppointmentInput, user);
    }
    if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount > 999999999999.99 || !/^\d+(\.\d{1,2})?$/.test(String(input.amount))) {
      throw new BadRequestException('成交总价须大于零，最多两位小数（单位：元）');
    }
    try {
      return await this.deals.manager.transaction(async manager => {
        const repo = manager.getRepository(SaleAppointment);
        const appointment = await this.scoped(repo, user)
          .andWhere('record.id = :id AND record.customerId = :customerId', { id: input.appointmentId, customerId: id })
          .setLock('pessimistic_write').getOne();
        if (!appointment) throw new ForbiddenException('约看记录不存在或不属于该客户');
        if (!['scheduled', 'completed'].includes(appointment.status)) throw new ConflictException('该约看已签约或取消');
        const property = await this.saleProperty(appointment.salePropertyId, user, manager, true);
        if (!['selling', 'published', 'bargain', 'price_negotiation', 'quick_sale'].includes(property.status)) throw new ConflictException('该房源已成交或不可签约');
        const dealRepo = manager.getRepository(Deal);
        const deal = await dealRepo.save(dealRepo.create({ contractCode: input.contractCode?.trim() || `XS${Date.now()}${randomUUID().slice(0, 8)}`,
          bizType: 'sale', customerId: id, customerName: customer.name, customerPhone: customer.mobile,
          propertyId: property.id, propertyCode: property.code, propertyName: property.title || property.code,
          saleAppointmentId: appointment.id, signedAt: new Date(), amount: input.amount, deposit: 0,
          responsibleEmployeeId: appointment.responsibleEmployeeId, responsibleEmployeeName: appointment.responsibleEmployeeName,
          storeId: property.storeId, groupId: appointment.groupId, previousPropertyStatus: property.status,
          status: 'active', remark: input.remark?.trim() || null }));
        property.status = 'sold'; await manager.getRepository(SaleProperty).save(property);
        appointment.status = 'signed'; await repo.save(appointment);
        await manager.getRepository(Customer).update(id, { status: 'done', relatedPropertyCode: property.code });
        return deal;
      });
    } catch (error) {
      if (error?.code === '23505') throw new ConflictException('合同编号已存在或该约看已成交');
      throw error;
    }
  }

  async terminate(customerId: number, dealId: number, input: { terminatedOn: string; reason: string }, user: CurrentUserPayload) {
    await this.customer(customerId, user);
    if (!input.reason?.trim() || input.reason.length > 255) throw new BadRequestException('请填写解约原因（最多 255 字）');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.terminatedOn) || !Number.isFinite(Date.parse(input.terminatedOn)) ||
      new Date(input.terminatedOn).toISOString().slice(0, 10) !== input.terminatedOn) throw new BadRequestException('解约日期无效');
    return this.deals.manager.transaction(async manager => {
      const repo = manager.getRepository(Deal);
      const deal = await this.scoped(repo, user).andWhere('record.id = :id AND record.customerId = :customerId', { id: dealId, customerId })
        .setLock('pessimistic_write').getOne();
      if (!deal) throw new NotFoundException('成交合同不存在或无权操作');
      if (deal.status !== 'active') throw new ConflictException('该合同已申请解约或已解约');
      if (input.terminatedOn < (deal.leaseStart || deal.signedAt.toISOString().slice(0, 10))) throw new BadRequestException('解约日期不能早于合同开始日期');
      deal.terminatedOn = input.terminatedOn; deal.terminationReason = input.reason.trim();
      if (deal.bizType === 'rent') {
        const checkout = await this.checkouts.create({ rentalSetId: deal.propertyId, rentalRoomId: deal.roomId,
          contractCode: deal.contractCode, tenantName: deal.customerName, checkoutDate: input.terminatedOn,
          reason: deal.terminationReason, settlementAmount: 0 }, user, manager);
        deal.checkoutId = checkout.id; deal.status = 'termination_pending';
      } else {
        const property = await this.saleProperty(deal.propertyId, user, manager, true);
        if (property.status !== 'sold') throw new ConflictException('房态已变化，不能自动解约');
        property.status = deal.previousPropertyStatus || 'published';
        await manager.getRepository(SaleProperty).save(property);
        deal.status = 'terminated';
        await this.reactivateCustomer(manager, customerId, deal.id);
      }
      return repo.save(deal);
    });
  }

  private async reactivateCustomer(manager: EntityManager, customerId: number, exceptId: number) {
    const others = await manager.getRepository(Deal).createQueryBuilder('d')
      .where('d.customerId = :customerId AND d.id != :exceptId AND d.status IN (:...statuses)', { customerId, exceptId, statuses: ['active', 'termination_pending'] }).getCount();
    if (!others) await manager.getRepository(Customer).update({ id: customerId, status: 'done' }, { status: 'active' });
  }

  async findDeals(query: any, user: CurrentUserPayload) {
    const qb = this.scoped(this.deals, user);
    if (query.bizType) qb.andWhere('record.bizType = :bizType', { bizType: query.bizType });
    if (query.status) qb.andWhere('record.status = :status', { status: query.status });
    if (query.customerId) { await this.customers.findOne(Number(query.customerId), user); qb.andWhere('record.customerId = :customerId', { customerId: Number(query.customerId) }); }
    if (query.startDate && query.endDate && query.startDate > query.endDate) throw new BadRequestException('开始日期不能晚于结束日期');
    if (query.startDate) qb.andWhere('record.signedAt >= CAST(:startDate AS date)', { startDate: query.startDate });
    if (query.endDate) qb.andWhere("record.signedAt < CAST(:endDate AS date) + INTERVAL '1 day'", { endDate: query.endDate });
    if (query.keyword?.trim()) qb.andWhere(new Brackets(sub => sub.where('record.contractCode ILIKE :keyword', { keyword: `%${query.keyword.trim()}%` })
      .orWhere('record.customerName ILIKE :keyword').orWhere('record.propertyCode ILIKE :keyword').orWhere('record.propertyName ILIKE :keyword').orWhere('record.responsibleEmployeeName ILIKE :keyword')));
    const stats = await qb.clone().select('COUNT(*)::int', 'total')
      .addSelect("COUNT(*) FILTER (WHERE record.bizType = 'rent')::int", 'rentCount')
      .addSelect("COUNT(*) FILTER (WHERE record.bizType = 'sale')::int", 'saleCount')
      .addSelect("COALESCE(SUM(record.amount) FILTER (WHERE record.bizType = 'rent' AND record.status = 'active'), 0)", 'monthlyRent')
      .addSelect("COALESCE(SUM(record.amount) FILTER (WHERE record.bizType = 'sale' AND record.status = 'active'), 0)", 'saleAmount').getRawOne();
    const page = Math.max(1, Number(query.page) || 1), pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const [list, total] = await qb.orderBy('record.signedAt', 'DESC').addOrderBy('record.id', 'DESC')
      .skip((page - 1) * pageSize).take(pageSize).getManyAndCount();
    return { list: list.map(row => ({ ...row, amount: row.amount == null ? null : Number(row.amount), deposit: row.deposit == null ? null : Number(row.deposit) })), total,
      stats: { ...stats, monthlyRent: Number(stats.monthlyRent), saleAmount: Number(stats.saleAmount) } };
  }
}
