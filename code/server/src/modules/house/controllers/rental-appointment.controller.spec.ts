import { PERMISSION_KEY } from '../../../common/decorators/require-permission.decorator';
import { RentalAppointmentController } from './rental-appointment.controller';

describe('RentalAppointmentController permissions', () => {
  it('requires record viewing permission', () => {
    expect(Reflect.getMetadata(PERMISSION_KEY, RentalAppointmentController.prototype.findAll))
      .toEqual(['renting:appointment:view']);
  });

  it('requires appointment creation permission', () => {
    expect(Reflect.getMetadata(PERMISSION_KEY, RentalAppointmentController.prototype.create))
      .toEqual(['renting:appointment:create']);
  });

  it.each([
    ['followUp', 'renting:appointment:follow-up'],
    ['sign', 'renting:appointment:sign'],
    ['signingContext', 'renting:appointment:sign'],
    ['recommend', 'renting:appointment:recommend'],
  ])('requires permission for %s', (method, permission) => {
    expect(Reflect.getMetadata(PERMISSION_KEY, RentalAppointmentController.prototype[method])).toEqual([permission]);
  });
});
