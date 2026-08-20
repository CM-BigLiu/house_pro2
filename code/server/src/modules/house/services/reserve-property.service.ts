import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReserveProperty } from '../entities/reserve-property.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class ReservePropertyService {
  constructor(
    @InjectRepository(ReserveProperty)
    private propertyRepo: Repository<ReserveProperty>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.propertyRepo.createQueryBuilder('r');
    if (query.status) qb.where('r.status = :status', { status: query.status });
    if (query.keyword) qb.andWhere('r.address LIKE :kw OR r.ownerName LIKE :kw OR r.ownerPhone LIKE :kw', { kw: `%${query.keyword}%` });
    applyDataScope(qb, user, 'r', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<ReserveProperty>) {
    const item = this.propertyRepo.create(data);
    return this.propertyRepo.save(item);
  }

  async update(id: number, data: Partial<ReserveProperty>) {
    await this.propertyRepo.update(id, data);
    return this.propertyRepo.findOne({ where: { id } });
  }
}
