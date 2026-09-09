import { del, get, post, put } from '@/utils/request';

export interface Community {
  id: number;
  name: string;
  cityName: string;
  district?: string;
  area?: string;
  address?: string;
  alias?: string;
  cityId?: number;
  districtId?: number;
  businessCircle?: string;
  longitude?: number;
  latitude?: number;
  buildingCount?: number;
  unitCount?: number;
  roomCount?: number;
  currentSaleCount?: number;
  currentRentCount?: number;
  createdAt: string;
}

export interface Building {
  id: number;
  name: string;
  units: { id: number; name: string }[];
}

export function getCommunities(params?: { keyword?: string; cityId?: number; businessCircle?: string; page?: number; pageSize?: number }) {
  return get<{ list: Community[]; total: number }>('/community', { params });
}

export interface CommunityCityFilter {
  id: number;
  name: string;
  count: number;
  children: { name: string; count: number }[];
}

export function getCommunityFilters() {
  return get<CommunityCityFilter[]>('/community/filters');
}

export function createCommunity(data: Partial<Community>) {
  return post<Community>('/community', data);
}

export function getCommunity(id: number | string) {
  return get<Community>(`/community/${id}`);
}

export function updateCommunity(id: number | string, data: Partial<Community>) {
  return put<Community>(`/community/${id}`, data);
}

export function deleteCommunity(id: number | string) {
  return del<{ id: number }>(`/community/${id}`);
}

export function getCommunityBuildings(id: number) {
  return get<{ id: number; name: string }[]>(`/community/${id}/buildings`);
}

export function getCommunityUnits(buildingId: number) {
  return get<{ id: number; name: string }[]>('/community/units', { params: { buildingId } });
}

export function getCommunityFloors(unitId: number) {
  return get<{ id: number; name: string }[]>('/community/floors', { params: { unitId } });
}

export function getCommunityRooms(floorId: number) {
  return get<{ id: number; name: string }[]>('/community/rooms', { params: { floorId } });
}
