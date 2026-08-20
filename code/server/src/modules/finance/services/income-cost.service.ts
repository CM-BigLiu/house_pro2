import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncomeCost } from '../entities/income-cost.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class IncomeCostService {
  constructor(
    @InjectRepository(IncomeCost)
    private repo: Repository<IncomeCost>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.repo.createQueryBuilder('ic');
    if (query.period) qb.where('ic.period = :period', { period: query.period });
    applyDataScope(qb, user, 'ic', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<IncomeCost>) {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }
}
