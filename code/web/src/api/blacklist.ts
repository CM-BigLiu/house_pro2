import { get, post, put, del } from '@/utils/request';

export interface Blacklist {
  id: number;
  name: string;
  mobile?: string;
  idCard?: string;
  type: string;
  reason: string;
  source?: string;
  status: string;
  storeId?: number;
  createdAt: string;
}

export function getBlacklist(params?: { keyword?: string; type?: string; status?: string }) {
  return get<{ list: Blacklist[]; total: number }>('/house/blacklist', { params });
}

export function checkBlacklist(mobile?: string, idCard?: string, name?: string) {
  return get<Blacklist[]>('/house/blacklist/check', { params: { mobile, idCard, name } });
}

export function createBlacklist(data: Partial<Blacklist>) {
  return post<Blacklist>('/house/blacklist', data);
}

export function updateBlacklist(id: number, data: Partial<Blacklist>) {
  return put<Blacklist>(`/house/blacklist/${id}`, data);
}

export function deleteBlacklist(id: number) {
  return del(`/house/blacklist/${id}`);
}
