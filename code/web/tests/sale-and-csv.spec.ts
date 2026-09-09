import { describe, expect, it, vi } from 'vitest';
vi.mock('../src/utils/request', () => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }));
import { salePayload } from '../src/api/sale';
import { toCsv } from '../src/utils/csv';

describe('sale API payload and export', () => {
  it('maps the displayed price to the required backend field', () => {
    const payload = salePayload({ totalPrice: 1234567.89, title: 'QA', communityName: 'display only', status: 'sold' });
    expect(payload).toEqual({ salePrice: 1234567.89, title: 'QA' });
  });
  it('omits immutable fields from edit requests and preserves editable fields', () => {
    expect(salePayload({ code: 'QA', storeId: 1, id: 1, totalPrice: 2.99, roomNo: 'QA2' }, true)).toEqual({ salePrice: 2.99, roomNo: 'QA2' });
  });
  it('exports UTF-8 BOM and escapes commas, newlines and quotes', () => {
    expect(toCsv([['中文', 'a,b', 'a"b', 'a\nb']])).toBe('\uFEFF"中文","a,b","a""b","a\nb"');
  });
  it.each(['=1+1', '+SUM(A1)', '-1+2', '@SUM(A1)', '  =1', '\t=1'])('neutralizes spreadsheet formulas: %s', (value) => {
    expect(toCsv([[value]])).toBe('\uFEFF"\'' + value + '"');
  });
});
