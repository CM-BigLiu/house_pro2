import { describe, expect, it } from 'vitest';
import { getBreadcrumbs } from '@/router/breadcrumb';
import { activeMenuPath, rentalListPath } from '@/router/rental-origin';
describe('租房详情和编辑的入口导航', () => {
  it.each(['detail', 'edit'])('房管房入口在 %s 页面和刷新后保留导航', action => {
    const path = `/house/rent/${action}/2`;
    expect(activeMenuPath(path, 'property-management')).toBe('/house/property-management');
    expect(getBreadcrumbs(path, '详情', 'property-management')[1]).toEqual({ label: '房管房管理', path: '/house/property-management' });
  });
  it('默认入口和无效来源都返回租房管理，不能形成任意跳转', () => {
    expect(rentalListPath('https://external.example')).toBe('/house/rent');
    expect(activeMenuPath('/house/rent/detail/2')).toBe('/house/rent');
    expect(getBreadcrumbs('/house/rent/detail/2', '租房详情')[1].label).toBe('租房管理');
    expect(activeMenuPath('/house/sale/detail/2', 'property-management')).toBe('/house/sale/detail/2');
  });
});
