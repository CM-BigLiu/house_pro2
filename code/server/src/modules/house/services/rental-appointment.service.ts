import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RentalAppointment } from '../entities/rental-appointment.entity';
import { RentalSet } from '../entities/rental-set.entity';
import { CustomerService } from './customer.service';
import { RentalAppointmentAction } from '../entities/rental-appointment-action.entity';
import { RentalRoom } from '../entities/rental-room.entity';
import { Deal } from '../entities/deal.entity';
import { Customer } from '../entities/customer.entity';
import { ContractDetails } from '../entities/contract-details';
import { BusinessWorkflowService } from '../../finance/services/business-workflow.service';

type CreateRentalAppointmentInput = {
  rentalSetId: number;
  rentalRoomId?: number;
  customerId?: number;
  scheduledAt: string;
  remark?: string;
};

export type SignRentalAppointmentInput = {
  rentalRoomId?: number;
  contractCode?: string;
  tenantName?: string;
  tenantPhone?: string;
  leaseStart: string;
  leaseEnd: string;
  rent: number;
  deposit: number;
  paymentMethod: string;
  remark?: string;
  details?: ContractDetails;
};

@Injectable()
export class RentalAppointmentService {
  constructor(
    @InjectRepository(RentalAppointment)
    private appointmentRepo: Repository<RentalAppointment>,
    @InjectRepository(RentalSet)
    private rentalSetRepo: Repository<RentalSet>,
    private customerService: CustomerService,
    private business?: BusinessWorkflowService,
  ) {}

  private scoped(repo: Repository<RentalAppointment>, user: CurrentUserPayload) {
    const qb = repo.createQueryBuilder('appointment');
    applyDataScope(qb, user, 'appointment', {
      ownerField: 'responsibleEmployeeId',
      groupField: 'groupId',
      storeField: 'storeId',
    });
    return qb;
  }

  private async findScoped(id: number, user: CurrentUserPayload, repo = this.appointmentRepo, lock = false) {
    const qb = this.scoped(repo, user).andWhere('appointment.id = :id', { id });
    if (lock) qb.setLock('pessimistic_write');
    const appointment = await qb.getOne();
    if (!appointment) throw new ForbiddenException('约看记录不存在或无权操作');
    return appointment;
  }

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.scoped(this.appointmentRepo, user).leftJoinAndSelect('appointment.actions', 'actions');

    if (query.status) {
      qb.andWhere('appointment.status = :status', { status: query.status });
    }
    if (query.rentalSetId) {
      qb.andWhere('appointment.rentalSetId = :rentalSetId', { rentalSetId: Number(query.rentalSetId) });
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const [list, total] = await qb
      .orderBy('appointment.scheduledAt', 'ASC')
      .addOrderBy('appointment.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return { list, total };
  }

  async create(input: CreateRentalAppointmentInput, user: CurrentUserPayload) {
    const appointment = await this.buildAppointment(input, user);
    return this.appointmentRepo.save(appointment);
  }

  private async buildAppointment(input: CreateRentalAppointmentInput, user: CurrentUserPayload, repo = this.rentalSetRepo) {
    const scheduledAt = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('约看时间格式不正确');
    }
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('约看时间必须晚于当前时间');
    }

    const qb = repo.createQueryBuilder('rentalSet')
      .leftJoinAndSelect('rentalSet.rooms', 'rooms')
      .leftJoinAndSelect('rentalSet.community', 'community')
      .where('rentalSet.id = :id', { id: input.rentalSetId });
    applyDataScope(qb, user, 'rentalSet', { ownerField: 'creatorId', groupField: 'groupId', storeField: 'storeId' });
    const rentalSet = await qb.getOne();
    if (!rentalSet) {
      throw new ForbiddenException('无权约看该房源或房源不存在');
    }

    if (input.rentalRoomId && !(rentalSet.rooms || []).some((room) => room.id === input.rentalRoomId)) {
      throw new BadRequestException('所选房间不属于该房源');
    }

    // 与客户列表共用数据权限校验，不信任前端传入的客户归属或姓名。
    const customer = input.customerId != null
      ? await this.customerService.findOne(input.customerId, user)
      : null;

    const propertyName = [
      rentalSet.community?.name,
      rentalSet.building ? `${rentalSet.building}栋` : '',
      rentalSet.unit ? `${rentalSet.unit}单元` : '',
      rentalSet.roomNo,
    ].filter(Boolean).join('');

