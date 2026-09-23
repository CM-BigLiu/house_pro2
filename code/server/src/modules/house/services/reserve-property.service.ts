import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { ReserveProperty } from '../entities/reserve-property.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RentalSet } from '../entities/rental-set.entity';
import { RentalRoom } from '../entities/rental-room.entity';
import { Employee } from '../../system/entities/employee.entity';
import { sanitizeReserveDetails, type ReserveType } from './reserve-details';

interface SignContractInput {
  contractCode?: string;
  bizType: string;
  leaseStart: string;
  leaseEnd: string;
  landlordRent: number;
  landlordDeposit?: number;
  communityId?: number;
  address?: string;
  roomNo?: string;
  layout?: string;
  ownerName?: string;
}

@Injectable()
export class ReservePropertyService {
  constructor(
    @InjectRepository(ReserveProperty)
    private propertyRepo: Repository<ReserveProperty>,
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
  ) {}

  private map(item: ReserveProperty) {
    const details = item.details || {};
    return {
      ...item,
      reserveType: item.reserveType || 'rent',
      title: String(details.title || `${item.community?.name || item.address || ''}${item.roomNo ? ` ${item.roomNo}` : ''}`.trim() || item.ownerName || `储备房源 #${item.id}`),
      communityName: item.community?.name || '',
      ownerQuote: item.ownerQuote == null ? undefined : Number(item.ownerQuote),
      buildingArea: item.buildingArea == null ? undefined : Number(item.buildingArea),
      expectedPrice: Number(item.ownerQuote || 0),
      source: item.sourceChannel,
    };
  }

