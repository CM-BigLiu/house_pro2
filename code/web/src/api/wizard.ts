import { post } from '@/utils/request';

export interface WizardRentalSet {
  code: string;
  bizType: string;
  communityId: number;
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
  storeId: number;
  groupId?: number;
  landlordId?: number;
  salesmanId?: number;
  housekeeperId?: number;
  rooms?: Partial<WizardRentalRoom>[];
}

export interface WizardRentalRoom {
  roomNo: string;
  roomType?: string;
  rentPrice?: number;
  listedPrice?: number;
  status?: string;
  leaseEnd?: string;
  paymentMethod?: string;
  leaseTerm?: string;
  depositAmount?: number;
}

export interface WizardSaleProperty {
  code: string;
  propertyType: string;
  communityId: number;
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
  salePrice: number;
  unitPrice?: number;
  floorPrice?: number;
  taxType?: string;
  debt?: number;
  certificateType?: string;
  sourceChannel: string;
  title: string;
  tags?: string[];
  description?: string;
  ownerName: string;
  ownerPhone: string;
  ownerPhoneBackup?: string;
  maintainerId?: number;
  storeId: number;
}

export interface WizardReserveProperty {
  storeId: number;
  groupId?: number;
  communityId?: number;
  address: string;
  roomNo: string;
  layout: string;
  buildingArea?: number;
  decoration?: string;
  ownerName: string;
  ownerPhone?: string;
  ownerQuote?: number;
  sourceChannel: string;
  keyStatus?: string;
  diskType?: string;
  salesmanId?: number;
  followerId?: number;
  followDate?: string;
}

export function createRentalSet(data: Partial<WizardRentalSet>) {
  return post<WizardRentalSet>('/house/rental-sets', data);
}

export function createSaleProperty(data: Partial<WizardSaleProperty>) {
  return post<WizardSaleProperty>('/house/sale-properties', data);
}

export function createReserveProperty(data: Partial<WizardReserveProperty>) {
  return post<WizardReserveProperty>('/house/reserves/properties', data);
}
