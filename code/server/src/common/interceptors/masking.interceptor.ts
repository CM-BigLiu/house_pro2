import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { maskBankCard, maskIdCard, maskPhone } from '../utils/mask.util';

const SENSITIVE_FIELDS = new Set([
  'mobile',
  'idCard',
  'bankCard',
  'ownerPhone',
  'ownerPhoneBackup',
]);

function maskValue(key: string, value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (key === 'mobile' || key === 'ownerPhone' || key === 'ownerPhoneBackup') {
    return maskPhone(value);
  }
  if (key === 'idCard') return maskIdCard(value);
  if (key === 'bankCard') return maskBankCard(value);
  return value;
}

function maskObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskObject(item));
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
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => maskObject(data)));
  }
}
