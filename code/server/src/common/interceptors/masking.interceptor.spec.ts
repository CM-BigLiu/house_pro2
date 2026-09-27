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
    switchToHttp: () => ({ getRequest: () => ({ user: { employeeId: 4, permissions: [] } }) }),
  } as unknown as ExecutionContext;
}

describe('MaskingInterceptor', () => {
  const interceptor = new MaskingInterceptor(new Reflector());

  it('masks sensitive fields by default', async () => {
    const result = await firstValueFrom(interceptor.intercept(
      contextFor(() => undefined),
      { handle: () => of({ mobile: '13800000000', idCard: '110101199001011234', landlordPhone: '13000000000', customerPhone: '13900000000', rooms: [{ tenantPhone: '13000000001' }] }) },
    ));

    expect(result).toEqual({ mobile: '138****0000', idCard: '110101**********1234', landlordPhone: '130****0000', customerPhone: '139****0000', rooms: [{ tenantPhone: '130****0001' }] });
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

  it('strips private landlord fields from nested audit snapshots even when masking is skipped', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata(SKIP_MASKING_KEY, true, handler);
    const result = await firstValueFrom(interceptor.intercept(contextFor(handler), {
      handle: () => of({ afterSnapshot: { bizType: 'entire', creatorId: 9, landlordName: '私有姓名',
        landlordBankCard: '6222020000000000', leaseStart: '2026-01-01', followUpContent: '私有跟进' } }),
    }));
    expect(result.afterSnapshot).toEqual({ bizType: 'entire', creatorId: 9, canViewLandlordInfo: false });
  });

  it('preserves landlord lease dates for managed rows belonging to the current author', async () => {
    const result = await firstValueFrom(interceptor.intercept(contextFor(() => undefined), {
      handle: () => of({ list: [{ bizType: 'entire', creatorId: 4, leaseStart: '2026-01-01', leaseEnd: '2027-01-01' }] }),
    }));
    expect(result.list[0]).toMatchObject({ canViewLandlordInfo: true, leaseStart: '2026-01-01', leaseEnd: '2027-01-01' });
  });
});
