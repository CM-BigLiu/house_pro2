import { get, post } from '@/utils/request';

export interface RentalSet {
  id: number;
  code: string;
  bizType: string;
  communityId: number;
  communityName?: string;
  address: string;
  building: string;
  unit: string;
  roomNo: string;
  layout: string;
  buildingArea?: number;
  decoration?: string;
  landlordRent?: number;
  leaseStart?: string;
  leaseEnd?: string;
  rentFreePeriod?: string;
  status: string;
  storeId: number;
  groupId?: number;
  landlordId?: number;
  salesmanId?: number;
  housekeeperId?: number;
  roomCount?: number;
  vacantCount?: number;
  rent?: number;
  deposit?: number;
  createdAt: string;
}

export interface RentalRoom {
  id: number;
  setId: number;
  roomNo: string;
  roomType?: string;
  rentPrice?: number;
  listedPrice?: number;
  status: string;
  leaseEnd?: string;
  paymentMethod?: string;
  leaseTerm?: string;
  depositAmount?: number;
  tenantName?: string;
  tenantPhone?: string;
  createdAt: string;
}

export function getRentalSets(params?: { keyword?: string; status?: string; bizType?: string }) {
  return get<{ list: RentalSet[]; total: number }>('/house/rental-sets', { params });
}

export function createRentalSet(data: Partial<RentalSet>) {
  return post<RentalSet>('/house/rental-sets', data);
}
