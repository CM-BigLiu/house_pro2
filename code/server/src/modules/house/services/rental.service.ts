import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { RentalSet } from '../entities/rental-set.entity';
import { RentalRoom } from '../entities/rental-room.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

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

  private mapSet(rs: RentalSet) {
    const rooms = rs.rooms || [];
    const rent = rs.bizType === 'entire'
      ? Number(rs.rent || 0)
      : rooms.reduce((sum, room) => sum + Number(room.rentPrice || 0), 0);
    const deposit = rs.bizType === 'entire'
      ? Number(rs.deposit || 0)
      : rooms.reduce((sum, room) => sum + Number(room.depositAmount || 0), 0);
    return {
      ...rs,
      communityName: rs.community?.name || '',
      rent,
      deposit,
      roomCount: rooms.length,
      vacantCount: rooms.filter((room) => room.status === 'vacant').length,
    };
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
    if (query.status) qb.andWhere('rs.status = :status', { status: query.status });
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
    applyDataScope(qb, user, 'rs', { ownerField: 'creatorId', groupField: 'groupId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    const mapped = list.map((rs) => this.mapSet(rs));
    return { list: mapped, total };
  }

  async findSet(id: number, user: CurrentUserPayload) {
    return this.mapSet(await this.findScopedSet(id, user));
  }

  async updateSet(
    id: number,
    data: RentalSetInput,
    user: CurrentUserPayload,
  ) {
    const existing = await this.findScopedSet(id, user);
    if (
      data.storeId !== undefined
      && Number(data.storeId) !== Number(existing.storeId)
      && user.dataScope !== 'company'
    ) {
      throw new ForbiddenException('无权将房源转移到其他门店');
    }

    const allowedSetFields: (keyof RentalSet)[] = [
      'code', 'bizType', 'communityId', 'address', 'building', 'unit', 'roomNo',
      'layout', 'buildingArea', 'interiorArea', 'businessCircle', 'decoration',
      'landlordRent', 'rent', 'leaseStart', 'leaseEnd', 'rentFreePeriod', 'status',
      'storeId', 'groupId', 'landlordId', 'salesmanId', 'housekeeperId',
      'tenantLeaseStart', 'tenantLeaseEnd',
      'landlordName', 'landlordPhone', 'tenantName', 'tenantPhone',
      'tenantPaymentMethod', 'deposit',
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
          'leaseStart', 'tenantName', 'tenantPhone',
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
    const storeId = data.storeId ?? user?.storeIds?.[0];
    if (user && user.dataScope !== 'company' && !user.storeIds?.includes(Number(storeId))) {
      throw new ForbiddenException('无权在该门店新增房源');
    }
    return this.setRepo.manager.transaction(async (manager) => {
      const setRepo = manager.getRepository(RentalSet);
      const roomRepo = manager.getRepository(RentalRoom);
      const { rooms: incomingRooms, ...setData } = data;
      delete setData.id;
      for (const field of ['leaseStart', 'leaseEnd', 'tenantLeaseStart', 'tenantLeaseEnd']) {
        if (setData[field] === '') setData[field] = null;
      }
      const saved = await setRepo.save(setRepo.create({
        ...setData, storeId, creatorId: user?.employeeId,
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
}
