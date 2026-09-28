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
const days = (start: string, end: string) =>
  (Date.parse(end) - Date.parse(start)) / 86400000;

/** 整个合同月收取月租；免租后或租期截断的零散天数按月租 / 30 折算。 */
export function leaseAmount(
  start: string,
  end: string,
  rent: number,
  from: string,
  until: string,
  freeDays: number[] = [],
) {
  let total = 0;
  for (let month = 0; month < 120; month++) {
    const a = addMonths(start, month),
      b = addMonths(start, month + 1);
    if (a >= until || a > end) break;
    const left = [a, from].sort().pop()!,
      right = [b, until, addDays(end, 1)].sort()[0];
    if (left >= right) continue;
    let payableDays = days(left, right);
    freeDays.forEach((count, year) => {
      const freeStart = addMonths(start, year * 12),
        freeEnd = addDays(freeStart, count);
      const overlapStart = [left, freeStart].sort().pop()!,
        overlapEnd = [right, freeEnd].sort()[0];
      if (overlapStart < overlapEnd)
        payableDays -= days(overlapStart, overlapEnd);
    });
    const fullMonth = left === a && right === b && payableDays === days(a, b);
    total += fullMonth
      ? cents(rent)
      : (cents(rent) * Math.max(0, payableDays)) / 30;
  }
  return money(total);
}
export function buildContractSchedule(input: {
  leaseStart: string;
  leaseEnd: string;
  paymentMethod: string;
  paymentDate: string;
  amount: number;
  freeDays?: number[];
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
      ),
    });
  }
  return result;
}
