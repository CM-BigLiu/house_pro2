import { del, get, post, put } from '@/utils/request';
import type { SaleTaxFee } from '@/utils/sale-tax';

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
  interiorArea?: number;
  totalFloor?: number;
  propertyStatus?: string;
  isRentSaleCoexist?: boolean;
  isFusion?: boolean;
  isPublic?: boolean;
  isOnlyProperty?: boolean;
  govVerifyCode?: string;
  govVerifyStatus?: string;
  quickSaleStart?: string;
  quickSaleEnd?: string;
  publishedAt?: string;
  offShelfAt?: string;
  bargainAt?: string;
  verifiedAt?: string;
  lastFollowAt?: string;
  daysWithoutFollow?: number;
  viewingTime?: string;
  viewingTimeAlt?: string;
  vrUrl?: string;
  videoUrl?: string;
  orientation: string;
  decoration: string;
  elevator: string;
  buildYear?: number;
  totalPrice: number;
  salePrice?: number;
  allowedStatuses?: string[];
  unitPrice?: number;
  floorPrice?: number;
  downPayment?: number;
  monthlyPayment?: number;
  loanAmount?: number;
  taxType?: string;
  taxFees?: SaleTaxFee[] | null;
  debt?: number;
  certificateType?: string;
  propertyRights?: string;
  propertyTerm?: string;
  certificateTerm?: string;
  acceptedPaymentMethods?: string;
  sourceChannel: string;
  tags?: string[];
  description?: string;
  ownerMentality?: string;
  communityIntro?: string;
  nearbySchool?: string;
  taxDescription?: string;
  advantages?: string;
  ownerName: string;
  ownerIdCard?: string;
  ownerPhone: string;
  ownerPhoneBackup?: string;
  ownerRemark?: string;
  emergencyContacts?: { name: string; phone: string; relation?: string }[];
  followUpContent?: string;
  maintainerId?: number;
  creatorId?: number;
  storeId: number;
  status: string;
  qualityScore?: number;
  qualityLevel?: string;
  verified: boolean;
  isCitywideSale: boolean;
  images?: string[];
  createdAt: string;
  updatedAt?: string;
}

type QueryNumber = number | string;

export interface SalePropertyQuery {
  keyword?: string;
  status?: string;
  scope?: 'all' | 'sold' | 'mine';
  code?: string;
  community?: string;
  building?: string;
  unit?: string;
  roomNo?: string;
  propertyType?: string;
  maintainerId?: QueryNumber;
  storeId?: QueryNumber;
  isPublic?: boolean | string;
  verified?: boolean | string;
  minSalePrice?: QueryNumber;
  maxSalePrice?: QueryNumber;
  minArea?: QueryNumber;
  maxArea?: QueryNumber;
  layoutRooms?: QueryNumber;
  minFloor?: QueryNumber;
  maxFloor?: QueryNumber;
  decoration?: string;
  orientation?: string;
  sourceChannel?: string;
  tag?: string;
  minQualityScore?: QueryNumber;
  maxQualityScore?: QueryNumber;
  buildYearFrom?: QueryNumber;
  buildYearTo?: QueryNumber;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export function getSaleProperties(params?: SalePropertyQuery) {
  return get<{ list: SaleProperty[]; total: number }>('/house/sale-properties', { params });
}

export function createSaleProperty(data: Partial<SaleProperty>) {
  return post<SaleProperty>('/house/sale-properties', salePayload(data));
}

export function updateSaleProperty(id: number, data: Partial<SaleProperty>) {
  return put<SaleProperty>(`/house/sale-properties/${id}`, salePayload(data, true));
}

export function deleteSaleProperty(id: number) {
  return del<{ id: number }>(`/house/sale-properties/${id}`);
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
  return post<{ id: number; result: string }>(`/house/sale-properties/${id}/change-status`, { status });
}

export function exportSalePage(params: SalePropertyQuery) {
  return get<{ list: SaleProperty[]; total: number }>('/house/sale-properties/export', { params });
}
