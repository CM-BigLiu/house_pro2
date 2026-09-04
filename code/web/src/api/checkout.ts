import { get, post } from '@/utils/request';

/** 退租记录 */
export interface Checkout {
  id: number;
  contractCode: string;
  tenantName?: string;
  houseInfo?: string;
  checkoutDate?: string;
  status: 'pending' | 'confirmed' | 'completed';
  settlementAmount?: number;
  reason?: string;
  remark?: string;
  createdAt?: string;
}

export interface CheckoutQuery {
  keyword?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateCheckoutParams {
  houseInfo: string;
  tenantName: string;
  checkoutDate?: string;
  reason?: string;
  settlementAmount?: number;
}

export function getCheckouts(params?: CheckoutQuery) {
  return get<{ list: Checkout[]; total: number }>('/house/checkouts', { params });
}

export function createCheckout(data: CreateCheckoutParams) {
  return post<Checkout>('/house/checkouts', data);
}

export function confirmCheckout(id: number) {
  return post<Checkout>(`/house/checkouts/${id}/confirm`);
}

export function completeCheckout(id: number) {
  return post<Checkout>(`/house/checkouts/${id}/complete`);
}
