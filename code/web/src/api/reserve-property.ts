import { get, post, put } from '@/utils/request';

export interface ReserveProperty {
  id: number;
  title: string;
  communityName: string;
  ownerName: string;
  ownerPhone: string;
  expectedPrice: number;
  status: string;
  diskType: string;
  source: string;
  createdAt: string;
}

export interface ReserveClient {
  id: number;
  name: string;
  phone: string;
  budget: number;
  intention: string;
  status: string;
  source: string;
  employeeName: string;
  createdAt: string;
}

export function getReserveProperties(params?: { keyword?: string; status?: string }) {
  return get<{ list: ReserveProperty[]; total: number }>('/house/reserve-properties', { params });
}

export function createReserveProperty(data: Partial<ReserveProperty>) {
  return post<ReserveProperty>('/house/reserve-properties', data);
}

export function updateReserveProperty(id: number, data: Partial<ReserveProperty>) {
  return put<ReserveProperty>(`/house/reserve-properties/${id}`, data);
}

export function getReserveClients(params?: { keyword?: string; status?: string }) {
  return get<{ list: ReserveClient[]; total: number }>('/house/reserve-clients', { params });
}

export function createReserveClient(data: Partial<ReserveClient>) {
  return post<ReserveClient>('/house/reserve-clients', data);
}

export function updateReserveClient(id: number, data: Partial<ReserveClient>) {
  return put<ReserveClient>(`/house/reserve-clients/${id}`, data);
}
