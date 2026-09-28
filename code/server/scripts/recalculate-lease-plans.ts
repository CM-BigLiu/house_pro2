import { DataSource, In } from 'typeorm';
import dataSource from '../src/config/data-source';
import { ContractSchedule } from '../src/modules/finance/entities/business-workflow.entity';
import { addDays, cents, leaseAmount, money, validDate, validMoney } from '../src/modules/finance/services/business-calculation';
import { Deal } from '../src/modules/house/entities/deal.entity';

/** 只重算生效合同未结清计划；先完整校验，再在同一事务内更新。 */
export async function recalculatePendingLeasePlans(ds: DataSource, apply = false) {
  return ds.transaction(async (manager) => {
    const repository = manager.getRepository(ContractSchedule);
    const schedules = await repository.createQueryBuilder('schedule')
      .innerJoin(Deal, 'deal', 'deal.id = schedule.dealId')
      .where('schedule.status = :status', { status: 'pending' })
      .andWhere('deal.status IN (:...statuses)', { statuses: ['active', 'termination_pending'] })
      .orderBy('schedule.id', 'ASC')
      .setLock('pessimistic_write', undefined, ['schedule'])
      .getMany();
    if (!schedules.length) return [];
    const deals = await manager.getRepository(Deal).findBy({
      id: In([...new Set(schedules.map(row => row.dealId))]),
    });
    const changes = schedules.flatMap(row => {
      const deal = deals.find(item => item.id === row.dealId)!;
      if (!deal || deal.amount == null ||
        ![deal.leaseStart, deal.leaseEnd, row.periodStart, row.periodEnd].every(validDate) ||
        deal.leaseStart > deal.leaseEnd || row.periodStart > row.periodEnd ||
        row.periodStart < deal.leaseStart || row.periodEnd > deal.leaseEnd) {
        throw new Error(`计划 ${row.id} 的合同金额或租期不完整，未更新任何计划。`);
      }
      validMoney(Number(deal.amount), '合同月租');
      const nextAmount = leaseAmount(
        deal.leaseStart, deal.leaseEnd, Number(deal.amount),
        row.periodStart, addDays(row.periodEnd, 1),
        row.direction === 'pay' ? deal.details?.freeDays : undefined,
        row.direction === 'pay' ? deal.details?.freeRentRanges : undefined,
      );
      if (cents(nextAmount) === cents(row.amount)) return [];
      return [{
        id: row.id,
        dealId: row.dealId,
        previousAmount: Number(row.amount),
        nextAmount,
        settledAmount: Number(row.settledAmount),
        remaining: money(cents(nextAmount) - cents(row.settledAmount)),
      }];
    });
    if (apply) {
      const conflicts = changes.filter(row => row.remaining < 0);
      if (conflicts.length) {
        throw new Error(`计划 ${conflicts.map(row => row.id).join(', ')} 的已结金额超过新应付/应收金额；请先核对差额，本次未更新任何计划。`);
      }
      for (const change of changes) {
        await repository.update(change.id, {
          amount: change.nextAmount,
          status: change.remaining === 0 ? 'paid' : 'pending',
        });
      }
    }
    return changes;
  });
}

if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    if (args.some(arg => arg !== '--apply')) throw new Error('仅支持 --apply；不传参数时预览差额。');
    const ds = new DataSource({ ...dataSource.options, synchronize: false, logging: false });
    await ds.initialize();
    try {
      const apply = args.includes('--apply');
      const changes = await recalculatePendingLeasePlans(ds, apply);
      console.log(JSON.stringify({ mode: apply ? 'applied' : 'preview', changes }, null, 2));
    } finally {
      await ds.destroy();
    }
  })().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
