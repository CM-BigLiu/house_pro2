import { CurrentUserPayload } from '../decorators/current-user.decorator';

export const RENTAL_LANDLORD_FIELDS = [
  'landlordId', 'landlordName', 'landlordPhone', 'landlordPhoneBackup',
  'landlordIdCard', 'landlordBankName', 'landlordBankCard', 'landlordRent',
  'landlordDeposit', 'leaseStart', 'leaseEnd', 'landlordPaymentMethod',
  'rentFreePeriod', 'landlordRemark', 'emergencyContacts', 'viewingTime',
  'viewingTimeAlt', 'followUpContent', 'isManaged',
] as const;

export function isRentalAdministrator(user?: CurrentUserPayload): boolean {
  return !!user && (user.permissions?.includes('*')
    || user.roleCodes?.some(role => ['super_admin', 'company_admin'].includes(role)));
}

export function canAccessRentalLandlord(record: { creatorId?: number }, user?: CurrentUserPayload): boolean {
  return isRentalAdministrator(user)
    || (!!user?.employeeId && Number(record.creatorId) === Number(user.employeeId));
}

export function filterRentalLandlord<T extends { creatorId?: number }>(record: T, user?: CurrentUserPayload) {
  const canViewLandlordInfo = canAccessRentalLandlord(record, user);
  const result = { ...record, canViewLandlordInfo };
  if (!canViewLandlordInfo) for (const key of RENTAL_LANDLORD_FIELDS) delete result[key];
  return result;
}
