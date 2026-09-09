import { get, post, put } from '@/utils/request';

export interface ReserveClient {
  id: number;
  clientName: string;
  clientMobile: string;
  desiredLocation: string;
  demandType: string;
  desiredLayout: string;
  areaMin: number;
  areaMax: number;
  priceMin: number;
  priceMax: number;
  sourceChannel: string;
  usage: string;
  urgency: string;
  ownership: string;
  status: string;
  dataSource: string;
  salesmanName: string;
  salesmanId?: number;
  followerId?: number;
  followDate?: string;
  storeId: number;
  createdAt: string;
}

export function getReserveClients(params?: { keyword?: string; demandType?: string; status?: string; page?: number; pageSize?: number }) {
  return get<{ list: ReserveClient[]; total: number }>('/house/reserve-clients', { params });
}

export function createReserveClient(data: Partial<ReserveClient>) {
  return post<ReserveClient>('/house/reserve-clients', data);
}

export function updateReserveClient(id: number, data: Partial<ReserveClient>) {
  return put<ReserveClient>(`/house/reserve-clients/${id}`, data);
}

export function getReserveClientForEdit(id: number) {
  return get<ReserveClient>(`/house/reserve-clients/${id}/edit`);
}

export function addReserveClientFollowUp(id: number, data: { followType: string; content: string; status?: string }) {
  return post(`/house/reserve-clients/${id}/follow-ups`, data);
}

export function convertReserveClient(id: number, data: { contractCode: string; contractEndDate?: string }) {
  return post<{ reserveClientId: number; customerId: number; contractCode: string; status: string }>(`/house/reserve-clients/${id}/convert`, data);
}
