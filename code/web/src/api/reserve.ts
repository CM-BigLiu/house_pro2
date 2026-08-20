import { get, post } from '@/utils/request';

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
  return get<ReserveProperty[]>('/house/reserves/properties', { params });
}

export function createReserveProperty(data: Partial<ReserveProperty>) {
  return post<ReserveProperty>('/house/reserves/properties', data);
}

export function getReserveClients(params?: { keyword?: string; status?: string }) {
  return get<ReserveClient[]>('/house/reserves/clients', { params });
}

export function createReserveClient(data: Partial<ReserveClient>) {
  return post<ReserveClient>('/house/reserves/clients', data);
}
