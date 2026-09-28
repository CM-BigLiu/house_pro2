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
import { CurrentUserPayload } from '../decorators/current-user.decorator';
import { filterRentalLandlord } from '../utils/rental-privacy.util';

const SENSITIVE_FIELDS = new Set([
  'mobile',
  'idCard',
  'ownerIdCard',
  'bankCard',
  'ownerPhone',
  'ownerPhoneBackup',
  'landlordPhone',
  'landlordIdCard',
  'landlordBankCard',
  'tenantPhone',
  'customerPhone',
  'customerIdCard',
  'payerAccount',
  'payeeAccount',
  'tenantIdCard',
]);

function maskValue(key: string, value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (['mobile', 'ownerPhone', 'ownerPhoneBackup', 'landlordPhone', 'tenantPhone', 'customerPhone'].includes(key)) {
    return maskPhone(value);
  }
  if (['idCard', 'ownerIdCard', 'landlordIdCard', 'tenantIdCard', 'customerIdCard'].includes(key)) return maskIdCard(value);
  if (['bankCard', 'landlordBankCard', 'payerAccount', 'payeeAccount'].includes(key)) return maskBankCard(value);
  return value;
}

function maskObject(obj: unknown, user?: CurrentUserPayload, skipMasking = false): unknown {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskObject(item, user, skipMasking));
  }

  if (obj instanceof Date) {
    // Date 等内置对象直接透传，避免被序列化成 {}
    return obj;
  }

  if (typeof obj === 'object') {
    let record = obj as Record<string, any>;
    // 同时保护列表、详情与操作日志中的历史房源快照；SkipMasking 不能绕过可见性限制。
    if (['entire', 'shared'].includes(record.bizType)
      || ['landlordName', 'landlordRent', 'landlordBankCard', 'isManaged'].some(key => key in record)) {
      record = filterRentalLandlord(record, user);
    }
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(record)) {
      if (!skipMasking && SENSITIVE_FIELDS.has(key)) {
        result[key] = maskValue(key, value);
      } else if (typeof value === 'object') {
        result[key] = maskObject(value, user, skipMasking);
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
    const user = context.switchToHttp().getRequest().user;
    return next.handle().pipe(map((data) => maskObject(data, user, skipMasking)));
  }
}
