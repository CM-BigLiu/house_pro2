import { get, post, put } from '@/utils/request';

export interface Bill {
  id: number;
  title: string;
  category: string;
  amount: number;
  paidAmount: number;
  status: string;
  tenantName?: string;
  houseTitle?: string;
  billDate: string;
  dueDate: string;
  createdAt: string;
}

export interface Flow {
  id: number;
  title: string;
  type: 'income' | 'expense';
  amount: number;
  paymentType: string;
  houseTitle?: string;
  customerName?: string;
  flowDate: string;
  createdAt: string;
}

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

export interface Payout {
  id: number;
  batchNo?: string;
  storeId?: number;
  accountName: string;
  bankCardNo?: string;
  bankName: string;
  cardType: string;
  payoutAmount: number;
  payableAmount: number;
  actualAmount: number;
  operateDate: string;
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
  remark?: string;
  issuer?: string;
  status: string;
  createdAt: string;
}

export function getBills(params?: { keyword?: string; status?: string }) {
  return get<{ list: Bill[]; total: number }>('/finance/bills', { params });
}

export function createBill(data: Partial<Bill>) {
  return post<Bill>('/finance/bills', data);
}

export function getFlows(params?: { keyword?: string; type?: string }) {
  return get<{ list: Flow[]; total: number }>('/finance/flows', { params });
}

export function createFlow(data: Partial<Flow>) {
  return post<Flow>('/finance/flows', data);
}

export function getPaymentPlans(params?: { keyword?: string; planType?: string; status?: string }) {
  return get<{ list: PaymentPlan[]; total: number }>('/finance/plans', { params });
}

export function createPaymentPlan(data: Partial<PaymentPlan>) {
  return post<PaymentPlan>('/finance/plans', data);
}

export function getArrears(params?: { keyword?: string; status?: string }) {
  return get<{ list: Arrear[]; total: number }>('/finance/arrears', { params });
}

export function createArrear(data: Partial<Arrear>) {
  return post<Arrear>('/finance/arrears', data);
}

export function getPayouts(params?: { keyword?: string; status?: string }) {
  return get<{ list: Payout[]; total: number }>('/finance/payouts', { params });
}

export function createPayout(data: Partial<Payout>) {
  return post<Payout>('/finance/payouts', data);
}

export function getInvoices(params?: { keyword?: string; status?: string }) {
  return get<{ list: Invoice[]; total: number }>('/finance/invoices', { params });
}

export function createInvoice(data: Partial<Invoice>) {
  return post<Invoice>('/finance/invoices', data);
}

export function updateInvoice(id: number, data: Partial<Invoice>) {
  return put<Invoice>(`/finance/invoices/${id}`, data);
}
