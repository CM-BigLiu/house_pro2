import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReserveProperty } from '../entities/reserve-property.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RentalSet } from '../entities/rental-set.entity';
import { RentalRoom } from '../entities/rental-room.entity';
import { Employee } from '../../system/entities/employee.entity';

interface SignContractInput {
  contractCode?: string;
  bizType: string;
  leaseStart: string;
  leaseEnd: string;
  landlordRent: number;
  deposit?: number;
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
    return {
      ...item,
      title: `${item.community?.name || item.address}${item.roomNo ? ` ${item.roomNo}` : ''}`.trim(),
      communityName: item.community?.name || '',
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
    if (query.keyword) qb.andWhere('r.address LIKE :kw OR r.ownerName LIKE :kw OR r.ownerPhone LIKE :kw', { kw: `%${query.keyword}%` });
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
    const item = this.propertyRepo.create({
      ...data,
      storeId,
      creatorId: user.employeeId,
      salesmanId: data.salesmanId ?? user.employeeId,
    });
    return this.map(await this.propertyRepo.save(item));
  }

  async update(id: number, data: Partial<ReserveProperty>, user: CurrentUserPayload) {
    const existing = await this.findScoped(id, user);
    const allowed: (keyof ReserveProperty)[] = [
      'communityId', 'address', 'roomNo', 'layout', 'buildingArea', 'decoration',
      'ownerName', 'ownerPhone', 'ownerQuote', 'sourceChannel', 'keyStatus', 'diskType',
    ];
    const changes: Partial<ReserveProperty> = {};
    for (const field of allowed) if (data[field] !== undefined) (changes as any)[field] = data[field];
    await this.propertyRepo.save({ ...existing, ...changes, id, creatorId: existing.creatorId });
    return this.findOne(id, user);
  }

  async transfer(id: number, salesmanId: number, user: CurrentUserPayload) {
    const existing = await this.findScoped(id, user);
    if (existing.status === 'taken' || existing.status === 'signed') {
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
    if (existing.status !== 'not_rented' && existing.status !== 'pause') {
      throw new BadRequestException('仅未租或暂不租的储备房源可拿房签约');
    }
    if (!existing.communityId) throw new BadRequestException('请先完善小区信息再签约');
    if (input.leaseEnd <= input.leaseStart) throw new BadRequestException('合同结束日期必须晚于开始日期');
    const contractCode = input.contractCode?.trim() || `RENT-${Date.now()}-${id}`;
    return this.propertyRepo.manager.transaction(async (manager) => {
      const setRepo = manager.getRepository(RentalSet);
      const roomRepo = manager.getRepository(RentalRoom);
      const reserveRepo = manager.getRepository(ReserveProperty);
      if (await setRepo.exist({ where: { code: contractCode } })) throw new BadRequestException('合同编号已存在');
      const rental = await setRepo.save(setRepo.create({
        code: contractCode,
        bizType: input.bizType,
        communityId: existing.communityId,
        address: existing.address,
        building: '',
        unit: '',
        roomNo: existing.roomNo,
        layout: existing.layout,
        buildingArea: existing.buildingArea,
        decoration: existing.decoration,
        landlordRent: input.landlordRent,
        landlordName: existing.ownerName,
        landlordPhone: existing.ownerPhone,
        rent: input.landlordRent,
        deposit: input.deposit || 0,
        leaseStart: input.leaseStart,
        leaseEnd: input.leaseEnd,
        status: 'active',
        storeId: existing.storeId,
        groupId: existing.groupId,
        salesmanId: existing.salesmanId,
        housekeeperId: existing.followerId,
        creatorId: user.employeeId,
      }));
      await roomRepo.save(roomRepo.create({
        setId: rental.id,
        roomNo: existing.roomNo,
        rentPrice: input.landlordRent,
        listedPrice: input.landlordRent,
        depositAmount: input.deposit || 0,
        status: 'vacant',
        creatorId: user.employeeId,
      }));
      await reserveRepo.update(existing.id, { status: 'taken' });
      return { reserveId: existing.id, rentalSetId: rental.id, contractCode, status: 'taken' };
    });
  }
}
