import { get, post, put } from '@/utils/request';

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  idCard?: string;
  customerType: string;
  status: string;
  sourceChannel?: string;
  relatedPropertyCode?: string;
  contractEndDate?: string;
  desiredDistrict?: string;
  budgetMin?: number;
  budgetMax?: number;
  salesmanId?: number;
  employeeName?: string;
  remark?: string;
  createdAt: string;
}

export function getCustomers(params?: { keyword?: string; customerType?: string; status?: string; desiredDistrict?: string; budgetMin?: string | number; budgetMax?: string | number; page?: number; pageSize?: number }) {
  return get<{ list: Customer[]; total: number }>('/house/customers', { params });
}

export function createCustomer(data: Partial<Customer>) {
  return post<Customer>('/house/customers', data);
}

export function getCustomerForEdit(id: number) {
  return get<Customer>(`/house/customers/${id}/edit`);
}

export function updateCustomer(id: number, data: Partial<Customer>) {
  return put<Customer>(`/house/customers/${id}`, data);
}
