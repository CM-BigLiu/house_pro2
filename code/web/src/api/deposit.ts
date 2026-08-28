import { get, post } from '@/utils/request';

/** 押金记录 */
export interface Deposit {
  id: number;
  contractCode: string;
  tenantName?: string;
  houseInfo?: string;
  depositAmount: number;
  status: 'pending' | 'refunded' | 'deducted';
  refundDate?: string;
  deductReason?: string;
  createdAt?: string;
}

export interface DepositQuery {
  keyword?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export function getDeposits(params?: DepositQuery) {
  return get<{ list: Deposit[]; total: number }>('/house/deposits', { params });
}

export function refundDeposit(id: number) {
  return post<Deposit>(`/house/deposits/${id}/refund`);
}

export function deductDeposit(id: number, data?: { amount?: number; reason?: string }) {
  return post<Deposit>(`/house/deposits/${id}/deduct`, data);
}
