import { BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Deal } from '../../house/entities/deal.entity';
import { RentalSet } from '../../house/entities/rental-set.entity';
import { ContractSchedule } from '../entities/business-workflow.entity';
import { addDays, cents, leaseAmount, normalizeFreeRentRanges } from './business-calculation';

/** 房源保存时同步生效委托与各期应付；已付金额不被改写或隐式退款。 */
export async function syncLandlordFreeRent(manager: EntityManager, rental: RentalSet) {
  const dealRepo = manager.getRepository(Deal), scheduleRepo = manager.getRepository(ContractSchedule);
  const deals = await dealRepo.createQueryBuilder('deal').where('deal.propertyId = :id AND deal.workflowType = :type AND deal.status IN (:...statuses)', {
    id: rental.id, type: 'management', statuses: ['active', 'termination_pending'],
  }).setLock('pessimistic_write').getMany();
  const changes: { id: number; amount: number; status: string }[] = [];
  for (const deal of deals) {
    const ranges = normalizeFreeRentRanges(rental.freeRentRanges || []).flatMap(range => {
      const start = [range.start, deal.leaseStart].sort().pop()!, end = [range.end, deal.leaseEnd].sort()[0];
      return start <= end ? [{ start, end }] : [];
    });
    deal.details = { ...deal.details, freeRentRanges: ranges };
    const plans = await scheduleRepo.createQueryBuilder('plan').where('plan.dealId = :id AND plan.direction = :direction AND plan.status IN (:...statuses)', {
      id: deal.id, direction: 'pay', statuses: ['pending', 'paid'],
    }).orderBy('plan.id', 'ASC').setLock('pessimistic_write').getMany();
    const end = deal.terminatedOn ? [deal.leaseEnd, addDays(deal.terminatedOn, -1)].sort()[0] : deal.leaseEnd;
    for (const plan of plans) {
      const amount = leaseAmount(deal.leaseStart, end, Number(deal.amount), plan.periodStart, addDays(plan.periodEnd, 1), deal.details.freeDays, ranges);
      if (cents(amount) < cents(plan.settledAmount)) throw new BadRequestException(`第${plan.sequence}期已付金额超过免租后的应付金额，请先处理财务调整；未保存本次修改`);
      const status = cents(amount) === cents(plan.settledAmount) ? 'paid' : 'pending';
      if (cents(plan.amount) !== cents(amount) || plan.status !== status) changes.push({ id: plan.id, amount, status });
    }
  }
  for (const change of changes) await scheduleRepo.update(change.id, { amount: change.amount, status: change.status });
  if (deals.length) await dealRepo.save(deals);
}
