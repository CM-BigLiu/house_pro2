import { get } from '@/utils/request';

export interface ManagedProperty {
  id: number;
  code: string;
  bizType: 'entire' | 'shared';
  title?: string;
  communityName?: string;
  address?: string;
  building?: string;
  unit?: string;
  roomNo?: string;
  layout?: string;
  buildingArea?: string | number;
  status: string;
  leaseStart: string | null;
  leaseEnd: string | null;
  nextLandlordPaymentDate: string | null;
}

export interface ManagedTenant {
  key: string;
  rentalSetId: number;
  rentalRoomId: number | null;
  tenantName: string;
  tenantPhone: string | null;
  signedAt: string | null;
  nextRentPaymentDate: string | null;
}

export interface ManagementQuery { keyword?: string; page: number; pageSize: number }
export interface ManagementPage<T> { list: T[]; total: number; page: number; pageSize: number }

export function getManagedProperties(params: ManagementQuery) {
  return get<ManagementPage<ManagedProperty>>('/house/property-management/properties', { params });
}
export function getManagedTenants(params: ManagementQuery) {
  return get<ManagementPage<ManagedTenant>>('/house/property-management/tenants', { params });
}
