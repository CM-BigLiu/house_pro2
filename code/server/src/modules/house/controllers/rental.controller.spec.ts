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

  it('requires renting:delete for rental deletion', () => {
    const required = Reflect.getMetadata(PERMISSION_KEY, RentalController.prototype.remove);
    expect(required).toEqual(['renting:delete']);
  });
});

describe('Rental form validation', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const input = {
    code: 'QA-DTO', bizType: 'shared', communityId: 1, address: 'QA测试地址',
    building: '1', unit: '1', roomNo: '101', layout: '1室', storeId: 1,
    floor: '10', totalFloor: '18', propertyType: 'residential', orientation: 'south', elevator: 'yes',
    sourceChannel: 'store', tags: ['subway'], description: 'QA备注',
    landlordName: 'QA房东', landlordPhone: '13000000000', tenantName: 'QA租客',
    landlordIdCard: '310101197801011234', landlordBankCard: '6227001234567890123', landlordBankName: 'QA银行',
    tenantIdCard: '310101199201011234',
    tenantPhone: '13000000001', tenantPaymentMethod: 'monthly', landlordDeposit: '5000', deposit: '1200',
    rooms: [{ roomNo: 'A', roomType: 'master', privateBathroom: false, balcony: true, leaseStart: '2026-09-09', tenantName: 'QA合租客', tenantPhone: '13000000002', tenantIdCard: '310101199301011234', rentPrice: '900' }],
  };

  it('preserves all editable rental fields through the whitelist and transforms nested amounts', async () => {
    const result = await pipe.transform(input, { type: 'body', metatype: CreateRentalSetDto });
    expect(result).toMatchObject({
      landlordName: input.landlordName, landlordPhone: input.landlordPhone,
      floor: '10', totalFloor: 18, orientation: 'south', sourceChannel: 'store', tags: ['subway'],
      landlordIdCard: input.landlordIdCard, landlordBankCard: input.landlordBankCard,
      tenantName: input.tenantName, tenantPhone: input.tenantPhone,
      tenantIdCard: input.tenantIdCard,
      tenantPaymentMethod: 'monthly', landlordDeposit: 5000, deposit: 1200,
      rooms: [{ leaseStart: '2026-09-09', tenantName: 'QA合租客', tenantPhone: '13000000002', tenantIdCard: '310101199301011234', rentPrice: 900 }],
    });
  });

  it('rejects blank nested room numbers and negative rent', async () => {
    await expect(pipe.transform({ ...input, rooms: [{ roomNo: '', rentPrice: -1 }] }, {
      type: 'body', metatype: CreateRentalSetDto,
    })).rejects.toMatchObject({ status: 400 });
  });

  it('strips removed form fields from rental requests', async () => {
    const result = await pipe.transform({ ...input, operationStatus: 'paused', businessStatus: 'arrears', leaseTerm: 'five_year' }, {
      type: 'body', metatype: CreateRentalSetDto,
    });
    expect(result.operationStatus).toBeUndefined();
    expect(result.businessStatus).toBeUndefined();
    expect(result.leaseTerm).toBeUndefined();
  });
});
