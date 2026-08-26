import { get, post, put } from '@/utils/request';

export interface SaleProperty {
  id: number;
  code: string;
  title: string;
  communityName: string;
  communityId?: number;
  propertyType: string;
  building: string;
  unit: string;
  floor: string;
  roomNo: string;
  layoutRooms: number;
  layoutHalls: number;
  layoutBathrooms: number;
  layoutBalconies: number;
  buildingArea: number;
  orientation: string;
  decoration: string;
  elevator: string;
  buildYear?: number;
  totalPrice: number;
  unitPrice?: number;
  floorPrice?: number;
  taxType?: string;
  debt?: number;
  certificateType?: string;
  sourceChannel: string;
  tags?: string[];
  description?: string;
  ownerName: string;
  ownerPhone: string;
  ownerPhoneBackup?: string;
  maintainerId?: number;
  storeId: number;
  status: string;
  qualityScore?: number;
  qualityLevel?: string;
  verified: boolean;
  isCitywideSale: boolean;
  images?: string[];
  createdAt: string;
}

export function getSaleProperties(params?: { keyword?: string; status?: string }) {
  return get<{ list: SaleProperty[]; total: number }>('/house/sale-properties', { params });
}

export function createSaleProperty(data: Partial<SaleProperty>) {
  return post<SaleProperty>('/house/sale-properties', data);
}

export function updateSaleProperty(id: number, data: Partial<SaleProperty>) {
  return put<SaleProperty>(`/house/sale-properties/${id}`, data);
}

// PRD 11 章统一房源接口（/api/property/*）
export function getPropertyPage(params?: { transType?: number; keyword?: string; status?: string }) {
  return get<{ list: SaleProperty[]; total: number }>('/property/page', { params });
}

export function createProperty(data: Partial<SaleProperty> & { transType?: number }) {
  return post<SaleProperty>('/property/add', data);
}

export function getPropertyDetail(id: number, transType = 2) {
  return get<SaleProperty>(`/property/detail/${id}`, { params: { transType } });
}

export function updateProperty(id: number, data: Partial<SaleProperty> & { transType?: number }) {
  return put<SaleProperty>(`/property/update/${id}`, data);
}
