// PostgreSQL decimal 可能以字符串返回；用分累计，避免字符串拼接和小数累加误差。
export function sumAmounts(values: Array<number | string | null | undefined>): number {
  return values.reduce<number>((sum, value) => sum + Math.round(Number(value ?? 0) * 100), 0) / 100;
}
