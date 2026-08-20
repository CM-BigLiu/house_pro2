import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentPlan } from '../entities/payment-plan.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(PaymentPlan)
    private planRepo: Repository<PaymentPlan>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.planRepo.createQueryBuilder('p');
    if (query.planType) qb.where('p.planType = :planType', { planType: query.planType });
    applyDataScope(qb, user, 'p', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<PaymentPlan>) {
    const item = this.planRepo.create(data);
    return this.planRepo.save(item);
  }
}
