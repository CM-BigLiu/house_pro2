const PAYMENT_MONTHS: Record<string, number> = {
  monthly: 1, bi_monthly: 2, quarterly: 3, four_month: 4,
  half_year: 6, semi_annual: 6, yearly: 12, annual: 12,
  two_year: 24, three_year: 36, four_year: 48,
};

export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function localDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function calendarMonths(value: string, count: number): string {
  const date = localDate(value), day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + count);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, last));
  return formatDate(date);
}
const dateDays = (from: string, until: string) => Math.round((Date.parse(until) - Date.parse(from)) / 86400000);

export function buildLeasePeriod(startStr: string | undefined, years: number, today = new Date()) {
  const start = startStr ? localDate(startStr) : new Date(today);
  if (!Number.isInteger(years) || years <= 0 || Number.isNaN(start.getTime())) return null;
  start.setHours(0, 0, 0, 0);
  const end = localDate(calendarMonths(formatDate(start), years * 12));
  end.setDate(end.getDate() - 1);
  return { start: formatDate(start), end: formatDate(end) };
}

export function buildPaymentSchedule(startStr?: string, endStr?: string, method?: string) {
  const list: { period: number; date: string }[] = [];
  if (!startStr || !method || (!PAYMENT_MONTHS[method] && method !== 'full')) return list;
  const start = localDate(startStr);
  const end = endStr ? localDate(endStr) : null;
  if (isNaN(start.getTime()) || (end && (isNaN(end.getTime()) || end < start))) return list;
  for (let index = 0; index < (method === 'full' ? 1 : 120); index++) {
    const date = localDate(calendarMonths(startStr, index * (PAYMENT_MONTHS[method] || 0)));
    if (end && date > end) break;
    list.push({ period: index + 1, date: formatDate(date) });
  }
  return list;
}

export interface DurationParts { years: number; months: number; days: number }
export function durationDays(parts: DurationParts, start: string): number {
  if (!start) return parts.days;
  return dateDays(start, calendarMonths(start, parts.years * 12 + parts.months)) + parts.days;
}
export function durationParts(days: number, start: string): DurationParts {
  if (!start || !Number.isFinite(days) || days <= 0) return { years: 0, months: 0, days: Math.max(0, days || 0) };
  let months = 0;
  while (months < 120 && dateDays(start, calendarMonths(start, months + 1)) <= days) months++;
  return { years: Math.floor(months / 12), months: months % 12, days: days - dateDays(start, calendarMonths(start, months)) };
}
export function leaseDuration(start: string, end: string): DurationParts {
  const days = dateDays(start, end) + 1;
  return durationParts(Number.isFinite(days) && days > 0 ? days : 0, start);
}
export function leaseEnd(start: string, parts: DurationParts): string {
  const date = localDate(start), days = durationDays(parts, start);
  if (!Number.isFinite(date.getTime()) || !Number.isInteger(days) || days <= 0) return '';
  date.setDate(date.getDate() + days - 1);
  return formatDate(date);
}

export interface PayReminder {
  type: 'pay' | 'verify';
  date: string;
  label: string;
}

/** 这里只知道计划日期，不知道账单实收状态，不能推断“欠费”。 */
export function getPayReminder(startStr?: string, endStr?: string, method?: string, now = new Date()): PayReminder | null {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (endStr && localDate(endStr) < today) return null;
  const schedule = buildPaymentSchedule(startStr, endStr, method);
  const next = schedule.find(item => localDate(item.date) >= today);
  if (next) {
    const days = Math.round((localDate(next.date).getTime() - today.getTime()) / 86400000);
    if (days <= 5) return { type: 'pay', date: next.date, label: '计划缴费' };
  }
  const previous = schedule.filter(item => localDate(item.date) < today).pop();
  return previous ? { type: 'verify', date: previous.date, label: '核对缴费' } : null;
}
