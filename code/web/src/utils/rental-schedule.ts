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

export function buildPaymentSchedule(startStr?: string, endStr?: string, method?: string) {
  const list: { period: number; date: string }[] = [];
  if (!startStr || !method || (!PAYMENT_MONTHS[method] && method !== 'full')) return list;
  const start = localDate(startStr);
  const end = endStr ? localDate(endStr) : null;
  if (isNaN(start.getTime()) || (end && (isNaN(end.getTime()) || end < start))) return list;
  for (let index = 0; index < (method === 'full' ? 1 : 120); index++) {
    const date = new Date(start);
    const originalDay = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + index * (PAYMENT_MONTHS[method] || 0));
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(originalDay, lastDay));
    if (end && date > end) break;
    list.push({ period: index + 1, date: formatDate(date) });
  }
  return list;
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
