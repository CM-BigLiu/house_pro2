/**
 * 房源编码自动生成
 * 规则：前缀 + 年月日 + 4 位随机数，如 R202608281234
 */
export function generateHouseCode(prefix = 'R'): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}${date}${rand}`;
}
