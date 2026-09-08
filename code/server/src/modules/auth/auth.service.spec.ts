import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { Employee } from '../system/entities/employee.entity';
import { Role } from '../system/entities/role.entity';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const SEVEN_DAYS_MS = 7 * 24 * 3600 * 1000;

describe('AuthService (auth-token-refresh)', () => {
  let service: AuthService;
  let employeeRepo: { findOne: jest.Mock };
  let roleRepo: Record<string, never>;
  let refreshTokenRepo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };

  const FIXED_NOW = new Date('2026-09-04T00:00:00.000Z');

  const makeEmployee = async (): Promise<Employee> => {
    const employee = new Employee();
    employee.id = 1;
    employee.name = '张三';
    employee.mobile = '13800000000';
    employee.password = await bcrypt.hash('secret-password', 10);
    employee.avatar = 'https://example.com/a.png';
    (employee as any).roles = [];
    (employee as any).stores = [];
    (employee as any).groups = [];
    return employee;
  };

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(FIXED_NOW);

    employeeRepo = { findOne: jest.fn() };
    roleRepo = {};
    refreshTokenRepo = {
      create: jest.fn((entity: Partial<RefreshToken>) => entity),
      save: jest.fn(async (entity: Partial<RefreshToken>) => ({ id: 100, ...entity })),
      findOne: jest.fn(),
      update: jest.fn(async () => ({ affected: 1 })),
    };
    jwtService = {
      // access / refresh 用不同签名结果区分，payload 含 token_type
      sign: jest.fn((payload: any) => `${payload.token_type}-signed-token`),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Employee), useValue: employeeRepo },
        { provide: getRepositoryToken(Role), useValue: roleRepo },
        { provide: getRepositoryToken(RefreshToken), useValue: refreshTokenRepo },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              ({
                JWT_ACCESS_EXPIRES_IN: '2h',
                JWT_REFRESH_EXPIRES_IN: '7d',
                JWT_REFRESH_SECRET: 'refresh-secret',
              })[key],
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('应返回 accessToken + refreshToken 双令牌（结构变更）', async () => {
      employeeRepo.findOne.mockResolvedValue(await makeEmployee());

      const result = await service.login('13800000000', 'secret-password');

      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.accessToken).not.toBe(result.refreshToken);
      expect(result.user).toEqual({
        id: 1,
        name: '张三',
        mobile: '138****0000',
        avatar: 'https://example.com/a.png',
      });
      // 破坏性变更：不再返回旧字段 token
      expect((result as any).token).toBeUndefined();
    });

    it('签发的 access token payload 应带 token_type=access，refresh token 带 token_type=refresh', async () => {
      employeeRepo.findOne.mockResolvedValue(await makeEmployee());

      await service.login('13800000000', 'secret-password');

      const payloads = jwtService.sign.mock.calls.map((c) => c[0]);
      const accessPayload = payloads.find((p: any) => p.token_type === 'access');
      const refreshPayload = payloads.find((p: any) => p.token_type === 'refresh');
      expect(accessPayload).toBeDefined();
      expect(refreshPayload).toBeDefined();
    });

    it('V-backend-1: refresh token 应落库为 active 记录，expiresAt = 签发时间 + 7d（绝对过期）', async () => {
      employeeRepo.findOne.mockResolvedValue(await makeEmployee());

      await service.login('13800000000', 'secret-password');

      expect(refreshTokenRepo.save).toHaveBeenCalledTimes(1);
      const saved = refreshTokenRepo.save.mock.calls[0][0] as Partial<RefreshToken>;
      expect(saved.userId).toBe(1);
      expect(saved.status).toBe('active');
      expect(saved.expiresAt).toBeInstanceOf(Date);
      expect((saved.expiresAt as Date).getTime()).toBe(FIXED_NOW.getTime() + SEVEN_DAYS_MS);
    });

    it('V-backend-2: refresh token 落库为 sha256 hash（64 hex），明文不落库', async () => {
      employeeRepo.findOne.mockResolvedValue(await makeEmployee());

      const result = await service.login('13800000000', 'secret-password');

      const saved = refreshTokenRepo.save.mock.calls[0][0] as Partial<RefreshToken>;
      expect(saved.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(saved.tokenHash).toBe(sha256(result.refreshToken));
      expect(saved.tokenHash).not.toBe(result.refreshToken);
    });
  });

  describe('refresh', () => {
    const REFRESH_PLAIN = 'refresh-signed-token';

    it('合法的 refresh token 应换发新 access token', async () => {
      jwtService.verify.mockReturnValue({ employeeId: 1, mobile: '13800000000', token_type: 'refresh' });
      refreshTokenRepo.findOne.mockResolvedValue({
        id: 100,
        userId: 1,
        tokenHash: sha256(REFRESH_PLAIN),
        status: 'active',
        expiresAt: new Date(FIXED_NOW.getTime() + SEVEN_DAYS_MS),
      } as RefreshToken);

      const result = await service.refresh(REFRESH_PLAIN);

      expect(typeof result.accessToken).toBe('string');
      // 契约：refresh 响应需带回 refreshToken（原样，不轮换），前端依赖它覆盖本地存储
      expect(result.refreshToken).toBe(REFRESH_PLAIN);
      expect(jwtService.verify).toHaveBeenCalledWith(REFRESH_PLAIN, expect.anything());
      // 落库查询应走 tokenHash
      expect(refreshTokenRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tokenHash: sha256(REFRESH_PLAIN) }) }),
      );
    });

    it('V-backend-1: 过期的 refresh token 刷新应抛 401', async () => {
      jwtService.verify.mockReturnValue({ employeeId: 1, token_type: 'refresh' });
      refreshTokenRepo.findOne.mockResolvedValue({
        id: 100,
        userId: 1,
        tokenHash: sha256(REFRESH_PLAIN),
        status: 'active',
        expiresAt: new Date(FIXED_NOW.getTime() - 1000), // 已过期
      } as RefreshToken);

      await expect(service.refresh(REFRESH_PLAIN)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('V-backend-3: revokeUserTokens 后，该用户历史 refresh token 刷新应抛 401', async () => {
      jwtService.verify.mockReturnValue({ employeeId: 1, token_type: 'refresh' });
      refreshTokenRepo.findOne.mockResolvedValue({
        id: 100,
        userId: 1,
        tokenHash: sha256(REFRESH_PLAIN),
        status: 'revoked',
        expiresAt: new Date(FIXED_NOW.getTime() + SEVEN_DAYS_MS),
        revokedAt: FIXED_NOW,
      } as RefreshToken);

      await service.revokeUserTokens(1);
      expect(refreshTokenRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1 }),
        expect.objectContaining({ status: 'revoked' }),
      );

      await expect(service.refresh(REFRESH_PLAIN)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('V-backend-4: access token（token_type=access）不能用于 refresh，应抛 401', async () => {
      jwtService.verify.mockReturnValue({ employeeId: 1, token_type: 'access' });

      await expect(service.refresh('access-signed-token')).rejects.toBeInstanceOf(UnauthorizedException);
      // token_type 错误时不应查询落库
      expect(refreshTokenRepo.findOne).not.toHaveBeenCalled();
    });

    it('DB 中不存在对应 hash 的 refresh token 应抛 401', async () => {
      jwtService.verify.mockReturnValue({ employeeId: 1, token_type: 'refresh' });
      refreshTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.refresh(REFRESH_PLAIN)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('logout 应将 refresh token 置为 revoked，之后刷新 401', async () => {
      const REFRESH_PLAIN = 'refresh-signed-token';
      jwtService.verify.mockReturnValue({ employeeId: 1, token_type: 'refresh' });
      const activeRecord = {
        id: 100,
        userId: 1,
        tokenHash: sha256(REFRESH_PLAIN),
        status: 'active',
        expiresAt: new Date(FIXED_NOW.getTime() + SEVEN_DAYS_MS),
      } as RefreshToken;
      refreshTokenRepo.findOne.mockResolvedValue(activeRecord);

      await service.logout(REFRESH_PLAIN);

      expect(refreshTokenRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'revoked', revokedAt: expect.any(Date) }),
      );
    });

    it('无效的 refresh token 登出应抛 401', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      await expect(service.logout('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
