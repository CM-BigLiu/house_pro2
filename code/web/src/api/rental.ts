import { get, post, put } from '@/utils/request';

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
  landlordRent?: number;   // 承租价（公司给房东）
  leaseStart?: string;     // 承租期开始
  leaseEnd?: string;       // 承租期结束
  rentFreePeriod?: string;
  rent?: number;           // 客租价（对房客，整租时使用）
  deposit?: number;
  status: string;
  storeId: number;
  groupId?: number;
  landlordId?: number;
  salesmanId?: number;
  housekeeperId?: number;
  roomCount?: number;
  vacantCount?: number;
  createdAt: string;
  // 房东信息
  landlordName?: string;
  landlordPhone?: string;
  landlordIdCard?: string;
  landlordBankCard?: string;
  landlordBankName?: string;
  // 租客信息（整租时使用）
  tenantName?: string;
  tenantPhone?: string;
  tenantIdCard?: string;
  tenantLeaseStart?: string;
  tenantLeaseEnd?: string;
  tenantPaymentMethod?: string;
  tenantDeposit?: number;
  rooms?: RentalRoom[];
}

export interface RentalRoom {
  id: number;
  setId: number;
  roomNo: string;
  roomType?: string;
  rentPrice?: number;
  listedPrice?: number;
  status: string;
  leaseStart?: string;
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

export function getRentalSet(id: number | string) {
  return get<RentalSet>(`/house/rental-sets/${id}`);
}

export function updateRentalSet(id: number | string, data: Partial<RentalSet>) {
  return put<RentalSet>(`/house/rental-sets/${id}`, data);
}

// PRD 11 章统一房源接口（transType=1 租房）
export function getRentalPropertyPage(params?: { keyword?: string; status?: string; bizType?: string }) {
  return get<{ list: RentalSet[]; total: number }>('/property/page', { params: { ...params, transType: 1 } });
}

export function createRentalProperty(data: Partial<RentalSet>) {
  return post<RentalSet>('/property/add', { ...data, transType: 1 });
}
