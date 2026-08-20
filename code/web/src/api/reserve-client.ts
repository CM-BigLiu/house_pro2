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
  createdAt: string;
}

export function getReserveClients(params?: { keyword?: string; demandType?: string; status?: string }) {
  return get<{ list: ReserveClient[]; total: number }>('/house/reserve-clients', { params });
}

export function createReserveClient(data: Partial<ReserveClient>) {
  return post<ReserveClient>('/house/reserve-clients', data);
}

export function updateReserveClient(id: number, data: Partial<ReserveClient>) {
  return put<ReserveClient>(`/house/reserve-clients/${id}`, data);
}
