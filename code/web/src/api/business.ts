import { get, post } from '@/utils/request';

export interface ContractDetails {
  ownerName: string;
  ownerIdCard: string;
  ownerAddress: string;
  ownerPhone: string;
  customerIdCard: string;
  customerAddress: string;
  propertyAddress: string;
  paymentDate: string;
  payee: string;
  payeeAccount: string;
  depositNote: string;
  occupants: number;
  maxOccupants: number;
  commissionAmount: number;
  performanceRatio: number;
  commissionRatio: number;
  freeDays: number[];
  freeRentRanges?: import('@/utils/free-rent').FreeRentRange[];
  entryEmployeeId?: number;
  entryRatio?: number;
  closingEmployeeId?: number;
  closingRatio?: number;
}
export function emptyContractDetails(): ContractDetails {
  return {
    ownerName: '',
    ownerIdCard: '',
    ownerAddress: '',
    ownerPhone: '',
    customerIdCard: '',
    customerAddress: '',
    propertyAddress: '',
    paymentDate: '',
    payee: '',
    payeeAccount: '',
    depositNote: '',
    occupants: 1,
    maxOccupants: 1,
    commissionAmount: 0,
    performanceRatio: 100,
    commissionRatio: 0,
    freeDays: [0, 0, 0, 0, 0],
    freeRentRanges: [],
  };
}
export interface ContractSchedule {
  billType?: 'rent' | 'charge';
  categoryLabel?: string;
  counterparty?: string;
  remark?: string;
  grossRent?: number;
  freeRentDays?: number;
  freeRentAmount?: number;
  id: number;
  dealId: number;
  propertyId: number;
  propertyName: string;
  direction: 'pay' | 'receive';
  sequence: number;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  remaining: number;
  settledAmount: number;
  contractCode?: string;
  paymentMethod?: string;
  monthlyRent?: number;
  roomId?: number | null;
}
export interface CalendarBucket {
  direction: 'pay' | 'receive';
  period: string;
  amount: number;
  count: number;
  list: ContractSchedule[];
}
export interface CashEntry {
  id: number;
  direction: 'pay' | 'receive';
  paymentDate: string;
  amount: number;
  accountCode: string;
  payerAccount: string;
  payer: string;
  payeeAccount: string;
  payee: string;
}
export interface ConfigurationItem {
  dueDate?: string;
  roomId?: number | null;
  type: string;
  amount: number;
  recipient: string;
  recipientEmployeeId?: number;
  channel: string;
  remark: string;
}
export interface PerformanceSection {
  amount: number;
  commission: number;
  details: Record<string, any>[];
}
export interface BusinessPerformance {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  regular: PerformanceSection;
  management: PerformanceSection;
  tenant: PerformanceSection;
  sale: PerformanceSection;
  totalAmount: number;
  totalCommission: number;
}
export interface BusinessSubmission {
  id: number;
  type: string;
  period: string;
  snapshot: {
    list?: BusinessPerformance[];
    buckets?: CalendarBucket[];
    overdue?: ContractSchedule[];
    payments?: (CashEntry & { propertyName: string })[];
  };
  status: string;
  reviewNote: string;
  employeeName: string;
  createdAt: string;
}
export const accountNames: Record<string, string> = {
  bank_ccb: '建设银行',
  bank_rural: '农商银行',
  wechat: '微信',
  cash: '现金',
  corporate: '公户',
};
const root = '/finance/business';
export const delegateProperty = (
  id: number,
  data: {
    leaseStart: string;
    leaseEnd: string;
    amount: number;
    deposit: number;
    paymentMethod: string;
    details: ContractDetails;
  },
) => post(`${root}/properties/${id}/delegate`, data);
export const getBusinessCalendar = (period: string, filter: { propertyId?: number; roomId?: number } = {}) =>
  get<{
    period: string;
    buckets: CalendarBucket[];
    overdue: ContractSchedule[];
  }>(`${root}/calendar`, { params: { period, ...filter } });
export const settleSchedule = (
  id: number,
  data: {
    requestKey: string;
    paymentDate: string;
    amount: number;
    accountCode: string;
    payerAccount: string;
    payer: string;
    payeeAccount: string;
    payee: string;
  },
) => post(`${root}/schedules/${id}/settle`, data);
export const settleCharge = (id: number, data: Parameters<typeof settleSchedule>[1]) => post(`${root}/charges/${id}/settle`, data);
export const getCompanyCashFlow = () =>
  get<{
    accounts: {
      code: string;
      name: string;
      balance: number;
      openingBalance: number;
      movement: number;
    }[];
    history: CashEntry[];
    scope: string;
  }>(`${root}/cash-flow`);
