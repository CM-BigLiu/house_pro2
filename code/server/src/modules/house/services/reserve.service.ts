import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReserveProperty } from '../entities/reserve-property.entity';
import { ReserveClient } from '../entities/reserve-client.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class ReserveService {
  constructor(
    @InjectRepository(ReserveProperty)
    private propertyRepo: Repository<ReserveProperty>,
    @InjectRepository(ReserveClient)
    private clientRepo: Repository<ReserveClient>,
  ) {}

  async findProperties(query: any, user: CurrentUserPayload) {
    const qb = this.propertyRepo.createQueryBuilder('r');
    if (query.status) qb.where('r.status = :status', { status: query.status });
    applyDataScope(qb, user, 'r', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async createProperty(data: Partial<ReserveProperty>) {
    const item = this.propertyRepo.create(data);
    return this.propertyRepo.save(item);
  }

  async findClients(query: any, user: CurrentUserPayload) {
    const qb = this.clientRepo.createQueryBuilder('c');
    if (query.demandType) qb.where('c.demandType = :demandType', { demandType: query.demandType });
    applyDataScope(qb, user, 'c', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async createClient(data: Partial<ReserveClient>) {
    const item = this.clientRepo.create(data);
    return this.clientRepo.save(item);
  }
}
