import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { applyRecordScope } from '../../../common/data-scope/record-data-scope.util';
import { CashEntry, ContractSchedule, PropertyConfiguration } from '../entities/business-workflow.entity';
import { IncomeCost } from '../entities/income-cost.entity';
import { PaymentPlan } from '../entities/payment-plan.entity';
import { FinanceFlow } from '../archive/finance-flow.entity';
import { Bill } from '../archive/bill.entity';
import { Deposit } from '../../house/entities/deposit.entity';
import { Checkout } from '../../house/entities/checkout.entity';
import { Deal } from '../../house/entities/deal.entity';
import { cents, money, validDate } from './business-calculation';
import { BusinessCharge } from '../entities/business-charge.entity';
import { CHARGE_LABELS, configurationCharge } from './business-charges';

export interface IncomeCostEntry {
  id: string; date: string; direction: 'income' | 'expense'; category: string;
  source: string; reference: string; propertyName: string; amount: number;
}

/** 只读汇总各业务的原始金额，不复制台账；源记录修改后实时重算。 */
@Injectable()
export class IncomeCostReportService {
  constructor(private readonly ds: DataSource) {}
  private scoped<T>(repo: Repository<T>, user: CurrentUserPayload, owner: string) {
    return applyRecordScope(repo.createQueryBuilder('r'), user, 'r', owner);
  }
  async report(period: string, user: CurrentUserPayload) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period || '')) throw new BadRequestException('月份格式为 YYYY-MM');
    const rows = <T>(entity: any, owner: string) => this.scoped(this.ds.getRepository<T>(entity), user, owner).getMany();
    const [cash, flows, deposits, checkouts, configurations, deals, plans, manual, charges] = await Promise.all([
      rows<CashEntry>(CashEntry, 'employeeId'), rows<FinanceFlow>(FinanceFlow, 'creatorId'),
      rows<Deposit>(Deposit, 'creatorId'), rows<Checkout>(Checkout, 'creatorId'),
      rows<PropertyConfiguration>(PropertyConfiguration, 'employeeId'), rows<Deal>(Deal, 'responsibleEmployeeId'),
      rows<PaymentPlan>(PaymentPlan, 'creatorId'), rows<IncomeCost>(IncomeCost, 'creatorId'),
      rows<BusinessCharge>(BusinessCharge, 'employeeId'),
    ]);
    const list: IncomeCostEntry[] = [];
    const dateOf = (value: Date | string) => value instanceof Date ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(value) : String(value || '').slice(0, 10);
    const add = (id: string, date: string, direction: IncomeCostEntry['direction'], category: string, source: string, amount: number | string, reference = '', propertyName = '') => {
      const n = cents(amount || 0);
      if (!validDate(date) || !date.startsWith(period) || !n) return;
      list.push({ id, date, direction, category, source, amount: money(n), reference, propertyName });
    };
    const schedules = cash.length ? await this.ds.getRepository(ContractSchedule).find() : [];
    const bySchedule = new Map(schedules.map(row => [row.id, row]));
    const byCharge = new Map(charges.map(row => [row.id, row]));
    cash.forEach(row => {
      const schedule = bySchedule.get(row.scheduleId), charge = byCharge.get(row.chargeId), deal = deals.find(deal => deal.id === (charge?.dealId || schedule?.dealId));
      // 配置费用在保存时计入成本，实际付款只更新现金账户，避免重复确认成本。
      if (charge && configurationCharge(charge.category)) return;
      add(`cash:${row.id}`, row.paymentDate, row.direction === 'receive' ? 'income' : 'expense', charge ? CHARGE_LABELS[charge.category] || charge.category : '租金', charge ? '费用收付款登记' : '缴费登记', row.amount, deal?.contractCode || (charge ? `费用 #${charge.id}` : `计划 #${row.scheduleId}`), charge?.propertyName || schedule?.propertyName || '');
    });
    // 历史流水携带账单外键；同一账单的实收仅按流水记账，不再次加账单合计。
    const bills = await this.scoped(this.ds.getRepository(Bill), user, 'creatorId').getMany();
    const flowReferences = new Map<number, string>(bills.map(bill => [bill.id, bill.bizId]));
    const completedFlows = flows.filter(row => row.status === 'completed');
    completedFlows.forEach(row => add(`flow:${row.id}`, row.occurredOn || dateOf(row.createdAt), row.direction === 'income' ? 'income' : 'expense', row.bizType === 'deposit' ? '押金' : row.bizType === 'rent' ? '租金' : '其他', '历史流水', row.isRed ? -Number(row.amount) : row.amount, flowReferences.get(row.billId) || `流水 #${row.id}`));
    const historicalReceipts = bills.filter(bill => cents(bill.actualAmount || 0) > 0 && bill.status !== 'cancelled' && !completedFlows.some(flow => flow.billId === bill.id));
    const billDirection = (bill: Bill) => ['pending_pay', 'paid'].includes(bill.status) || bill.billSource === 'landlord_rent' ? 'expense' : 'income';
    historicalReceipts.forEach(bill => add(`bill:${bill.id}`, dateOf(bill.updatedAt), billDirection(bill), bill.bizType === 'deposit' ? '押金' : bill.bizType === 'rent' ? '租金' : '其他', '历史账单已缴（无流水）', bill.actualAmount, bill.bizId || `账单 #${bill.id}`, bill.roomCode || ''));
    const hasFlow = (reference: string, direction: string, types: string[]) => completedFlows.some(row => flowReferences.get(row.billId) === reference && row.direction === direction && types.includes(row.bizType)) || historicalReceipts.some(bill => bill.bizId === reference && billDirection(bill) === direction && types.includes(bill.bizType));
    deposits.forEach(row => {
      const receivedByCharge = cash.filter(entry => entry.direction === 'receive' && byCharge.get(entry.chargeId)?.category === 'tenant_deposit' && deals.find(deal => deal.id === byCharge.get(entry.chargeId)?.dealId)?.contractCode === row.contractCode).reduce((sum, entry) => sum + cents(entry.amount), 0);
      if (!hasFlow(row.contractCode, 'income', ['deposit'])) add(`deposit:${row.id}:receive`, row.depositDate, 'income', '押金', '押金登记', money(Math.max(0, cents(row.depositAmount) - receivedByCharge)), row.contractCode, row.houseInfo);
      if (row.status === 'refunded' && !hasFlow(row.contractCode, 'expense', ['deposit'])) add(`deposit:${row.id}:refund`, row.refundDate, 'expense', '押金退款', '押金退还', row.depositAmount, row.contractCode, row.houseInfo);
      // 扣留的押金已经收取，不再生成第二笔收入。
    });
    checkouts.filter(row => row.status === 'completed').forEach(row => {
      if (hasFlow(row.contractCode, Number(row.settlementAmount) >= 0 ? 'income' : 'expense', ['checkout', 'settlement'])) return;
      add(`checkout:${row.id}`, dateOf(row.completedAt || row.updatedAt), Number(row.settlementAmount) >= 0 ? 'income' : 'expense', '退房结算', '退房清算', Math.abs(Number(row.settlementAmount || 0)), row.contractCode, row.houseInfo);
    });
    configurations.forEach(row => {
      const adjustments = row.adjustments?.length ? row.adjustments : [{ occurredOn: dateOf(row.createdAt), amount: money((row.items || []).reduce((sum, item) => sum + cents(item.amount), 0)) }];
      adjustments.forEach((item, index) => add(`configuration:${row.id}:${index}`, item.occurredOn, 'expense', '配置与奖励', '房源配置', item.amount, `配置 #${row.id}`, deals.find(deal => deal.propertyId === row.propertyId && deal.bizType === 'rent')?.propertyName || `房源 #${row.propertyId}`));
    });
    deals.filter(row => row.workflowType !== 'management' && row.status !== 'cancelled').forEach(row => {
      if (!charges.some(charge => charge.dealId === row.id && charge.category === 'commission') && !hasFlow(row.contractCode, 'income', ['commission'])) add(`deal:${row.id}:commission`, dateOf(row.signedAt), 'income', '佣金', '历史合同佣金', row.details?.commissionAmount || 0, row.contractCode, row.propertyName);
    });
    plans.forEach(row => add(`plan:${row.id}`, row.auditTime || dateOf(row.updatedAt), ['pay', 'expense', 'payment'].includes(row.planType) ? 'expense' : 'income', row.billingCategory || '其他', '历史收付款计划已完成金额', row.completedAmount, `计划 #${row.id}`, row.reason));
    const fields = { rentIncome: ['income', '租金'], depositIncome: ['income', '押金'], energyIncome: ['income', '能源'], otherIncome: ['income', '其他'], rentCost: ['expense', '租金'], energyCost: ['expense', '能源'], decorateCost: ['expense', '装修'], laborCost: ['expense', '人工'], otherCost: ['expense', '其他'] } as const;
    manual.filter(row => row.period === period).forEach(row => Object.entries(fields).forEach(([field, [direction, category]]) => add(`manual:${row.id}:${field}`, `${row.period}-01`, direction, category, '补充台账', row[field], `台账 #${row.id}`)));
    list.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
    const sum = (direction: string) => money(list.filter(row => row.direction === direction).reduce((total, row) => total + cents(row.amount), 0));
    const totalIncome = sum('income'), totalCost = sum('expense');
    return { period, list, totalIncome, totalCost, net: money(cents(totalIncome) - cents(totalCost)) };
  }
}
