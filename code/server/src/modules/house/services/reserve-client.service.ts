import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReserveClient } from '../entities/reserve-client.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class ReserveClientService {
  constructor(
    @InjectRepository(ReserveClient)
    private clientRepo: Repository<ReserveClient>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.clientRepo.createQueryBuilder('c');
    if (query.demandType) qb.where('c.demandType = :demandType', { demandType: query.demandType });
    if (query.status) qb.andWhere('c.status = :status', { status: query.status });
    if (query.keyword) qb.andWhere('c.clientName LIKE :kw OR c.clientMobile LIKE :kw', { kw: `%${query.keyword}%` });
    applyDataScope(qb, user, 'c', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<ReserveClient>) {
    const item = this.clientRepo.create(data);
    return this.clientRepo.save(item);
  }

  async update(id: number, data: Partial<ReserveClient>) {
    await this.clientRepo.update(id, data);
    return this.clientRepo.findOne({ where: { id } });
  }
}
