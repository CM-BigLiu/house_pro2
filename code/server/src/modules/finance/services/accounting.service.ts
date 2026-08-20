import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Accounting } from '../entities/accounting.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(Accounting)
    private repo: Repository<Accounting>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.repo.createQueryBuilder('a');
    if (query.period) qb.where('a.period = :period', { period: query.period });
    applyDataScope(qb, user, 'a', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<Accounting>) {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }
}
