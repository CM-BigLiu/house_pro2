import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Checkout } from '../entities/checkout.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

function genContractCode(prefix: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${prefix}${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Checkout)
    private checkoutRepo: Repository<Checkout>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.checkoutRepo.createQueryBuilder('c');
    if (query.status) qb.where('c.status = :status', { status: query.status });
    if (query.startDate) qb.andWhere('c.checkoutDate >= :startDate', { startDate: query.startDate });
    if (query.endDate) qb.andWhere('c.checkoutDate <= :endDate', { endDate: query.endDate });
    if (query.keyword) {
      qb.andWhere('(c.contractCode ILIKE :kw OR c.tenantName ILIKE :kw)', { kw: `%${query.keyword}%` });
    }
    applyDataScope(qb, user, 'c', { ownerField: 'creatorId', storeField: 'storeId' });
    const [list, total] = await qb
      .orderBy('c.createdAt', 'DESC')
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    return { list, total };
  }

  async create(data: Partial<Checkout>, user?: CurrentUserPayload) {
    const item = this.checkoutRepo.create({
      ...data,
      contractCode: data.contractCode || genContractCode('CO'),
      status: data.status || 'pending',
      storeId: data.storeId ?? user?.storeIds?.[0],
      creatorId: data.creatorId ?? user?.employeeId,
    });
    return this.checkoutRepo.save(item);
  }

  async findOne(id: number, user: CurrentUserPayload) {
    const item = await this.findScoped(id, user);
    return { ...item, settlementAmount: Number(item.settlementAmount || 0) };
  }

  async confirm(id: number, user: CurrentUserPayload) {
    const checkout = await this.findScoped(id, user);
    if (checkout.status !== 'pending') {
      throw new BadRequestException('仅待确认状态的退租记录可确认');
    }
    return this.checkoutRepo.save({ ...checkout, status: 'confirmed' });
  }

  async complete(id: number, user: CurrentUserPayload) {
    const checkout = await this.findScoped(id, user);
    if (checkout.status !== 'confirmed') {
      throw new BadRequestException('仅已确认状态的退租记录可完成清算');
    }
    return this.checkoutRepo.save({ ...checkout, status: 'completed' });
  }

  private async findScoped(id: number, user: CurrentUserPayload) {
    const qb = this.checkoutRepo.createQueryBuilder('c').where('c.id = :id', { id });
    applyDataScope(qb, user, 'c', { ownerField: 'creatorId', storeField: 'storeId' });
    const existing = await qb.getOne();
    if (!existing) throw new NotFoundException('退租记录不存在');
    return existing;
  }
}
