import { BadRequestException } from '@nestjs/common';

export const CASH_ACCOUNTS = {
  bank_ccb: '建设银行',
  bank_rural: '农商银行',
  wechat: '微信',
  cash: '现金',
  corporate: '公户',
};
export const PAYMENT_MONTHS = {
  monthly: 1,
  bi_monthly: 2,
  quarterly: 3,
  four_month: 4,
  half_year: 6,
  semi_annual: 6,
  yearly: 12,
  annual: 12,
  two_year: 24,
  three_year: 36,
  four_year: 48,
  full: 120,
};
export const cents = (value: number | string) =>
  Math.round(Number(value) * 100);
export const money = (value: number) => Math.round(value) / 100;
export function validMoney(
  value: unknown,
  label: string,
  signed = false,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    (!signed && value < 0) ||
    Math.abs(value) > 999999999999.99 ||
    !/^-?\d+(\.\d{1,2})?$/.test(String(value))
  )
    throw new BadRequestException(`${label}须为有效金额，最多两位小数`);
  return value;
}
export function validDate(value: string) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function addMonths(value: string, count: number) {
  return addCalendarMonths(value, count);
}
/** 从原始锚点增加真实日历月份，月底超出目标月份时取该月最后一天。 */
export function addCalendarMonths(value: string, count: number) {
  const date = new Date(`${value}T00:00:00Z`),
    day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + count);
  const last = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date.toISOString().slice(0, 10);
}
export function addDays(value: string, count: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
export const days = (start: string, end: string) =>
  (Date.parse(end) - Date.parse(start)) / 86400000;

export interface FreeRentRange { start: string; end: string }
/** 起止日均计入免租；交叠及相邻区间合并，避免重复扣租。 */
export function normalizeFreeRentRanges(value: unknown, leaseStart?: string, leaseEnd?: string, maxRanges = 100): FreeRentRange[] {
  if (!Array.isArray(value) || value.length > maxRanges)
    throw new BadRequestException('免租日期区间须为数组，最多100段');
  if (value.length && leaseStart !== undefined && (!validDate(leaseStart) || !validDate(leaseEnd)))
    throw new BadRequestException('添加免租日期前请填写完整承租期');
  const sorted = value.map(range => {
    if (!range || !validDate(range.start) || !validDate(range.end) || range.start > range.end)
      throw new BadRequestException('请选择完整有效的免租日期区间');
    if (leaseStart && (range.start < leaseStart || range.end > leaseEnd))
      throw new BadRequestException('免租日期须在承租期内');
    return { start: range.start as string, end: range.end as string };
  }).sort((a, b) => a.start.localeCompare(b.start));
  const merged: FreeRentRange[] = [];
  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= addDays(previous.end, 1)) previous.end = [previous.end, range.end].sort().pop()!;
    else merged.push({ ...range });
  }
  return merged;
}

/** 年度免租与所选区间取并集，日期继续使用真实日历。 */
export function contractFreeRentRanges(start: string, end: string, freeDays: number[] = [], freeRentRanges: FreeRentRange[] = []) {
  const annual = freeDays.flatMap((count, year) => count > 0 ? [{ start: addMonths(start, year * 12), end: addDays(addMonths(start, year * 12), count - 1) }] : []);
  return normalizeFreeRentRanges([...annual, ...normalizeFreeRentRanges(freeRentRanges)], undefined, undefined, 105)
    .map(range => ({ start: [start, range.start].sort().pop()!, end: [end, range.end].sort()[0] })).filter(range => range.start <= range.end);
}
export function leaseBreakdown(
  start: string,
  end: string,
  rent: number,
  from: string,
  until: string,
  freeDays: number[] = [],
  freeRentRanges: FreeRentRange[] = [],
) {
  const ranges = contractFreeRentRanges(start, end, freeDays, freeRentRanges);
  let gross = 0, freeDaysInPeriod = 0;
  for (let month = 0; month < 120; month++) {
    const a = addMonths(start, month), b = addMonths(start, month + 1);
    if (a >= until || a > end) break;
    const left = [a, from].sort().pop()!, right = [b, until, addDays(end, 1)].sort()[0];
    if (left >= right) continue;
    const exempt = ranges.reduce((sum, range) => {
      const x = [left, range.start].sort().pop()!, y = [right, addDays(range.end, 1)].sort()[0];
      return sum + (x < y ? days(x, y) : 0);
    }, 0);
    gross += cents(rent) * days(left, right) / days(a, b);
    freeDaysInPeriod += exempt;
  }
  // 整期基础租金按合同月计，零散租期按实际日历；免租扣款统一使用月租÷30。
  const deduction = Math.min(gross, cents(rent) * freeDaysInPeriod / 30);
  return { grossRent: money(gross), freeRentDays: freeDaysInPeriod, freeRentAmount: money(deduction), amount: money(gross - deduction) };
}
export function leaseAmount(start: string, end: string, rent: number, from: string, until: string, freeDays: number[] = [], freeRentRanges: FreeRentRange[] = []) {
  return leaseBreakdown(start, end, rent, from, until, freeDays, freeRentRanges).amount;
}
export function buildContractSchedule(input: {
  leaseStart: string;
  leaseEnd: string;
  paymentMethod: string;
  paymentDate: string;
  amount: number;
  freeDays?: number[];
  freeRentRanges?: FreeRentRange[];
}) {
  if (
    !validDate(input.leaseStart) ||
    !validDate(input.leaseEnd) ||
    input.leaseStart > input.leaseEnd ||
    !validDate(input.paymentDate)
  )
    throw new BadRequestException('租期或首期付款日期无效');
  if (input.leaseEnd >= addMonths(input.leaseStart, 120))
    throw new BadRequestException('租赁期限最多十年');
  validMoney(input.amount, '合同月租');
  normalizeFreeRentRanges(input.freeRentRanges || [], input.leaseStart, input.leaseEnd);
  if (input.freeDays && (input.freeDays.length !== 5 || input.freeDays.some((count, year) => !Number.isInteger(count) || count < 0 || count > days(addMonths(input.leaseStart, year * 12), addMonths(input.leaseStart, (year + 1) * 12)))))
    throw new BadRequestException('年度免租天数不能超过对应合同年的实际天数，共五个年度');
  const interval = Object.prototype.hasOwnProperty.call(
    PAYMENT_MONTHS,
    input.paymentMethod,
  )
    ? PAYMENT_MONTHS[input.paymentMethod]
    : 0;
  if (!interval) throw new BadRequestException('请选择支持的租金付款周期');
  const result: {
    sequence: number;
    dueDate: string;
    periodStart: string;
    periodEnd: string;
    amount: number;
  }[] = [];
  for (let index = 0; index < 120; index++) {
    const start = addMonths(input.leaseStart, index * interval);
    if (start > input.leaseEnd) break;
    const until = [
      addMonths(input.leaseStart, (index + 1) * interval),
      addDays(input.leaseEnd, 1),
    ].sort()[0];
    result.push({
      sequence: index + 1,
      dueDate: addMonths(input.paymentDate, index * interval),
      periodStart: start,
      periodEnd: addDays(until, -1),
      amount: leaseAmount(
        input.leaseStart,
        input.leaseEnd,
        input.amount,
        start,
        until,
        input.freeDays,
        input.freeRentRanges,
      ),
    });
  }
  return result;
}
