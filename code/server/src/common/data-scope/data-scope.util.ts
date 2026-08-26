import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { SelectQueryBuilder, Brackets } from 'typeorm';

export function applyDataScope<T>(
  qb: SelectQueryBuilder<T>,
  user: CurrentUserPayload,
  alias: string,
  options?: { ownerField?: string; groupField?: string; storeField?: string },
): SelectQueryBuilder<T> {
  if (!user) return qb;

  const scope = user.dataScope || 'self';
  const ownerField = options?.ownerField || 'created_by';
  const groupField = options?.groupField || 'group_id';
  const storeField = options?.storeField || 'store_id';

  switch (scope) {
    case 'self':
      qb.andWhere(`${alias}.${ownerField} = :employeeId`, { employeeId: user.employeeId });
      break;
    case 'group':
      if (user.groupIds?.length) {
        qb.andWhere(`${alias}.${groupField} IN (:...groupIds)`, { groupIds: user.groupIds });
      } else {
        qb.andWhere(`${alias}.${ownerField} = :employeeId`, { employeeId: user.employeeId });
      }
      break;
    case 'store':
      if (user.storeIds?.length) {
        qb.andWhere(`${alias}.${storeField} IN (:...storeIds)`, { storeIds: user.storeIds });
      } else {
        qb.andWhere(`${alias}.${ownerField} = :employeeId`, { employeeId: user.employeeId });
      }
      break;
    case 'company':
      break;
    case 'assigned':
      if (user.assignedStoreIds?.length) {
        qb.andWhere(`${alias}.${storeField} IN (:...assignedStoreIds)`, { assignedStoreIds: user.assignedStoreIds });
      } else {
        qb.andWhere(`${alias}.${ownerField} = :employeeId`, { employeeId: user.employeeId });
      }
      break;
    case 'custom':
      applyCustomScope(qb, user.customScope, alias, ownerField, storeField, user.employeeId);
      break;
    default:
      qb.andWhere(`${alias}.${ownerField} = :employeeId`, { employeeId: user.employeeId });
  }
  return qb;
}

function applyCustomScope<T>(
  qb: SelectQueryBuilder<T>,
  customScope: Record<string, any> | undefined,
  alias: string,
  ownerField: string,
  storeField: string,
  employeeId: number,
): void {
  if (!customScope || typeof customScope !== 'object') {
    qb.andWhere(`${alias}.${ownerField} = :employeeId`, { employeeId });
    return;
  }
  qb.andWhere(new Brackets((sub) => {
    for (const [key, value] of Object.entries(customScope)) {
      if (key === 'creator_id' || key === ownerField) {
        if (value === '@me') {
          sub.orWhere(`${alias}.${ownerField} = :employeeId`, { employeeId });
        } else if (Array.isArray(value)) {
          sub.orWhere(`${alias}.${ownerField} IN (:...${key})`, { [key]: value });
        } else {
          sub.orWhere(`${alias}.${ownerField} = :${key}`, { [key]: value });
        }
      } else if (key === 'store_id' || key === storeField) {
        if (Array.isArray(value)) {
          sub.orWhere(`${alias}.${storeField} IN (:...${key})`, { [key]: value });
        } else {
          sub.orWhere(`${alias}.${storeField} = :${key}`, { [key]: value });
        }
      } else if (Array.isArray(value)) {
        sub.orWhere(`${alias}.${key} IN (:...${key})`, { [key]: value });
      } else {
        sub.orWhere(`${alias}.${key} = :${key}`, { [key]: value });
      }
    }
  }));
}

export function getEffectiveDataScope(user: CurrentUserPayload): string {
  if (!user) return 'self';
  return user.dataScope || 'self';
}
