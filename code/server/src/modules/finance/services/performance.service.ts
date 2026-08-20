import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Performance } from '../entities/performance.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(Performance)
    private repo: Repository<Performance>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.repo.createQueryBuilder('p');
    if (query.period) qb.where('p.period = :period', { period: query.period });
    if (query.keyword) qb.andWhere('p.employeeName LIKE :kw', { kw: `%${query.keyword}%` });
    applyDataScope(qb, user, 'p', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .orderBy('p.totalPerformance', 'DESC')
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<Performance>) {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }
}
