import { describe, expect, it } from 'vitest';
import { hasRentalOccupancy } from '@/utils/rental-status';

describe('合租房源空置与已出租统计', () => {
  it('部分房间空置、部分已出租时同时属于两个筛选', () => {
    const set = { bizType: 'shared', status: 'rented', rooms: [{ status: 'vacant' }, { status: 'rented' }] };
    expect(hasRentalOccupancy(set, 'vacant')).toBe(true);
    expect(hasRentalOccupancy(set, 'rented')).toBe(true);
  });

  it('没有对应房间时不按合租整套状态计数', () => {
    const set = { bizType: 'shared', status: 'rented', rooms: [{ status: 'vacant' }] };
    expect(hasRentalOccupancy(set, 'vacant')).toBe(true);
    expect(hasRentalOccupancy(set, 'rented')).toBe(false);
  });

  it('整租仍按整套状态筛选', () => {
    expect(hasRentalOccupancy({ bizType: 'entire', status: 'active' }, 'vacant')).toBe(true);
    expect(hasRentalOccupancy({ bizType: 'entire', status: 'rented' }, 'rented')).toBe(true);
    expect(hasRentalOccupancy({ bizType: 'entire', status: 'rented' }, 'vacant')).toBe(false);
  });
});
