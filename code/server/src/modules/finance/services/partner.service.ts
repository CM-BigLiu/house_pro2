import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partner } from '../entities/partner.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class PartnerService {
  constructor(
    @InjectRepository(Partner)
    private repo: Repository<Partner>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.repo.createQueryBuilder('p');
    if (query.keyword) qb.where('p.name LIKE :kw', { kw: `%${query.keyword}%` });
    applyDataScope(qb, user, 'p', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<Partner>) {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }

  async update(id: number, data: Partial<Partner>) {
    await this.repo.update(id, data);
    return this.repo.findOneBy({ id });
  }
}
