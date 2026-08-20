import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleProperty } from '../entities/sale-property.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(SaleProperty)
    private saleRepo: Repository<SaleProperty>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.saleRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.community', 'community');
    if (query.keyword) {
      qb.where('s.title LIKE :kw OR s.code LIKE :kw', { kw: `%${query.keyword}%` });
    }
    if (query.status) qb.andWhere('s.status = :status', { status: query.status });
    applyDataScope(qb, user, 's', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<SaleProperty>) {
    const item = this.saleRepo.create(data);
    return this.saleRepo.save(item);
  }

  async update(id: number, data: Partial<SaleProperty>) {
    await this.saleRepo.update(id, data);
    return this.saleRepo.findOne({ where: { id } });
  }
}
