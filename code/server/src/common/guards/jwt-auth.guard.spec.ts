import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard (token_type 区分)', () => {
  let guard: JwtAuthGuard;
  let jwtService: { verify: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };

  const makeContext = (authorization?: string): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: authorization ? { authorization } : {},
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jwtService = { verify: jest.fn() };
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    guard = new JwtAuthGuard(jwtService as unknown as JwtService, reflector as unknown as Reflector);
  });

  it('V-backend-4: access token（token_type=access）应放行', () => {
    jwtService.verify.mockReturnValue({ employeeId: 1, token_type: 'access' });

    expect(guard.canActivate(makeContext('Bearer access-token'))).toBe(true);
  });

  it('V-backend-4: refresh token（token_type=refresh）调业务接口应抛 401', () => {
    jwtService.verify.mockReturnValue({ employeeId: 1, token_type: 'refresh' });

    expect(() => guard.canActivate(makeContext('Bearer refresh-token'))).toThrow(UnauthorizedException);
  });

  it('缺少 Bearer token 应抛 401', () => {
    expect(() => guard.canActivate(makeContext())).toThrow(UnauthorizedException);
  });

  it('签名无效的 token 应抛 401', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });

    expect(() => guard.canActivate(makeContext('Bearer bad'))).toThrow(UnauthorizedException);
  });
});
