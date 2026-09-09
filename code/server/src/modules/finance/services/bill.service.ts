import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Bill } from '../entities/bill.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class BillService {
  constructor(
    @InjectRepository(Bill)
    private billRepo: Repository<Bill>,
  ) {}

  private mapBill(b: Bill) {
    return {
      ...b,
      title: b.payer ? `${b.payer} - ${b.billSource || '账单'}` : `账单 ${b.id}`,
      category: b.billSource,
      billDate: b.dueDate,
      houseTitle: b.roomCode || '-',
      tenantName: b.payer || '-',
      status: this.mapStatus(b.status),
      amount: Number(b.amount),
      paidAmount: Number(b.actualAmount),
      actualAmount: Number(b.actualAmount),
      overdueFee: Number(b.overdueFee),
    };
  }

  private async findScoped(id: number, user: CurrentUserPayload) {
    const qb = this.billRepo.createQueryBuilder('b').where('b.id = :id', { id });
    applyDataScope(qb, user, 'b', { ownerField: 'creatorId' });
    const bill = await qb.getOne();
    if (!bill) throw new NotFoundException('账单不存在或无权访问');
    return bill;
  }

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.billRepo.createQueryBuilder('b');
    const status = ({ pending: 'pending_receive', paid: 'received' } as Record<string, string>)[query.status] || query.status;
    if (status) qb.where('b.status = :status', { status });
    if (query.category) qb.andWhere('b.billSource = :category', { category: query.category });
    if (query.keyword?.trim()) qb.andWhere(new Brackets((sub) => {
      for (const field of ['b.payer', 'b.payee', 'b.roomCode', 'b.bizId']) sub.orWhere(`${field} ILIKE :kw`, { kw: `%${query.keyword.trim()}%` });
    }));
    if (query.storeId) qb.andWhere('b.storeId = :storeId', { storeId: Number(query.storeId) });
    if (query.userId) qb.andWhere('b.salesmanId = :userId', { userId: Number(query.userId) });
    if (query.dateStart && !/^\d{4}-\d{2}-\d{2}$/.test(query.dateStart)) throw new BadRequestException('开始日期无效');
    if (query.dateEnd && !/^\d{4}-\d{2}-\d{2}$/.test(query.dateEnd)) throw new BadRequestException('结束日期无效');
    if (query.dateStart && query.dateEnd && query.dateStart > query.dateEnd) throw new BadRequestException('开始日期不能晚于结束日期');
    if (query.dateStart) qb.andWhere('b.dueDate >= :dateStart', { dateStart: query.dateStart });
    if (query.dateEnd) qb.andWhere('b.dueDate <= :dateEnd', { dateEnd: query.dateEnd });
    if (query.bizType) qb.andWhere('b.bizType = :bizType', { bizType: query.bizType });
    applyDataScope(qb, user, 'b', { ownerField: 'creatorId' });
    const [list, total] = await qb.orderBy('b.id', 'DESC')
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    const mapped = list.map((b) => this.mapBill(b));
    return { list: mapped, total };
  }

  private mapStatus(status: string) {
    const map: Record<string, string> = {
      pending_receive: 'pending',
      received: 'paid',
      partial: 'partial',
      cancelled: 'cancelled',
    };
    return map[status] || status;
  }

  async create(data: Partial<Bill>, user?: CurrentUserPayload) {
    const item = this.billRepo.create({
      ...data,
      status: 'pending_receive',
      actualAmount: 0,
      storeId: data.storeId ?? user?.storeIds?.[0],
      creatorId: data.creatorId ?? user?.employeeId,
    });
    return this.mapBill(await this.billRepo.save(item));
  }

  async findOne(id: number, user: CurrentUserPayload) {
    return this.mapBill(await this.findScoped(id, user));
  }

  async update(id: number, data: Partial<Bill>, user: CurrentUserPayload) {
    const existing = await this.findScoped(id, user);
    if (!['pending_receive', 'due', 'overdue', 'pending_pay'].includes(existing.status)) {
      throw new BadRequestException('仅待处理或逾期账单可编辑');
    }
    const allowed: (keyof Bill)[] = ['bizType', 'bizId', 'billSource', 'payer', 'payee', 'dueDate', 'paymentCount', 'billPeriod', 'overdueFee', 'amount', 'roomCode'];
    const changes: Partial<Bill> = {};
    for (const field of allowed) if (data[field] !== undefined) (changes as any)[field] = data[field];
    await this.billRepo.save({ ...existing, ...changes, id, creatorId: existing.creatorId });
    return this.findOne(id, user);
  }

  async void(id: number, user: CurrentUserPayload) {
    const existing = await this.findScoped(id, user);
    if (['received', 'paid', 'cashiered', 'refunded', 'cancelled'].includes(existing.status) || Number(existing.actualAmount || 0) > 0) {
      throw new BadRequestException('已收付款或已作废账单不能作废');
    }
    existing.status = 'cancelled';
    await this.billRepo.save(existing);
    return this.findOne(id, user);
  }
}
