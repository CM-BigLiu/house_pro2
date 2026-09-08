/**
 * int.backend 集成测试（TDD 红 phase）：
 * 登录 → 刷新 → 登出 全链路，真实 PostgreSQL 读写 refresh_token 表，覆盖 V-backend-1~4。
 *
 * 运行方式（stage.test_commands = `cd code/server && npm test`，rootDir=src，仅跑 *.spec.ts）：
 *   DB_DATABASE=house_pro_int npx jest src/int/auth-token-refresh.int.spec.ts
 * 本文件会自建独立测试库 house_pro_int（synchronize 建表 + 造数），
 * 不触碰 house_pro 业务库，也不会影响 3000 端口正在运行的 dev-local 服务。
 */
import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as net from 'net';
import { createHash } from 'crypto';
import { DataSource, Repository } from 'typeorm';

import { AuthModule } from '../modules/auth/auth.module';
import { AuthService } from '../modules/auth/auth.service';
import { RefreshToken, RefreshTokenStatus } from '../modules/auth/entities/refresh-token.entity';
import { Employee } from '../modules/system/entities/employee.entity';
import { Role } from '../modules/system/entities/role.entity';
import { Permission } from '../modules/system/entities/permission.entity';
import { Store } from '../modules/system/entities/store.entity';
import { Department } from '../modules/system/entities/department.entity';
import { Position } from '../modules/system/entities/position.entity';
import { Group } from '../modules/system/entities/group.entity';
import { City } from '../modules/system/entities/city.entity';
import { Company } from '../modules/system/entities/company.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const SEVEN_DAYS_MS = 7 * 24 * 3600 * 1000;
const TWO_HOURS_MS = 2 * 3600 * 1000;

const INT_DB = process.env.INT_DB_DATABASE || 'house_pro_int';
const ACCESS_SECRET = 'int_access_secret_for_test';
const REFRESH_SECRET = 'int_refresh_secret_for_test';

const TEST_MOBILE = '19900000001';
const TEST_PASSWORD = 'IntTest@123';

/** 断言用 mock：refresh token 不应被 JwtAuthGuard 当成合法 access token */
const requestWith = (token: string) =>
  ({ headers: { authorization: `Bearer ${token}` } } as any);
const ctxOf = (req: any) =>
  ({
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any);

function decodeJwtPayload(token: string): any {
  const part = token.split('.')[1];
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
}

async function httpJson(
  port: number,
  method: string,
  path: string,
  body?: unknown,
  accessToken?: string,
): Promise<{ status: number; body: any }> {
  const payload = body === undefined ? '' : JSON.stringify(body);
  const raw = await new Promise<string>((resolve, reject) => {
    const req = net.createConnection({ host: '127.0.0.1', port }, () => {
      const headers = [
        `${method} ${path} HTTP/1.1`,
        `Host: 127.0.0.1:${port}`,
        'Connection: close',
        'Content-Type: application/json',
        `Content-Length: ${Buffer.byteLength(payload)}`,
      ];
      if (accessToken) headers.push(`Authorization: Bearer ${accessToken}`);
      req.write(headers.join('\r\n') + '\r\n\r\n' + payload);
    });
    let raw = '';
    req.on('data', (chunk) => (raw += chunk.toString('utf8')));
    req.on('end', () => resolve(raw));
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('http timeout')));
  });

  const sep = raw.indexOf('\r\n\r\n');
  const statusLine = raw.slice(0, raw.indexOf('\r\n'));
  const status = parseInt(statusLine.split(' ')[1], 10);
  const rawBody = raw.slice(sep + 4);
  let parsed: any = null;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    // 可能为 chunked，本测试仅注册 auth 路由，响应体很小不会出现
  }
  return { status, body: parsed };
}

