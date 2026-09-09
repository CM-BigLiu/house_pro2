import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { maskBankCard, maskIdCard, maskPhone } from '../utils/mask.util';
import { SKIP_MASKING_KEY } from '../decorators/skip-masking.decorator';

const SENSITIVE_FIELDS = new Set([
  'mobile',
  'idCard',
  'ownerIdCard',
  'bankCard',
  'ownerPhone',
  'ownerPhoneBackup',
  'landlordPhone',
  'tenantPhone',
]);

function maskValue(key: string, value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (['mobile', 'ownerPhone', 'ownerPhoneBackup', 'landlordPhone', 'tenantPhone'].includes(key)) {
    return maskPhone(value);
  }
  if (key === 'idCard' || key === 'ownerIdCard') return maskIdCard(value);
  if (key === 'bankCard') return maskBankCard(value);
  return value;
}

function maskObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskObject(item));
  }

  if (obj instanceof Date) {
    // Date 等内置对象直接透传，避免被序列化成 {}
    return obj;
  }

  if (typeof obj === 'object') {
    const record = obj as Record<string, any>;
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(record)) {
      if (SENSITIVE_FIELDS.has(key)) {
        result[key] = maskValue(key, value);
      } else if (typeof value === 'object') {
        result[key] = maskObject(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return obj;
}

@Injectable()
export class MaskingInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skipMasking = this.reflector.getAllAndOverride<boolean>(SKIP_MASKING_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipMasking) return next.handle();
    return next.handle().pipe(map((data) => maskObject(data)));
  }
}
