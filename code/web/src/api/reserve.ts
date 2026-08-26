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

// PRD 11 章储备接口（/api/reserve/*）
export function getReserveHousePage(params?: { keyword?: string; status?: string }) {
  return get<{ list: ReserveProperty[]; total: number }>('/reserve/house/page', { params });
}

export function createReserveHouse(data: Partial<ReserveProperty>) {
  return post<ReserveProperty>('/reserve/house/add', data);
}

export function getReserveClientPage(params?: { keyword?: string; status?: string }) {
  return get<{ list: ReserveClient[]; total: number }>('/reserve/client/page', { params });
}

export function createReserveClientAlias(data: Partial<ReserveClient>) {
  return post<ReserveClient>('/reserve/client/add', data);
}
