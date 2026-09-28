import { DataSource, In } from 'typeorm';
import dataSource from '../src/config/data-source';
import { ContractSchedule } from '../src/modules/finance/entities/business-workflow.entity';
import { Deal } from '../src/modules/house/entities/deal.entity';
import { addDays, addMonths, buildContractSchedule, cents, leaseAmount, money, PAYMENT_MONTHS, validDate } from '../src/modules/finance/services/business-calculation';

/** 已结清期间保留；未结清期间从上一已结清期之后按真实日历月份重新排期。 */
export async function rebuildPendingLeasePlans(ds: DataSource, apply = false) {
  return ds.transaction(async manager => {
    const repo = manager.getRepository(ContractSchedule);
    const rows = await repo.createQueryBuilder('schedule')
      .innerJoin(Deal, 'deal', 'deal.id = schedule.dealId')
      .where('deal.status IN (:...statuses)', { statuses: ['active', 'termination_pending'] })
      .orderBy('schedule.id', 'ASC').setLock('pessimistic_write', undefined, ['schedule']).getMany();
    const ids = [...new Set(rows.filter(row => row.status === 'pending').map(row => row.dealId))];
    if (!ids.length) return [];
    const deals = await manager.getRepository(Deal).find({ where: { id: In(ids) }, lock: { mode: 'pessimistic_write' } });
    const operations: { action: 'update' | 'create'; previous?: ContractSchedule; next: Partial<ContractSchedule> }[] = [];
    for (const deal of deals) {
      if (![deal.leaseStart, deal.leaseEnd].every(validDate)) throw new Error(`合同 ${deal.id} 租期不完整，未更新任何计划。`);
      if (deal.details?.freeDays?.some(days => !Number.isInteger(days) || days < 0 || days > 366)) throw new Error(`合同 ${deal.id} 年度免租超出0至366天，请核对后重排。`);
      const plans = rows.filter(row => row.dealId === deal.id).sort((a, b) => a.sequence - b.sequence);
      const firstPending = plans.find(row => row.status === 'pending')!;
      const paid = plans.filter(row => row.status === 'paid' && cents(row.settledAmount) > 0);
      if (paid.some(row => row.sequence > firstPending.sequence)) throw new Error(`合同 ${deal.id} 存在非顺序结清计划，请核对后重排。`);
      const lastPaid = paid[paid.length - 1];
      const offset = lastPaid?.sequence || 0;
      const start = lastPaid ? addDays(lastPaid.periodEnd, 1) : deal.leaseStart;
      const due = deal.details?.paymentDate || deal.leaseStart;
      const interval = PAYMENT_MONTHS[deal.paymentMethod];
      if (!interval) throw new Error(`合同 ${deal.id} 付款周期无效。`);
      const end = deal.terminatedOn ? [deal.leaseEnd, addDays(deal.terminatedOn, -1)].sort()[0] : deal.leaseEnd;
      const desired = start > end ? [] : buildContractSchedule({
        leaseStart: start, leaseEnd: end, paymentMethod: deal.paymentMethod,
        paymentDate: addMonths(due, offset * interval), amount: Number(deal.amount),
      }).map(plan => ({ ...plan, sequence: plan.sequence + offset, dueDate: addMonths(due, (plan.sequence + offset - 1) * interval),
        amount: leaseAmount(deal.leaseStart, end, Number(deal.amount), plan.periodStart, addDays(plan.periodEnd, 1), firstPending.direction === 'pay' ? deal.details?.freeDays : undefined, firstPending.direction === 'pay' ? deal.details?.freeRentRanges : undefined),
      }));
      for (const plan of desired) {
        const previous = plans.find(row => row.sequence === plan.sequence);
        if (previous && previous.status !== 'pending' && !(previous.status === 'paid' && cents(previous.amount) === 0)) throw new Error(`合同 ${deal.id} 第${plan.sequence}期已经归档，请核对后重排。`);
        const settled = Number(previous?.settledAmount || 0);
        if (cents(plan.amount) < cents(settled)) throw new Error(`计划 ${previous?.id} 已结金额超过新金额，未更新任何计划。`);
        const next = { ...plan, status: cents(plan.amount) === cents(settled) ? 'paid' : 'pending' };
        if (!previous) operations.push({ action: 'create', next: { ...firstPending, ...next, id: undefined, settledAmount: 0, createdAt: undefined } });
        else if (cents(previous.amount) !== cents(next.amount) || previous.dueDate !== next.dueDate || previous.periodStart !== next.periodStart || previous.periodEnd !== next.periodEnd || previous.status !== next.status)
          operations.push({ action: 'update', previous, next });
      }
      for (const previous of plans.filter(row => row.status === 'pending' && !desired.some(plan => plan.sequence === row.sequence))) {
        if (cents(previous.settledAmount) !== 0) throw new Error(`计划 ${previous.id} 已有实际收付款，不能取消。`);
        operations.push({ action: 'update', previous, next: { status: 'cancelled' } });
      }
    }
    // 所有合同都校验成功后才写入，任何冲突由事务整批回滚。
    if (apply) for (const operation of operations) {
      if (operation.action === 'create') await repo.save(repo.create(operation.next));
      else await repo.update(operation.previous!.id, operation.next);
    }
    return operations.map(({ action, previous, next }) => ({
      action, id: previous?.id, dealId: previous?.dealId || next.dealId,
      previous: previous && { dueDate: previous.dueDate, periodStart: previous.periodStart, periodEnd: previous.periodEnd, amount: Number(previous.amount) },
      next, remaining: next.amount === undefined ? 0 : money(cents(next.amount) - cents(previous?.settledAmount || 0)),
    }));
  });
}

if (require.main === module) (async () => {
  if (process.argv.slice(2).some(arg => arg !== '--apply')) throw new Error('仅支持 --apply；不传参数时预览差额。');
  const ds = new DataSource({ ...dataSource.options, synchronize: false, logging: false });
  await ds.initialize();
  try { console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'applied' : 'preview', changes: await rebuildPendingLeasePlans(ds, process.argv.includes('--apply')) }, null, 2)); }
  finally { await ds.destroy(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