  private async findScoped(id: number, user: CurrentUserPayload) {
    const qb = this.propertyRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.community', 'community')
      .where('r.id = :id', { id });
    applyDataScope(qb, user, 'r', { ownerField: 'creatorId' });
    const item = await qb.getOne();
    if (!item) throw new NotFoundException('储备房源不存在或无权访问');
    return item;
  }

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.propertyRepo.createQueryBuilder('r').leftJoinAndSelect('r.community', 'community');
    if (query.status) qb.where('r.status = :status', { status: query.status });
    if (query.reserveType === 'rent' || query.reserveType === 'sale') {
      qb.andWhere('r.reserveType = :reserveType', { reserveType: query.reserveType });
    }
    const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : '';
    if (keyword) qb.andWhere(new Brackets(sub => {
      sub.where('r.address ILIKE :kw', { kw: `%${keyword}%` })
        .orWhere('r.ownerName ILIKE :kw', { kw: `%${keyword}%` })
        .orWhere('r.ownerPhone ILIKE :kw', { kw: `%${keyword}%` })
        .orWhere('community.name ILIKE :kw', { kw: `%${keyword}%` })
        .orWhere("r.details ->> 'title' ILIKE :kw", { kw: `%${keyword}%` });
    }));
    applyDataScope(qb, user, 'r', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list: list.map((item) => this.map(item)), total };
  }

  async findOne(id: number, user: CurrentUserPayload) {
    return this.map(await this.findScoped(id, user));
  }

  async create(data: Partial<ReserveProperty>, user: CurrentUserPayload) {
    const storeId = data.storeId ?? user.storeIds?.[0];
    if (!storeId) throw new BadRequestException('当前账号未配置门店');
    if (user.dataScope !== 'company' && !user.storeIds?.includes(Number(storeId))) {
      throw new ForbiddenException('无权在该门店录入储备房源');
    }
    const reserveType: ReserveType = data.reserveType || 'rent';
    if (!['rent', 'sale'].includes(reserveType)) throw new BadRequestException('储备类型无效');
    const details = sanitizeReserveDetails(reserveType, data.details);
    this.requireIdentifier(data, details);
    const item = this.propertyRepo.create({
      ...data,
      reserveType,
      details,
      status: reserveType === 'sale' ? 'not_sold' : 'not_rented',
      storeId,
      creatorId: user.employeeId,
      salesmanId: data.salesmanId ?? user.employeeId,
    });
    return this.map(await this.propertyRepo.save(item));
  }

  async update(id: number, data: Partial<ReserveProperty>, user: CurrentUserPayload) {
    const existing = await this.findScoped(id, user);
    const reserveType: ReserveType = data.reserveType || existing.reserveType || 'rent';
    if (!['rent', 'sale'].includes(reserveType)) throw new BadRequestException('储备类型无效');
    if (reserveType !== (existing.reserveType || 'rent') && ['taken', 'signed', 'sold'].includes(existing.status)) {
      throw new BadRequestException('已流转的储备房源不能更改租售类型');
    }
    const allowed: (keyof ReserveProperty)[] = [
      'communityId', 'address', 'roomNo', 'layout', 'buildingArea', 'decoration',
      'ownerName', 'ownerPhone', 'ownerQuote', 'sourceChannel', 'keyStatus', 'diskType',
    ];
    const changes: Partial<ReserveProperty> = {};
    for (const field of allowed) if (data[field] !== undefined) (changes as any)[field] = data[field];
    const details = data.details !== undefined
      ? sanitizeReserveDetails(reserveType, data.details)
      : reserveType === (existing.reserveType || 'rent') ? existing.details : {};
    this.requireIdentifier({ ...existing, ...changes }, details);
    const changedType = reserveType !== (existing.reserveType || 'rent');
    const toSave = {
      ...existing, ...changes, id, reserveType, details,
      status: changedType ? (reserveType === 'sale' ? 'not_sold' : 'not_rented') : existing.status,
      creatorId: existing.creatorId,
    };
    delete (toSave as Partial<ReserveProperty>).community;
    await this.propertyRepo.save(toSave);
    return this.findOne(id, user);
  }

  async remove(id: number, user: CurrentUserPayload) {
    const existing = await this.findScoped(id, user);
    if (['taken', 'signed', 'sold', 'rented', 'deposit_paid'].includes(existing.status)) {
      throw new BadRequestException('已签约、成交或流转的储备房源不能删除');
    }
    await this.propertyRepo.delete(id);
    return { id };
  }

  private requireIdentifier(data: Partial<ReserveProperty>, details: Record<string, unknown>) {
    if (data.communityId || data.address?.trim() || data.roomNo?.trim() ||
      data.ownerName?.trim() || data.ownerPhone?.trim() || details.title) return;
    throw new BadRequestException('请至少填写小区、地址、房号、业主或标题中的一项');
  }

  async transfer(id: number, salesmanId: number, user: CurrentUserPayload) {
    const existing = await this.findScoped(id, user);
    if (['taken', 'signed', 'sold'].includes(existing.status)) {
      throw new BadRequestException('已流转房源不能再次转业务员');
    }
    const employee = await this.employeeRepo.createQueryBuilder('e')
      .leftJoinAndSelect('e.stores', 'stores')
      .where('e.id = :salesmanId', { salesmanId })
      .andWhere('e.status = :status', { status: 'normal' })
      .getOne();
    if (!employee || !employee.stores?.some((store) => store.id === existing.storeId)) {
      throw new BadRequestException('目标业务员不属于当前房源门店或已离职');
    }
    existing.salesmanId = salesmanId;
    await this.propertyRepo.save(existing);
    return this.findOne(id, user);
  }

  async signContract(id: number, input: SignContractInput, user: CurrentUserPayload) {
    const existing = await this.findScoped(id, user);
    if ((existing.reserveType || 'rent') !== 'rent') throw new BadRequestException('售房储备不能办理租房签约');
    if (existing.status !== 'not_rented' && existing.status !== 'pause') {
      throw new BadRequestException('仅未租或暂不租的储备房源可拿房签约');
    }
    const communityId = input.communityId ?? existing.communityId;
    const address = input.address?.trim() || existing.address?.trim();
    const roomNo = input.roomNo?.trim() || existing.roomNo?.trim();
    const layout = input.layout?.trim() || existing.layout?.trim();
    const ownerName = input.ownerName?.trim() || existing.ownerName?.trim();
    const missing = [
      !communityId && '小区', !address && '地址', !roomNo && '房号',
      !layout && '户型', !ownerName && '房东姓名',
    ].filter(Boolean);
    if (missing.length) throw new BadRequestException(`请补充签约必填信息：${missing.join('、')}`);
    if (input.leaseEnd <= input.leaseStart) throw new BadRequestException('合同结束日期必须晚于开始日期');
    const details = sanitizeReserveDetails('rent', existing.details);
    const contractCode = input.contractCode?.trim() || `RENT-${Date.now()}-${id}`;
    return this.propertyRepo.manager.transaction(async (manager) => {
      const setRepo = manager.getRepository(RentalSet);
      const roomRepo = manager.getRepository(RentalRoom);
      const reserveRepo = manager.getRepository(ReserveProperty);
      if (await setRepo.exist({ where: { code: contractCode } })) throw new BadRequestException('合同编号已存在');
      const rental = await setRepo.save(setRepo.create({
        code: contractCode,
        bizType: input.bizType,
        communityId,
        address,
        building: String(details.building || ''),
        unit: String(details.unit || ''),
        roomNo,
        layout,
        buildingArea: existing.buildingArea,
        decoration: existing.decoration,
        landlordRent: input.landlordRent,
        landlordDeposit: Number(input.landlordDeposit ?? details.landlordDeposit ?? details.deposit ?? 0),
        landlordName: ownerName,
        landlordPhone: existing.ownerPhone,
        rent: Number(details.rent ?? input.landlordRent),
        deposit: 0,
        rentFreePeriod: String(details.rentFreePeriod || ''),
        leaseStart: input.leaseStart,
        leaseEnd: input.leaseEnd,
        status: 'active',
        storeId: existing.storeId,
        groupId: existing.groupId,
        salesmanId: existing.salesmanId,
        housekeeperId: existing.followerId,
        creatorId: user.employeeId,
      }));
      const reservedRooms = input.bizType === 'shared' && Array.isArray(details.rooms) && details.rooms.length
        ? details.rooms as Record<string, unknown>[]
        : [{ roomNo, rentPrice: Number(details.rent ?? input.landlordRent) }];
      await roomRepo.save(reservedRooms.map(room => roomRepo.create({
        setId: rental.id,
        roomNo: String(room.roomNo || roomNo),
        roomType: String(room.roomType || ''),
        rentPrice: Number(room.rentPrice ?? input.landlordRent),
        listedPrice: Number(room.listedPrice ?? room.rentPrice ?? input.landlordRent),
        depositAmount: Number(room.depositAmount ?? 0),
        status: 'vacant',
        creatorId: user.employeeId,
      })));
      await reserveRepo.update(existing.id, { status: 'taken', communityId, address, roomNo, layout, ownerName });
      return { reserveId: existing.id, rentalSetId: rental.id, contractCode, status: 'taken' };
    });
  }
}
