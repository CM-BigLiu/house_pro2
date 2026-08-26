import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationLog } from '../../system/entities/operation-log.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class OperationLogService {
  constructor(
    @InjectRepository(OperationLog)
    private logRepo: Repository<OperationLog>,
  ) {}

  async findByBiz(bizType: string, bizId: string, user: CurrentUserPayload) {
    const qb = this.logRepo.createQueryBuilder('l')
      .where('l.objectType = :bizType AND l.objectId = :bizId', { bizType, bizId });
    applyDataScope(qb, user, 'l', { ownerField: 'employeeId' });
    return qb.orderBy('l.createdAt', 'DESC').getMany();
  }

  async log(user: CurrentUserPayload, module: string, action: string, bizType?: string, bizId?: string, detail?: string) {
    const item = this.logRepo.create({
      employeeId: user.employeeId,
      module,
      action,
      objectType: bizType,
      objectId: bizId,
    } as any);
    (item as any).detail = detail;
    return this.logRepo.save(item);
  }
}