describe('int.backend: 登录→刷新→登出 全链路（真实 DB refresh_token 读写）', () => {
  let admin: DataSource;
  let ds: DataSource;
  let app: INestApplication;
  let authService: AuthService;
  let refreshRepo: Repository<RefreshToken>;
  let jwtService: JwtService;
  let guard: JwtAuthGuard;
  let port: number;

  const dbAvailable = async (): Promise<boolean> => {
    try {
      admin = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: 'postgres',
      });
      await admin.initialize();
      return true;
    } catch {
      return false;
    }
  };

  beforeAll(async () => {
    if (!(await dbAvailable())) {
      throw new Error('dev-local PostgreSQL 不可达，无法执行 int.backend 集成测试');
    }
    await admin.query(`DROP DATABASE IF EXISTS ${INT_DB}`);
    await admin.query(`CREATE DATABASE ${INT_DB}`);

    process.env.JWT_SECRET = ACCESS_SECRET;
    process.env.JWT_REFRESH_SECRET = REFRESH_SECRET;
    process.env.JWT_ACCESS_EXPIRES_IN = '2h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET: ACCESS_SECRET,
              JWT_REFRESH_SECRET: REFRESH_SECRET,
              JWT_ACCESS_EXPIRES_IN: '2h',
              JWT_REFRESH_EXPIRES_IN: '7d',
            }),
          ],
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: INT_DB,
          entities: [RefreshToken, Employee, Role, Permission, Store, Department, Position, Group, City, Company],
          synchronize: true,
          logging: ['error'],
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: ['error', 'warn', 'log', 'debug', 'verbose'] });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    // 动态端口监听，避免与 dev-local 3000 端口冲突
    const server = app.getHttpAdapter().getHttpServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = server.address().port;

    ds = app.get(DataSource);
    authService = app.get(AuthService);
    refreshRepo = app.get<Repository<RefreshToken>>(getRepositoryToken(RefreshToken));
    jwtService = app.get(JwtService);
    guard = new JwtAuthGuard(jwtService, app.get(Reflector));

    // 造数：可登录员工
    await ds.getRepository(Employee).save({
      name: '集成测试员工',
      mobile: TEST_MOBILE,
      password: await bcrypt.hash(TEST_PASSWORD, 10),
      status: 'normal',
    });
  }, 60000);

  /**
   * 每次测试登录前重置员工密码（唯一 nonce）并确保跨秒签发，避免 refresh token 撞库：
   * JWT iat 精度为秒，同一 employeeId 同秒签发的 refresh token 完全一致 → tokenHash 唯一索引冲突。
   */
  let pwdNonce = 0;
  const loginAsTestEmployee = async (): Promise<{ status: number; body: any }> => {
    pwdNonce += 1;
    const password = `${TEST_PASSWORD}#${pwdNonce}`;
    await ds.getRepository(Employee).update(
      { mobile: TEST_MOBILE },
      { password: await bcrypt.hash(password, 10) },
    );
    // 跨秒再发请求，保证 iat 不同
    await new Promise((r) => setTimeout(r, 1100));
    return httpJson(port, 'POST', '/auth/login', { mobile: TEST_MOBILE, password });
  };

  afterAll(async () => {
    if (app) await app.close();
    if (admin) {
      try {
        // 断开残余连接后清理测试库
        await admin.query(
          `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${INT_DB}' AND pid <> pg_backend_pid()`,
        );
        await admin.query(`DROP DATABASE IF EXISTS ${INT_DB}`);
      } finally {
        await admin.destroy();
      }
    }
  });

  it('11.1-V1: login 返回双令牌并落库 active 记录，expiresAt≈签发+7d（绝对过期）', async () => {
    const before = Date.now();
    const res = await loginAsTestEmployee();

    expect(res.status).toBe(201);
    expect(res.body.code).toBe(200);
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(typeof res.body.data.refreshToken).toBe('string');
    expect(res.body.data.accessToken).not.toBe(res.body.data.refreshToken);
    expect(res.body.data.user.mobile).toBe('199****0001');
    expect(res.body.data.token).toBeUndefined();

    // payload 区分 token_type（V-backend-4 前置）
    expect(decodeJwtPayload(res.body.data.accessToken).token_type).toBe('access');
    expect(decodeJwtPayload(res.body.data.refreshToken).token_type).toBe('refresh');

    // V-backend-1: 真实 DB 落库
    const rows = await refreshRepo.find({ where: { userId: res.body.data.user.id } });
    expect(rows.length).toBe(1);
    expect(rows[0].status).toBe(RefreshTokenStatus.Active);
    const delta = rows[0].expiresAt.getTime() - before;
    expect(delta).toBeGreaterThan(SEVEN_DAYS_MS - 5000);
    expect(delta).toBeLessThan(SEVEN_DAYS_MS + 5000);
    // access token 2h 短时效
    const accessPayload = decodeJwtPayload(res.body.data.accessToken);
    expect(accessPayload.exp - accessPayload.iat).toBe(TWO_HOURS_MS / 1000);
  });

  it('11.1-V2: refresh token 落库为 sha256(64 hex)，明文不落库', async () => {
    const res = await loginAsTestEmployee();
    expect(res.status).toBe(201);

    const row = await refreshRepo.findOne({
      where: { tokenHash: sha256(res.body.data.refreshToken) },
    });
    expect(row).not.toBeNull();
    expect(row!.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(row!.tokenHash).not.toBe(res.body.data.refreshToken);
  });

  it('11.1-V3: revokeUserTokens 批次吊销后，历史 refresh token 刷新返回 401', async () => {
    const res = await loginAsTestEmployee();
    expect(res.status).toBe(201);
    const { refreshToken } = res.body.data;
    const userId = res.body.data.user.id;

    await authService.revokeUserTokens(userId);

    const row = await refreshRepo.findOne({ where: { tokenHash: sha256(refreshToken) } });
    expect(row!.status).toBe(RefreshTokenStatus.Revoked);
    expect(row!.revokedAt).not.toBeNull();

    const refreshRes = await httpJson(port, 'POST', '/auth/refresh', { refreshToken });
    expect(refreshRes.status).toBe(401);
    expect(refreshRes.body.code).toBe(401);
  });

  it('11.1-V4: token_type 隔离——refresh 不能当 access 访问业务接口，access 不能调 refresh', async () => {
    const res = await loginAsTestEmployee();
    const { accessToken, refreshToken } = res.body.data;

    // refresh token 走 JwtAuthGuard（access 入口）→ 401
    expect(() => guard.canActivate(ctxOf(requestWith(refreshToken)))).toThrow(
      UnauthorizedException,
    );
    const meRes = await httpJson(port, 'GET', '/auth/me', undefined, refreshToken);
    expect(meRes.status).toBe(401);

    // access token 当 refresh 调 /auth/refresh → 401（且不应命中落库查询）
    const refreshRes = await httpJson(port, 'POST', '/auth/refresh', {
      refreshToken: accessToken,
    });
    expect(refreshRes.status).toBe(401);

    // 合法 access token 可访问业务接口
    const meOk = await httpJson(port, 'GET', '/auth/me', undefined, accessToken);
    expect(meOk.status).toBe(200);
    expect(meOk.body.code).toBe(200);
    expect(meOk.body.data.mobile).toBe(TEST_MOBILE);
  });

  it('11.1-FULL: 登录→刷新→登出全链路，登出后 refresh 返回 401', async () => {
    // 登录
    const loginRes = await loginAsTestEmployee();
    expect(loginRes.status).toBe(201);
    const { accessToken, refreshToken } = loginRes.body.data;

    // 刷新：得新 access token
    const refreshRes = await httpJson(port, 'POST', '/auth/refresh', { refreshToken });
    expect(refreshRes.status).toBe(201);
    expect(refreshRes.body.code).toBe(200);
    expect(typeof refreshRes.body.data.accessToken).toBe('string');
    expect(decodeJwtPayload(refreshRes.body.data.accessToken).token_type).toBe('access');
    // 契约：refresh 响应需带回 refreshToken（原样不轮换），否则前端本地 refreshToken 会被清空
    expect(refreshRes.body.data.refreshToken).toBe(refreshToken);

    // 跨多次刷新：refreshToken 不变，可反复续期（模拟跨 2h 再刷新）
    const refreshRes2 = await httpJson(port, 'POST', '/auth/refresh', { refreshToken });
    expect(refreshRes2.status).toBe(201);
    expect(refreshRes2.body.data.refreshToken).toBe(refreshToken);

    // 新 access token 可用
    const meOk = await httpJson(
      port,
      'GET',
      '/auth/me',
      undefined,
      refreshRes.body.data.accessToken,
    );
    expect(meOk.status).toBe(200);
    void accessToken;

    // 登出
    const logoutRes = await httpJson(port, 'POST', '/auth/logout', { refreshToken });
    expect(logoutRes.status).toBe(201);
    expect(logoutRes.body.code).toBe(200);

    // 真实 DB：记录置 revoked
    const row = await refreshRepo.findOne({ where: { tokenHash: sha256(refreshToken) } });
    expect(row!.status).toBe(RefreshTokenStatus.Revoked);
    expect(row!.revokedAt).not.toBeNull();

    // 登出后再次 refresh → 401
    const afterRes = await httpJson(port, 'POST', '/auth/refresh', { refreshToken });
    expect(afterRes.status).toBe(401);
    expect(afterRes.body.code).toBe(401);
  });

  it('11.1-EDGE: 过期 refresh token（DB expiresAt 已过）刷新返回 401', async () => {
    const res = await loginAsTestEmployee();
    const { refreshToken } = res.body.data;

    // 直接把落库记录的 expiresAt 拨到过去（JWT 自身 7d 签名仍有效，仅 DB 账态过期）
    await refreshRepo.update(
      { tokenHash: sha256(refreshToken) },
      { expiresAt: new Date(Date.now() - 1000) },
    );

    const refreshRes = await httpJson(port, 'POST', '/auth/refresh', { refreshToken });
    expect(refreshRes.status).toBe(401);
  });
});
