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
    const conditions: string[] = [];
    const params: any = {};

    if (mobile) {
      conditions.push('b.mobile = :mobile');
      params.mobile = mobile;
    }
    if (name) {
      conditions.push('b.name ILIKE :namePattern');
      params.namePattern = `%${name}%`;
    }
    if (idCard) {
      // 历史明文数据：直接等值匹配
      conditions.push('b.idCard = :idCardPlain');
      params.idCardPlain = idCard;
    }

    if (!conditions.length) return [];

    const qb = this.blacklistRepo
      .createQueryBuilder('b')
      .where('b.status = :status', { status: 'active' })
      .andWhere(`(${conditions.join(' OR ')})`, params);

    const rows = await qb.getMany();

    // 密文数据（enc: 前缀，AES-GCM 随机 IV 无法 SQL 等值匹配）：
    // 仅取 idCard 非空的 active 记录，解密（transformer 已自动解密）后内存精确比对
    if (idCard) {
      const encRows = await this.blacklistRepo
        .createQueryBuilder('b')
        .where('b.status = :activeStatus', { activeStatus: 'active' })
        .andWhere('b.idCard IS NOT NULL')
        .andWhere("b.idCard LIKE 'enc:%'")
        .getMany();
      const seen = new Set(rows.map((r) => r.id));
      for (const r of encRows) {
        if (r.idCard === idCard && !seen.has(r.id)) rows.push(r);
      }
    }

    return rows;
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
