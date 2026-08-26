export function maskPhone(value?: string | null): string {
  if (!value || value.length < 7) return value || '-';
  return value.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
}

export function maskIdCard(value?: string | null): string {
  if (!value || value.length < 10) return value || '-';
  return value.replace(/^(\d{6})\d+(\w{4})$/, '$1**********$2');
}

export function maskBankCard(value?: string | null): string {
  if (!value || value.length < 8) return value || '-';
  const last4 = value.slice(-4);
  return `**** **** **** ${last4}`;
}

export function maskName(value?: string | null): string {
  if (!value) return value || '-';
  if (value.length <= 1) return '*';
  if (value.length === 2) return `${value[0]}*`;
  return `${value[0]}${'*'.repeat(value.length - 2)}${value[value.length - 1]}`;
}
