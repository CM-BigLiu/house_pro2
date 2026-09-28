import { SelectQueryBuilder } from 'typeorm';
import { CurrentUserPayload } from '../decorators/current-user.decorator';
import { Employee } from '../../modules/system/entities/employee.entity';
import { applyDataScope } from './data-scope.util';

/** 没有直接分组字段的台账，按所属员工分组限定，避免查询不存在的 group_id。 */
export function applyRecordScope<T>(qb: SelectQueryBuilder<T>, user: CurrentUserPayload, alias: string, ownerField: string) {
  const metadata = qb.expressionMap?.aliases?.find(item => item.name === alias)?.metadata;
  if (metadata && !metadata.findColumnWithPropertyName('groupId') && user.dataScope === 'group' && user.groupIds?.length) {
    return qb.innerJoin(Employee, 'recordOwner', `recordOwner.id = ${alias}.${ownerField}`)
      .innerJoin('recordOwner.groups', 'recordGroup').andWhere('recordGroup.id IN (:...recordGroups)', { recordGroups: user.groupIds });
  }
  return applyDataScope(qb, user, alias, { ownerField, storeField: 'storeId', groupField: 'groupId' });
}
