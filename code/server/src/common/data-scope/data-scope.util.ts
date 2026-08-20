import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { SelectQueryBuilder } from 'typeorm';

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
      if (user.storeIds?.length) {
        qb.andWhere(`${alias}.${storeField} IN (:...storeIds)`, { storeIds: user.storeIds });
      } else {
        qb.andWhere(`${alias}.${ownerField} = :employeeId`, { employeeId: user.employeeId });
      }
      break;
    default:
      qb.andWhere(`${alias}.${ownerField} = :employeeId`, { employeeId: user.employeeId });
  }
  return qb;
}

export function getEffectiveDataScope(user: CurrentUserPayload): string {
  if (!user) return 'self';
  return user.dataScope || 'self';
}
