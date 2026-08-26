import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowUp } from '../entities/follow-up.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class FollowUpService {
  constructor(
    @InjectRepository(FollowUp)
    private followUpRepo: Repository<FollowUp>,
  ) {}

  async findByBiz(bizType: string, bizId: number, user: CurrentUserPayload) {
    const qb = this.followUpRepo.createQueryBuilder('f')
      .where('f.bizType = :bizType AND f.bizId = :bizId', { bizType, bizId });
    applyDataScope(qb, user, 'f', { ownerField: 'employeeId' });
    return qb.orderBy('f.createdAt', 'DESC').getMany();
  }

  async create(data: Partial<FollowUp>, user: CurrentUserPayload) {
    const item = this.followUpRepo.create({
      ...data,
      employeeId: user.employeeId,
      employeeName: user.name,
    });
    return this.followUpRepo.save(item);
  }
}
