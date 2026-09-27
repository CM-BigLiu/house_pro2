import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isRentalAdministrator } from '../../../common/utils/rental-privacy.util';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RentalSet } from '../entities/rental-set.entity';

export interface PropertyManagementQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

// 只读取未结清的租金账单，不把押金、其他费用或已支付账单当作下次租金。
function nextRentDate(code: string, setId: string, tenantName?: string): string {
  const landlord = !tenantName;
  const direction = landlord
    ? `(b.status = 'pending_pay' OR (b.status IN ('partial', 'due', 'overdue') AND b.payee = rs."landlordName"))`
    : `b.status IN ('pending_receive', 'partial', 'due', 'overdue') AND b.payer = ${tenantName}`;
  const link = landlord
    ? `(b."bizId" IN (rs.id::text, rs.code) OR b."roomCode" = rs.code)`
    : `(b."roomCode" = ${code} OR b."bizId" = ${code}${setId ? ` OR b."bizId" = ${setId}` : ''})`;
  return `(SELECT MIN(b."dueDate")::text FROM fin_bill b
    WHERE b."bizType" = 'rent' AND b.store_id = rs.store_id
      AND b."billSource" IN ('rent', '${landlord ? 'landlord_rent' : 'tenant_rent'}')
      AND b.amount > COALESCE(b."actualAmount", 0) AND ${direction} AND ${link})`;
}

function signedAt(roomId: string, tenantName: string, leaseStart: string, leaseEnd: string): string {
  return `(SELECT MAX(a.signed_at) FROM house_rental_appointment a
    WHERE a.rental_set_id = rs.id AND a.rental_room_id IS NOT DISTINCT FROM ${roomId}
      AND a.status = 'signed' AND a.customer_name = ${tenantName}
      AND EXISTS (SELECT 1 FROM house_rental_appointment_action act
        WHERE act.appointment_id = a.id AND act.action = 'sign'
          AND act.details->>'leaseStart' = ${leaseStart}::text
          AND act.details->>'leaseEnd' = ${leaseEnd}::text))`;
}

@Injectable()
export class PropertyManagementService {
  constructor(@InjectRepository(RentalSet) private readonly rentalRepo: Repository<RentalSet>) {}

  async properties(query: PropertyManagementQuery, user: CurrentUserPayload) {
    const { page = 1, pageSize = 20 } = query;
    const qb = this.rentalRepo.createQueryBuilder('rs').leftJoin('rs.community', 'community');
    qb.andWhere('rs.isManaged = :isManaged', { isManaged: true });
    if (!isRentalAdministrator(user)) qb.andWhere('rs.creatorId = :employeeId', { employeeId: user.employeeId });
    const keyword = query.keyword?.trim();
    if (keyword) qb.andWhere('(rs.code ILIKE :keyword OR rs.title ILIKE :keyword OR rs.address ILIKE :keyword OR community.name ILIKE :keyword)', { keyword: `%${keyword}%` });
    const total = await qb.getCount();
    const list = await qb.select([
      'rs.id AS id', 'rs.code AS code', 'rs."bizType" AS "bizType"',
      'rs.creator_id AS "creatorId"',
      'rs.title AS title', 'community.name AS "communityName"', 'rs.address AS address',
      'rs.building AS building', 'rs.unit AS unit', 'rs."roomNo" AS "roomNo"',
      'rs.layout AS layout', 'rs."buildingArea" AS "buildingArea"', 'rs.status AS status',
      `rs."leaseStart"::text AS "leaseStart"`, `rs."leaseEnd"::text AS "leaseEnd"`,
    ]).addSelect(nextRentDate('rs.code', ''), 'nextLandlordPaymentDate')
      .orderBy('rs.createdAt', 'DESC').addOrderBy('rs.id', 'DESC')
      .offset((page - 1) * pageSize).limit(pageSize).getRawMany();
    return { list, total, page, pageSize };
  }

  async tenants(query: PropertyManagementQuery, user: CurrentUserPayload) {
    const { page = 1, pageSize = 20 } = query;
    // 按合同/房间列出真实租客，不用 CRM 意向客户替代；同一人多份租约分别展示。
    // 在 UNION 之后统一分页，避免合租一套多位租客导致漏项、重复计数。
    const source = `SELECT 'set-' || rs.id AS key, rs.id AS "rentalSetId", NULL::integer AS "rentalRoomId",
      rs."tenantName" AS "tenantName", rs."tenantPhone" AS "tenantPhone",
      rs.creator_id, rs.store_id, rs.group_id,
      ${signedAt('NULL::integer', 'rs."tenantName"', 'rs."tenantLeaseStart"', 'rs."tenantLeaseEnd"')} AS "signedAt",
      ${nextRentDate('rs.code', 'rs.id::text', 'rs."tenantName"')} AS "nextRentPaymentDate"
      FROM house_rental_set rs WHERE rs.is_managed = true AND rs."bizType" = 'entire' AND NULLIF(TRIM(rs."tenantName"), '') IS NOT NULL
      UNION ALL
      SELECT 'room-' || rr.id AS key, rs.id AS "rentalSetId", rr.id AS "rentalRoomId",
      rr."tenantName" AS "tenantName", rr."tenantPhone" AS "tenantPhone",
      rs.creator_id, rs.store_id, rs.group_id,
      ${signedAt('rr.id', 'rr."tenantName"', 'rr."leaseStart"', 'rr."leaseEnd"')} AS "signedAt",
      ${nextRentDate(`(rs.code || '-' || rr."roomNo")`, '', 'rr."tenantName"')} AS "nextRentPaymentDate"
      FROM house_rental_set rs INNER JOIN house_rental_room rr ON rr.set_id = rs.id
      WHERE rs.is_managed = true AND rs."bizType" = 'shared' AND NULLIF(TRIM(rr."tenantName"), '') IS NOT NULL`;
    const qb = this.rentalRepo.manager.createQueryBuilder().from(`(${source})`, 'tenant');
    if (!isRentalAdministrator(user)) qb.andWhere('tenant.creator_id = :employeeId', { employeeId: user.employeeId });
    const keyword = query.keyword?.trim();
    if (keyword) qb.andWhere('(tenant."tenantName" ILIKE :keyword OR tenant."tenantPhone" ILIKE :keyword)', { keyword: `%${keyword}%` });
    const count = await qb.clone().select('COUNT(*)', 'total').getRawOne();
    const list = await qb.select([
      'tenant.key AS key', 'tenant."rentalSetId" AS "rentalSetId"', 'tenant."rentalRoomId" AS "rentalRoomId"',
      'tenant."tenantName" AS "tenantName"', 'tenant."tenantPhone" AS "tenantPhone"',
      'tenant."signedAt" AS "signedAt"', 'tenant."nextRentPaymentDate" AS "nextRentPaymentDate"',
    ]).orderBy('tenant."signedAt"', 'DESC', 'NULLS LAST').addOrderBy('tenant.key', 'ASC')
      .offset((page - 1) * pageSize).limit(pageSize).getRawMany();
    return { list, total: Number(count.total), page, pageSize };
  }
}
