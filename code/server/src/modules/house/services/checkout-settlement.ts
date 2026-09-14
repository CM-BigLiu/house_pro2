import { Checkout } from '../entities/checkout.entity';
import { Deposit } from '../entities/deposit.entity';

export function normalizeHouseInfo(value: string) {
  return (value || '').trim().replace(/(号楼|栋|座|单元|室)/gu, ' ').replace(/[\s-]+/g, '-').replace(/-$/, '');
}

// 老数据没有租约外键，必须同时匹配房源（含房间）、租客和门店，不能只按房源结算。
export function matchingDeposits(checkout: Partial<Checkout>, deposits: Partial<Deposit>[]) {
  return deposits.filter(d => d.storeId === checkout.storeId
    && !!checkout.houseInfo && !!checkout.tenantName
    && normalizeHouseInfo(d.houseInfo) === normalizeHouseInfo(checkout.houseInfo) && d.tenantName === checkout.tenantName);
}

export function settlementState(checkout: Partial<Checkout>, deposits: Partial<Deposit>[]) {
  const pendingDepositCount = deposits.filter(d => !['refunded', 'deducted'].includes(d.status)).length;
  const missing = !deposits.length && (checkout.expectedDepositAmount == null || Number(checkout.expectedDepositAmount) > 0);
  const settlementBlockReason = pendingDepositCount ? `还有 ${pendingDepositCount} 笔押金未处置，请先退还或扣留`
    : missing ? '未找到对应押金记录，请先核对押金登记与房源、租客信息'
    : checkout.status !== 'confirmed' ? '仅审批通过后可完成清算' : '';
  return { pendingDepositCount, depositCount: deposits.length,
    canComplete: !settlementBlockReason, settlementBlockReason };
}
