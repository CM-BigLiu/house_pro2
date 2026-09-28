import { BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Deal } from '../../house/entities/deal.entity';
import { Deposit } from '../../house/entities/deposit.entity';
import { RentalSet } from '../../house/entities/rental-set.entity';
import { BusinessCharge } from '../entities/business-charge.entity';
import { PropertyConfiguration } from '../entities/business-workflow.entity';
import { cents, money, validDate } from './business-calculation';

export const CHARGE_LABELS: Record<string, string> = {
  landlord_deposit: '房东押金', tenant_deposit: '租房押金', commission: '佣金',
  furniture: '家具配置', appliance: '家电配置', repair: '维修', cleaning: '保洁',
  renovation: '装修', rental_bonus: '出房奖', collection_bonus: '收房奖',
};
export const configurationCharge = (category: string) => ['furniture', 'appliance', 'repair', 'cleaning', 'renovation', 'rental_bonus', 'collection_bonus'].includes(category);
export const chargeToday = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date());

export async function upsertCharge(manager: EntityManager, input: Partial<BusinessCharge> & { sourceKey: string; amount: number }, historicalReceipt = 0) {
  const repo = manager.getRepository(BusinessCharge);
  const old = await repo.findOne({ where: { sourceKey: input.sourceKey }, lock: { mode: 'pessimistic_write' } });
  const settled = cents(old?.settledAmount ?? historicalReceipt);
  if (cents(input.amount) < settled) throw new BadRequestException(`${CHARGE_LABELS[input.category!] || '费用'}不能低于已结金额`);
  if (old && settled && ((old.roomId ?? null) !== (input.roomId ?? null) || old.counterparty !== (input.counterparty || ''))) throw new BadRequestException('已结费用不能变更所属房间或收款人');
  if (!old && !cents(input.amount)) return;
  return repo.save(repo.create({ ...old, ...input, settledAmount: money(settled), status: cents(input.amount) === settled ? 'paid' : 'pending' }));
}

export async function syncContractCharges(manager: EntityManager, deal: Deal) {
  if (!['rent', 'management'].includes(deal.bizType) || (!cents(deal.deposit || 0) && !cents(deal.details?.commissionAmount || 0))) return;
  const dueDate = deal.details?.paymentDate || deal.leaseStart;
  if (!validDate(dueDate)) throw new BadRequestException('押金与佣金须有有效付款日期');
  const owner = deal.bizType === 'management';
  const base = { dealId: deal.id, propertyId: deal.propertyId, roomId: deal.roomId ?? null, propertyName: deal.propertyName, dueDate, employeeId: deal.responsibleEmployeeId, storeId: deal.storeId, groupId: deal.groupId };
  const historic = !owner && cents(deal.deposit || 0) ? await manager.getRepository(Deposit).findOne({ where: { contractCode: deal.contractCode } }) : null;
  await upsertCharge(manager, { ...base, sourceKey: `deal:${deal.id}:deposit`, category: owner ? 'landlord_deposit' : 'tenant_deposit', direction: owner ? 'pay' : 'receive', amount: Number(deal.deposit || 0), counterparty: owner ? deal.details?.ownerName || deal.customerName || '' : deal.customerName || '' }, historic?.depositDate ? Number(historic.depositAmount || 0) : 0);
  if (!owner) await upsertCharge(manager, { ...base, sourceKey: `deal:${deal.id}:commission`, category: 'commission', direction: 'receive', amount: Number(deal.details?.commissionAmount || 0), counterparty: deal.customerName || '' });
}

export async function syncConfigurationCharges(manager: EntityManager, configuration: PropertyConfiguration, rental: RentalSet) {
  for (const item of configuration.items) {
    const dueDate = item.dueDate || chargeToday();
    if (!validDate(dueDate)) throw new BadRequestException('费用付款日期无效');
    if (item.roomId != null && (!Number.isInteger(item.roomId) || !(rental.rooms || []).some(room => room.id === item.roomId))) throw new BadRequestException('费用所属房间不存在');
    await upsertCharge(manager, { sourceKey: `configuration:${configuration.id}:${item.type}`, dealId: null, propertyId: rental.id, roomId: item.roomId ?? null, propertyName: rental.address || rental.community?.name || rental.code, category: item.type, direction: 'pay', amount: Number(item.amount), dueDate, counterparty: item.recipient || '', remark: item.remark || '', employeeId: configuration.employeeId, storeId: configuration.storeId, groupId: configuration.groupId });
  }
}

export function chargeCalendarRow(row: BusinessCharge, contractCode?: string) {
  return { ...row, billType: 'charge', categoryLabel: CHARGE_LABELS[row.category] || row.category, contractCode, sequence: 0, periodStart: row.dueDate, periodEnd: row.dueDate, amount: Number(row.amount), settledAmount: Number(row.settledAmount), remaining: money(cents(row.amount) - cents(row.settledAmount)) };
}
