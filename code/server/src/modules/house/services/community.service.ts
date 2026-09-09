import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Community } from '../entities/community.entity';
import { Building, Unit, Floor, RoomCode } from '../entities/community-hierarchy.entity';
import { City } from '../../system/entities/city.entity';
import { RentalSet } from '../entities/rental-set.entity';
import { SaleProperty } from '../entities/sale-property.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Community)
    private communityRepo: Repository<Community>,
    @InjectRepository(Building)
    private buildingRepo: Repository<Building>,
    @InjectRepository(Unit)
    private unitRepo: Repository<Unit>,
    @InjectRepository(Floor)
    private floorRepo: Repository<Floor>,
    @InjectRepository(RoomCode)
    private roomRepo: Repository<RoomCode>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.communityRepo.createQueryBuilder('c');
    if (query.keyword) {
      qb.andWhere(new Brackets(sub => {
        sub.where('c.name ILIKE :kw OR c.alias ILIKE :kw OR c.address ILIKE :kw', { kw: `%${query.keyword}%` });
      }));
    }
    if (query.cityId) qb.andWhere('c.cityId = :cityId', { cityId: query.cityId });
    if (query.businessCircle) qb.andWhere('c.businessCircle = :businessCircle', { businessCircle: query.businessCircle });
    qb.orderBy('c.id', 'DESC');
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    if (!list.length) return { list, total };
    const ids = list.map(item => item.id);
    const rentals = this.communityRepo.manager.getRepository(RentalSet).createQueryBuilder('rs')
      .select('rs.communityId', 'id').addSelect('COUNT(rs.id)', 'count')
      .where('rs.communityId IN (:...ids)', { ids }).groupBy('rs.communityId');
    const sales = this.communityRepo.manager.getRepository(SaleProperty).createQueryBuilder('s')
      .select('s.communityId', 'id').addSelect('COUNT(s.id)', 'count')
      .where('s.communityId IN (:...ids)', { ids }).groupBy('s.communityId');
    applyDataScope(rentals, user, 'rs', { ownerField: 'creatorId', groupField: 'groupId' });
    applyDataScope(sales, user, 's', { ownerField: 'creatorId' });
    const [rentalCounts, saleCounts] = await Promise.all([rentals.getRawMany(), sales.getRawMany()]);
    const rentById = new Map(rentalCounts.map(row => [Number(row.id), Number(row.count)]));
    const saleById = new Map(saleCounts.map(row => [Number(row.id), Number(row.count)]));
    return {
      list: list.map(item => ({ ...item, currentRentCount: rentById.get(item.id) || 0, currentSaleCount: saleById.get(item.id) || 0 })),
      total,
    };
  }

  async filters() {
    const rows = await this.communityRepo.createQueryBuilder('c')
      .leftJoin(City, 'city', 'city.id = c.cityId')
      .select('c.cityId', 'id')
      .addSelect('city.name', 'name')
      .addSelect('c.businessCircle', 'businessCircle')
      .addSelect('COUNT(c.id)', 'count')
      .groupBy('c.cityId').addGroupBy('city.name').addGroupBy('c.businessCircle')
      .orderBy('c.cityId', 'ASC').addOrderBy('c.businessCircle', 'ASC')
      .getRawMany();
    const cities = new Map<number, { id: number; name: string; count: number; children: { name: string; count: number }[] }>();
    for (const row of rows) {
      const id = Number(row.id);
      const city = cities.get(id) || { id, name: row.name || `城市 #${id}`, count: 0, children: [] };
      city.count += Number(row.count);
      if (row.businessCircle) city.children.push({ name: row.businessCircle, count: Number(row.count) });
      cities.set(id, city);
    }
    return [...cities.values()];
  }

  async create(data: Partial<Community>) {
    const item = this.communityRepo.create(data);
    return this.communityRepo.save(item);
  }

  async findOne(id: number) {
    const item = await this.communityRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('小区不存在');
    return item;
  }

  async update(id: number, data: Partial<Community>) {
    const item = await this.findOne(id);
    return this.communityRepo.save(this.communityRepo.merge(item, data, { id }));
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    await this.communityRepo.remove(item);
    return { id };
  }

  async findBuildings(communityId: number) {
    return this.buildingRepo.find({ where: { communityId } });
  }

  async findUnits(buildingId: number) {
    return this.unitRepo.find({ where: { buildingId } });
  }

  async findFloors(unitId: number) {
    return this.floorRepo.find({ where: { unitId } });
  }

  async findRooms(floorId: number) {
    return this.roomRepo.find({ where: { floorId } });
  }
}
