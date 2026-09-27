import { del, get, post, put } from '@/utils/request';

export interface RentalSet {
  id: number;
  creatorId?: number;
  isManaged?: boolean;
  canViewLandlordInfo?: boolean;
  code: string;
  bizType: string;
  communityId: number;
  communityName?: string;
  address: string;
  building: string;
  unit: string;
  floor?: string;
  totalFloor?: number;
  roomNo: string;
  layout: string;
  buildingArea?: number;
  interiorArea?: number;
  district?: string;
  businessCircle?: string;
  propertyType?: string;
  orientation?: string;
  elevator?: string;
  decoration?: string;
  sourceChannel?: string;
  tags?: string[];
  description?: string;
  title?: string;
  communityIntro?: string;
  nearbySchool?: string;
  taxDescription?: string;
  advantages?: string;
  facilities?: string[];
  landlordRent?: number;   // 承租价（公司给房东）
  landlordDeposit?: number; // 房东押金（公司给房东）
  leaseStart?: string;     // 承租期开始
  leaseEnd?: string;       // 承租期结束
  landlordPaymentMethod?: string;
  leaseTerm?: string;
  rentFreePeriod?: string;
  rent?: number;           // 客租价（对房客，整租时使用）
  deposit?: number;        // 租客押金（整租时使用）
  status: string;
  operationStatus?: string;
  businessStatus?: string;
  storeId: number;
  groupId?: number;
  landlordId?: number;
  salesmanId?: number;
  housekeeperId?: number;
  roomCount?: number;
  vacantCount?: number;
  createdAt: string;
  updatedAt?: string;
  // 房东信息
  landlordName?: string;
  landlordPhone?: string;
  landlordPhoneBackup?: string;
  landlordRemark?: string;
  emergencyContacts?: { name: string; phone: string; relation?: string }[];
  viewingTime?: string;
  viewingTimeAlt?: string;
  followUpContent?: string;
  images?: string[];
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
  leaseDuration?: string;
  renovationProgress?: string;
  paymentStatus?: string;
  arrearDays?: number;
  tenantId?: number;
  cohabitantIds?: number[];
  depositAmount?: number;
  tenantName?: string;
  tenantPhone?: string;
  tenantIdCard?: string;
  createdAt: string;
}

export interface RentalSetQuery {
  keyword?: string;
  status?: string;
  bizType?: string;
  code?: string;
  roomNo?: string;
  storeId?: number | '';
  salesmanId?: number | '';
  housekeeperId?: number | '';
  paymentMethod?: string;
  leaseTerm?: string;
  layout?: string;
  district?: string;
  address?: string;
  building?: string;
  unit?: string;
  operationStatus?: string;
  businessStatus?: string;
  propertyType?: string;
  orientation?: string;
  decoration?: string;
  sourceChannel?: string;
  landlordPhone?: string;
  scope?: 'all' | 'mine';
  sortBy?: 'created_desc' | 'rent_desc' | 'rent_asc' | 'lease_end';
  page?: number;
  pageSize?: number;
}

export interface RentalAppointment {
  id: number;
  rentalSetId: number;
  rentalRoomId?: number;
  customerId?: number | null;
  customerName?: string | null;
  sourceAppointmentId?: number | null;
  contractCode?: string | null;
  signedAt?: string | null;
  actions?: RentalAppointmentAction[];
  propertyCode: string;
  propertyName: string;
  scheduledAt: string;
  responsibleEmployeeId: number;
  responsibleEmployeeName: string;
  storeId: number;
  groupId?: number;
  status: 'scheduled' | 'completed' | 'signed' | 'cancelled';
  remark?: string;
  createdAt: string;
}

export interface RentalAppointmentAction {
  id: number;
  action: 'follow_up' | 'sign' | 'recommend';
  content: string;
  employeeName: string;
  createdAt: string;
  details?: Record<string, unknown>;
}

export interface RentalAppointmentSignInput {
  rentalRoomId?: number;
  contractCode?: string;
  tenantName?: string;
  tenantPhone?: string;
  leaseStart: string;
  leaseEnd: string;
  rent: number;
  deposit: number;
  paymentMethod: string;
  remark?: string;
}

export function getRentalSets(params?: RentalSetQuery) {
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

export function getRentalDistricts() {
  return get<string[]>('/house/rental-sets/district-options');
}

export function deleteRentalSet(id: number | string) {
  return del<{ id: number }>(`/house/rental-sets/${id}`);
}

export function getRentalAppointments(params?: { rentalSetId?: number; status?: string; page?: number; pageSize?: number }) {
  return get<{ list: RentalAppointment[]; total: number }>('/house/rental-appointments', { params });
}

export function createRentalAppointment(data: { rentalSetId: number; rentalRoomId?: number; customerId?: number; scheduledAt: string; remark?: string }) {
  return post<RentalAppointment>('/house/rental-appointments', data);
}

export function followUpRentalAppointment(id: number, content: string) {
  return post<RentalAppointmentAction>(`/house/rental-appointments/${id}/follow-up`, { content });
}

export function getRentalAppointmentSigningContext(id: number) {
  return get<{ bizType: string; rooms: Pick<RentalRoom, 'id' | 'roomNo' | 'status'>[] }>(`/house/rental-appointments/${id}/signing-context`);
}

export function signRentalAppointment(id: number, data: RentalAppointmentSignInput) {
  return post<RentalAppointment>(`/house/rental-appointments/${id}/sign`, data);
}

export function recommendRentalAppointment(id: number, data: Parameters<typeof createRentalAppointment>[0]) {
  return post<RentalAppointment>(`/house/rental-appointments/${id}/recommend`, data);
}

// PRD 11 章统一房源接口（transType=1 租房）
export function getRentalPropertyPage(params?: { keyword?: string; status?: string; bizType?: string }) {
  return get<{ list: RentalSet[]; total: number }>('/property/page', { params: { ...params, transType: 1 } });
}

export function createRentalProperty(data: Partial<RentalSet>) {
  return post<RentalSet>('/property/add', { ...data, transType: 1 });
}
