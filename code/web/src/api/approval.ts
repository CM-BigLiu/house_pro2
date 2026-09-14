import { get, post } from '@/utils/request';

export type ApprovalResult = 'pending' | 'approved' | 'rejected';

export interface ApprovalRecord {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  fromStatus: string;
  toStatus: string;
  operatorId: number;
  operatorName?: string;
  approverId?: number;
  approverName?: string;
  remark?: string;
  result: ApprovalResult;
  createdAt: string;
}

export interface ApprovalQuery {
  page?: number;
  pageSize?: number;
  result?: ApprovalResult | '';
  entityType?: string;
  entityId?: number;
}

export function getApprovals(params?: ApprovalQuery) {
  return get<{ list: ApprovalRecord[]; total: number }>('/system/approvals', { params });
}

export function approveApproval(id: number, remark?: string) {
  return post<ApprovalRecord>(`/system/approvals/${id}/approve`, { remark });
}

export function rejectApproval(id: number, remark?: string) {
  return post<ApprovalRecord>(`/system/approvals/${id}/reject`, { remark });
}

const statusEndpoints: Record<string, string> = {
  sale_property: '/house/sale-properties',
  rental_room: '/house/rental-rooms',
  bill: '/finance/bills',
  invoice: '/finance/invoices',
};

export function requestStatusChange(entityType: string, entityId: number, status: string, remark?: string) {
  const base = statusEndpoints[entityType];
  if (!base) throw new Error(`不支持的审批业务类型：${entityType}`);
  return post<ApprovalRecord>(`${base}/${entityId}/change-status`, { status, remark });
}
