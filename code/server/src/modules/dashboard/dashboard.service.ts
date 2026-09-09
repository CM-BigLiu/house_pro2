import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SaleProperty } from '../house/entities/sale-property.entity';
import { RentalSet } from '../house/entities/rental-set.entity';
import { RentalRoom } from '../house/entities/rental-room.entity';
import { ReserveClient } from '../house/entities/reserve-client.entity';
import { ReserveProperty } from '../house/entities/reserve-property.entity';
import { Customer } from '../house/entities/customer.entity';
import { Bill } from '../finance/entities/bill.entity';
import { FinanceFlow } from '../finance/entities/finance-flow.entity';
import { ApprovalRecord } from '../system/entities/approval-record.entity';
import { applyDataScope } from '../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Employee } from '../system/entities/employee.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(SaleProperty) private saleRepo: Repository<SaleProperty>,
    @InjectRepository(RentalSet) private rentalSetRepo: Repository<RentalSet>,
    @InjectRepository(RentalRoom) private rentalRoomRepo: Repository<RentalRoom>,
    @InjectRepository(ReserveClient) private clientRepo: Repository<ReserveClient>,
    @InjectRepository(ReserveProperty) private reservePropertyRepo: Repository<ReserveProperty>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Bill) private billRepo: Repository<Bill>,
    @InjectRepository(FinanceFlow) private flowRepo: Repository<FinanceFlow>,
    @InjectRepository(ApprovalRecord) private approvalRepo: Repository<ApprovalRecord>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
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

    const vacantQb = this.rentalRoomRepo.createQueryBuilder('rr')
      .innerJoin('rr.set', 'set')
      .where('rr.status = :status', { status: 'vacant' });
    applyDataScope(vacantQb, user, 'set', { ownerField: 'creatorId', groupField: 'groupId' });
    const vacantCount = await vacantQb.getCount();

    const clientQb = this.clientRepo.createQueryBuilder('c');
    applyDataScope(clientQb, user, 'c', { ownerField: 'creatorId' });
    const clientCount = await clientQb.getCount();

    const canViewFinance = this.canViewFinance(user);
    let receivable = 0;
    let received = 0;
    if (canViewFinance) {
      const { start, end } = this.currentMonthRange();
      const receivableQb = this.billRepo.createQueryBuilder('b')
        .select('COALESCE(SUM(b.amount), 0)', 'total')
        .where('b.dueDate BETWEEN :start AND :end', { start, end });
      applyDataScope(receivableQb, user, 'b', { ownerField: 'creatorId' });
      receivable = +(await receivableQb.getRawOne()).total;

      const receivedQb = this.billRepo.createQueryBuilder('b')
        .select('COALESCE(SUM(b.actualAmount), 0)', 'total')
        .where('b.dueDate BETWEEN :start AND :end', { start, end });
      applyDataScope(receivedQb, user, 'b', { ownerField: 'creatorId' });
      received = +(await receivedQb.getRawOne()).total;
    }

    const monthly = canViewFinance ? await this.monthlyTrend(user) : [];
    const smallCards = await this.getSmallCards(user);
    const bigCards = await this.getBigCards(user);

    const kpis: Array<{ label: string; value: number | string; unit: string; color: string }> = [
      { label: '在管房源', value: rentalCount + saleCount, unit: '套', color: 'blue' },
      { label: '在租房间', value: roomCount, unit: '间', color: 'green' },
      { label: '空房间', value: vacantCount, unit: '间', color: 'orange' },
      { label: '储备客源', value: clientCount, unit: '人', color: 'purple' },
    ];
    if (canViewFinance) {
      kpis.push(
        { label: '本月应收', value: (receivable / 10000).toFixed(2), unit: '万', color: 'blue' },
        { label: '本月实收', value: (received / 10000).toFixed(2), unit: '万', color: 'green' },
      );
    }

    return {
      greetingName: user.name,
      role: user.dataScope || 'self',
      kpis,
      charts: { monthly },
      smallCards,
      bigCards,
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

    const result: Array<{
      title: string;
      value: number;
      label: string;
      color: 'red' | 'orange' | 'blue' | 'green';
    }> = [
      { title: '30天内到期租客', value: dueSoonCount, label: '需续租/退房', color: 'orange' as const },
      { title: '储备房源待跟进', value: await this.countReserveByStatus(user, 'not_rented'), label: '待签约', color: 'blue' as const },
      { title: '黑名单人员', value: await this.countBlacklist(user), label: '生效中', color: 'red' as const },
    ];
    if (this.canViewFinance(user)) {
      const overdueQb = this.billRepo.createQueryBuilder('b')
        .where('b.dueDate < :today', { today })
        .andWhere('b.status IN (:...status)', { status: ['pending_receive', 'partial'] });
      applyDataScope(overdueQb, user, 'b', { ownerField: 'creatorId' });
      const overdueCount = await overdueQb.getCount();
      result.splice(1, 0, {
        title: '逾期未缴账单',
        value: overdueCount,
        label: overdueCount ? '需催收' : '暂无',
        color: overdueCount ? 'red' as const : 'green' as const,
      });
    }
    return result;
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
    dueSoon.forEach((item: any) => {
      todos.push({
        id: `lease-${item.id}`,
        title: `【续约】${item.address || ''} 租约即将到期`,
        priority: 'medium',
        date: item.leaseEnd,
      });
    });

    if (this.canViewFinance(user)) {
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
    }

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
    const { start } = this.currentMonthRange();
    const saleQb = this.saleRepo.createQueryBuilder('s')
      .select('s.creatorId', 'employeeId')
      .addSelect('COUNT(s.id)', 'count')
      .where('s.createdAt >= :start', { start: `${start}T00:00:00` })
      .groupBy('s.creatorId');
    applyDataScope(saleQb, user, 's', { ownerField: 'creatorId' });

    const customerQb = this.customerRepo.createQueryBuilder('c')
      .select('c.creatorId', 'employeeId')
      .addSelect('COUNT(c.id)', 'count')
      .where('c.createdAt >= :start', { start: `${start}T00:00:00` })
      .groupBy('c.creatorId');
    applyDataScope(customerQb, user, 'c', { ownerField: 'creatorId' });

    const [saleRows, customerRows] = await Promise.all([saleQb.getRawMany(), customerQb.getRawMany()]);
    const counts = new Map<number, { saleCount: number; customerCount: number }>();
    saleRows.forEach((row: any) => counts.set(Number(row.employeeId), { saleCount: Number(row.count), customerCount: 0 }));
    customerRows.forEach((row: any) => {
      const employeeId = Number(row.employeeId);
      const current = counts.get(employeeId) || { saleCount: 0, customerCount: 0 };
      current.customerCount = Number(row.count);
      counts.set(employeeId, current);
    });

    const employeeIds = [...counts.keys()];
    if (!employeeIds.length) return [];
    const employees = await this.employeeRepo.find({ where: { id: In(employeeIds), status: 'normal' } });
    const names = new Map(employees.map((employee) => [employee.id, employee.name]));
    return employeeIds
      .map((employeeId) => {
        const count = counts.get(employeeId)!;
        return {
          name: names.get(employeeId) || `员工${employeeId}`,
          performance: count.saleCount * 5000 + count.customerCount * 500,
          houseCount: count.saleCount,
          customerCount: count.customerCount,
        };
      })
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 5);
  }

  private async countReserveByStatus(user: CurrentUserPayload, status: string) {
    const qb = this.reservePropertyRepo.createQueryBuilder('r')
      .where('r.status = :status', { status });
    applyDataScope(qb, user, 'r', { ownerField: 'creatorId', groupField: 'groupId' });
    return qb.getCount();
  }

  private async countBlacklist(user: CurrentUserPayload) {
    const { Blacklist } = await import('../house/entities/blacklist.entity');
    const qb = this.saleRepo.manager.getRepository(Blacklist).createQueryBuilder('b')
      .where('b.status = :status', { status: 'active' });
    applyDataScope(qb, user, 'b', { ownerField: 'createdBy' });
    return qb.getCount();
  }

  async getSmallCards(user: CurrentUserPayload) {
    const today = new Date().toISOString().split('T')[0];
    const future30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const tenantDueToday = await this.countRoomLeaseEnd(user, today, today);
    const tenantDue30 = await this.countRoomLeaseEnd(user, today, future30);
    const landlordDueToday = await this.countLandlordLeaseEnd(user, today, today);
    const landlordDue30 = await this.countLandlordLeaseEnd(user, today, future30);
    const result = [
      { group: '租客', title: '今日到期租客', value: tenantDueToday },
      { group: '租客', title: '未来30天到期租客', value: tenantDue30 },
      { group: '房东', title: '今日房东到期', value: landlordDueToday },
      { group: '房东', title: '未来30天到期房东', value: landlordDue30 },
    ];
    if (this.canViewFinance(user)) {
      result.splice(2, 0, { group: '租客', title: '已逾期租客欠款', value: await this.countOverdueBills(user, 'pending_receive') });
      result.push({ group: '房东', title: '已逾期房东欠款', value: await this.countOverduePayable(user) });
    }
    return result;
  }

  async getBigCards(user: CurrentUserPayload) {
    const saleQb = this.saleRepo.createQueryBuilder('s');
    applyDataScope(saleQb, user, 's', { ownerField: 'creatorId' });
    const saleCount = await saleQb.getCount();

    const roomQb = this.rentalRoomRepo.createQueryBuilder('rr').innerJoin('rr.set', 'set');
    applyDataScope(roomQb, user, 'set', { ownerField: 'creatorId', groupField: 'groupId' });
    const roomCount = await roomQb.getCount();

    const vacantCount = await this.countRoomStatus(user, 'vacant');
    const rentedCount = await this.countRoomStatus(user, 'rented');
    const occupancyRate = roomCount ? Math.round((rentedCount / roomCount) * 100) : 0;

    const approvalQb = this.approvalRepo.createQueryBuilder('a').where('a.result = :result', { result: 'pending' });
    if (user.dataScope !== 'company') {
      approvalQb.andWhere('(a.operatorId = :employeeId OR a.approverId = :employeeId)', { employeeId: user.employeeId });
    }
    const pendingApproval = await approvalQb.getCount();
    const todoCount = (await this.getTodos(user)).length;

    const result = [
      { title: '在售房源', value: saleCount, label: '套', color: 'blue' },
      { title: '在租房间', value: roomCount, label: '间', color: 'green' },
      { title: '空置房间', value: vacantCount, label: '间', color: 'orange' },
      { title: '出租率', value: `${occupancyRate}%`, label: '占比', color: 'purple' },
      { title: '待审批', value: pendingApproval, label: '条', color: 'orange' },
      { title: '我的待办', value: todoCount, label: '条', color: 'blue' },
    ];
    if (this.canViewFinance(user)) {
      result.splice(4, 0,
        { title: '押金收入', value: await this.sumDeposit(user, 'income'), label: '元', color: 'green' },
        { title: '押金支出', value: await this.sumDeposit(user, 'expense'), label: '元', color: 'red' },
      );
    }
    return result;
  }

  private async countRoomLeaseEnd(user: CurrentUserPayload, start: string, end: string) {
    const qb = this.rentalRoomRepo.createQueryBuilder('rr')
      .innerJoin('rr.set', 'set')
      .where('rr.status = :status', { status: 'rented' })
      .andWhere('rr.leaseEnd BETWEEN :start AND :end', { start, end });
    applyDataScope(qb, user, 'set', { ownerField: 'creatorId', groupField: 'groupId' });
    return qb.getCount();
  }

  private async countLandlordLeaseEnd(user: CurrentUserPayload, start: string, end: string) {
    const qb = this.rentalSetRepo.createQueryBuilder('rs')
      .where('rs.leaseEnd BETWEEN :start AND :end', { start, end });
    applyDataScope(qb, user, 'rs', { ownerField: 'creatorId', groupField: 'groupId' });
    return qb.getCount();
  }

  private async countOverdueBills(user: CurrentUserPayload, status: string) {
    const today = new Date().toISOString().split('T')[0];
    const qb = this.billRepo.createQueryBuilder('b')
      .select('COALESCE(SUM(b.amount - b.actualAmount), 0)', 'total')
      .where('b.dueDate < :today', { today })
      .andWhere('b.status = :status', { status });
    applyDataScope(qb, user, 'b', { ownerField: 'creatorId' });
    return +(await qb.getRawOne()).total;
  }

  private async countOverduePayable(user: CurrentUserPayload) {
    const today = new Date().toISOString().split('T')[0];
    const qb = this.billRepo.createQueryBuilder('b')
      .select('COALESCE(SUM(b.amount), 0)', 'total')
      .where('b.dueDate < :today', { today })
      .andWhere('b.status = :status', { status: 'pending_pay' });
    applyDataScope(qb, user, 'b', { ownerField: 'creatorId' });
    return +(await qb.getRawOne()).total;
  }

  private async countRoomStatus(user: CurrentUserPayload, status: string) {
    const qb = this.rentalRoomRepo.createQueryBuilder('rr')
      .innerJoin('rr.set', 'set')
      .where('rr.status = :status', { status });
    applyDataScope(qb, user, 'set', { ownerField: 'creatorId', groupField: 'groupId' });
    return qb.getCount();
  }

  private async sumDeposit(user: CurrentUserPayload, direction: string) {
    const { start, end } = this.currentMonthRange();
    const qb = this.flowRepo.createQueryBuilder('f')
      .select('COALESCE(SUM(f.amount), 0)', 'total')
      .where('f.direction = :direction', { direction })
      .andWhere('f.status = :status', { status: 'completed' })
      .andWhere('f.bizType = :bizType', { bizType: 'deposit' })
      .andWhere('f.createdAt BETWEEN :start AND :end', { start: `${start}T00:00:00`, end: `${end}T23:59:59` });
    applyDataScope(qb, user, 'f', { ownerField: 'creatorId' });
    return +(await qb.getRawOne()).total;
  }

  private canViewFinance(user: CurrentUserPayload): boolean {
    return user.permissions.includes('*') || user.permissions.some((permission) => permission.startsWith('finance:'));
  }
}
