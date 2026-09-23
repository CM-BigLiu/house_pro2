import { describe, expect, it } from 'vitest';
import { asyncRoutes } from '@/router/asyncRoutes';
import { getBreadcrumbs } from '@/router/breadcrumb';

describe('新增和编辑页面面包屑', () => {
  it.each(asyncRoutes.filter(route => /\/(create|edit)(?:\/:id)?$/.test(route.path)))('%s 可返回所属列表', route => {
    const path = route.path.replace(':id', '42');
    const parentPath = route.path.replace(/\/(?:create|edit)(?:\/:id)?$/, '');
    const crumbs = getBreadcrumbs(path, route.meta?.title);
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0]).toEqual({ label: '首页', path: '/home' });
    expect(crumbs[1]).toMatchObject({ path: parentPath });
    expect(crumbs[2]).toEqual({ label: route.meta?.title });
  });

  it('列表页和首页不增加无效层级', () => {
    expect(getBreadcrumbs('/house/rent', '租房管理')).toEqual([
      { label: '首页', path: '/home' },
      { label: '租房管理' },
    ]);
    expect(getBreadcrumbs('/home', '首页')).toEqual([{ label: '首页', path: undefined }]);
  });
});
