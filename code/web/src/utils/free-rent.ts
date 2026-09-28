import { calendarMonths } from './rental-schedule';
export interface FreeRentRange { start: string; end: string }
const validDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date || '') && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
export function freeRentError(ranges: FreeRentRange[], start?: string, end?: string) {
  const filled = ranges.filter(range => range.start || range.end);
  if (filled.length > 100) return '免租日期最多100段';
  if (filled.length && (!validDate(start || '') || !validDate(end || ''))) return '添加免租日期前请填写完整承租期';
  for (const range of filled) {
    if (!validDate(range.start) || !validDate(range.end) || range.start > range.end) return '请选择完整有效的免租日期区间';
    if (range.start < start! || range.end > end!) return '免租日期须在承租期内';
  }
  return '';
}
export function freeRentDays(ranges: FreeRentRange[]) {
  const sorted = ranges.filter(range => validDate(range.start) && validDate(range.end) && range.start <= range.end)
    .map(range => ({ start: Date.parse(range.start), end: Date.parse(range.end) + 86400000 })).sort((a, b) => a.start - b.start);
  let total = 0, previousEnd = 0;
  for (const range of sorted) { total += Math.max(0, range.end - Math.max(range.start, previousEnd)); previousEnd = Math.max(previousEnd, range.end); }
  return total / 86400000;
}
export function freeRentDiscount(ranges: FreeRentRange[], start: string, end: string, rent: number) {
  if (freeRentError(ranges, start, end) || !validDate(start) || !validDate(end) || !Number.isFinite(rent)) return 0;
  const intervals = ranges.filter(range => validDate(range.start) && validDate(range.end)).map(range => ({ start: Date.parse(range.start), end: Date.parse(range.end) + 86400000 })).sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const range of intervals) { const last = merged[merged.length - 1]; if (last && range.start <= last.end) last.end = Math.max(last.end, range.end); else merged.push({ ...range }); }
  let total = 0;
  for (let month = 0; month < 120; month++) {
    const a = Date.parse(calendarMonths(start, month)), b = Date.parse(calendarMonths(start, month + 1));
    if (a > Date.parse(end)) break;
    const exempt = merged.reduce((sum, range) => sum + Math.max(0, Math.min(b, range.end) - Math.max(a, range.start)), 0);
    total += Math.round(rent * 100) * exempt / (30 * 86400000);
  }
  return Math.round(total) / 100;
}
