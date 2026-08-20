import { get, post } from '@/utils/request';

export interface LoginForm {
  mobile: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: {
    id: number;
    name: string;
    mobile: string;
    avatar?: string;
  };
}

export interface UserInfo {
  employeeId: number;
  name: string;
  mobile: string;
  avatar?: string;
  storeIds: number[];
  groupIds: number[];
  dataScope: string;
  permissions: string[];
}

export function login(data: LoginForm) {
  return post<LoginResult>('/auth/login', data);
}

export function getMe() {
  return get<UserInfo>('/auth/me');
}

export function getMenus() {
  return get<MenuItem[]>('/auth/menus');
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  permission?: string;
  children?: MenuItem[];
}
