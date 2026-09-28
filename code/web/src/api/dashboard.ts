import { get } from '@/utils/request';

export interface KpiItem {
  key?: string;
  label: string;
  value: number | string;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  color?: string;
}

export interface KpiDetailRow {
  id: string | number; propertyName?: string; propertyCode?: string; roomNo?: string;
  type?: string; status?: string; rent?: number; leaseStart?: string; leaseEnd?: string;
  date?: string; source?: string; category?: string; reference?: string; amount?: number; settledAmount?: number;
}
export function getKpiDetails(key: string, page = 1, pageSize = 10) {
  return get<{ key: string; list: KpiDetailRow[]; total: number; totalAmount: number }>(`/dashboard/details/${key}`, { params: { page, pageSize } });
}

export interface WarningCard {
  title: string;
  value: number;
  label: string;
  color: 'red' | 'orange' | 'blue' | 'green';
}

export interface RankItem {
  name: string;
  value: number;
  unit?: string;
}

export interface TodoItem {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  date?: string;
}

export interface SmallCard {
  group: string;
  title: string;
  value: number;
}

export interface BigCard {
  title: string;
  value: string | number;
  label?: string;
  color?: string;
}

export interface OverviewData {
  greetingName?: string;
  role?: string;
  kpis: KpiItem[];
  charts: { monthly: { month: string; income: number; expense: number }[] };
  smallCards: SmallCard[];
  bigCards: BigCard[];
}

export function getOverview() {
  return get<OverviewData>('/dashboard/overview');
}

export function getWarnings() {
  return get<WarningCard[]>('/dashboard/warnings');
}

export function getRankings() {
  return get<Record<string, RankItem[]>>('/dashboard/rankings');
}

export function getTodos(params?: { all?: boolean }) {
  return get<TodoItem[]>('/dashboard/todos', { params });
}

// PRD 11 章看板接口别名
export function getStatsOverview() {
  return get<OverviewData>('/stats/overview/circle');
}

export function getWorkflowTodoCountLists() {
  return get<{ list: TodoItem[]; total: number }>('/workflow/employeeToDoCountLists');
}

export function getWorkflowInstanceList() {
  return get<{ list: TodoItem[]; total: number }>('/workflow/getInstanceList');
}

export function getNoticeHomePage() {
  return get<{ list: any[]; total: number }>('/notice/list/homePageV1');
}

export function getEmployeeHomePage() {
  return get<OverviewData>('/employee/homePage');
}
