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
  assignedStores?: number[];
  customScope?: string;
  isBuiltin: boolean;
  status: string;
  permissions?: { id: number; name: string; code: string }[];
  /** 保存时提交的权限点 id 集合 */
  permissionIds?: number[];
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
  return get<{ list: Employee[]; total: number }>('/system/employees', { params });
}

export function createEmployee(data: Partial<Employee>) {
  return post<Employee>('/system/employees', data);
}

export function updateEmployee(id: number, data: Partial<Employee>) {
  return put<Employee>(`/system/employees/${id}`, data);
}

export function getEmployeeForEdit(id: number) {
  return get<Employee>(`/system/employees/${id}/edit`);
}

export function deleteEmployee(id: number) {
  return del(`/system/employees/${id}`);
}

export function getRoles() {
  return get<Role[]>('/system/roles');
}

export function createRole(data: Partial<Role>) {
  return post<Role>('/system/roles', data);
}

export function updateRole(id: number, data: Partial<Role>) {
  return put<Role>(`/system/roles/${id}`, data);
}

export function deleteRole(id: number) {
  return del(`/system/roles/${id}`);
}

export function getPermissions() {
  return get<Permission[]>('/system/permissions/tree');
}

export function getStores(params?: { cityId?: number; keyword?: string; status?: string }) {
  return get<Store[]>('/system/stores', { params });
}

export function getStoreForEdit(id: number) {
  return get<Store>(`/system/stores/${id}/edit`);
}

export function createStore(data: Partial<Store>) {
  return post<Store>('/system/stores', data);
}

export function updateStore(id: number, data: Partial<Store>) {
  return put<Store>(`/system/stores/${id}`, data);
}

export function getCities() {
  return get<{ id: number; name: string }[]>('/system/cities');
}

export function getDepartments(params?: { storeId?: number }) {
  return get<{ id: number; name: string }[]>('/system/departments', { params });
}

export function getPositions() {
  return get<{ id: number; name: string; code: string }[]>('/system/positions');
}

export interface Store {
  id: number;
  name: string;
  cityId?: number;
  cityName?: string;
  address?: string;
  phone?: string;
  manager?: string | { id: number; name: string };
  employeeCount?: number;
  status?: string;
}
