import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleProperty } from '../house/entities/sale-property.entity';
import { RentalSet } from '../house/entities/rental-set.entity';
import { RentalRoom } from '../house/entities/rental-room.entity';
import { ReserveClient } from '../house/entities/reserve-client.entity';
import { Customer } from '../house/entities/customer.entity';
import { Bill } from '../finance/entities/bill.entity';
import { FinanceFlow } from '../finance/entities/finance-flow.entity';
import { applyDataScope } from '../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(SaleProperty) private saleRepo: Repository<SaleProperty>,
    @InjectRepository(RentalSet) private rentalSetRepo: Repository<RentalSet>,
    @InjectRepository(RentalRoom) private rentalRoomRepo: Repository<RentalRoom>,
    @InjectRepository(ReserveClient) private clientRepo: Repository<ReserveClient>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Bill) private billRepo: Repository<Bill>,
    @InjectRepository(FinanceFlow) private flowRepo: Repository<FinanceFlow>,
  ) {}

  async getOverview(user: CurrentUserPayload) {
    const saleQb = this.saleRepo.createQueryBuilder('s');
    applyDataScope(saleQb, user, 's', { ownerField: 'creatorId' });
    const saleCount = await saleQb.getCount();

    const rentalQb = this.rentalSetRepo.createQueryBuilder('rs');
    applyDataScope(rentalQb, user, 'rs', { ownerField: 'creatorId', groupField: 'groupId' });
    const rentalCount = await rentalQb.getCount();

    const roomQb = this.rentalRoomRepo.createQueryBuilder('rr')
      .innerJoin('rr.set', 'set');
    applyDataScope(roomQb, user, 'set', { ownerField: 'creatorId', groupField: 'groupId' });
    const roomCount = await roomQb.getCount();
    const vacantCount = await this.rentalRoomRepo.createQueryBuilder('rr')
      .innerJoin('rr.set', 'set')
      .where('rr.status = :status', { status: 'vacant' })
      .andWhere((qb) => {
        applyDataScope(qb, user, 'set', { ownerField: 'creatorId', groupField: 'groupId' });
      })
      .getCount();

    const clientQb = this.clientRepo.createQueryBuilder('c');
    applyDataScope(clientQb, user, 'c', { ownerField: 'creatorId' });
    const clientCount = await clientQb.getCount();

    const { start, end } = this.currentMonthRange();

    const receivableQb = this.billRepo.createQueryBuilder('b')
      .select('COALESCE(SUM(b.amount), 0)', 'total')
      .where('b.dueDate BETWEEN :start AND :end', { start, end });
    applyDataScope(receivableQb, user, 'b', { ownerField: 'creatorId' });
    const receivable = +(await receivableQb.getRawOne()).total;

    const receivedQb = this.billRepo.createQueryBuilder('b')
      .select('COALESCE(SUM(b.actualAmount), 0)', 'total')
      .where('b.dueDate BETWEEN :start AND :end', { start, end });
    applyDataScope(receivedQb, user, 'b', { ownerField: 'creatorId' });
    const received = +(await receivedQb.getRawOne()).total;

    const monthly = await this.monthlyTrend(user);

    return {
      greetingName: user.name,
      role: user.dataScope || 'self',
      kpis: [
        { label: '在管房源', value: rentalCount + saleCount, unit: '套', color: 'blue' },
        { label: '在租房间', value: roomCount, unit: '间', color: 'green' },
        { label: '空房间', value: vacantCount, unit: '间', color: 'orange' },
        { label: '储备客源', value: clientCount, unit: '人', color: 'purple' },
        { label: '本月应收', value: (receivable / 10000).toFixed(2), unit: '万', color: 'blue' },
        { label: '本月实收', value: (received / 10000).toFixed(2), unit: '万', color: 'green' },
      ],
      charts: { monthly },
    };
  }

  async getWarnings(user: CurrentUserPayload) {
    const today = new Date().toISOString().split('T')[0];
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const dueSoonQb = this.rentalRoomRepo.createQueryBuilder('rr')
      .innerJoin('rr.set', 'set')
      .where('rr.status = :status', { status: 'rented' })
      .andWhere('rr.leaseEnd BETWEEN :start AND :end', { start: today, end: future });
    applyDataScope(dueSoonQb, user, 'set', { ownerField: 'creatorId', groupField: 'groupId' });
    const dueSoonCount = await dueSoonQb.getCount();

    const overdueQb = this.billRepo.createQueryBuilder('b')
      .where('b.dueDate < :today', { today })
      .andWhere('b.status IN (:...status)', { status: ['pending_receive', 'partial'] });
    applyDataScope(overdueQb, user, 'b', { ownerField: 'creatorId' });
    const overdueCount = await overdueQb.getCount();

    return [
      { title: '30天内到期租客', value: dueSoonCount, label: '需续租/退房', color: 'orange' as const },
      { title: '逾期未缴账单', value: overdueCount, label: overdueCount ? '需催收' : '暂无', color: overdueCount ? 'red' : 'green' as const },
      { title: '储备房源待跟进', value: await this.countReserveByStatus(user, 'not_rented'), label: '待签约', color: 'blue' as const },
      { title: '黑名单人员', value: await this.countBlacklist(user), label: '生效中', color: 'red' as const },
    ];
  }

  async getRankings(user: CurrentUserPayload) {
    const employeeRanking = await this.employeeRanking(user);
    return {
      performance: employeeRanking.map((r) => ({ name: r.name, value: Math.round(r.performance), unit: '元' })),
      house: employeeRanking.map((r) => ({ name: r.name, value: r.houseCount, unit: '套' })),
      customer: employeeRanking.map((r) => ({ name: r.name, value: r.customerCount, unit: '人' })),
    };
  }

  async getTodos(user: CurrentUserPayload) {
    const todos: { id: string; title: string; priority: 'high' | 'medium' | 'low'; date: string }[] = [];
    const today = new Date().toISOString().split('T')[0];
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const dueSoonQb = this.rentalRoomRepo.createQueryBuilder('rr')
      .innerJoin('rr.set', 'set')
      .select(['rr.id AS id', 'rr.leaseEnd AS leaseEnd', 'set.address AS address'])
      .where('rr.status = :status', { status: 'rented' })
      .andWhere('rr.leaseEnd BETWEEN :start AND :end', { start: today, end: future })
      .orderBy('rr.leaseEnd', 'ASC')
      .limit(5);
    applyDataScope(dueSoonQb, user, 'set', { ownerField: 'creatorId', groupField: 'groupId' });
    const dueSoon = await dueSoonQb.getRawMany();
    dueSoon.forEach((item: any, index: number) => {
      todos.push({
        id: `lease-${item.id}`,
        title: `【续约】${item.address || ''} 租约即将到期`,
        priority: 'medium',
        date: item.leaseEnd,
      });
    });

    const overdueQb = this.billRepo.createQueryBuilder('b')
      .select(['b.id AS id', 'b.dueDate AS dueDate', 'b.payer AS payer', 'b.amount AS amount'])
      .where('b.dueDate < :today', { today })
      .andWhere('b.status IN (:...status)', { status: ['pending_receive', 'partial'] })
      .orderBy('b.dueDate', 'ASC')
      .limit(5);
    applyDataScope(overdueQb, user, 'b', { ownerField: 'creatorId' });
    const overdue = await overdueQb.getRawMany();
    overdue.forEach((item: any) => {
      todos.push({
        id: `bill-${item.id}`,
        title: `【催收】${item.payer || '未知'} 欠款 ${item.amount || 0} 元`,
        priority: 'high',
        date: item.dueDate,
      });
    });

    return todos;
  }

  private currentMonthRange() {
    const now = new Date();
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return { start, end };
  }

  private async monthlyTrend(user: CurrentUserPayload) {
    const months: { month: string; income: number; expense: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const start = `${year}-${month}-01`;
      const end = new Date(year, d.getMonth() + 1, 0).toISOString().split('T')[0];

      const incomeQb = this.flowRepo.createQueryBuilder('f')
        .select('COALESCE(SUM(f.amount), 0)', 'total')
        .where('f.direction = :direction', { direction: 'income' })
        .andWhere('f.status = :status', { status: 'completed' })
        .andWhere('f.createdAt BETWEEN :start AND :end', { start: `${start}T00:00:00`, end: `${end}T23:59:59` });
      applyDataScope(incomeQb, user, 'f', { ownerField: 'creatorId' });
      const income = +(await incomeQb.getRawOne()).total;

      const expenseQb = this.flowRepo.createQueryBuilder('f')
        .select('COALESCE(SUM(f.amount), 0)', 'total')
        .where('f.direction = :direction', { direction: 'expense' })
        .andWhere('f.status = :status', { status: 'completed' })
        .andWhere('f.createdAt BETWEEN :start AND :end', { start: `${start}T00:00:00`, end: `${end}T23:59:59` });
      applyDataScope(expenseQb, user, 'f', { ownerField: 'creatorId' });
      const expense = +(await expenseQb.getRawOne()).total;

      months.push({ month: `${year}-${month}`, income, expense });
    }
    return months;
  }

  private async employeeRanking(user: CurrentUserPayload) {
    const raw = await this.saleRepo.manager.query(
      `SELECT e.id, e.name,
        COALESCE(s.saleCount, 0) AS "saleCount",
        COALESCE(c.customerCount, 0) AS "customerCount"
      FROM sys_employee e
      LEFT JOIN (
        SELECT creator_id, COUNT(*) AS saleCount FROM house_sale
        WHERE created_at >= date_trunc('month', now())
        GROUP BY creator_id
      ) s ON s.creator_id = e.id
      LEFT JOIN (
        SELECT creator_id, COUNT(*) AS customerCount FROM house_customer
        WHERE created_at >= date_trunc('month', now())
        GROUP BY creator_id
      ) c ON c.creator_id = e.id
      WHERE e.status = 'normal'
      ORDER BY COALESCE(s.saleCount, 0) + COALESCE(c.customerCount, 0) DESC
      LIMIT 5`,
    );
    return raw.map((r: any) => ({
      name: r.name,
      performance: Math.round(r.saleCount * 5000 + r.customerCount * 500),
      houseCount: Number(r.saleCount),
      customerCount: Number(r.customerCount),
    }));
  }

  private async countReserveByStatus(user: CurrentUserPayload, status: string) {
    const qb = this.saleRepo.createQueryBuilder('s')
      .where('s.status = :status', { status });
    applyDataScope(qb, user, 's', { ownerField: 'creatorId' });
    return qb.getCount();
  }

  private async countBlacklist(user: CurrentUserPayload) {
    const { Blacklist } = await import('../house/entities/blacklist.entity');
    const qb = this.saleRepo.manager.getRepository(Blacklist).createQueryBuilder('b')
      .where('b.status = :status', { status: 'active' });
    applyDataScope(qb, user, 'b', { ownerField: 'createdBy' });
    return qb.getCount();
  }
}
