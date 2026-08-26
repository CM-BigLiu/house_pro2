import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: CurrentUserPayload = request.user;
    if (!user) throw new UnauthorizedException('未登录');

    const has = required.some((p) => user.permissions.includes(p) || user.permissions.includes('*'));
    if (!has) throw new ForbiddenException('无操作权限');
    return true;
  }
}
