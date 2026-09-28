import { get, post } from '@/utils/request';
import type { RentalAppointmentSignInput } from './rental';

export interface Deal {
  workflowType?: string; details?: import('./business').ContractDetails;
  id: number; contractCode: string; bizType: 'rent' | 'sale' | 'management'; customerId: number | null;
  customerName: string; customerPhone?: string; propertyId: number; roomId?: number;
  propertyCode: string; propertyName: string; signedAt: string;
  amount: number | null; deposit: number | null; leaseStart?: string; leaseEnd?: string; paymentMethod?: string;
  responsibleEmployeeName: string; status: 'active' | 'termination_pending' | 'terminated';
  checkoutId?: number; terminatedOn?: string; terminationReason?: string; remark?: string;
}
export interface CustomerAppointment {
  id: number; propertyName: string; propertyCode: string; scheduledAt: string; status: string;
}
export interface PropertyOption { id: number; code: string; name: string }
export type CustomerWorkflowAction = 'appointment' | 'sign' | 'terminate';
const workflowUrl = (id: number) => `/house/customers/${id}/workflow`;
export function getCustomerWorkflowContext(id: number) {
  return get<{ appointments: CustomerAppointment[]; contracts: Deal[] }>(`${workflowUrl(id)}/context`);
}
export function getCustomerPropertyOptions(id: number, params: { keyword?: string; page?: number; pageSize?: number }) {
  return get<{ list: PropertyOption[]; total: number }>(`${workflowUrl(id)}/properties`, { params });
}
export function createCustomerAppointment(id: number, data: { propertyId: number; scheduledAt: string; remark?: string }) {
  return post(`${workflowUrl(id)}/appointments`, data);
}
export function getCustomerSigningContext(id: number, appointmentId: number) {
  return get<{ bizType: string; workflowType?: 'regular' | 'tenant'; propertyAddress?: string; rooms: { id: number; roomNo: string; status: string }[] }>(`${workflowUrl(id)}/appointments/${appointmentId}/signing-context`);
}
export function signCustomer(id: number, data: Partial<RentalAppointmentSignInput> & { appointmentId: number; amount?: number }) {
  return post(`${workflowUrl(id)}/sign`, data);
}
export function terminateCustomerContract(id: number, data: { dealId: number; terminatedOn: string; reason: string }) {
  return post<Deal>(`${workflowUrl(id)}/terminate`, data);
}
export interface DealQuery { keyword?: string; bizType?: string; status?: string; startDate?: string; endDate?: string; page?: number; pageSize?: number }
export function getDeals(params: DealQuery) {
  // 空选项表示不筛选，不将空字符串作为枚举或日期交给后端校验。
  const filtered = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value != null));
  return get<{ list: Deal[]; total: number; stats: { total: number; rentCount: number; saleCount: number; managementCount?: number; monthlyRent: number; saleAmount: number } }>('/finance/deals', { params: filtered });
}
