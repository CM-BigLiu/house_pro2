import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RentIncrease } from '../entities/rent-increase.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class RentIncreaseService {
  constructor(
    @InjectRepository(RentIncrease)
    private repo: Repository<RentIncrease>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.repo.createQueryBuilder('r');
    if (query.year) qb.where('r.year = :year', { year: query.year });
    if (query.month) qb.andWhere('r.month = :month', { month: query.month });
    if (query.keyword) qb.andWhere('r.roomCode LIKE :kw', { kw: `%${query.keyword}%` });
    applyDataScope(qb, user, 'r', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<RentIncrease>) {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }
}
