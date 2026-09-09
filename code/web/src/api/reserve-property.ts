import { get, post, put } from '@/utils/request';

export interface ReserveProperty {
  id: number;
  title: string;
  communityName: string;
  communityId?: number;
  storeId: number;
  groupId?: number;
  address: string;
  roomNo: string;
  layout: string;
  buildingArea?: number;
  decoration?: string;
  ownerName: string;
  ownerPhone: string;
  expectedPrice: number;
  ownerQuote: number;
  status: string;
  diskType: string;
  source: string;
  sourceChannel: string;
  keyStatus?: string;
  salesmanId?: number;
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

export function getReserveProperties(params?: { keyword?: string; status?: string; page?: number; pageSize?: number }) {
  return get<{ list: ReserveProperty[]; total: number }>('/house/reserve-properties', { params });
}

export function createReserveProperty(data: Partial<ReserveProperty>) {
  return post<ReserveProperty>('/house/reserve-properties', data);
}

export function updateReserveProperty(id: number, data: Partial<ReserveProperty>) {
  return put<ReserveProperty>(`/house/reserve-properties/${id}`, data);
}

export function getReservePropertyForEdit(id: number) {
  return get<ReserveProperty>(`/house/reserve-properties/${id}/edit`);
}

export function transferReserveProperty(id: number, salesmanId: number) {
  return post<ReserveProperty>(`/house/reserve-properties/${id}/transfer`, { salesmanId });
}

export function signReserveProperty(id: number, data: {
  contractCode?: string;
  bizType: 'entire' | 'shared';
  leaseStart: string;
  leaseEnd: string;
  landlordRent: number;
  deposit?: number;
}) {
  return post<{ reserveId: number; rentalSetId: number; contractCode: string; status: string }>(`/house/reserve-properties/${id}/sign-contract`, data);
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
