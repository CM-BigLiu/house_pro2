import { describe, expect, it } from 'vitest';
import { durationDays, durationParts, leaseDuration, leaseEnd, buildLeasePeriod, buildPaymentSchedule, formatDate, getPayReminder } from '../src/utils/rental-schedule';

describe('rental payment schedule', () => {
  it.each([
    ['monthly', '2026-02-28'], ['bi_monthly', '2026-03-31'],
    ['quarterly', '2026-04-30'], ['four_month', '2026-05-31'],
    ['half_year', '2026-07-31'], ['yearly', '2027-01-31'],
    ['two_year', '2028-01-31'], ['three_year', '2029-01-31'], ['four_year', '2030-01-31'],
  ])('uses the dictionary interval for %s', (method, nextDate) => {
    expect(buildPaymentSchedule('2026-01-31', '2031-01-30', method)[1].date).toBe(nextDate);
  });

  it('treats full payment as one installment and does not invent irregular schedules', () => {
    expect(buildPaymentSchedule('2026-01-01', '2026-12-31', 'full')).toHaveLength(1);
    expect(buildPaymentSchedule('2026-01-01', '2026-12-31', 'irregular')).toEqual([]);
    expect(buildPaymentSchedule('2026-01-01', '2026-12-31', 'unknown')).toEqual([]);
  });

  it('formats local calendar dates without conversion to the previous UTC day', () => {
    expect(formatDate(new Date(2026, 8, 10, 0, 0, 0))).toBe('2026-09-10');
  });

  it.each([
    [1, '2027-09-22'],
    [3, '2029-09-22'],
    [5, '2031-09-22'],
  ])('builds a %s-year lease with calendar anniversaries', (years, end) => {
    expect(buildLeasePeriod('2026-09-23', years)).toEqual({ start: '2026-09-23', end });
  });

  it('asks to verify payment rather than claiming arrears without billing evidence', () => {
    expect(getPayReminder('2026-01-01', '2026-12-31', 'monthly', new Date(2026, 0, 15)))
      .toMatchObject({ type: 'verify', label: '核对缴费' });
    expect(getPayReminder('2026-01-01', '2026-12-31', 'monthly', new Date(2026, 0, 29)))
      .toMatchObject({ type: 'pay', label: '计划缴费', date: '2026-02-01' });
    expect(getPayReminder('2026-01-01', '2026-12-31', 'monthly', new Date(2027, 0, 1))).toBeNull();
  });
});

 it('年度免租和期限按实际日历换算，包含租期结束日', () => {
   expect(durationDays({years: 1, months: 2, days: 3}, '2026-09-28')).toBe(429);
   expect(durationParts(429, '2026-09-28')).toEqual({years: 1, months: 2, days: 3});
   expect(leaseEnd('2026-09-28', {years: 2, months: 0, days: 0})).toBe('2028-09-27');
   expect(leaseDuration('2026-09-28', '2028-09-27')).toEqual({years: 2, months: 0, days: 0});
 });
