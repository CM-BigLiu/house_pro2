import { decryptField, encryptField } from '../../../common/utils/crypto.util';

export interface ContractDetails {
  ownerName?: string;
  ownerIdCard?: string;
  ownerAddress?: string;
  ownerPhone?: string;
  customerIdCard?: string;
  customerAddress?: string;
  propertyAddress?: string;
  paymentDate?: string;
  payee?: string;
  payeeAccount?: string;
  depositNote?: string;
  occupants?: number;
  maxOccupants?: number;
  commissionAmount?: number;
  performanceRatio?: number;
  commissionRatio?: number;
  freeDays?: number[];
  freeRentRanges?: { start: string; end: string }[];
  entryEmployeeId?: number;
  entryEmployeeName?: string;
  entryRatio?: number;
  closingEmployeeId?: number;
  closingEmployeeName?: string;
  closingRatio?: number;
}

// 合同身份、地址和账号整体加密；服务读取后仍经过统一脱敏拦截器。
export const contractDetailsTransformer = {
  to: (value: ContractDetails | null) =>
    value == null ? null : encryptField(JSON.stringify(value)),
  from: (value: string | null) =>
    value == null ? null : JSON.parse(decryptField(value)),
};
