import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deposit } from '../entities/deposit.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class DepositService {
  constructor(
    @InjectRepository(Deposit)
    private depositRepo: Repository<Deposit>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.depositRepo.createQueryBuilder('d');
    if (query.status) qb.where('d.status = :status', { status: query.status });
    if (query.startDate) qb.andWhere('d.depositDate >= :startDate', { startDate: query.startDate });
    if (query.endDate) qb.andWhere('d.depositDate <= :endDate', { endDate: query.endDate });
    if (query.keyword) {
      qb.andWhere('(d.contractCode ILIKE :kw OR d.tenantName ILIKE :kw)', { kw: `%${query.keyword}%` });
    }
    applyDataScope(qb, user, 'd', { ownerField: 'creatorId', storeField: 'storeId' });
    const [list, total] = await qb
      .orderBy('d.createdAt', 'DESC')
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async refund(id: number, user: CurrentUserPayload) {
    const deposit = await this.findScoped(id, user);
    if (deposit.status !== 'pending') {
      throw new BadRequestException('仅待退状态的押金可退还');
    }
    const today = new Date().toISOString().slice(0, 10);
    return this.depositRepo.save({ ...deposit, status: 'refunded', refundDate: today });
  }

  async deduct(id: number, user: CurrentUserPayload, reason?: string) {
    const deposit = await this.findScoped(id, user);
    if (deposit.status !== 'pending') {
      throw new BadRequestException('仅待退状态的押金可扣留');
    }
    return this.depositRepo.save({ ...deposit, status: 'deducted', deductReason: reason || '扣留' });
  }

  private async findScoped(id: number, user: CurrentUserPayload) {
    const qb = this.depositRepo.createQueryBuilder('d').where('d.id = :id', { id });
    applyDataScope(qb, user, 'd', { ownerField: 'creatorId', storeField: 'storeId' });
    const existing = await qb.getOne();
    if (!existing) throw new NotFoundException('押金记录不存在');
    return existing;
  }
}
