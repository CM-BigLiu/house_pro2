import { describe, expect, it } from 'vitest';
import { sumAmounts } from '../src/utils/money-summary';

describe('deposit monetary summary', () => {
  it('sums decimal strings as money rather than concatenating them', () => {
    expect(sumAmounts(['1500.00', '2600.00', '2200.00', '3200.00'])).toBe(9500);
  });
  it('handles fractions and empty amounts', () => {
    expect(sumAmounts(['0.10', 0.2, null, undefined])).toBe(0.3);
    expect(sumAmounts([])).toBe(0);
  });
  it('does not silently replace corrupt monetary data with zero', () => {
    expect(sumAmounts(['bad'])).toBeNaN();
  });
});
