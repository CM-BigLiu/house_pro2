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