    return this.appointmentRepo.create({
      rentalSetId: rentalSet.id,
      rentalRoomId: input.rentalRoomId,
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? null,
      propertyCode: rentalSet.code,
      propertyName: propertyName || rentalSet.title || rentalSet.address || rentalSet.code,
      scheduledAt,
      responsibleEmployeeId: user.employeeId,
      responsibleEmployeeName: user.name,
      storeId: rentalSet.storeId,
      groupId: rentalSet.groupId,
      status: 'scheduled',
      remark: input.remark?.trim() || null,
    });
  }

  private async saveAction(manager: EntityManager, appointmentId: number, action: string, content: string,
    user: CurrentUserPayload, details?: Record<string, unknown>) {
    const repo = manager.getRepository(RentalAppointmentAction);
    return repo.save(repo.create({ appointmentId, action, content, employeeId: user.employeeId,
      employeeName: user.name, details }));
  }

  async followUp(id: number, content: string, user: CurrentUserPayload) {
    if (!content?.trim()) throw new BadRequestException('请填写约看后跟进内容');
    return this.appointmentRepo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(RentalAppointment);
      const appointment = await this.findScoped(id, user, repo, true);
      if (appointment.status === 'cancelled') throw new BadRequestException('已取消的约看不能跟进');
      const action = await this.saveAction(manager, id, 'follow_up', content.trim(), user);
      if (appointment.status === 'scheduled') appointment.status = 'completed';
      await repo.save(appointment);
      return action;
    });
  }

  async signingContext(id: number, user: CurrentUserPayload) {
    const appointment = await this.findScoped(id, user);
    const qb = this.rentalSetRepo.createQueryBuilder('rentalSet').where('rentalSet.id = :id', { id: appointment.rentalSetId });
    applyDataScope(qb, user, 'rentalSet', { ownerField: 'creatorId', groupField: 'groupId', storeField: 'storeId' });
    const rental = await qb.leftJoinAndSelect('rentalSet.rooms', 'rooms').getOne();
    if (!rental) throw new ForbiddenException('房源不存在或无权签约');
    const customer = appointment.customerId ? await this.customerService.findOne(appointment.customerId, user) : null;
    return { bizType: rental.bizType, workflowType: rental.isManaged ? 'tenant' : 'regular', propertyAddress: appointment.propertyName,
      customerName: customer?.name || appointment.customerName, customerPhone: customer?.mobile || null,
      rooms: (rental.rooms || []).map((room) => ({ id: room.id, roomNo: room.roomNo, status: room.status })) };
  }

  async recommend(id: number, input: CreateRentalAppointmentInput, user: CurrentUserPayload) {
    return this.appointmentRepo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(RentalAppointment);
      const source = await this.findScoped(id, user, repo, true);
      if (['signed', 'cancelled'].includes(source.status)) throw new BadRequestException('已签约或已取消的约看不能再次推荐');
      if (source.customerId && input.customerId && input.customerId !== source.customerId) {
        throw new BadRequestException('再次推荐须保持原约看的客户');
      }
      const customerId = source.customerId ?? input.customerId;
      if (!customerId) throw new BadRequestException('请先选择本次推荐的客户');
      const appointment = await this.buildAppointment({ ...input, customerId }, user, manager.getRepository(RentalSet));
      appointment.sourceAppointmentId = source.id;
      const saved = await repo.save(appointment);
      await this.saveAction(manager, id, 'recommend', input.remark?.trim() || '再次推荐房源', user,
        { recommendedAppointmentId: saved.id, propertyCode: saved.propertyCode, scheduledAt: saved.scheduledAt.toISOString() });
      return saved;
    });
  }

  async sign(id: number, input: SignRentalAppointmentInput, user: CurrentUserPayload) {
    if (input.details) this.business?.validateDetails(input.details);
    const validDate = (value: string) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
    if (!validDate(input.leaseStart) || !validDate(input.leaseEnd) || input.leaseStart > input.leaseEnd) {
      throw new BadRequestException('请选择有效的租期，结束日期不能早于开始日期');
    }
    if (![input.rent, input.deposit].every((value) => Number.isFinite(value) && value >= 0 && /^\d+(\.\d{1,2})?$/.test(String(value)))) {
      throw new BadRequestException('租金和押金须为非负金额，最多两位小数');
    }
    if (!input.paymentMethod?.trim()) throw new BadRequestException('请选择付款方式');
    try {
      return await this.appointmentRepo.manager.transaction(async (manager) => {
        const repo = manager.getRepository(RentalAppointment);
        const appointment = await this.findScoped(id, user, repo, true);
        if (appointment.status === 'signed') throw new ConflictException('该约看已签约，请勿重复提交');
        if (appointment.status === 'cancelled') throw new BadRequestException('已取消的约看不能签约');
        const customer = appointment.customerId ? await this.customerService.findOne(appointment.customerId, user) : null;
        if (customer && (customer.customerType !== 'tenant' || customer.isBlacklist || ['blacklist', 'invalid'].includes(customer.status))) {
          throw new BadRequestException('请选择有效的租房客户签约');
        }
        const tenantName = (customer?.name ?? input.tenantName)?.trim();
        const tenantPhone = (customer?.mobile ?? input.tenantPhone)?.trim();
        if (!tenantName || !/^1\d{10}$/.test(tenantPhone || '')) throw new BadRequestException('请补齐租客姓名及有效手机号');
        const setRepo = manager.getRepository(RentalSet);
        const qb = setRepo.createQueryBuilder('rentalSet').where('rentalSet.id = :id', { id: appointment.rentalSetId });
        applyDataScope(qb, user, 'rentalSet', { ownerField: 'creatorId', groupField: 'groupId', storeField: 'storeId' });
        const rental = await qb.setLock('pessimistic_write').getOne();
        if (!rental) throw new ForbiddenException('房源不存在或无权签约');
        if (this.business) this.business.validateRentalDetails(input.details || {}, rental.isManaged);
        if (!['active', 'vacant', 'reserved', 'rented'].includes(rental.status)) throw new BadRequestException('该房源当前状态不能签约');
        const roomId = appointment.rentalRoomId || input.rentalRoomId;
        if (appointment.rentalRoomId && input.rentalRoomId && appointment.rentalRoomId !== input.rentalRoomId) {
          throw new BadRequestException('签约房间须与约看房间一致');
        }
        if (rental.bizType === 'shared') {
          if (!roomId) throw new BadRequestException('请选择签约房间');
          const roomRepo = manager.getRepository(RentalRoom);
          const room = await roomRepo.findOne({ where: { id: roomId, setId: rental.id }, lock: { mode: 'pessimistic_write' } });
          if (!room || !['vacant', 'reserved'].includes(room.status) || room.tenantName || room.tenantPhone) {
            throw new ConflictException('所选房间不存在、已出租或不可签约');
          }
          Object.assign(room, { tenantName, tenantPhone, tenantId: appointment.customerId, leaseStart: input.leaseStart,
            leaseEnd: input.leaseEnd, rentPrice: input.rent, depositAmount: input.deposit, paymentMethod: input.paymentMethod, status: 'rented' });
          await roomRepo.save(room);
          appointment.rentalRoomId = room.id;
        } else {
          if (roomId) throw new BadRequestException('整租房源不支持选择合租房间');
          if (rental.status === 'rented' || rental.tenantName || rental.tenantPhone) throw new ConflictException('该房源已出租，不能重复签约');
          Object.assign(rental, { tenantName, tenantPhone, tenantLeaseStart: input.leaseStart, tenantLeaseEnd: input.leaseEnd,
            rent: input.rent, deposit: input.deposit, tenantPaymentMethod: input.paymentMethod });
        }
        rental.status = 'rented';
        await setRepo.save(rental);
        appointment.status = 'signed';
        appointment.contractCode = input.details ? `HT${Date.now()}${randomUUID().slice(0, 8)}` : input.contractCode?.trim() || `HT${Date.now()}${randomUUID().slice(0, 8)}`;
        appointment.signedAt = new Date();
        appointment.customerName = tenantName;
        await repo.save(appointment);
        await this.saveAction(manager, id, 'sign', input.remark?.trim() || '约看签约', user, {
          contractCode: appointment.contractCode, leaseStart: input.leaseStart, leaseEnd: input.leaseEnd,
          rent: input.rent, deposit: input.deposit, paymentMethod: input.paymentMethod,
        });
        const dealRepo = manager.getRepository(Deal);
        const deal = await dealRepo.save(dealRepo.create({ contractCode: appointment.contractCode, bizType: 'rent',
          workflowType: rental.isManaged ? 'tenant' : 'regular', details: input.details,
          customerId: appointment.customerId, customerName: tenantName, customerPhone: tenantPhone,
          propertyId: rental.id, roomId: appointment.rentalRoomId || null, propertyCode: appointment.propertyCode,
          propertyName: appointment.propertyName, rentalAppointmentId: appointment.id, signedAt: appointment.signedAt,
          amount: input.rent, deposit: input.deposit, leaseStart: input.leaseStart, leaseEnd: input.leaseEnd,
          paymentMethod: input.paymentMethod, responsibleEmployeeId: user.employeeId,
          responsibleEmployeeName: user.name, storeId: appointment.storeId, groupId: appointment.groupId,
          status: 'active', remark: input.remark?.trim() || null }));
        if (rental.isManaged && this.business) {
          const management = await dealRepo.createQueryBuilder('management').where('management.propertyId = :propertyId AND management.workflowType = :type AND management.status = :status AND management.leaseStart <= :leaseStart AND management.leaseEnd >= :leaseEnd', { propertyId: rental.id, type: 'management', status: 'active', leaseStart: input.leaseStart, leaseEnd: input.leaseEnd }).getOne();
          if (!management || input.leaseStart < management.leaseStart || input.leaseEnd > management.leaseEnd) throw new BadRequestException('承租期限须在生效委托合同的租期内，请先登记房管房委托合同');
          await this.business.createSchedules(manager, deal, 'receive');
        }
        if (appointment.customerId) await manager.getRepository(Customer).update(appointment.customerId,
          { status: 'done', relatedPropertyCode: appointment.propertyCode, contractEndDate: input.leaseEnd });
        return appointment;
      });
    } catch (error) {
      if (error?.code === '23505') throw new ConflictException('合同编号已存在');
      throw error;
    }
  }
}
