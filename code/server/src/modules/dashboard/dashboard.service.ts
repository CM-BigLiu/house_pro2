import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SaleProperty } from '../house/entities/sale-property.entity';
import { RentalSet } from '../house/entities/rental-set.entity';
import { RentalRoom } from '../house/entities/rental-room.entity';
import { Customer } from '../house/entities/customer.entity';
import { Bill } from '../finance/archive/bill.entity';
import { FinanceFlow } from '../finance/archive/finance-flow.entity';
import { ApprovalRecord } from '../system/entities/approval-record.entity';
import { applyRecordScope } from '../../common/data-scope/record-data-scope.util';
import { applyDataScope } from '../../common/data-scope/data-scope.util';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Employee } from '../system/entities/employee.entity';
import { IncomeCostReportService } from '../finance/services/income-cost-report.service';
import { ContractSchedule } from '../finance/entities/business-workflow.entity';
import { BusinessCharge } from '../finance/entities/business-charge.entity';
import { Deal } from '../house/entities/deal.entity';
import { CHARGE_LABELS } from '../finance/services/business-charges';
import { addMonths, cents, money } from '../finance/services/business-calculation';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(SaleProperty) private saleRepo: Repository<SaleProperty>,
    @InjectRepository(RentalSet) private rentalSetRepo: Repository<RentalSet>,
    @InjectRepository(RentalRoom) private rentalRoomRepo: Repository<RentalRoom>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Bill) private billRepo: Repository<Bill>,
    @InjectRepository(FinanceFlow) private flowRepo: Repository<FinanceFlow>,
    @InjectRepository(ApprovalRecord) private approvalRepo: Repository<ApprovalRecord>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    private costs: IncomeCostReportService,
  ) {}

  async getOverview(user: CurrentUserPayload) {
    const keys = ['properties', 'rented', 'vacant', ...(this.canViewFinance(user) ? ['receivable', 'received'] : [])];
    const labels = { properties: '在管房源', rented: '在租房间', vacant: '空房间', receivable: '本月应收', received: '本月实收' };
    const data = await Promise.all(keys.map(key => this.kpiRows(key, user)));
    const kpis = keys.map((key, index) => ({ key, label: labels[key],
      value: index < 3 ? data[index].length : (data[index].reduce((sum, row) => sum + cents(row.amount), 0) / 1000000).toFixed(2),
      unit: key === 'properties' ? '套' : index < 3 ? '间' : '万', color: ['blue', 'green', 'orange', 'blue', 'green'][index],
    }));
    return { greetingName: user.name, role: user.dataScope || 'self', kpis,
      charts: { monthly: this.canViewFinance(user) ? await this.monthlyTrend(user) : [] },
      smallCards: await this.getSmallCards(user), bigCards: await this.getBigCards(user) };
  }
  async getKpiDetails(key: string, query: any, user: CurrentUserPayload) {
    const page = Math.max(1, Math.floor(Number(query.page) || 1)), pageSize = Math.min(100, Math.max(1, Math.floor(Number(query.pageSize) || 10)));
    const list = await this.kpiRows(key, user);
    return { key, list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length,
      totalAmount: money(list.reduce((sum, row) => sum + cents(row.amount || 0), 0)) };
  }
  private async kpiRows(key: string, user: CurrentUserPayload): Promise<any[]> {
    if (key === 'properties') {
      const rental = this.rentalSetRepo.createQueryBuilder('r');
      applyDataScope(rental, user, 'r', { ownerField: 'creatorId', groupField: 'groupId' });
      const sale = this.saleRepo.createQueryBuilder('s');
      applyRecordScope(sale, user, 's', 'creatorId');
      const [rentals, sales] = await Promise.all([rental.getMany(), sale.getMany()]);
      return [...rentals.map(row => ({ id: `rent:${row.id}`, propertyCode: row.code, propertyName: row.title || row.address, type: '出租房源', status: row.status })),
        ...sales.map(row => ({ id: `sale:${row.id}`, propertyCode: row.code, propertyName: row.title || row.code, type: '出售房源', status: row.status }))];
    }
    if (['rented', 'vacant'].includes(key)) {
      const qb = this.rentalRoomRepo.createQueryBuilder('rr').innerJoinAndSelect('rr.set', 'set').where('rr.status = :status', { status: key });
      applyDataScope(qb, user, 'set', { ownerField: 'creatorId', groupField: 'groupId' });
      const rows = await qb.orderBy('rr.id', 'ASC').getMany();
      return rows.map(row => ({ id: row.id, propertyCode: row.set.code, propertyName: row.set.title || row.set.address, roomNo: row.roomNo, status: row.status, rent: Number(row.rentPrice || 0), leaseStart: row.leaseStart, leaseEnd: row.leaseEnd }));
    }
    if (!['receivable', 'received'].includes(key)) throw new BadRequestException('不支持的经营指标');
    if (!this.canViewFinance(user)) throw new ForbiddenException('无权查看财务详情');
    const { start, end } = this.currentMonthRange();
    if (key === 'received') return (await this.costs.report(start.slice(0, 7), user)).list.filter(row => row.direction === 'income');
    const schedules = this.rentalSetRepo.manager.getRepository(ContractSchedule).createQueryBuilder('s')
      .where('s.direction = :direction AND s.status != :cancelled AND s.dueDate BETWEEN :start AND :end', { direction: 'receive', cancelled: 'cancelled', start, end });
    applyDataScope(schedules, user, 's', { ownerField: 'employeeId', groupField: 'groupId' });
    const bills = this.billRepo.createQueryBuilder('b').where('b.dueDate BETWEEN :start AND :end AND b.status IN (:...statuses)', { start, end, statuses: ['pending_receive', 'partial', 'received'] });
    applyRecordScope(bills, user, 'b', 'creatorId');
    const chargeQuery = this.rentalSetRepo.manager.getRepository(BusinessCharge).createQueryBuilder('charge')
      .leftJoin(Deal, 'chargeDeal', 'chargeDeal.id = charge.dealId')
      .where('charge.direction = :direction AND charge.status != :cancelled AND charge.dueDate BETWEEN :start AND :end', { direction: 'receive', cancelled: 'cancelled', start, end })
      .andWhere('(charge.category != :deposit OR chargeDeal.status IN (:...depositActive))', { deposit: 'tenant_deposit', depositActive: ['active', 'termination_pending'] });
    applyDataScope(chargeQuery, user, 'charge', { ownerField: 'employeeId', groupField: 'groupId' });
    const [plans, legacy, charges] = await Promise.all([schedules.getMany(), bills.getMany(), chargeQuery.getMany()]);
    return [...plans.map(row => ({ id: `schedule:${row.id}`, date: row.dueDate, reference: `合同 #${row.dealId} / 第${row.sequence}期`, propertyName: row.propertyName, source: '租金缴费计划', amount: Number(row.amount), settledAmount: Number(row.settledAmount), status: row.status })),
      ...legacy.map(row => ({ id: `bill:${row.id}`, date: row.dueDate, reference: row.bizId || `账单 #${row.id}`, propertyName: row.roomCode || '', source: '历史账单', amount: Number(row.amount), settledAmount: Number(row.actualAmount), status: row.status })),
      ...charges.map(row => ({ id: `charge:${row.id}`, date: row.dueDate, reference: row.dealId ? `合同 #${row.dealId}` : `房源 #${row.propertyId}`, propertyName: row.propertyName, source: CHARGE_LABELS[row.category] || row.category, amount: Number(row.amount), settledAmount: Number(row.settledAmount), status: row.status }))];
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
    ];
    if (this.canViewFinance(user)) {
      const overdueQb = this.billRepo.createQueryBuilder('b')
        .where('b.dueDate < :today', { today })
        .andWhere('b.status IN (:...status)', { status: ['pending_receive', 'partial'] });
      applyRecordScope(overdueQb, user, 'b', 'creatorId');
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

  async getTodos(user: CurrentUserPayload, all = false) {
    const todos: { id: string; title: string; priority: 'high' | 'medium' | 'low'; date: string }[] = [];
    const today = new Date().toISOString().split('T')[0];
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const dueSoonQb = this.rentalRoomRepo.createQueryBuilder('rr')
      .innerJoin('rr.set', 'set')
      .select(['rr.id AS id', 'rr.leaseEnd AS leaseEnd', 'set.address AS address'])
      .where('rr.status = :status', { status: 'rented' })
      .andWhere('rr.leaseEnd BETWEEN :start AND :end', { start: today, end: future })
      .orderBy('rr.leaseEnd', 'ASC');
    if (!all) dueSoonQb.limit(5);
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
        .orderBy('b.dueDate', 'ASC');
      if (!all) overdueQb.limit(5);
      applyRecordScope(overdueQb, user, 'b', 'creatorId');
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
    const start = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date()).slice(0, 7) + '-01';
    const next = addMonths(start, 1), date = new Date(`${next}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return { start, end: date.toISOString().slice(0, 10) };
  }
  private async monthlyTrend(user: CurrentUserPayload) {
    const { start } = this.currentMonthRange();
    return Promise.all(Array.from({ length: 6 }, async (_, index) => {
      const month = addMonths(start, index - 5).slice(0, 7), report = await this.costs.report(month, user);
      return { month, income: report.totalIncome, expense: report.totalCost };
    }));
  }

  private async employeeRanking(user: CurrentUserPayload) {
    const { start } = this.currentMonthRange();
    const saleQb = this.saleRepo.createQueryBuilder('s')
      .select('s.creatorId', 'employeeId')
      .addSelect('COUNT(s.id)', 'count')
      .where('s.createdAt >= :start', { start: `${start}T00:00:00` })
      .groupBy('s.creatorId');
    applyRecordScope(saleQb, user, 's', 'creatorId');

    const customerQb = this.customerRepo.createQueryBuilder('c')
      .select('c.creatorId', 'employeeId')
      .addSelect('COUNT(c.id)', 'count')
      .where('c.createdAt >= :start', { start: `${start}T00:00:00` })
      .groupBy('c.creatorId');
    applyRecordScope(customerQb, user, 'c', 'creatorId');

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
    applyRecordScope(saleQb, user, 's', 'creatorId');
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
      { title: '在租房间', value: rentedCount, label: '间', color: 'green' },
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
    applyRecordScope(qb, user, 'b', 'creatorId');
    return +(await qb.getRawOne()).total;
  }

  private async countOverduePayable(user: CurrentUserPayload) {
    const today = new Date().toISOString().split('T')[0];
    const qb = this.billRepo.createQueryBuilder('b')
      .select('COALESCE(SUM(b.amount), 0)', 'total')
      .where('b.dueDate < :today', { today })
      .andWhere('b.status = :status', { status: 'pending_pay' });
    applyRecordScope(qb, user, 'b', 'creatorId');
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
    const report = await this.costs.report(this.currentMonthRange().start.slice(0, 7), user);
    return money(report.list.filter(row => row.direction === direction && row.category.includes('押金')).reduce((sum, row) => sum + cents(row.amount), 0));
  }

  private canViewFinance(user: CurrentUserPayload): boolean {
    return user.permissions.includes('*') || user.permissions.some((permission) => permission.startsWith('finance:'));
  }
}
