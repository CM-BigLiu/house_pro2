import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';

function contextWith(user?: { permissions: string[] }) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as any;
}

describe('PermissionGuard', () => {
  it('allows endpoints without permission metadata', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) } as unknown as Reflector;
    expect(new PermissionGuard(reflector).canActivate(contextWith())).toBe(true);
  });

  it('returns 401 when a protected endpoint has no authenticated user', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['renting:add']) } as unknown as Reflector;
    expect(() => new PermissionGuard(reflector).canActivate(contextWith())).toThrow(UnauthorizedException);
  });

  it('returns 403 for a readonly user without the required action permission', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['renting:add']) } as unknown as Reflector;
    expect(() => new PermissionGuard(reflector).canActivate(contextWith({ permissions: ['home', 'house:rent'] }))).toThrow(ForbiddenException);
  });

  it('allows matching and wildcard permissions', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['renting:add']) } as unknown as Reflector;
    const guard = new PermissionGuard(reflector);
    expect(guard.canActivate(contextWith({ permissions: ['renting:add'] }))).toBe(true);
    expect(guard.canActivate(contextWith({ permissions: ['*'] }))).toBe(true);
  });
});
