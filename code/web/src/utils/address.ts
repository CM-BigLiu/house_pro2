const BUILDING_SUFFIX = /(号楼|栋|座)$/u;
const UNIT_SUFFIX = /单元$/u;

export function formatBuilding(value?: string): string {
  const normalized = value?.trim();
  if (!normalized) return '';
  return BUILDING_SUFFIX.test(normalized) ? normalized : `${normalized}栋`;
}

export function formatUnit(value?: string): string {
  const normalized = value?.trim();
  if (!normalized) return '';
  return UNIT_SUFFIX.test(normalized) ? normalized : `${normalized}单元`;
}

export function formatHouseAddress(parts: {
  community?: string;
  building?: string;
  unit?: string;
  roomNo?: string;
}): string {
  return [
    parts.community?.trim(),
    formatBuilding(parts.building),
    formatUnit(parts.unit),
    parts.roomNo?.trim(),
  ].filter(Boolean).join(' ');
}
