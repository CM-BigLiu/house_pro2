import { In, MigrationInterface, QueryRunner } from 'typeorm';
import { ContractSchedule } from '../../modules/finance/entities/business-workflow.entity';
import { Deal } from '../../modules/house/entities/deal.entity';
import {
  buildContractSchedule,
  cents,
  validDate,
} from '../../modules/finance/services/business-calculation';

/**
 * 免租规则统一为「整月免租按30天折算、不足整月按实际天数」后，
 * fin_contract_schedule 里存量账单的快照金额与当前规则不一致，需要按新规则回写。
 *
 * 回写口径：仅处理仍处于 status='pending' 的租金期次行（覆盖完全未结清与部分已结清，
 * 即 settledAmount < amount 的情形）。已结清（已收/已付）的历史行 status='paid'，
 * 保留历史账，不做改动。金额为 0 的免租月行在生成时即为 'paid'，同样不改。
 *
 * 重算方式：按 deal 重跑 buildContractSchedule，用 periodStart 匹配对应期次取值。
 * 方向口径与 createSchedules 一致：pay 方向带上 deal.details.freeDays/freeRentRanges，
 * receive 方向不带（租客收款侧不受免租影响）。deal.details 为加密存储，
 * 通过 TypeORM repository 读实体以走既有 EncryptedTransformer 解密，避免解析密文。
 *
 * 数据修正不可逆：旧规则快照无法还原，故 down 不做回滚。
 */
export class ResyncPendingScheduleAmounts1792306915720
  implements MigrationInterface
{
  async up(q: QueryRunner) {
    const manager = q.manager;
    const scheduleRepo = manager.getRepository(ContractSchedule);
    const pending = await scheduleRepo.find({ where: { status: 'pending' } });
    if (!pending.length) return;
    const dealIds = [...new Set(pending.map((row) => row.dealId))];
    const deals = await manager
      .getRepository(Deal)
      .find({ where: { id: In(dealIds) } });
    const byId = new Map(deals.map((deal) => [deal.id, deal]));
    for (const row of pending) {
      const deal = byId.get(row.dealId);
      if (!deal) continue;
      const paymentDate = deal.details?.paymentDate || deal.leaseStart;
      if (
        !validDate(deal.leaseStart) ||
        !validDate(deal.leaseEnd) ||
        !validDate(paymentDate)
      )
        continue;
      let plan: ReturnType<typeof buildContractSchedule>;
      try {
        plan = buildContractSchedule({
          leaseStart: deal.leaseStart,
          leaseEnd: deal.leaseEnd,
          amount: Number(deal.amount),
          paymentMethod: deal.paymentMethod,
          paymentDate,
          freeDays: row.direction === 'pay' ? deal.details?.freeDays : undefined,
          freeRentRanges:
            row.direction === 'pay' ? deal.details?.freeRentRanges : undefined,
        });
      } catch {
        // 合同参数不完整或付款周期无效时跳过该合同，不阻断整批迁移。
        continue;
      }
      const target = plan.find((entry) => entry.periodStart === row.periodStart);
      if (!target) continue;
      if (cents(target.amount) !== cents(row.amount))
        await scheduleRepo.update(row.id, { amount: target.amount });
    }
  }
  async down() {
    // 数据修正不可逆：旧规则快照无法复原，不提供回滚。
  }
}
