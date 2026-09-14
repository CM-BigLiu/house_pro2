import { matchingDeposits, settlementState } from './checkout-settlement';

const checkout: any = { storeId: 1, houseInfo: '小区 12栋 2单元 501 A室', tenantName: '租客甲', status: 'confirmed', expectedDepositAmount: 1000 };
const deposit: any = { storeId: 1, houseInfo: '小区 12-2-501 A室', tenantName: '租客甲', status: 'pending' };
describe('deposit matching and settlement readiness', () => {
  it('matches legacy address formats without losing room identifiers', () => {
    expect(matchingDeposits(checkout, [deposit])).toHaveLength(1);
    expect(matchingDeposits(checkout, [{ ...deposit, houseInfo: '小区 12-2-501 B室' }])).toHaveLength(0);
  });
  it.each([{ storeId: 2 }, { tenantName: '新租客' }, { houseInfo: '小区 1-22-501 A室' }])('does not match unrelated deposits: %j', change => {
    expect(matchingDeposits(checkout, [{ ...deposit, ...change }])).toHaveLength(0);
  });
  it('requires ALL linked deposits disposed and does not treat unknown status as disposed', () => {
    expect(settlementState(checkout, [{ status: 'refunded' }, { status: 'unknown' }]).canComplete).toBe(false);
    expect(settlementState(checkout, [{ status: 'refunded' }, { status: 'deducted' }]).canComplete).toBe(true);
  });
  it('allows explicitly zero deposit, but fails closed for legacy unknown amounts', () => {
    expect(settlementState({ ...checkout, expectedDepositAmount: 0 }, []).canComplete).toBe(true);
    expect(settlementState({ ...checkout, expectedDepositAmount: null }, []).canComplete).toBe(false);
    expect(settlementState({ ...checkout, status: 'pending' }, [{ status: 'refunded' }]).canComplete).toBe(false);
  });
});
