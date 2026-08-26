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
    applyDataScope(qb, user, 'b', { ownerField: 'createdBy' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    const filtered = query.keyword
      ? list.filter((b) =>
          [b.name, b.mobile].some((v) => v && v.includes(query.keyword)) ||
          (b.idCard && b.idCard.includes(query.keyword)),
        )
      : list;
    return { list: filtered, total };
  }

  async check(mobile?: string, idCard?: string, name?: string) {
    const records = await this.blacklistRepo.find({ where: { status: 'active' } });
    const hits: Blacklist[] = [];
    for (const b of records) {
      let hit = false;
      if (mobile && b.mobile === mobile) hit = true;
      if (idCard && b.idCard && b.idCard === idCard) hit = true;
      if (name && b.name && b.name.includes(name)) hit = true;
      // 换号拦截：传入身份证时，若黑名单记录有同一身份证且不同手机号，也命中
      if (idCard && b.idCard && b.idCard === idCard && (!mobile || b.mobile !== mobile)) {
        hit = true;
      }
      if (hit) hits.push(b);
    }
    return hits;
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
    const updated = await this.blacklistRepo.save({ ...existing, ...data, id });
    return updated;
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
