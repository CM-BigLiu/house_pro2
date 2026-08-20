import { get, post, put, del } from '@/utils/request';

export interface Employee {
  id: number;
  name: string;
  mobile: string;
  status: string;
  entryDate?: string;
  leaveDate?: string;
  idCard?: string;
  bankCard?: string;
  bankName?: string;
  avatar?: string;
  roles?: { id: number; name: string }[];
  stores?: { id: number; name: string }[];
  departments?: { id: number; name: string }[];
  positions?: { id: number; name: string }[];
}

export interface Role {
  id: number;
  code: string;
  name: string;
  dataScope: string;
  isBuiltin: boolean;
  status: string;
  permissions?: { id: number; name: string; code: string }[];
}

export interface Permission {
  id: number;
  code: string;
  name: string;
  type: 'menu' | 'action' | 'data';
  parentId?: number;
  module?: string;
  path?: string;
  icon?: string;
  sort?: number;
  status: string;
  children?: Permission[];
}

export function getEmployees(params?: { keyword?: string; storeId?: number }) {
  return get<Employee[]>('/employees', { params });
}

export function createEmployee(data: Partial<Employee>) {
  return post<Employee>('/employees', data);
}

export function updateEmployee(id: number, data: Partial<Employee>) {
  return put<Employee>(`/employees/${id}`, data);
}

export function deleteEmployee(id: number) {
  return del(`/employees/${id}`);
}

export function getRoles() {
  return get<Role[]>('/roles');
}

export function createRole(data: Partial<Role>) {
  return post<Role>('/roles', data);
}

export function updateRole(id: number, data: Partial<Role>) {
  return put<Role>(`/roles/${id}`, data);
}

export function deleteRole(id: number) {
  return del(`/roles/${id}`);
}

export function getPermissions() {
  return get<Permission[]>('/permissions');
}

export function getStores(params?: { cityId?: number }) {
  return get<{ id: number; name: string; cityId?: number }[]>('/stores', { params });
}

export function getCities() {
  return get<{ id: number; name: string }[]>('/cities');
}

export function getDepartments(params?: { storeId?: number }) {
  return get<{ id: number; name: string }[]>('/departments', { params });
}

export function getPositions() {
  return get<{ id: number; name: string; code: string }[]>('/positions');
}

export interface Store {
  id: number;
  name: string;
  cityId?: number;
}
