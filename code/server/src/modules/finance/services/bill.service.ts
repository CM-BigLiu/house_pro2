import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill } from '../entities/bill.entity';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class BillService {
  constructor(
    @InjectRepository(Bill)
    private billRepo: Repository<Bill>,
  ) {}

  async findAll(query: any, user: CurrentUserPayload) {
    const qb = this.billRepo.createQueryBuilder('b');
    if (query.status) qb.where('b.status = :status', { status: query.status });
    if (query.bizType) qb.andWhere('b.bizType = :bizType', { bizType: query.bizType });
    applyDataScope(qb, user, 'b', { ownerField: 'creatorId' });
    const [list, total] = await qb
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();
    const mapped = list.map((b) => ({
      ...b,
      title: b.payer ? `${b.payer} - ${b.billSource || '账单'}` : `账单 ${b.id}`,
      category: b.bizType,
      houseTitle: b.roomCode || '-',
      tenantName: b.payer || '-',
      status: this.mapStatus(b.status),
      amount: Number(b.amount),
      paidAmount: Number(b.actualAmount),
    }));
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

  async create(data: Partial<Bill>) {
    const item = this.billRepo.create(data);
    return this.billRepo.save(item);
  }
}
