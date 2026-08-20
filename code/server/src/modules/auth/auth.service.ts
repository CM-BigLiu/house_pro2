import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../system/entities/employee.entity';
import { Role } from '../system/entities/role.entity';
import { Permission } from '../system/entities/permission.entity';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    private jwtService: JwtService,
  ) {}

  async validateEmployee(mobile: string, password: string): Promise<Employee> {
    const employee = await this.employeeRepo.findOne({
      where: { mobile },
      relations: ['roles', 'roles.permissions', 'stores', 'groups'],
    });
    if (!employee) throw new UnauthorizedException('账号或密码错误');
    const ok = await bcrypt.compare(password, employee.password);
    if (!ok) throw new UnauthorizedException('账号或密码错误');
    return employee;
  }

  async login(mobile: string, password: string) {
    const employee = await this.validateEmployee(mobile, password);
    const payload = await this.buildPayload(employee);
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: employee.id,
        name: employee.name,
        mobile: employee.mobile,
        avatar: employee.avatar,
      },
    };
  }

  async buildPayload(employee: Employee): Promise<CurrentUserPayload> {
    const permissionCodes = new Set<string>();
    const scopePriority = ['self', 'group', 'store', 'company'];
    let dataScopeIndex = 0;
    const storeIds = (employee.stores || []).map((s: any) => s.id);
    const groupIds = (employee.groups || []).map((g: any) => g.id);

    for (const role of employee.roles || []) {
      const idx = scopePriority.indexOf(role.dataScope);
      if (idx > dataScopeIndex) dataScopeIndex = idx;
      const perms = (role.permissions || []).map((p: Permission) => p.code);
      perms.forEach((code) => permissionCodes.add(code));
    }

    return {
      employeeId: employee.id,
      mobile: employee.mobile,
      name: employee.name,
      storeIds,
      groupIds,
      dataScope: scopePriority[dataScopeIndex],
      permissions: Array.from(permissionCodes),
    };
  }

  async getMenus(user: CurrentUserPayload) {
    const allMenus = [
      { id: 'home', label: '首页', icon: 'layout-dashboard', path: '/home' },
      {
        id: 'house',
        label: '房屋管理',
        icon: 'building-2',
        children: [
          { id: 'rent', label: '租房管理', path: '/house/rent', permission: 'house:rent' },
          { id: 'sale', label: '售房管理', path: '/house/sale', permission: 'house:sale' },
          { id: 'reserve-house', label: '储备房源', path: '/house/reserve-house', permission: 'house:reserve_house' },
          { id: 'reserve-client', label: '储备客源', path: '/house/reserve-client', permission: 'house:reserve_client' },
          { id: 'customer', label: '客户管理', path: '/house/customer', permission: 'house:customer' },
          { id: 'blacklist', label: '黑名单', path: '/house/blacklist', permission: 'house:blacklist' },
          { id: 'community', label: '小区管理', path: '/house/community', permission: 'house:community' },
        ],
      },
      {
        id: 'finance',
        label: '财务管理',
        icon: 'banknote',
        children: [
          { id: 'bill', label: '账单', path: '/finance/bill', permission: 'finance:bill' },
          { id: 'flow', label: '流水账', path: '/finance/daily-account', permission: 'finance:flow' },
          { id: 'rent-increase', label: '涨价统计', path: '/finance/rent-increase', permission: 'finance:rent_increase' },
          { id: 'profit', label: '公寓利润', path: '/finance/profit', permission: 'finance:profit' },
          { id: 'partner', label: '合伙人', path: '/finance/partner', permission: 'finance:partner' },
          { id: 'income-cost', label: '收入成本', path: '/finance/income-cost', permission: 'finance:income_cost' },
          { id: 'performance', label: '业绩核算', path: '/finance/performance', permission: 'finance:performance' },
          { id: 'accounting', label: '财务核算', path: '/finance/accounting', permission: 'finance:accounting' },
          { id: 'arrears', label: '欠款统计', path: '/finance/arrears', permission: 'finance:arrears' },
          { id: 'plan', label: '收支计划', path: '/finance/plan', permission: 'finance:plan' },
          { id: 'payout', label: '代付管理', path: '/finance/payout', permission: 'finance:payout' },
          { id: 'billing', label: '开票管理', path: '/finance/billing', permission: 'finance:billing' },
        ],
      },
      {
        id: 'system',
        label: '系统管理',
        icon: 'settings',
        children: [
          { id: 'role', label: '角色管理', path: '/system/role', permission: 'system:role' },
          { id: 'permission', label: '权限管理', path: '/system/permission', permission: 'system:permission' },
          { id: 'dictionary', label: '字典管理', path: '/system/dictionary', permission: 'system:dictionary' },
          { id: 'employee', label: '人员管理', path: '/system/employee', permission: 'system:employee' },
        ],
      },
    ];

    return allMenus
      .map((group) => {
        if (group.id === 'home') return group;
        const children = (group.children || []).filter(
          (item) =>
            user.permissions.includes('*') ||
            user.permissions.includes(item.permission),
        );
        return children.length ? { ...group, children } : null;
      })
      .filter(Boolean);
  }
}
