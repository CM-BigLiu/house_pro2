import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blacklist } from '../entities/blacklist.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class BlacklistService {
  constructor(
    @InjectRepository(Blacklist)
    private blacklistRepo: Repository<Blacklist>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.blacklistRepo.createQueryBuilder('b');
    if (query.type) qb.where('b.type = :type', { type: query.type });
    if (query.status) qb.andWhere('b.status = :status', { status: query.status });
    if (query.keyword) {
      qb.andWhere('b.name LIKE :kw OR b.mobile LIKE :kw OR b.idCard LIKE :kw', { kw: `%${query.keyword}%` });
    }
    applyDataScope(qb, user, 'b', { ownerField: 'createdBy' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async check(mobile?: string, idCard?: string) {
    const qb = this.blacklistRepo.createQueryBuilder('b').where('b.status = :status', { status: 'active' });
    if (mobile) qb.andWhere('b.mobile = :mobile', { mobile });
    if (idCard) qb.andWhere('b.idCard = :idCard', { idCard });
    if (!mobile && !idCard) return null;
    return qb.getOne();
  }

  async create(data: Partial<Blacklist>, user?: CurrentUserPayload) {
    const item = this.blacklistRepo.create({
      ...data,
      storeId: data.storeId ?? user?.storeIds?.[0],
      createdBy: data.createdBy ?? user?.employeeId,
    });
    return this.blacklistRepo.save(item);
  }

  async update(id: number, data: Partial<Blacklist>, user: CurrentUserPayload) {
    const qb = this.blacklistRepo.createQueryBuilder('b').where('b.id = :id', { id });
    applyDataScope(qb, user, 'b', { ownerField: 'createdBy' });
    const existing = await qb.getOne();
    if (!existing) throw new ForbiddenException('无权修改或记录不存在');
    await this.blacklistRepo.update(id, data);
    return this.blacklistRepo.findOne({ where: { id } });
  }

  async remove(id: number, user: CurrentUserPayload) {
    const qb = this.blacklistRepo.createQueryBuilder('b').where('b.id = :id', { id });
    applyDataScope(qb, user, 'b', { ownerField: 'createdBy' });
    const existing = await qb.getOne();
    if (!existing) throw new ForbiddenException('无权删除或记录不存在');
    await this.blacklistRepo.delete(id);
    return { id };
  }
}
