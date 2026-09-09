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
  salePrice?: number;
  allowedStatuses?: string[];
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

export function getSaleProperties(params?: { keyword?: string; status?: string; page?: number; pageSize?: number }) {
  return get<{ list: SaleProperty[]; total: number }>('/house/sale-properties', { params });
}

export function createSaleProperty(data: Partial<SaleProperty>) {
  return post<SaleProperty>('/house/sale-properties', salePayload(data));
}

export function updateSaleProperty(id: number, data: Partial<SaleProperty>) {
  return put<SaleProperty>(`/house/sale-properties/${id}`, salePayload(data, true));
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

export function salePayload(data: Partial<SaleProperty>, editing = false) {
  const { totalPrice } = data;
  const payload = { ...data };
  for (const key of ['totalPrice', 'communityName', 'id', 'createdAt', 'status', 'allowedStatuses'] as const) delete payload[key];
  if (editing) { delete payload.code; delete payload.storeId; }
  return { ...payload, ...(totalPrice !== undefined ? { salePrice: totalPrice } : {}) };
}

export function getSalePropertyForEdit(id: number) {
  return get<SaleProperty>(`/house/sale-properties/${id}/edit`);
}

export function changeSaleStatus(id: number, status: string) {
  return put<SaleProperty>(`/house/sale-properties/${id}/status`, { status });
}

export function exportSalePage(params: { keyword?: string; status?: string; page?: number; pageSize?: number }) {
  return get<{ list: SaleProperty[]; total: number }>('/house/sale-properties/export', { params });
}
