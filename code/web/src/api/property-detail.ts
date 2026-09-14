import { get } from '@/utils/request';
import type { Checkout } from './checkout';

export interface PropertyDetail {
  property: Record<string, any>;
  roomId: number | null;
  approvals: { id: number; entityType: string; entityId: number; action: string; fromStatus: string; toStatus: string; result: string; operatorId: number; approverId?: number; remark?: string; createdAt: string }[];
  checkouts: Checkout[];
  operations: { id: number; action: string; employeeId: number; result: string; createdAt: string }[];
}
export function getHouseDetail(kind: 'rent' | 'sale', id: number, roomId?: number) {
  return get<PropertyDetail>(`/house/details/${kind}/${id}`, { params: { roomId } });
}
