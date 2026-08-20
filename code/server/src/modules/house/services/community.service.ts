import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Community } from '../entities/community.entity';
import { Building, Unit, Floor, RoomCode } from '../entities/community-hierarchy.entity';

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

  async findAll(query: any) {
    const qb = this.communityRepo.createQueryBuilder('c');
    if (query.keyword) {
      qb.where('c.name LIKE :kw OR c.alias LIKE :kw OR c.address LIKE :kw', { kw: `%${query.keyword}%` });
    }
    if (query.cityId) qb.andWhere('c.cityId = :cityId', { cityId: query.cityId });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<Community>) {
    const item = this.communityRepo.create(data);
    return this.communityRepo.save(item);
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
