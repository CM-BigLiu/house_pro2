export const SALE_TAX_OPTIONS = [
  { value: 'vat', label: '增值税' },
  { value: 'vat_surcharge', label: '增值税附加' },
  { value: 'personal', label: '个税' },
  { value: 'deed', label: '契税' },
  { value: 'land_transfer', label: '土地出让金' },
  { value: 'land_price', label: '综合地价款' },
  { value: 'other', label: '其他' },
] as const;

export type SaleTaxType = typeof SALE_TAX_OPTIONS[number]['value'];
export interface SaleTaxFee {
  type: SaleTaxType;
  amount?: number | null;
}

export function saleTaxLabel(type: string) {
  return SALE_TAX_OPTIONS.find(option => option.value === type)?.label || type;
}

export function readSaleTaxFees(data: { taxFees?: SaleTaxFee[] | null; taxType?: string }): SaleTaxFee[] {
  if (Array.isArray(data.taxFees)) return data.taxFees.map(fee => ({ ...fee }));
  const legacy = SALE_TAX_OPTIONS.find(option => option.value === data.taxType);
  return legacy ? [{ type: legacy.value, amount: null }] : [];
}
