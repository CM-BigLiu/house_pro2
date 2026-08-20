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

export function getOverview() {
  return get<{ greetingName?: string; role?: string; kpis: KpiItem[]; charts: { monthly: { month: string; income: number; expense: number }[] } }>('/dashboard/overview');
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
