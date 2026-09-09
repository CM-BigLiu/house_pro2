import { describe, expect, it } from 'vitest';
import { asyncRoutes } from '@/router/asyncRoutes';
import { canAccessRoute, hasPermission } from '@/router/permission';
import { formatBuilding, formatHouseAddress, formatUnit } from '@/utils/address';

describe('route permission: menu and action permissions', () => {
  it('allows a route only when both menu and action permissions are present', () => {
    const permissions = ['home', 'house:rent', 'renting:add'];
    expect(canAccessRoute(permissions, 'house:rent', 'renting:add')).toBe(true);
    expect(canAccessRoute(permissions, 'house:rent', 'renting:edit')).toBe(false);
  });

  it('blocks readonly users from hidden write routes', () => {
    const readonlyPermissions = ['home', 'house:rent', 'house:sale'];
    expect(canAccessRoute(readonlyPermissions, 'house:rent', 'renting:add')).toBe(false);
    expect(canAccessRoute(readonlyPermissions, 'house:rent', 'renting:edit')).toBe(false);
  });

  it('supports any-of permissions and wildcard administrators', () => {
    expect(hasPermission(['sale:add'], ['renting:add', 'sale:add'])).toBe(true);
    expect(canAccessRoute(['*'], 'house:rent', 'renting:add')).toBe(true);
  });

  it('protects blacklist routes with blacklist permissions instead of customer permissions', () => {
    const listRoute = asyncRoutes.find(route => route.name === 'Blacklist');
    const createRoute = asyncRoutes.find(route => route.name === 'BlacklistCreate');
    expect(listRoute?.meta.permission).toBe('house:blacklist');
    expect(createRoute?.meta.actionPermission).toBe('house:blacklist:create');
    expect(canAccessRoute(['house:customer'], listRoute?.meta.permission)).toBe(false);
  });

  it('uses dedicated community action permissions', () => {
    const createRoute = asyncRoutes.find(route => route.name === 'CommunityCreate');
    const editRoute = asyncRoutes.find(route => route.name === 'CommunityEdit');
    expect(createRoute?.meta.actionPermission).toBe('house:community:create');
    expect(editRoute?.meta.actionPermission).toBe('house:community:edit');
  });
});

describe('house address formatting', () => {
  it('does not append duplicate building or unit suffixes', () => {
    expect(formatBuilding('1号楼')).toBe('1号楼');
    expect(formatBuilding('2')).toBe('2栋');
    expect(formatUnit('1单元')).toBe('1单元');
    expect(formatUnit('2')).toBe('2单元');
  });

  it('formats a complete address without repeated units', () => {
    expect(formatHouseAddress({
      community: '张江汤臣豪园',
      building: '1号楼',
      unit: '1单元',
      roomNo: '301',
    })).toBe('张江汤臣豪园 1号楼 1单元 301');
  });
});
