import { asyncRoutes } from './asyncRoutes';
import { rentalListPath } from './rental-origin';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

// 列表页沿用导航栏已有的名称，避免新增/编辑页面出现不同叫法。
const breadcrumbMap: Record<string, string> = {
  '/': '看板',
  '/dashboard': '看板',
  '/house/rent': '租房管理',
  '/house/property-management': '房管房管理',
  '/house/sale': '售房管理',
  '/house/customer': '客源管理',
  '/house/community': '小区管理',
  '/house/house-wizard': '房源录入',
  '/house/checkout': '退租管理',
  '/house/deposit': '押金管理',
  '/finance/deal': '成交管理',
  '/finance/invoice': '发票管理',
  '/finance/income-cost': '收支成本',
  '/finance/performance': '业绩核算',
  '/finance/accounting': '财务管理',
  '/finance/arrears': '房管房业务',
  '/finance/plan': '收支计划（公司现金流）',
  '/system/role': '角色管理',
  '/system/permission': '权限管理',
  '/system/employee': '员工管理',
  '/system/dict': '字典管理',
  '/system/store': '门店管理',
  '/system/config': '系统配置',
  '/system/log': '操作日志',
};

export function getBreadcrumbs(path: string, title?: unknown, source?: unknown): BreadcrumbItem[] {
  const currentName = breadcrumbMap[path] || (typeof title === 'string' ? title : '');
  const segments: BreadcrumbItem[] = [
    { label: '首页', path: path === '/home' ? undefined : '/home' },
  ];

  // 新增/编辑是独立路由，route.matched 不含列表页；从同级路由找到真正的父列表。
  const parentPath = /^\/house\/rent\/(detail|edit)\//.test(path)
    ? rentalListPath(source)
    : path.replace(/\/(?:create|edit|detail)(?:\/[^/]+)?$/, '');
  if (parentPath !== path) {
    const parent = asyncRoutes.find(route => route.path === parentPath);
    if (parent?.meta?.title && parentPath !== '/home') {
      segments.push({ label: breadcrumbMap[parentPath] || String(parent.meta.title), path: parentPath });
    }
  }

  if (currentName && currentName !== '首页') segments.push({ label: currentName });
  return segments;
}
