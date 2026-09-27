import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDeals } from '@/api/deal';
import { get } from '@/utils/request';

vi.mock('@/utils/request', () => ({ get: vi.fn().mockResolvedValue({ list: [], total: 0 }), post: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

describe('成交查询参数', () => {
  it('默认和重置后的空枚举、空日期不传给后端，且不修改表单', async () => {
    const query = { keyword: '', bizType: '', status: '', startDate: '', endDate: '', page: 1, pageSize: 10 };
    await getDeals(query);
    expect(get).toHaveBeenCalledWith('/finance/deals', { params: { page: 1, pageSize: 10 } });
    expect(query.status).toBe(''); expect(query.startDate).toBe('');
  });
  it('保留已选择的业务、状态、日期和分页', async () => {
    const query = { bizType: 'rent', status: 'active', startDate: '2026-09-01', endDate: '2026-09-30', page: 2, pageSize: 10 };
    await getDeals(query);
    expect(get).toHaveBeenCalledWith('/finance/deals', { params: query });
  });
});
