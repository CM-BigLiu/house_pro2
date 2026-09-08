import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../system/entities/employee.entity';
import { Role } from '../system/entities/role.entity';
import { Permission } from '../system/entities/permission.entity';
import { RefreshToken, RefreshTokenStatus } from './entities/refresh-token.entity';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

import { maskPhone } from '../../common/utils/mask.util';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

/** '2h' | '7d' | '30m' | number(seconds) → 毫秒 */
function parseExpiresInMs(value: string | number, fallbackMs: number): number {
  if (typeof value === 'number') return value * 1000;
  if (!value) return fallbackMs;
  const match = /^(\d+)\s*(ms|s|m|h|d)?$/.exec(String(value).trim());
  if (!match) return fallbackMs;
  const amount = parseInt(match[1], 10);
  const unit = match[2] || 's';
  const factor =
    unit === 'ms' ? 1 :
    unit === 's' ? 1000 :
    unit === 'm' ? 60 * 1000 :
    unit === 'h' ? 3600 * 1000 :
    24 * 3600 * 1000; // d
  return amount * factor;
}

const SEVEN_DAYS_MS = 7 * 24 * 3600 * 1000;
const TWO_HOURS_MS = 2 * 3600 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
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

    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '2h';
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'house_pro_jwt_refresh_secret_change_in_production';

    const accessToken = this.jwtService.sign(
      { ...payload, token_type: 'access' },
      { expiresIn: accessExpiresIn },
    );
    const refreshToken = this.jwtService.sign(
      { ...payload, token_type: 'refresh' },
      { secret: refreshSecret, expiresIn: refreshExpiresIn },
    );

    // refresh token 落库：存 sha256 hash 而非明文，绝对过期 7d（不随刷新滚动）
    const expiresAt = new Date(Date.now() + parseExpiresInMs(refreshExpiresIn, SEVEN_DAYS_MS));
    const record = this.refreshTokenRepo.create({
      userId: employee.id,
      tokenHash: sha256(refreshToken),
      status: RefreshTokenStatus.Active,
      expiresAt,
    });
    await this.refreshTokenRepo.save(record);

    return {
      accessToken,
      refreshToken,
      user: {
        id: employee.id,
        name: employee.name,
        mobile: maskPhone(employee.mobile),
        avatar: employee.avatar,
      },
    };
  }

  async refresh(refreshToken: string) {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'house_pro_jwt_refresh_secret_change_in_production';

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, { secret: refreshSecret });
    } catch (err) {
      this.logger.warn(`refresh failed: invalid signature, ${err?.message}`);
      throw new UnauthorizedException('Refresh token 无效或已注销');
    }

    if (payload?.token_type !== 'refresh') {
      this.logger.warn('refresh failed: token_type is not refresh');
      throw new UnauthorizedException('Refresh token 无效或已注销');
    }

    const record = await this.refreshTokenRepo.findOne({
      where: { tokenHash: sha256(refreshToken) },
    });
    if (
      !record ||
      record.status !== RefreshTokenStatus.Active ||
      record.expiresAt.getTime() <= Date.now()
    ) {
      this.logger.warn(
        `refresh failed: userId=${payload.employeeId}, ` +
          `reason=${!record ? 'not_found' : record.status !== RefreshTokenStatus.Active ? 'revoked' : 'expired'}`,
      );
      throw new UnauthorizedException('Refresh token 无效或已注销');
    }

    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '2h';
    const { iat, exp, ...rest } = payload;
    const accessToken = this.jwtService.sign(
      { ...rest, token_type: 'access' },
      { expiresIn: accessExpiresIn },
    );

    this.logger.log(`refresh success: userId=${payload.employeeId}`);
    // design.md 契约：refresh 响应需同时返回 accessToken 与 refreshToken，
    // 前端 doRefresh 会用返回的 refreshToken 覆盖本地存储（不轮换，原样带回）
    return { accessToken, refreshToken };
  }

  async logout(refreshToken: string) {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'house_pro_jwt_refresh_secret_change_in_production';

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, { secret: refreshSecret });
    } catch (err) {
      this.logger.warn(`logout failed: invalid signature, ${err?.message}`);
      throw new UnauthorizedException('Refresh token 无效');
    }

    if (payload?.token_type !== 'refresh') {
      this.logger.warn('logout failed: token_type is not refresh');
      throw new UnauthorizedException('Refresh token 无效');
    }

    const record = await this.refreshTokenRepo.findOne({
      where: { tokenHash: sha256(refreshToken) },
    });
    if (!record) {
      this.logger.warn(`logout failed: userId=${payload.employeeId}, reason=not_found`);
      throw new UnauthorizedException('Refresh token 无效');
    }

    if (record.status === RefreshTokenStatus.Active) {
      record.status = RefreshTokenStatus.Revoked;
      record.revokedAt = new Date();
      await this.refreshTokenRepo.save(record);
    }

    this.logger.log(`logout success: userId=${payload.employeeId}, tokenId=${record.id}`);
  }

  /** 员工停用 / 密码变更后，批次吊销该用户全部 active refresh token */
  async revokeUserTokens(userId: number): Promise<void> {
    await this.refreshTokenRepo.update(
      { userId, status: RefreshTokenStatus.Active },
      { status: RefreshTokenStatus.Revoked, revokedAt: new Date() },
    );
    this.logger.log(`revokeUserTokens: userId=${userId}`);
  }

  async buildPayload(employee: Employee): Promise<CurrentUserPayload> {
    const permissionCodes = new Set<string>();
    const scopePriority = ['self', 'group', 'store', 'assigned', 'custom', 'company'];
    let dataScopeIndex = 0;
    const storeIds = (employee.stores || []).map((s: any) => s.id);
    const groupIds = (employee.groups || []).map((g: any) => g.id);
    let assignedStoreIds: number[] = [];
    let customScope: Record<string, any> | undefined;

    for (const role of employee.roles || []) {
      const idx = scopePriority.indexOf(role.dataScope);
      if (idx > dataScopeIndex) {
        dataScopeIndex = idx;
        if (role.dataScope === 'assigned') {
          assignedStoreIds = role.assignedStores || [];
        }
        if (role.dataScope === 'custom') {
          customScope = role.customScope
            ? (typeof role.customScope === 'string' ? JSON.parse(role.customScope) : role.customScope)
            : undefined;
        }
      }
      const perms = (role.permissions || []).map((p: Permission) => p.code);
      perms.forEach((code) => permissionCodes.add(code));
    }

    return {
      employeeId: employee.id,
      mobile: employee.mobile,
      name: employee.name,
      storeIds,
      assignedStoreIds,
      groupIds,
      dataScope: scopePriority[dataScopeIndex],
      customScope,
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
