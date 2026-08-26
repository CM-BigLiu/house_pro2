import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Company } from '../../modules/system/entities/company.entity';
import { City } from '../../modules/system/entities/city.entity';
import { Store } from '../../modules/system/entities/store.entity';
import { Department } from '../../modules/system/entities/department.entity';
import { Position } from '../../modules/system/entities/position.entity';
import { Employee } from '../../modules/system/entities/employee.entity';
import { Role } from '../../modules/system/entities/role.entity';
import { Permission } from '../../modules/system/entities/permission.entity';
import { Dict } from '../../modules/system/entities/dict.entity';
import { DictItem } from '../../modules/system/entities/dict-item.entity';
import { BizSeedService } from './biz.seed';
import { dictSeedData } from './dict.seed';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(City) private cityRepo: Repository<City>,
    @InjectRepository(Store) private storeRepo: Repository<Store>,
    @InjectRepository(Department) private deptRepo: Repository<Department>,
    @InjectRepository(Position) private positionRepo: Repository<Position>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permissionRepo: Repository<Permission>,
    @InjectRepository(Dict) private dictRepo: Repository<Dict>,
    @InjectRepository(DictItem) private dictItemRepo: Repository<DictItem>,
    private bizSeed: BizSeedService,
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    const count = await this.companyRepo.count();
    if (count > 0) {
      this.logger.log('Seed skipped: data already exists');
      return;
    }
    await this.seed();
  }

  async seed() {
    this.logger.log('Seeding data...');
    await this.seedPermissions();
    await this.seedRoles();
    await this.seedOrganization();
    await this.seedDicts();
    await this.bizSeed.seedIfEmpty();
    this.logger.log('Seed completed');
  }

  private async seedPermissions() {
    const existing = new Set((await this.permissionRepo.find({ select: ['code'] })).map((p) => p.code));
    const menus = [
      { code: 'home', name: '首页', type: 'menu', path: '/home', sort: 1 },
      { code: 'house', name: '房屋管理', type: 'menu', sort: 2 },
      { code: 'house:rent', name: '租房管理', type: 'menu', parentId: null, path: '/house/rent', module: 'house', sort: 1 },
      { code: 'house:sale', name: '售房管理', type: 'menu', path: '/house/sale', module: 'house', sort: 2 },
      { code: 'house:reserve_house', name: '储备房源', type: 'menu', path: '/house/reserve-house', module: 'house', sort: 3 },
      { code: 'house:reserve_client', name: '储备客源', type: 'menu', path: '/house/reserve-client', module: 'house', sort: 4 },
      { code: 'house:customer', name: '客户管理', type: 'menu', path: '/house/customer', module: 'house', sort: 5 },
      { code: 'house:blacklist', name: '黑名单', type: 'menu', path: '/house/blacklist', module: 'house', sort: 7 },
      { code: 'house:community', name: '小区管理', type: 'menu', path: '/house/community', module: 'house', sort: 8 },
      { code: 'finance', name: '财务管理', type: 'menu', sort: 3 },
      { code: 'finance:bill', name: '账单', type: 'menu', path: '/finance/bill', module: 'finance', sort: 1 },
      { code: 'finance:flow', name: '流水账', type: 'menu', path: '/finance/daily-account', module: 'finance', sort: 2 },
      { code: 'finance:rent_increase', name: '涨价统计', type: 'menu', path: '/finance/rent-increase', module: 'finance', sort: 3 },
      { code: 'finance:profit', name: '公寓利润', type: 'menu', path: '/finance/profit', module: 'finance', sort: 4 },
      { code: 'finance:partner', name: '合伙人', type: 'menu', path: '/finance/partner', module: 'finance', sort: 5 },
      { code: 'finance:income_cost', name: '收入成本', type: 'menu', path: '/finance/income-cost', module: 'finance', sort: 6 },
      { code: 'finance:performance', name: '业绩核算', type: 'menu', path: '/finance/performance', module: 'finance', sort: 7 },
      { code: 'finance:accounting', name: '财务核算', type: 'menu', path: '/finance/accounting', module: 'finance', sort: 8 },
      { code: 'finance:arrears', name: '欠款统计', type: 'menu', path: '/finance/arrears', module: 'finance', sort: 9 },
      { code: 'finance:plan', name: '收支计划', type: 'menu', path: '/finance/plan', module: 'finance', sort: 10 },
      { code: 'finance:payout', name: '代付管理', type: 'menu', path: '/finance/payout', module: 'finance', sort: 11 },
      { code: 'finance:billing', name: '开票管理', type: 'menu', path: '/finance/billing', module: 'finance', sort: 12 },
      { code: 'system', name: '系统管理', type: 'menu', sort: 4 },
      { code: 'system:role', name: '角色管理', type: 'menu', path: '/system/role', module: 'system', sort: 1 },
      { code: 'system:permission', name: '权限管理', type: 'menu', path: '/system/permission', module: 'system', sort: 2 },
      { code: 'system:dictionary', name: '字典管理', type: 'menu', path: '/system/dictionary', module: 'system', sort: 3 },
      { code: 'system:employee', name: '人员管理', type: 'menu', path: '/system/employee', module: 'system', sort: 4 },
    ];
    const actions = [
      { code: 'renting:add', name: '新建房间', type: 'action', module: 'house' },
      { code: 'renting:edit', name: '编辑房间', type: 'action', module: 'house' },
      { code: 'renting:checkout', name: '退房登记', type: 'action', module: 'house' },
      { code: 'renting:export', name: '导出', type: 'action', module: 'house' },
      { code: 'sale:add', name: '新房源录入', type: 'action', module: 'house' },
      { code: 'sale:edit', name: '修改房源', type: 'action', module: 'house' },
      { code: 'sale:changeStatus', name: '上架/下架/成交', type: 'action', module: 'house' },
      { code: 'sale:export', name: '导出', type: 'action', module: 'house' },
      { code: 'reserve:house:add', name: '录入房源', type: 'action', module: 'house' },
      { code: 'reserve:house:take', name: '拿房签约', type: 'action', module: 'house' },
      { code: 'reserve:house:transfer', name: '转业务员', type: 'action', module: 'house' },
      { code: 'reserve:client:add', name: '录入客源', type: 'action', module: 'house' },
      { code: 'reserve:client:transfer', name: '转签约', type: 'action', module: 'house' },
      { code: 'house:customer:create', name: '新增客户', type: 'action', module: 'house' },
      { code: 'house:blacklist:delete', name: '删除黑名单', type: 'action', module: 'house' },
      { code: 'finance:bill:modify', name: '修改账单', type: 'action', module: 'finance' },
      { code: 'finance:bill:cancel', name: '作废账单', type: 'action', module: 'finance' },
      { code: 'finance:ticket:apply', name: '开票申请', type: 'action', module: 'finance' },
      { code: 'finance:ticket:approve', name: '开票审批', type: 'action', module: 'finance' },
      { code: 'finance:payout:batch', name: '批量代付', type: 'action', module: 'finance' },
      { code: 'finance:export', name: '导出报表', type: 'action', module: 'finance' },
      { code: 'system:role:create', name: '创建角色', type: 'action', module: 'system' },
      { code: 'system:role:edit', name: '编辑角色', type: 'action', module: 'system' },
      { code: 'system:role:delete', name: '删除角色', type: 'action', module: 'system' },
      { code: 'system:permission:edit', name: '编辑权限', type: 'action', module: 'system' },
      { code: 'system:dictionary:edit', name: '编辑字典', type: 'action', module: 'system' },
      { code: 'system:employee:edit', name: '编辑员工', type: 'action', module: 'system' },
    ];
    const all = [...menus, ...actions].filter((p) => !existing.has(p.code));
    if (all.length) {
      await this.permissionRepo.save(all.map((p) => this.permissionRepo.create(p)));
    }
  }

  private async seedRoles() {
    const allPerms = await this.permissionRepo.find();
    const menuCodes = new Set(allPerms.filter((p) => p.type === 'menu').map((p) => p.code));
    const existing = new Set((await this.roleRepo.find({ select: ['code'] })).map((r) => r.code));
    const roleConfigs: { code: string; name: string; dataScope: string; isBuiltin: boolean }[] = [
      { code: 'super_admin', name: '超级管理员', dataScope: 'company', isBuiltin: true },
      { code: 'company_admin', name: '公司管理员', dataScope: 'company', isBuiltin: true },
      { code: 'store_manager', name: '店长', dataScope: 'store', isBuiltin: true },
      { code: 'finance_manager', name: '财务负责人', dataScope: 'company', isBuiltin: true },
      { code: 'finance_clerk', name: '财务专员', dataScope: 'store', isBuiltin: true },
      { code: 'housekeeper', name: '管家', dataScope: 'group', isBuiltin: true },
      { code: 'salesman', name: '业务员', dataScope: 'self', isBuiltin: true },
      { code: 'agent', name: '综合经纪人', dataScope: 'self', isBuiltin: true },
      { code: 'readonly', name: '只读账号', dataScope: 'store', isBuiltin: true },
    ];

    const roleMenuAllowlist: Record<string, string[]> = {
      super_admin: Array.from(menuCodes),
      company_admin: Array.from(menuCodes),
      store_manager: ['home', 'house', 'house:rent', 'house:sale', 'house:reserve_house', 'house:reserve_client', 'house:customer', 'house:blacklist', 'house:community', 'finance', 'finance:bill', 'finance:flow', 'finance:arrears', 'finance:plan', 'finance:payout', 'finance:rent_increase', 'finance:profit', 'finance:partner', 'finance:income_cost', 'finance:performance', 'finance:accounting', 'finance:billing'],
      finance_manager: ['home', 'finance', 'finance:bill', 'finance:flow', 'finance:arrears', 'finance:plan', 'finance:payout', 'finance:rent_increase', 'finance:profit', 'finance:partner', 'finance:income_cost', 'finance:performance', 'finance:accounting', 'finance:billing', 'house', 'house:rent', 'house:sale', 'house:customer'],
      finance_clerk: ['home', 'finance', 'finance:bill', 'finance:flow', 'finance:arrears', 'finance:plan', 'finance:payout'],
      housekeeper: ['home', 'house', 'house:rent', 'house:reserve_house', 'house:customer', 'house:community'],
      salesman: ['home', 'house', 'house:rent', 'house:sale', 'house:reserve_house', 'house:reserve_client', 'house:customer', 'house:community'],
      agent: ['home', 'house', 'house:rent', 'house:sale', 'house:reserve_house', 'house:reserve_client', 'house:customer', 'house:community'],
      readonly: ['home', 'house', 'house:rent', 'house:sale', 'house:reserve_house', 'house:reserve_client', 'house:customer', 'house:blacklist', 'house:community', 'finance', 'finance:bill', 'finance:flow', 'finance:arrears', 'finance:plan', 'finance:payout', 'finance:rent_increase', 'finance:profit', 'finance:partner', 'finance:income_cost', 'finance:performance', 'finance:accounting', 'finance:billing'],
    };

    const roleActionAllowlist: Record<string, string[]> = {
      super_admin: allPerms.filter((p) => p.type === 'action').map((p) => p.code),
      company_admin: allPerms.filter((p) => p.type === 'action').map((p) => p.code),
      store_manager: ['sale:add', 'sale:edit', 'sale:changeStatus', 'sale:export', 'renting:add', 'renting:edit', 'renting:checkout', 'renting:export', 'reserve:house:add', 'reserve:house:take', 'reserve:house:transfer', 'reserve:client:add', 'reserve:client:transfer', 'house:customer:create', 'finance:bill:modify', 'finance:bill:cancel', 'finance:payout:batch', 'finance:export', 'system:employee:edit'],
      finance_manager: ['finance:bill:modify', 'finance:bill:cancel', 'finance:ticket:apply', 'finance:ticket:approve', 'finance:payout:batch', 'finance:export'],
      finance_clerk: ['finance:bill:modify', 'finance:ticket:apply', 'finance:payout:batch'],
      housekeeper: ['renting:add', 'renting:edit', 'renting:checkout', 'reserve:house:add', 'reserve:house:take'],
      salesman: ['sale:add', 'sale:edit', 'sale:changeStatus', 'sale:export', 'reserve:client:add', 'reserve:client:transfer', 'house:customer:create'],
      agent: ['sale:add', 'sale:edit', 'sale:changeStatus', 'sale:export', 'reserve:client:add', 'reserve:client:transfer', 'house:customer:create'],
      readonly: [],
    };

    for (const cfg of roleConfigs) {
      if (existing.has(cfg.code)) continue;
      const allowedMenus = new Set(roleMenuAllowlist[cfg.code] || []);
      const allowedActions = new Set(roleActionAllowlist[cfg.code] || []);
      const rolePerms = allPerms.filter(
        (p) => (p.type === 'menu' && allowedMenus.has(p.code)) || (p.type === 'action' && allowedActions.has(p.code)),
      );
      const role = this.roleRepo.create({ ...cfg, permissions: rolePerms });
      await this.roleRepo.save(role);
    }
  }

  private async seedOrganization() {
    const company = await this.companyRepo.save(this.companyRepo.create({ name: '优居科技', status: 'active' }));
    const shanghai = await this.cityRepo.save(this.cityRepo.create({ name: '上海', companyId: company.id }));
    await this.cityRepo.save(this.cityRepo.create({ name: '北京', companyId: company.id }));

    const stores = await this.storeRepo.save([
      { name: '张江店', cityId: shanghai.id, address: '上海市浦东新区张江路 1 号', phone: '021-12345678', status: 'active' },
      { name: '浦东店', cityId: shanghai.id, address: '上海市浦东新区世纪大道 88 号', phone: '021-87654321', status: 'active' },
      { name: '联洋店', cityId: shanghai.id, address: '上海市浦东新区丁香路 1000 号', phone: '021-11223344', status: 'active' },
    ]);

    const depts = await this.deptRepo.save([
      { name: '业务部', storeId: stores[0].id },
      { name: '财务部', storeId: stores[0].id },
      { name: '销售部', storeId: stores[0].id },
    ]);

    const existingPositions = new Set((await this.positionRepo.find({ select: ['name'] })).map((p) => p.name));
    const positions = [
      { name: '店长', code: 'store_manager', defaultRoleIds: [] },
      { name: '业务员', code: 'salesman', defaultRoleIds: [] },
      { name: '财务专员', code: 'finance_clerk', defaultRoleIds: [] },
      { name: '管家', code: 'housekeeper', defaultRoleIds: [] },
      { name: '综合经纪人', code: 'agent', defaultRoleIds: [] },
    ].filter((p) => !existingPositions.has(p.name));
    if (positions.length) {
      await this.positionRepo.save(positions);
    }

    const roles = await this.roleRepo.find({ relations: ['permissions'] });
    const roleMap = Object.fromEntries(roles.map((r) => [r.code, r]));

    const existingEmployees = new Set((await this.employeeRepo.find({ select: ['mobile'] })).map((e) => e.mobile));
    const password = await bcrypt.hash('123456', 10);
    const employeeData = [
      { name: '超级管理员', mobile: 'super_admin', password, roles: [roleMap.super_admin], stores },
      { name: '王老板', mobile: 'boss', password, roles: [roleMap.company_admin], stores },
      { name: '张店长', mobile: 'store_manager', password, roles: [roleMap.store_manager], stores: [stores[0]] },
      { name: '李业务员', mobile: 'salesman', password, roles: [roleMap.salesman], stores: [stores[0]], departments: [depts[0]] },
      { name: '赵财务', mobile: 'finance', password, roles: [roleMap.finance_manager], stores: [stores[0]], departments: [depts[1]] },
      { name: '周管家', mobile: 'housekeeper', password, roles: [roleMap.housekeeper], stores: [stores[0]], departments: [depts[2]] },
      { name: '吴经纪人A', mobile: 'agent01', password, roles: [roleMap.agent], stores: [stores[0]], departments: [depts[0]] },
      { name: '郑经纪人B', mobile: 'agent02', password, roles: [roleMap.agent], stores: [stores[1]], departments: [depts[0]] },
      { name: '孙只读', mobile: 'readonly', password, roles: [roleMap.readonly], stores },
    ].filter((e) => !existingEmployees.has(e.mobile));
    const employees = employeeData.length ? await this.employeeRepo.save(employeeData) : [];
  }

  private async seedDicts() {
    const existingDicts = new Map((await this.dictRepo.find()).map((d) => [d.code, d]));
    for (const [code, items] of Object.entries(dictSeedData)) {
      let dict = existingDicts.get(code);
      if (!dict) {
        dict = await this.dictRepo.save(this.dictRepo.create({ code, name: items[0]?.group || code }));
      }
      const existingItems = new Set((await this.dictItemRepo.find({ where: { dictCode: code }, select: ['value'] })).map((i) => i.value));
      const newItems = items
        .filter((item: any) => !existingItems.has(item.value))
        .map((item: any, index: number) =>
          this.dictItemRepo.create({
            dictCode: code,
            value: item.value,
            label: item.label,
            sort: index + 1,
            enabled: true,
            isBuiltin: true,
          }));
      if (newItems.length) {
        await this.dictItemRepo.save(newItems);
      }
    }
  }
}
