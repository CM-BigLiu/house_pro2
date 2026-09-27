import { get, post, put } from '@/utils/request';

export interface PaymentPlan {
  id: number;
  title: string;
  planType: 'income' | 'expense';
  amount: number;
  planDate: string;
  actualDate?: string;
  status: string;
  houseTitle?: string;
  billingCategory?: string;
  reason?: string;
  totalPeriods?: number;
  totalAmount?: number;
  auditStatus?: string;
  createdAt: string;
}

export interface Arrear {
  id: number;
  name: string;
  identity: string;
  phone?: string;
  amount: number;
  paidAmount: number;
  remainAmount: number;
  status: string;
  createdAt: string;
}

export interface Invoice {
  id: number;
  applySource: string;
  buyerName: string;
  buyerTaxNo?: string;
  amountWithoutTax: number;
  taxAmount: number;
  amountWithTax: number;
  invoiceType?: 'normal' | 'special';
  remark?: string;
  issuer?: string;
  status: string;
  createdAt: string;
}

export function getPaymentPlans(params?: { keyword?: string; planType?: string; status?: string; page?: number; pageSize?: number }) {
  return get<{ list: PaymentPlan[]; total: number }>('/finance/plans', { params });
}

export function createPaymentPlan(data: Partial<PaymentPlan>) {
  return post<PaymentPlan>('/finance/plans', data);
}
export function getPaymentPlanForEdit(id: number) { return get<PaymentPlan>(`/finance/plans/${id}/edit`); }
export function updatePaymentPlan(id: number, data: Partial<PaymentPlan>) { return put<PaymentPlan>(`/finance/plans/${id}`, data); }

export function getArrears(params?: { keyword?: string; status?: string; page?: number; pageSize?: number }) {
  return get<{ list: Arrear[]; total: number }>('/finance/arrears', { params });
}

export function createArrear(data: Partial<Arrear>) {
  return post<Arrear>('/finance/arrears', data);
}
export function collectArrear(id: number, amount: number) { return post<Arrear>(`/finance/arrears/${id}/collect`, { amount }); }

export function getInvoices(params?: { keyword?: string; status?: string; page?: number; pageSize?: number }) {
  return get<{ list: Invoice[]; total: number }>('/finance/invoices', { params });
}

export function createInvoice(data: Partial<Invoice>) {
  return post<Invoice>('/finance/invoices', data);
}

export function updateInvoice(id: number, data: Partial<Invoice>) {
  return put<Invoice>(`/finance/invoices/${id}`, data);
}
