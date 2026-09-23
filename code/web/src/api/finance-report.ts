import { get, post, put } from '@/utils/request';

export interface RentIncrease {
  id: number;
  roomCode?: string;
  year: number;
  month: number;
  lastRent: number;
  currentRent: number;
  increaseAmount: number;
  increaseRate: number;
  status: string;
}

export interface IncomeCost {
  id: number;
  period: string;
  rentIncome: number;
  depositIncome: number;
  energyIncome: number;
  otherIncome: number;
  rentCost: number;
  energyCost: number;
  decorateCost: number;
  laborCost: number;
  otherCost: number;
  totalIncome: number;
  totalCost: number;
}

export interface Performance {
  id: number;
  employeeName: string;
  period: string;
  newHouseCount: number;
  newCustomerCount: number;
  showingCount: number;
  dealCount: number;
  totalPerformance: number;
  distributed: number;
  retained: number;
  transferred: number;
  commission: number;
}

export interface Accounting {
  id: number;
  period: string;
  revenue: number;
  receivable: number;
  payable: number;
  actualIncome: number;
  actualExpense: number;
  diff: number;
  remark?: string;
  description?: string;
}

export function getRentIncreases(params?: { year?: number; month?: number; keyword?: string }) {
  return get<{ list: RentIncrease[]; total: number }>('/finance/rent-increases', { params });
}

export function createRentIncrease(data: Partial<RentIncrease>) {
  return post<RentIncrease>('/finance/rent-increases', data);
}

export function getIncomeCosts(params?: { period?: string; [key: string]: unknown }) {
  return get<{ list: IncomeCost[]; total: number }>('/finance/income-costs', { params });
}

export function createIncomeCost(data: Partial<IncomeCost>) {
  return post<IncomeCost>('/finance/income-costs', data);
}
export function updateIncomeCost(id: number, data: Partial<IncomeCost>) {
  return put<IncomeCost>(`/finance/income-costs/${id}`, data);
}

export function getPerformances(params?: { period?: string; keyword?: string }) {
  return get<{ list: Performance[]; total: number }>('/finance/performances', { params });
}

export function createPerformance(data: Partial<Performance>) {
  return post<Performance>('/finance/performances', data);
}

export function getAccountings(params?: { period?: string; [key: string]: unknown }) {
  return get<{ list: Accounting[]; total: number }>('/finance/accountings', { params });
}

export function createAccounting(data: Partial<Accounting>) {
  return post<Accounting>('/finance/accountings', data);
}