export const getRentalCosts = (period: string) => get<{ period: string; totalIncome: number; totalCost: number; freeAmount: number; net: number; list: { propertyId: number; propertyCode: string; propertyName: string; rentIncome: number; originalRent: number; freeAmount: number; rentCost: number; net: number }[] }>(`${root}/rental-costs`, { params: { period } });
export const setOpeningBalance = (code: string, amount: number) =>
  post(`${root}/accounts/${code}/opening`, { amount });
export const getPropertyConfiguration = (id: number) =>
  get<{ items: ConfigurationItem[]; rooms?: { id: number; roomNo: string }[] }>(`${root}/properties/${id}/configuration`);
export const getConfigurationEmployees = (id: number) =>
  get<{ id: number; name: string; code: string }[]>(`${root}/properties/${id}/configuration-employees`);
export const getDelegationContext = (id: number) =>
  get<{ leaseStart: string; leaseEnd: string; amount: number; deposit: number; paymentMethod: string; details: Partial<ContractDetails>; existingContractCode?: string }>(`${root}/properties/${id}/delegation-context`);
export const savePropertyConfiguration = (
  id: number,
  items: ConfigurationItem[],
) => post(`${root}/properties/${id}/configuration`, { items });
export const getBusinessPerformance = (period: string) =>
  get<{ period: string; list: BusinessPerformance[] }>(`${root}/performance`, {
    params: { period },
  });
export const getBusinessEmployees = () =>
  get<{ id: number; name: string; code: string }[]>(`${root}/employees`);
export const createManualSale = (data: {
  amount: number;
  address: string;
  details: Partial<ContractDetails>;
}) => post(`${root}/sales`, data);
export const submitBusiness = (type: string, period: string) =>
  post<BusinessSubmission>(`${root}/submissions`, { type, period });
export const getBusinessSubmissions = () =>
  get<BusinessSubmission[]>(`${root}/submissions`);
export const reviewBusinessSubmission = (
  id: number,
  action: 'save' | 'return',
  note: string,
) => post(`${root}/submissions/${id}/review`, { action, note });

export function validateContractDetails(
  d: ContractDetails,
  mode: 'regular' | 'tenant' | 'management',
): string {
  const idCard = /^(\d{15}|\d{17}[\dXx])$/;
  if (!d.propertyAddress.trim()) return '请填写房屋地址';
  if (
    mode !== 'tenant' &&
    (!d.ownerName.trim() ||
      !idCard.test(d.ownerIdCard) ||
      !d.ownerAddress.trim() ||
      !/^1\d{10}$/.test(d.ownerPhone))
  )
    return '请补齐业主姓名、身份证、通讯地址和电话';
  if (
    mode !== 'management' &&
    (!idCard.test(d.customerIdCard) || !d.customerAddress.trim())
  )
    return '请填写客户身份证和通讯地址';
  if (mode !== 'regular' && !d.paymentDate) return '请填写付款日期';
  if (mode === 'management' && (!d.payee.trim() || !d.payeeAccount.trim()))
    return '请填写收款人和收款账号';
  if (mode === 'management' && (d.freeDays.length !== 5 || d.freeDays.some(days => !Number.isInteger(days) || days < 0 || days > 366)))
    return '请填写五个年度的免租期，每年0至366天';
  if (
    mode === 'tenant' &&
    (!Number.isInteger(d.occupants) ||
      !Number.isInteger(d.maxOccupants) ||
      d.occupants < 1 ||
      d.maxOccupants < d.occupants)
  )
    return '请填写有效居住人数，常居人数不能超过容纳人数';
  if (!Number.isFinite(d.commissionAmount) || d.commissionAmount < 0)
    return '佣金金额无效';
  return '';
}

export interface IncomeCostEntry {
  id: string; date: string; direction: 'income' | 'expense'; category: string;
  source: string; reference: string; propertyName: string; amount: number;
}
export interface AutomaticIncomeCosts {
  period: string; list: IncomeCostEntry[]; totalIncome: number; totalCost: number; net: number;
}
export function getAutomaticIncomeCosts(period: string) {
  return get<AutomaticIncomeCosts>('/finance/business/income-costs', { params: { period } });
}
