export interface LayoutCounts {
  rooms: number;
  halls: number;
  bathrooms: number;
  balconies: number;
}

export const COMMON_LAYOUT_OPTIONS = [
  '1室0厅1卫',
  '1室1厅1卫',
  '2室1厅1卫',
  '2室2厅1卫',
  '3室1厅1卫',
  '3室2厅1卫',
  '3室2厅2卫',
  '4室2厅2卫',
  '4室2厅3卫',
  '5室2厅2卫',
];

const chineseDigits: Record<string, number> = {
  零: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

function parseCount(value: string | undefined, fallback = 0): number {
  if (!value) return fallback;
  if (/^\d+$/.test(value)) return Number(value);
  if (value in chineseDigits) return chineseDigits[value];
  if (value.startsWith('十')) return 10 + (chineseDigits[value.slice(1)] || 0);
  if (value.endsWith('十')) return (chineseDigits[value.slice(0, -1)] || 0) * 10;
  const [tens, ones] = value.split('十');
  return (chineseDigits[tens] || 0) * 10 + (chineseDigits[ones] || 0);
}

export function formatLayoutLabel(layout: LayoutCounts): string {
  const balcony = layout.balconies > 0 ? `${layout.balconies}阳台` : '';
  return `${layout.rooms}室${layout.halls}厅${layout.bathrooms}卫${balcony}`;
}

export function parseLayoutLabel(value: string): LayoutCounts | null {
  const normalized = value.trim().replace(/\s+/g, '');
  const match = normalized.match(/^([\d零一二两三四五六七八九十]+)室([\d零一二两三四五六七八九十]+)厅(?:([\d零一二两三四五六七八九十]+)卫)?(?:([\d零一二两三四五六七八九十]+)(?:个)?阳台)?$/);
  if (!match) return null;
  const layout = {
    rooms: parseCount(match[1]),
    halls: parseCount(match[2]),
    bathrooms: parseCount(match[3], 1),
    balconies: parseCount(match[4]),
  };
  return Object.values(layout).every(count => Number.isInteger(count) && count >= 0) ? layout : null;
}
