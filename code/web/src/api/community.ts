import { get, post } from '@/utils/request';

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
  createdAt: string;
}

export interface Building {
  id: number;
  name: string;
  units: { id: number; name: string }[];
}

export function getCommunities(params?: { keyword?: string; cityId?: number; page?: number; pageSize?: number }) {
  return get<{ list: Community[]; total: number }>('/community', { params });
}

export function createCommunity(data: Partial<Community>) {
  return post<Community>('/community', data);
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
