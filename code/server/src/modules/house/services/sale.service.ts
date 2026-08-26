import { Injectable, ForbiddenException } from '@nestjs/common';
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
    const mapped = list.map((s) => ({
      ...s,
      totalPrice: Number(s.salePrice),
      communityName: (s as any).community?.name || '',
    }));
    return { list: mapped, total };
  }

  async findOne(id: number, user: CurrentUserPayload) {
    const qb = this.saleRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.community', 'community')
      .where('s.id = :id', { id });
    applyDataScope(qb, user, 's', { ownerField: 'creatorId' });
    const item = await qb.getOne();
    if (!item) throw new ForbiddenException('无权查看或记录不存在');
    return item;
  }

  async create(data: Partial<SaleProperty>, user?: CurrentUserPayload) {
    const item = this.saleRepo.create({
      ...data,
      storeId: data.storeId ?? user?.storeIds?.[0],
      creatorId: data.creatorId ?? user?.employeeId,
    });
    return this.saleRepo.save(item);
  }

  async update(id: number, data: Partial<SaleProperty>, user: CurrentUserPayload) {
    const qb = this.saleRepo.createQueryBuilder('s').where('s.id = :id', { id });
    applyDataScope(qb, user, 's', { ownerField: 'creatorId' });
    const existing = await qb.getOne();
    if (!existing) throw new ForbiddenException('无权修改或记录不存在');
    await this.saleRepo.update(id, data);
    return this.saleRepo.findOne({ where: { id } });
  }
}
