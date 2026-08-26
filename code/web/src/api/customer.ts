import { get, post } from '@/utils/request';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  identity: string;
  status: string;
  source: string;
  storeName: string;
  employeeName: string;
  remark?: string;
  createdAt: string;
}

export function getCustomers(params?: { keyword?: string; identity?: string }) {
  return get<{ list: Customer[]; total: number }>('/house/customers', { params });
}

export function createCustomer(data: Partial<Customer>) {
  return post<Customer>('/house/customers', data);
}
