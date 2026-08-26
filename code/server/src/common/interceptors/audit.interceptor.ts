import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_OPTIONS_KEY, AuditOptions } from '../decorators/audit.decorator';
import { OperationLogService } from '../../modules/house/services/operation-log.service';

function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function isMutatingMethod(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

function sanitizeSnapshot(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  const sensitive = ['password', 'token'];
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeSnapshot(item));
  }
  const result: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (sensitive.includes(key)) {
      result[key] = '***';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeSnapshot(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private operationLogService: OperationLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const audit = this.reflector.getAllAndOverride<AuditOptions>(AUDIT_OPTIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (!audit || !isMutatingMethod(method)) {
      return next.handle();
    }

    const user = request.user;
    if (!user) return next.handle();

    const objectType = audit.objectType || this.inferObjectType(context);
    const paramId = audit.objectIdPath
      ? getValueByPath(request, audit.objectIdPath)
      : getValueByPath(request, 'params.id');

    const ip = request.ip || request.connection?.remoteAddress || '';
    const userAgent = request.headers['user-agent'] || '';

    return next.handle().pipe(
      tap((result) => {
        const objectId = paramId || (result && (result.id ?? result.objectId)) || '';
        const afterSnapshot = audit.captureAfter !== false && result
          ? sanitizeSnapshot(result)
          : null;
        this.operationLogService.log(user, audit.module, audit.action, {
          objectType,
          objectId: String(objectId || ''),
          afterSnapshot,
          ip,
          userAgent,
          result: 'success',
        }).catch((err) => {
          console.error('[AuditInterceptor] failed to write log', err);
        });
      }),
    );
  }

  private inferObjectType(context: ExecutionContext): string {
    const controllerPath = this.reflector.get('path', context.getClass()) || '';
    const parts = controllerPath.split('/').filter(Boolean);
    return parts[parts.length - 1] || 'unknown';
  }
}
