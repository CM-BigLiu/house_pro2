import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceFlow } from '../entities/finance-flow.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class FlowService {
  constructor(
    @InjectRepository(FinanceFlow)
    private flowRepo: Repository<FinanceFlow>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.flowRepo.createQueryBuilder('f');
    if (query.status) qb.where('f.status = :status', { status: query.status });
    if (query.isRed !== undefined) qb.andWhere('f.isRed = :isRed', { isRed: query.isRed });
    applyDataScope(qb, user, 'f', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<FinanceFlow>) {
    const item = this.flowRepo.create(data);
    return this.flowRepo.save(item);
  }
}
