import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profit } from '../entities/profit.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class ProfitService {
  constructor(
    @InjectRepository(Profit)
    private repo: Repository<Profit>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.repo.createQueryBuilder('p');
    if (query.period) qb.where('p.period = :period', { period: query.period });
    applyDataScope(qb, user, 'p', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<Profit>) {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }

  async summary(user: CurrentUserPayload) {
    const qb = this.repo.createQueryBuilder('p');
    applyDataScope(qb, user, 'p', { ownerField: 'creatorId' });
    const row = await qb
      .select('SUM(p.income)', 'income')
      .addSelect('SUM(p.cost)', 'cost')
      .addSelect('SUM(p.profit)', 'profit')
      .getRawOne();
    return {
      income: Number(row.income) || 0,
      cost: Number(row.cost) || 0,
      profit: Number(row.profit) || 0,
      margin: Number(row.income) ? ((Number(row.profit) / Number(row.income)) * 100).toFixed(2) : '0.00',
    };
  }
}
