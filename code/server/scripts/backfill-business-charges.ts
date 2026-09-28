import { DataSource } from 'typeorm';
import dataSource from '../src/config/data-source';
import { Deal } from '../src/modules/house/entities/deal.entity';
import { RentalSet } from '../src/modules/house/entities/rental-set.entity';
import { BusinessCharge } from '../src/modules/finance/entities/business-charge.entity';
import { PropertyConfiguration } from '../src/modules/finance/entities/business-workflow.entity';
import { Bill } from '../src/modules/finance/archive/bill.entity';
import { FinanceFlow } from '../src/modules/finance/archive/finance-flow.entity';
import { syncConfigurationCharges, syncContractCharges } from '../src/modules/finance/services/business-charges';
import { cents, money } from '../src/modules/finance/services/business-calculation';

/** 默认在事务中预览后回滚；仅 --apply 写入，无新增现金流水。 */
export async function backfillBusinessCharges(ds: DataSource, apply = false) {
  const runner = ds.createQueryRunner();
  await runner.connect(); await runner.startTransaction();
  try {
    const manager = runner.manager, repo = manager.getRepository(BusinessCharge);
    const before = await repo.find(), oldKeys = new Set(before.map(row => row.sourceKey));
    const deals = await manager.getRepository(Deal).find();
    const bills = await manager.getRepository(Bill).find(), flows = await manager.getRepository(FinanceFlow).find();
    for (const deal of deals.filter(deal => ['active', 'termination_pending'].includes(deal.status))) {
      await syncContractCharges(manager, deal);
      const key = `deal:${deal.id}:commission`;
      if (oldKeys.has(key)) continue;
      const commission = await repo.findOne({ where: { sourceKey: key } });
      if (!commission) continue;
      const receipts = bills.filter(bill => bill.bizId === deal.contractCode && bill.bizType === 'commission' && bill.status !== 'cancelled').reduce((total, bill) => {
        const completed = flows.filter(flow => flow.billId === bill.id && flow.status === 'completed' && flow.direction === 'income');
        return total + (completed.length ? completed.reduce((s, flow) => s + cents(flow.amount) * (flow.isRed ? -1 : 1), 0) : cents(bill.actualAmount || 0));
      }, 0);
      if (receipts < 0 || receipts > cents(commission.amount)) throw new Error(`合同 ${deal.id} 历史佣金实收与合同不符，本次未写入任何费用`);
      if (receipts) await repo.update(commission.id, { settledAmount: money(receipts), status: receipts === cents(commission.amount) ? 'paid' : 'pending' });
    }
    for (const configuration of await manager.getRepository(PropertyConfiguration).find()) {
      const rental = await manager.getRepository(RentalSet).findOne({ where: { id: configuration.propertyId }, relations: ['rooms', 'community'] });
      if (!rental) throw new Error(`配置 ${configuration.id} 缺少房源，本次未写入任何费用`);
      const occurredOn = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(configuration.createdAt);
      configuration.items = configuration.items.map(item => ({ ...item, dueDate: item.dueDate || occurredOn, roomId: item.roomId ?? null }));
      await syncConfigurationCharges(manager, configuration, rental);
    }
    const after = await repo.find({ order: { id: 'ASC' } });
    const changes = after.filter(row => !oldKeys.has(row.sourceKey) || before.some(old => old.sourceKey === row.sourceKey && (cents(old.amount) !== cents(row.amount) || old.dueDate !== row.dueDate || old.roomId !== row.roomId || old.counterparty !== row.counterparty))).map(row => ({ sourceKey: row.sourceKey, propertyId: row.propertyId, category: row.category, dueDate: row.dueDate, amount: Number(row.amount), settledAmount: Number(row.settledAmount), status: row.status }));
    if (apply) await runner.commitTransaction(); else await runner.rollbackTransaction();
    return changes;
  } catch (error) { await runner.rollbackTransaction(); throw error; }
  finally { await runner.release(); }
}
if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    if (args.some(arg => arg !== '--apply')) throw new Error('仅支持 --apply；不传参数时预览后回滚。');
    const ds = new DataSource({ ...dataSource.options, synchronize: false, logging: false }); await ds.initialize();
    try { console.log(JSON.stringify({ mode: args.includes('--apply') ? 'applied' : 'preview', changes: await backfillBusinessCharges(ds, args.includes('--apply')) }, null, 2)); }
    finally { await ds.destroy(); }
  })().catch(error => { console.error(error.message); process.exitCode = 1; });
}
