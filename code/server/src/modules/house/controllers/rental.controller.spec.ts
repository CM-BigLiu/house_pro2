import { PERMISSION_KEY } from '../../../common/decorators/require-permission.decorator';
import { ValidationPipe } from '@nestjs/common';
import { CreateRentalSetDto, RentalController } from './rental.controller';

describe('RentalController permissions', () => {
  it('requires renting:edit for unmasked rental edit detail', () => {
    const required = Reflect.getMetadata(PERMISSION_KEY, RentalController.prototype.findOne);
    expect(required).toEqual(['renting:edit']);
  });

  it('requires renting:add for rental creation', () => {
    const required = Reflect.getMetadata(PERMISSION_KEY, RentalController.prototype.create);
    expect(required).toEqual(['renting:add']);
  });

  it('requires renting:edit for rental updates', () => {
    const required = Reflect.getMetadata(PERMISSION_KEY, RentalController.prototype.update);
    expect(required).toEqual(['renting:edit']);
  });
});

describe('Rental form validation', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const input = {
    code: 'QA-DTO', bizType: 'shared', communityId: 1, address: 'QA测试地址',
    building: '1', unit: '1', roomNo: '101', layout: '1室', storeId: 1,
    landlordName: 'QA房东', landlordPhone: '13000000000', tenantName: 'QA租客',
    tenantPhone: '13000000001', tenantPaymentMethod: 'monthly', deposit: '1200',
    rooms: [{ roomNo: 'A', leaseStart: '2026-09-09', tenantName: 'QA合租客', tenantPhone: '13000000002', rentPrice: '900' }],
  };

  it('preserves all editable rental fields through the whitelist and transforms nested amounts', async () => {
    const result = await pipe.transform(input, { type: 'body', metatype: CreateRentalSetDto });
    expect(result).toMatchObject({
      landlordName: input.landlordName, landlordPhone: input.landlordPhone,
      tenantName: input.tenantName, tenantPhone: input.tenantPhone,
      tenantPaymentMethod: 'monthly', deposit: 1200,
      rooms: [{ leaseStart: '2026-09-09', tenantName: 'QA合租客', tenantPhone: '13000000002', rentPrice: 900 }],
    });
  });

  it('rejects blank nested room numbers and negative rent', async () => {
    await expect(pipe.transform({ ...input, rooms: [{ roomNo: '', rentPrice: -1 }] }, {
      type: 'body', metatype: CreateRentalSetDto,
    })).rejects.toMatchObject({ status: 400 });
  });
});
