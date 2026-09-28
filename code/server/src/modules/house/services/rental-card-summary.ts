import { EntityManager } from 'typeorm';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { applyRecordScope } from '../../../common/data-scope/record-data-scope.util';
import { CashEntry, ContractSchedule } from '../../finance/entities/business-workflow.entity';
import { BusinessCharge } from '../../finance/entities/business-charge.entity';
import { addCalendarMonths, cents, days, money, validDate } from '../../finance/services/business-calculation';
import { chargeToday } from '../../finance/services/business-charges';
import { Deal } from '../entities/deal.entity';
import { Checkout } from '../entities/checkout.entity';

/** 只统计当前可见房源和当前账号的数据范围；整套费用不擅自分摊到房间。 */
export async function attachRentalCardSummaries(manager: EntityManager, rentals: any[], user: CurrentUserPayload) {
  if (!rentals.length) return rentals;
  const ids = rentals.map(rental => rental.id), today = chargeToday(), periodStart = `${today.slice(0, 7)}-01`, until = addCalendarMonths(periodStart, 1);
  const scoped = (entity: any, owner = 'employeeId') => applyRecordScope(manager.getRepository<any>(entity).createQueryBuilder('record'), user, 'record', owner);
  const [plans, charges, cash, deals, checkouts] = await Promise.all([
    scoped(ContractSchedule).innerJoin(Deal, 'deal', 'deal.id = record.dealId').andWhere('record.propertyId IN (:...ids) AND record.status = :status AND record.dueDate < :until AND deal.status IN (:...active)', { ids, status: 'pending', until, active: ['active', 'termination_pending'] }).getMany(),
    scoped(BusinessCharge).andWhere('record.propertyId IN (:...ids)', { ids }).getMany(),
    scoped(CashEntry).leftJoin(ContractSchedule, 'schedule', 'schedule.id = record.scheduleId').leftJoin(BusinessCharge, 'charge', 'charge.id = record.chargeId').andWhere('(schedule.propertyId IN (:...ids) OR charge.propertyId IN (:...ids)) AND record.paymentDate >= :periodStart AND record.paymentDate < :until', { ids, periodStart, until }).getMany(),
    scoped(Deal, 'responsibleEmployeeId').andWhere('record.propertyId IN (:...ids)', { ids }).getMany(),
    scoped(Checkout, 'creatorId').andWhere('record.rentalSetId IN (:...ids) AND record.status IN (:...statuses)', { ids, statuses: ['confirmed', 'completed'] }).getMany(),
  ]);
  // 已结账单也需要关联本月现金流水的房间归属。
  const cashPlans = cash.some(entry => entry.scheduleId) ? await scoped(ContractSchedule).andWhere('record.propertyId IN (:...ids)', { ids }).getMany() : [];
  const byPlan = new Map([...plans, ...cashPlans].map(plan => [plan.id, plan])), byCharge = new Map(charges.map(charge => [charge.id, charge])), byDeal = new Map(deals.map(deal => [deal.id, deal]));
  const sum = (rows: any[], select: (row: any) => number) => money(rows.reduce((total, row) => total + select(row), 0));
  const summary = (rental: any, roomId?: number) => {
    const matches = (propertyId: number, room: number | null | undefined) => propertyId === rental.id && (roomId == null || room === roomId);
    const duePlans = plans.filter(plan => matches(plan.propertyId, byDeal.get(plan.dealId)?.roomId));
    const dueCharges = charges.filter(charge => charge.status === 'pending' && charge.dueDate < until && matches(charge.propertyId, charge.roomId) && (charge.category !== 'tenant_deposit' || ['active', 'termination_pending'].includes(byDeal.get(charge.dealId)?.status)));
    const entries = cash.filter(entry => { const plan = byPlan.get(entry.scheduleId), charge = byCharge.get(entry.chargeId); return matches(charge?.propertyId || plan?.propertyId, charge ? charge.roomId : byDeal.get(plan?.dealId)?.roomId); });
    const pending = [...duePlans, ...dueCharges];
    const total = (direction: string) => sum(pending.filter(row => row.direction === direction), row => cents(row.amount) - cents(row.settledAmount));
    const result: any = { period: today.slice(0, 7), pendingIncome: total('receive'), received: sum(entries.filter(entry => entry.direction === 'receive'), entry => cents(entry.amount)) };
    if (rental.canViewLandlordInfo === true) { result.pendingExpense = total('pay'); result.paid = sum(entries.filter(entry => entry.direction === 'pay'), entry => cents(entry.amount)); }
    const subject = roomId == null ? rental : rental.rooms.find((room: any) => room.id === roomId);
    if (['vacant', 'active'].includes(subject.status)) {
      const latest = checkouts.filter(checkout => checkout.rentalSetId === rental.id && (roomId == null ? !checkout.rentalRoomId : checkout.rentalRoomId === roomId)).map(checkout => checkout.checkoutDate).filter(validDate).sort().pop();
      const created = subject.createdAt instanceof Date ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(subject.createdAt) : String(subject.createdAt || '').slice(0, 10);
      const since = latest || created;
      if (validDate(since)) { result.vacantDays = Math.max(0, days(since, today)); result.vacancySource = latest ? 'checkout' : 'registered'; result.vacantSince = since; }
    }
    return result;
  };
  return rentals.map(rental => ({ ...rental, financialSummary: summary(rental), rooms: (rental.rooms || []).map((room: any) => ({ ...room, financialSummary: summary(rental, room.id) })) }));
}
