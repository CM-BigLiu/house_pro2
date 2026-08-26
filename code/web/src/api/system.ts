import { get, post, put, del } from '@/utils/request';

export interface Dict {
  id: number;
  code: string;
  name: string;
  description?: string;
  enabled: boolean;
}

export interface DictItem {
  id: number;
  dictCode: string;
  value: string;
  label: string;
  sort: number;
  enabled: boolean;
  isBuiltin: boolean;
}

export function getDicts(params?: { keyword?: string }) {
  return get<Dict[]>('/system/dicts', { params });
}

export function getDictItems(code: string) {
  return get<DictItem[]>(`/system/dicts/${code}/items`);
}

export function createDict(data: Partial<Dict>) {
  return post<Dict>('/system/dicts', data);
}

export function updateDict(id: number, data: Partial<Dict>) {
  return put<Dict>(`/system/dicts/${id}`, data);
}

export function deleteDict(id: number) {
  return del(`/system/dicts/${id}`);
}

export function createDictItem(data: Partial<DictItem>) {
  return post<DictItem>('/system/dicts/items', data);
}

export function updateDictItem(id: number, data: Partial<DictItem>) {
  return put<DictItem>(`/system/dicts/items/${id}`, data);
}

export function deleteDictItem(id: number) {
  return del(`/system/dicts/items/${id}`);
}
