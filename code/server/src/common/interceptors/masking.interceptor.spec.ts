import 'reflect-metadata';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, of } from 'rxjs';
import { SKIP_MASKING_KEY } from '../decorators/skip-masking.decorator';
import { MaskingInterceptor } from './masking.interceptor';

function contextFor(handler: () => void): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => class TestController {},
  } as unknown as ExecutionContext;
}

describe('MaskingInterceptor', () => {
  const interceptor = new MaskingInterceptor(new Reflector());

  it('masks sensitive fields by default', async () => {
    const result = await firstValueFrom(interceptor.intercept(
      contextFor(() => undefined),
      { handle: () => of({ mobile: '13800000000', idCard: '110101199001011234', landlordPhone: '13000000000', rooms: [{ tenantPhone: '13000000001' }] }) },
    ));

    expect(result).toEqual({ mobile: '138****0000', idCard: '110101**********1234', landlordPhone: '130****0000', rooms: [{ tenantPhone: '130****0001' }] });
  });

  it('returns raw values only for explicitly marked handlers', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata(SKIP_MASKING_KEY, true, handler);
    const raw = { mobile: '13800000000', idCard: '110101199001011234' };
    const result = await firstValueFrom(interceptor.intercept(
      contextFor(handler),
      { handle: () => of(raw) },
    ));

    expect(result).toEqual(raw);
  });
});
