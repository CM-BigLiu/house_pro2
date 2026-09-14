import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { EntityManager, Repository } from 'typeorm';
import { Checkout } from '../entities/checkout.entity';
import { RentalSet } from '../entities/rental-set.entity';
import { RentalRoom } from '../entities/rental-room.entity';
import { Deposit } from '../entities/deposit.entity';
import { Community } from '../entities/community.entity';
import { matchingDeposits, settlementState } from './checkout-settlement';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Checkout)
    private checkoutRepo: Repository<Checkout>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.checkoutRepo.createQueryBuilder('c');
    if (query.status) qb.where('c.status = :status', { status: query.status });
    if (query.startDate) qb.andWhere('c.checkoutDate >= :startDate', { startDate: query.startDate });
    if (query.endDate) qb.andWhere('c.checkoutDate <= :endDate', { endDate: query.endDate });
    if (query.keyword) {
      qb.andWhere('(c.contractCode ILIKE :kw OR c.tenantName ILIKE :kw)', { kw: `%${query.keyword}%` });
    }
    this.applyScope(qb, user);
    const [list, total] = await qb.orderBy('c.createdAt', 'DESC')
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20).getManyAndCount();
    const deposits = list.length ? await this.checkoutRepo.manager.getRepository(Deposit).find({
      where: list.map(item => ({ storeId: item.storeId, tenantName: item.tenantName || '' })),
    }) : [];
    return { list: list.map(item => ({ ...item, ...settlementState(item, matchingDeposits(item, deposits)) })), total };
  }

  async create(data: Partial<Checkout>, user: CurrentUserPayload) {
    if (!Number.isInteger(data.rentalSetId) || data.rentalSetId <= 0) {
      throw new BadRequestException('退租必须关联出租房源');
    }
    return this.checkoutRepo.manager.transaction(async (manager) => {
      // 锁定实际房源，校验、登记和房态更新在同一事务内完成，防止并发重复退租。
      const { rentalSet, target, room } = await this.lockTarget(manager, data, user);
      if (target.status !== 'rented') throw new BadRequestException('仅已出租的房源或房间可发起退租');
      const repo = manager.getRepository(Checkout);
      const duplicateQb = repo.createQueryBuilder('c')
        .where('c.status = :status', { status: 'pending' })
        .andWhere('c.rentalSetId = :setId', { setId: rentalSet.id });
      if (room) duplicateQb.andWhere('c.rentalRoomId = :roomId', { roomId: room.id });
      else duplicateQb.andWhere('c.rentalRoomId IS NULL');
      if (await duplicateQb.getOne()) throw new BadRequestException('该房源或房间已有待审批退租申请，请勿重复提交');
      const community = await manager.getRepository(Community).findOne({ where: { id: rentalSet.communityId } });
      const houseInfo = `${community?.name || rentalSet.address} ${rentalSet.building}-${rentalSet.unit}-${rentalSet.roomNo}${room ? ` ${room.roomNo}室` : ''}`;
      const record = repo.create({
        contractCode: data.contractCode || `CO${Date.now()}${randomUUID().slice(0, 8)}`,
        houseInfo,
        tenantName: target.tenantName || data.tenantName,
        rentalSetId: rentalSet.id,
        rentalRoomId: room?.id ?? null,
        checkoutDate: data.checkoutDate,
        reason: data.reason,
        remark: data.remark,
        settlementAmount: data.settlementAmount ?? 0,
        expectedDepositAmount: Number(room ? room.depositAmount || 0 : rentalSet.deposit || 0),
        status: 'pending',
        storeId: rentalSet.storeId,
        creatorId: user.employeeId,
      });
      target.status = 'checkout';
      if (room) await manager.getRepository(RentalRoom).save(room);
      else await manager.getRepository(RentalSet).save(rentalSet);
      return repo.save(record);
    });
  }

  async findOne(id: number, user: CurrentUserPayload) {
    const item = await this.findScoped(id, user);
    const deposits = await this.checkoutRepo.manager.getRepository(Deposit).find({
      where: { storeId: item.storeId, tenantName: item.tenantName || '' },
    });
    return { ...item, settlementAmount: Number(item.settlementAmount || 0),
      ...settlementState(item, matchingDeposits(item, deposits)) };
  }

  async confirm(id: number, user: CurrentUserPayload) {
    return this.checkoutRepo.manager.transaction(async (manager) => {
      const checkout = await this.findScoped(id, user, manager, true);
      if (checkout.status !== 'pending') throw new BadRequestException('仅待审批的退租记录可审批通过');
      const { rentalSet, target, room } = await this.lockTarget(manager, checkout);
      if (target.status !== 'checkout') throw new BadRequestException('房源或房间状态已变化，请刷新后重试');
      target.status = 'vacant';
      target.tenantName = null;
      target.tenantPhone = null;
      if (room) {
        room.tenantId = null;
        room.cohabitantIds = null;
        room.leaseStart = null;
        room.leaseEnd = null;
        room.paymentMethod = null;
        await manager.getRepository(RentalRoom).save(room);
      } else {
        rentalSet.tenantLeaseStart = null;
        rentalSet.tenantLeaseEnd = null;
        rentalSet.tenantPaymentMethod = null;
        await manager.getRepository(RentalSet).save(rentalSet);
      }
      checkout.status = 'confirmed';
      checkout.confirmedAt = new Date();
      return manager.getRepository(Checkout).save(checkout);
    });
  }

  async complete(id: number, user: CurrentUserPayload) {
    return this.checkoutRepo.manager.transaction(async (manager) => {
      const checkout = await this.findScoped(id, user, manager, true);
      if (checkout.status !== 'confirmed') throw new BadRequestException('仅已审批通过的退租记录可完成清算');
      const deposits = await manager.getRepository(Deposit).createQueryBuilder('d')
        .where('d.storeId = :storeId AND d.tenantName = :tenantName', { storeId: checkout.storeId, tenantName: checkout.tenantName || '' })
        .setLock('pessimistic_write').getMany();
      const state = settlementState(checkout, matchingDeposits(checkout, deposits));
      if (!state.canComplete) throw new BadRequestException(state.settlementBlockReason);
      // 审批已释放房间；后续清算不再修改房态，避免影响新入住租客。
      checkout.status = 'completed';
      checkout.completedAt = new Date();
      return manager.getRepository(Checkout).save(checkout);
    });
  }

  private applyScope(qb: any, user: CurrentUserPayload) {
    // 退租表无 group_id，分组范围通过关联房源限定。
    if (user.dataScope === 'group' && user.groupIds?.length) {
      qb.andWhere('c.rentalSetId IN (SELECT rs.id FROM house_rental_set rs WHERE rs.group_id IN (:...groupIds))', { groupIds: user.groupIds });
    } else {
      applyDataScope(qb, user, 'c', { ownerField: 'creatorId', storeField: 'storeId' });
    }
  }

  private async findScoped(id: number, user: CurrentUserPayload, manager?: EntityManager, lock = false) {
    const repo = manager ? manager.getRepository(Checkout) : this.checkoutRepo;
    const qb = repo.createQueryBuilder('c').where('c.id = :id', { id });
    this.applyScope(qb, user);
    if (lock) qb.setLock('pessimistic_write');
    const existing = await qb.getOne();
    if (!existing) throw new NotFoundException('退租记录不存在');
    return existing;
  }

  private async lockTarget(manager: EntityManager, data: Partial<Checkout>, user?: CurrentUserPayload) {
    if (!data.rentalSetId) throw new BadRequestException('历史退租记录未关联房源，无法自动更新房态');
    const qb = manager.getRepository(RentalSet).createQueryBuilder('rs')
      .where('rs.id = :id', { id: data.rentalSetId });
    if (user) applyDataScope(qb, user, 'rs', { ownerField: 'creatorId', groupField: 'groupId' });
    const rentalSet = await qb.setLock('pessimistic_write').getOne();
    if (!rentalSet) throw new NotFoundException('出租房源不存在或无权访问');
    if (!data.rentalRoomId) {
      if (rentalSet.bizType !== 'entire') throw new BadRequestException('合租房源请按房间发起退租');
      return { rentalSet, room: null as RentalRoom | null, target: rentalSet };
    }
    const room = await manager.getRepository(RentalRoom).findOne({
      where: { id: data.rentalRoomId, setId: data.rentalSetId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!room) throw new NotFoundException('出租房间不存在或不属于该房源');
    return { rentalSet, room, target: room };
  }
}
