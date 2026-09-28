import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get, post } from '@/utils/request';
import {
  delegateProperty,
  emptyContractDetails,
  getBusinessCalendar,
  getBusinessEmployees,
  getBusinessPerformance,
  getBusinessSubmissions,
  getCompanyCashFlow,
  getPropertyConfiguration,
  reviewBusinessSubmission,
  savePropertyConfiguration,
  setOpeningBalance,
  settleSchedule,
  submitBusiness,
  validateContractDetails,
} from '@/api/business';
vi.mock('@/utils/request', () => ({ get: vi.fn(), post: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
describe('业务API及合同表单规则', () => {
  it('查询使用月份参数和新业务接口，不再依赖孤立台账', () => {
    getBusinessCalendar('2026-10');
    getBusinessPerformance('2026-10');
    getCompanyCashFlow();
    getBusinessSubmissions();
    getPropertyConfiguration(8);
    getBusinessEmployees();
    expect(get).toHaveBeenCalledWith('/finance/business/calendar', {
      params: { period: '2026-10' },
    });
    expect(get).toHaveBeenCalledWith('/finance/business/performance', {
      params: { period: '2026-10' },
    });
    expect(get).toHaveBeenCalledWith('/finance/business/cash-flow');
    expect(get).toHaveBeenCalledWith('/finance/business/submissions');
    expect(get).toHaveBeenCalledWith(
      '/finance/business/properties/8/configuration',
    );
    expect(get).toHaveBeenCalledWith('/finance/business/employees');
  });
  it('委托、配置、付款、快照和审核分别提交目标资源', () => {
    const contract = {
      leaseStart: '2026-10-01',
      leaseEnd: '2027-09-30',
      amount: 100,
      deposit: 100,
      paymentMethod: 'monthly',
      details: emptyContractDetails(),
    };
    const payment = {
      requestKey: 'unique',
      paymentDate: '2026-10-01',
      amount: 100,
      accountCode: 'cash',
      payer: 'a',
      payerAccount: 'a1',
      payee: 'b',
      payeeAccount: 'b1',
    };
    delegateProperty(8, contract);
    settleSchedule(3, payment);
    savePropertyConfiguration(8, []);
    submitBusiness('management', '2026-10');
    reviewBusinessSubmission(5, 'return', '请修正');
    setOpeningBalance('cash', 100);
    expect(post).toHaveBeenCalledWith(
      '/finance/business/properties/8/delegate',
      contract,
    );
    expect(post).toHaveBeenCalledWith(
      '/finance/business/schedules/3/settle',
      payment,
    );
    expect(post).toHaveBeenCalledWith(
      '/finance/business/properties/8/configuration',
      { items: [] },
    );
    expect(post).toHaveBeenCalledWith('/finance/business/submissions', {
      type: 'management',
      period: '2026-10',
    });
    expect(post).toHaveBeenCalledWith(
      '/finance/business/submissions/5/review',
      { action: 'return', note: '请修正' },
    );
    expect(post).toHaveBeenCalledWith(
      '/finance/business/accounts/cash/opening',
      { amount: 100 },
    );
  });
  it('不同合同类型要求相应身份资料，承租人数不能超过容量', () => {
    const d = emptyContractDetails();
    expect(validateContractDetails(d, 'regular')).not.toBe('');
    Object.assign(d, {
      propertyAddress: '房屋地址',
      customerIdCard: '110101199001011234',
      customerAddress: '地址',
      paymentDate: '2026-10-01',
    });
    expect(validateContractDetails(d, 'tenant')).toBe('');
    d.occupants = 2;
    expect(validateContractDetails(d, 'tenant')).not.toBe('');
    d.occupants = 1;
    expect(validateContractDetails(d, 'regular')).not.toBe('');
    Object.assign(d, {
      ownerName: '业主',
      ownerIdCard: '110101199001011235',
      ownerAddress: '地址',
      ownerPhone: '13800001111',
    });
    expect(validateContractDetails(d, 'regular')).toBe('');
    expect(validateContractDetails(d, 'management')).not.toBe('');
    Object.assign(d, { payee: '业主', payeeAccount: '收款账户' });
    expect(validateContractDetails(d, 'management')).toBe('');
  });
});
