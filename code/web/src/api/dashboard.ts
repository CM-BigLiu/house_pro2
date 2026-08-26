import { get } from '@/utils/request';

export interface KpiItem {
  label: string;
  value: number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
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

export function getTodos() {
  return get<TodoItem[]>('/dashboard/todos');
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
