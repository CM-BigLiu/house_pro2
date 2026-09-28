import { describe, expect, it } from 'vitest';
import { freeRentDays, freeRentError, freeRentDiscount } from '@/utils/free-rent';
describe('多段免租日期', () => {
  it('减免预览按实际日期数乘以月租除以30，跨月份和闰年一致', () => {
    expect(freeRentDiscount([{ start: '2026-10-01', end: '2026-10-10' }], '2026-10-01', '2026-12-31', 3000)).toBe(1000);
    expect(freeRentDiscount([{ start: '2028-02-01', end: '2028-02-29' }], '2028-02-01', '2028-03-31', 3000)).toBe(2900);
    expect(freeRentDiscount([{ start: '2026-10-05', end: '2026-10-15' }, { start: '2026-10-01', end: '2026-10-10' }], '2026-10-01', '2026-12-31', 3100)).toBe(1550);
  });
  it('起止日计入、交叠只算一次，跨闰年正确', () => {
    expect(freeRentDays([{ start: '2028-02-28', end: '2028-03-01' }, { start: '2028-02-29', end: '2028-03-02' }])).toBe(4);
  });
  it('允许未填日期行，拒绝半段、无效日期及超出租期', () => {
    expect(freeRentError([{ start: '', end: '' }])).toBe('');
    for (const range of [{ start: '2026-10-01', end: '' }, { start: '2026-02-30', end: '2026-10-01' }, { start: '2026-09-30', end: '2026-10-10' }]) expect(freeRentError([range], '2026-10-01', '2027-09-25')).toBeTruthy();
  });
});
