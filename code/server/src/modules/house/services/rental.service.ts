import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { RentalSet } from '../entities/rental-set.entity';
import { RentalRoom } from '../entities/rental-room.entity';
import { Checkout } from '../entities/checkout.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { BEIJING_DISTRICTS } from '../../../common/constants/beijing-districts';
import { canAccessRentalLandlord, filterRentalLandlord, isRentalAdministrator, RENTAL_LANDLORD_FIELDS } from '../../../common/utils/rental-privacy.util';
import { normalizeFreeRentRanges } from '../../finance/services/business-calculation';
import { syncLandlordFreeRent } from '../../finance/services/landlord-free-rent';
import { attachRentalCardSummaries } from './rental-card-summary';

type RentalSetInput = Omit<Partial<RentalSet>, 'rooms'> & {
  rooms?: Partial<RentalRoom>[];
};

@Injectable()
export class RentalService {
  constructor(
    @InjectRepository(RentalSet)
    private setRepo: Repository<RentalSet>,
    @InjectRepository(RentalRoom)
    private roomRepo: Repository<RentalRoom>,
  ) {}

  private mapSet(rs: RentalSet, user: CurrentUserPayload) {
    const rooms = [...(rs.rooms || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.id - b.id);
    const rent = rs.bizType === 'entire'
      ? Number(rs.rent || 0)
      : rooms.reduce((sum, room) => sum + Number(room.rentPrice || 0), 0);
    const deposit = rs.bizType === 'entire'
      ? Number(rs.deposit || 0)
      : rooms.reduce((sum, room) => sum + Number(room.depositAmount || 0), 0);
    return filterRentalLandlord({
      ...rs,
      rooms,
      communityName: rs.community?.name || '',
      landlordDeposit: Number(rs.landlordDeposit || 0),
      rent,
      deposit,
      roomCount: rooms.length,
      vacantCount: rooms.filter((room) => room.status === 'vacant').length,
    }, user);
  }

  private async findScopedSet(id: number, user: CurrentUserPayload) {
    const qb = this.setRepo.createQueryBuilder('rs')
      .leftJoinAndSelect('rs.rooms', 'rooms')
      .leftJoinAndSelect('rs.community', 'community')
      .where('rs.id = :id', { id });
    applyDataScope(qb, user, 'rs', { ownerField: 'creatorId', groupField: 'groupId' });
    const item = await qb.getOne();
    if (!item) throw new ForbiddenException('无权查看或记录不存在');
    return item;
  }

  async findSets(query: any, user: CurrentUserPayload) {
    const qb = this.setRepo.createQueryBuilder('rs')
      .leftJoinAndSelect('rs.rooms', 'rooms')
      .leftJoinAndSelect('rs.community', 'community');
    if (query.bizType) qb.where('rs.bizType = :bizType', { bizType: query.bizType });
    if (query.status === 'vacant' || query.status === 'rented') {
      const entireCondition = query.status === 'vacant'
        ? 'rs.bizType = :entireType AND rs.status IN (:...entireStatuses)'
        : 'rs.bizType = :entireType AND rs.status = :entireStatus';
      const entireParams = query.status === 'vacant'
        ? { entireType: 'entire', entireStatuses: ['active', 'vacant'] }
        : { entireType: 'entire', entireStatus: 'rented' };
      qb.andWhere(new Brackets((statusQb) => {
        statusQb.where(entireCondition, entireParams)
          .orWhere(
            `rs.bizType = :sharedType AND EXISTS (
              SELECT 1 FROM house_rental_room status_room
              WHERE status_room.set_id = rs.id AND status_room.status = :roomStatus
            )`,
            { sharedType: 'shared', roomStatus: query.status },
          );
      }));
    } else if (query.status) qb.andWhere('rs.status = :status', { status: query.status });
    const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : '';
    if (keyword) {
      qb.andWhere(new Brackets((sub) => {
        sub.where('rs.code ILIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('community.name ILIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('rs.address ILIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('rs.building ILIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('rs.unit ILIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('rs.roomNo ILIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('rooms.roomNo ILIKE :keyword', { keyword: `%${keyword}%` });
      }));
    }
    const likeFilters: Array<[string, string]> = [
      ['code', 'rs.code'],
      ['layout', 'rs.layout'],
      ['district', 'rs.district'],
      ['address', 'rs.address'],
      ['building', 'rs.building'],
      ['unit', 'rs.unit'],
      ['landlordPhone', 'rs.landlordPhone'],
    ];
    for (const [key, column] of likeFilters) {
      const value = typeof query[key] === 'string' ? query[key].trim() : '';
      if (value && key === 'landlordPhone' && !isRentalAdministrator(user)) {
        qb.andWhere('rs.creatorId = :landlordOwnerId', { landlordOwnerId: user.employeeId });
      }
      if (value) qb.andWhere(`${column} ILIKE :${key}`, { [key]: `%${value}%` });
    }
    const roomNo = typeof query.roomNo === 'string' ? query.roomNo.trim() : '';
    if (roomNo) {
      qb.andWhere(new Brackets((sub) => {
        sub.where('rs.roomNo ILIKE :roomNo', { roomNo: `%${roomNo}%` })
          .orWhere('rooms.roomNo ILIKE :roomNo', { roomNo: `%${roomNo}%` });
      }));
    }
    for (const field of ['storeId', 'salesmanId', 'housekeeperId'] as const) {
      const value = Number(query[field]);
      if (Number.isFinite(value) && value > 0) {
        qb.andWhere(`rs.${field} = :${field}`, { [field]: value });
      }
    }
    if (query.paymentMethod) {
      qb.andWhere(new Brackets((sub) => {
        sub.where('rs.tenantPaymentMethod = :paymentMethod', { paymentMethod: query.paymentMethod })
          .orWhere('rooms.paymentMethod = :paymentMethod', { paymentMethod: query.paymentMethod });
      }));
    }
    if (query.leaseTerm) {
      qb.andWhere(new Brackets((sub) => {
        sub.where('rs.leaseTerm = :leaseTerm', { leaseTerm: query.leaseTerm })
          .orWhere('rooms.leaseTerm = :leaseTerm', { leaseTerm: query.leaseTerm });
      }));
    }
    if (query.operationStatus) {
      qb.andWhere('rs.operationStatus = :operationStatus', { operationStatus: query.operationStatus });
    }
    if (query.businessStatus) {
      qb.andWhere('rs.businessStatus = :businessStatus', { businessStatus: query.businessStatus });
    }
    for (const field of ['propertyType', 'orientation', 'decoration', 'sourceChannel'] as const) {
      if (query[field]) qb.andWhere(`rs.${field} = :${field}`, { [field]: query[field] });
    }
    if (query.scope === 'mine') qb.andWhere('rs.creatorId = :scopeCreatorId', { scopeCreatorId: user.employeeId });
    applyDataScope(qb, user, 'rs', { ownerField: 'creatorId', groupField: 'groupId' });
    if (query.sortBy === 'rent_desc') qb.orderBy('rs.rent', 'DESC', 'NULLS LAST');
    else if (query.sortBy === 'rent_asc') qb.orderBy('rs.rent', 'ASC', 'NULLS LAST');
    else if (query.sortBy === 'lease_end') {
      qb.orderBy(isRentalAdministrator(user)
        ? 'COALESCE(rs."tenantLeaseEnd", rs."leaseEnd")'
        : 'rs."tenantLeaseEnd"', 'ASC', 'NULLS LAST');
    } else qb.orderBy('rs.createdAt', 'DESC');
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    const mapped = list.map((rs) => this.mapSet(rs, user));
    return { list: query.withFinancialSummary === 'true' || query.withFinancialSummary === true ? await attachRentalCardSummaries(this.setRepo.manager, mapped, user) : mapped, total };
  }

  async findSet(id: number, user: CurrentUserPayload) {
    return this.mapSet(await this.findScopedSet(id, user), user);
  }

  async updateSet(
    id: number,
    data: RentalSetInput,
    user: CurrentUserPayload,
  ) {
    const existing = await this.findScopedSet(id, user);
    if (!canAccessRentalLandlord(existing, user)
      && RENTAL_LANDLORD_FIELDS.some(field => data[field] !== undefined)) {
      throw new ForbiddenException('仅填写人和管理员可修改房东与收房信息或托管状态');
    }
    if (data.isManaged !== undefined && typeof data.isManaged !== 'boolean') throw new BadRequestException('托管状态须为布尔值');
    if (data.freeRentRanges !== undefined) data.freeRentRanges = normalizeFreeRentRanges(data.freeRentRanges, data.leaseStart ?? existing.leaseStart ?? '', data.leaseEnd ?? existing.leaseEnd ?? '');
    else if (data.leaseStart !== undefined || data.leaseEnd !== undefined) normalizeFreeRentRanges(existing.freeRentRanges || [], data.leaseStart ?? existing.leaseStart ?? '', data.leaseEnd ?? existing.leaseEnd ?? '');
    if (data.isManaged === true) this.validateManagement({ ...existing, ...data });
    if (data.district !== undefined && data.district !== existing.district) this.validateDistrict(data.district);
    if (
      data.storeId !== undefined
      && Number(data.storeId) !== Number(existing.storeId)
      && user.dataScope !== 'company'
    ) {
      throw new ForbiddenException('无权将房源转移到其他门店');
    }

    const allowedSetFields: (keyof RentalSet)[] = [
      'code', 'bizType', 'communityId', 'address', 'building', 'unit', 'roomNo',
      'floor', 'totalFloor', 'layout', 'buildingArea', 'interiorArea', 'businessCircle', 'district',
      'propertyType', 'orientation', 'elevator', 'decoration', 'sourceChannel', 'tags', 'description',
      'title', 'communityIntro', 'nearbySchool', 'taxDescription', 'advantages', 'facilities',
      'landlordRent', 'landlordDeposit', 'rent', 'leaseStart', 'leaseEnd',
      'landlordPaymentMethod', 'rentFreePeriod', 'freeRentRanges', 'status',
      'storeId', 'groupId', 'landlordId', 'salesmanId', 'housekeeperId',
      'tenantLeaseStart', 'tenantLeaseEnd',
      'landlordName', 'landlordPhone', 'landlordPhoneBackup', 'landlordRemark', 'emergencyContacts',
      'viewingTime', 'viewingTimeAlt', 'followUpContent', 'images',
      'landlordIdCard', 'landlordBankCard', 'landlordBankName',
      'tenantName', 'tenantPhone', 'tenantIdCard',
      'tenantPaymentMethod', 'deposit',
      'isManaged',
    ];
    const setChanges: Partial<RentalSet> = {};
    const nullableDateFields = new Set<keyof RentalSet>([
      'leaseStart', 'leaseEnd', 'tenantLeaseStart', 'tenantLeaseEnd',
    ]);
    for (const field of allowedSetFields) {
      if (data[field] !== undefined) {
        (setChanges as any)[field] = nullableDateFields.has(field) && data[field] === ''
          ? null
          : data[field];
      }
    }

    const incomingRooms = data.rooms;
    const currentRooms = existing.rooms || [];
    const currentRoomById = new Map(currentRooms.map((room) => [room.id, room]));
    if (incomingRooms) {
      for (const room of incomingRooms) {
        if (room.id !== undefined && !currentRoomById.has(Number(room.id))) {
          throw new ForbiddenException('房间不属于当前房源');
        }
      }
    }

    await this.setRepo.manager.transaction(async (manager) => {
      const setRepo = manager.getRepository(RentalSet);
      const roomRepo = manager.getRepository(RentalRoom);
      const setToSave = setRepo.create({
        ...existing,
        ...setChanges,
        id,
        creatorId: existing.creatorId,
      });
      delete (setToSave as any).community;
      delete (setToSave as any).rooms;
      await setRepo.save(setToSave);
      if (data.freeRentRanges !== undefined && JSON.stringify(existing.freeRentRanges || []) !== JSON.stringify(data.freeRentRanges))
        await syncLandlordFreeRent(manager, setToSave);

      if (incomingRooms !== undefined) {
        const incomingIds = new Set(
          incomingRooms
            .filter((room) => room.id !== undefined)
            .map((room) => Number(room.id)),
        );
        const removedIds = currentRooms
          .map((room) => room.id)
          .filter((roomId) => !incomingIds.has(roomId));
        if (removedIds.length) {
          await roomRepo.delete({ id: In(removedIds), setId: id });
        }

        const allowedRoomFields: (keyof RentalRoom)[] = [
          'roomNo', 'roomType', 'rentPrice', 'listedPrice', 'status', 'leaseEnd',
          'paymentMethod', 'leaseTerm', 'renovationProgress', 'cohabitantIds',
          'leaseDuration', 'arrearDays', 'depositAmount', 'paymentStatus', 'tenantId',
          'leaseStart', 'tenantName', 'tenantPhone', 'tenantIdCard',
          'privateBathroom', 'balcony', 'airConditioner', 'interiorArea', 'orientation', 'facilities', 'sortOrder',
        ];
        const roomsToSave = incomingRooms.map((room) => {
          const current = room.id === undefined ? undefined : currentRoomById.get(Number(room.id));
          const changes: Partial<RentalRoom> = {};
          for (const field of allowedRoomFields) {
            if (room[field] !== undefined) {
              (changes as any)[field] = (field === 'leaseStart' || field === 'leaseEnd') && room[field] === ''
                ? null
                : room[field];
            }
          }
          return roomRepo.create({
            ...current,
            ...changes,
            id: current?.id,
            setId: id,
            creatorId: current?.creatorId ?? user.employeeId,
          });
        });
        if (roomsToSave.length) await roomRepo.save(roomsToSave);
      }
    });

    return this.findSet(id, user);
  }

  async createSet(data: RentalSetInput, user?: CurrentUserPayload) {
    if (data.freeRentRanges !== undefined) data.freeRentRanges = normalizeFreeRentRanges(data.freeRentRanges, data.leaseStart || '', data.leaseEnd || '');
    this.validateDistrict(data.district);
    if (data.isManaged !== undefined && typeof data.isManaged !== 'boolean') throw new BadRequestException('托管状态须为布尔值');
    if (data.isManaged === true) this.validateManagement(data);
    const storeId = data.storeId ?? user?.storeIds?.[0];
    if (user && user.dataScope !== 'company' && !user.storeIds?.includes(Number(storeId))) {
      throw new ForbiddenException('无权在该门店新增房源');
    }
    return this.setRepo.manager.transaction(async (manager) => {
      const setRepo = manager.getRepository(RentalSet);
      const roomRepo = manager.getRepository(RentalRoom);
      const { rooms: incomingRooms, ...setData } = data;
      delete setData.id;
      delete setData.operationStatus;
      delete setData.businessStatus;
      delete setData.leaseTerm;
      for (const field of ['leaseStart', 'leaseEnd', 'tenantLeaseStart', 'tenantLeaseEnd']) {
        if (setData[field] === '') setData[field] = null;
      }
      const saved = await setRepo.save(setRepo.create({
        ...setData, operationStatus: 'normal', businessStatus: 'normal', storeId, creatorId: user?.employeeId,
      }));
      if (incomingRooms?.length) {
        const rooms = incomingRooms.map(({ id: _roomId, ...room }) => roomRepo.create({
          ...room,
          leaseStart: room.leaseStart || null,
          leaseEnd: room.leaseEnd || null,
          setId: saved.id,
          creatorId: user?.employeeId,
        }));
        await roomRepo.save(rooms);
      }
      return saved;
    });
  }

  private validateDistrict(district?: string) {
    if (district && !BEIJING_DISTRICTS.includes(district)) throw new BadRequestException('请选择北京市所辖区域');
  }

  private validateManagement(data: RentalSetInput) {
    if (!data.landlordName?.trim() || !/^1\d{10}$/.test(data.landlordPhone?.trim() || '')
      || data.landlordRent == null || !Number.isFinite(Number(data.landlordRent)) || Number(data.landlordRent) < 0
      || !data.leaseStart || !data.leaseEnd || !Number.isFinite(Date.parse(data.leaseStart))
      || !Number.isFinite(Date.parse(data.leaseEnd)) || data.leaseStart > data.leaseEnd
      || !data.landlordPaymentMethod?.trim()) {
      throw new BadRequestException('托管前请补齐房东姓名、有效手机号、承租价、承租期和房东缴费方式');
    }
  }

  async removeSet(id: number, user: CurrentUserPayload) {
    const existing = await this.findScopedSet(id, user);
    const rooms = existing.rooms || [];
    const hasActiveBusiness = !['active', 'vacant', 'pause', 'maintenance'].includes(existing.status)
      || Boolean(existing.tenantName || existing.tenantPhone)
      || rooms.some((room) => !['vacant', 'maintenance'].includes(room.status)
        || Boolean(room.tenantName || room.tenantPhone));
    const hasCheckout = await this.setRepo.manager.getRepository(Checkout).exist({
      where: { rentalSetId: id },
    });
    if (hasActiveBusiness || hasCheckout) {
      throw new BadRequestException('房源已有出租、租客或退租业务记录，不能删除');
    }
    await this.setRepo.manager.transaction(async (manager) => {
      await manager.getRepository(RentalRoom).delete({ setId: id });
      await manager.getRepository(RentalSet).delete(id);
    });
    return { id };
  }
}
