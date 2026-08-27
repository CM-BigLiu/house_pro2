import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payout } from '../entities/payout.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class PayoutService {
  constructor(
    @InjectRepository(Payout)
    private payoutRepo: Repository<Payout>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.payoutRepo.createQueryBuilder('p');
    if (query.status) qb.where('p.status = :status', { status: query.status });
    applyDataScope(qb, user, 'p', { ownerField: 'operatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<Payout>, user?: CurrentUserPayload) {
    const item = this.payoutRepo.create({
      ...data,
      operatorId: data.operatorId ?? user?.employeeId ?? 1,
    });
    return this.payoutRepo.save(item);
  }
}
