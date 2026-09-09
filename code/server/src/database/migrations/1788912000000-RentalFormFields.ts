import { MigrationInterface, QueryRunner } from 'typeorm';

/** 增量补齐租房表单字段，不推测或覆盖历史租期。 */
export class RentalFormFields1788912000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE house_rental_set
      ADD COLUMN IF NOT EXISTS "landlordName" varchar(100),
      ADD COLUMN IF NOT EXISTS "landlordPhone" varchar(30),
      ADD COLUMN IF NOT EXISTS "tenantName" varchar(100),
      ADD COLUMN IF NOT EXISTS "tenantPhone" varchar(30),
      ADD COLUMN IF NOT EXISTS "tenantPaymentMethod" varchar(50),
      ADD COLUMN IF NOT EXISTS "deposit" numeric(12,2) DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE house_rental_room
      ADD COLUMN IF NOT EXISTS "leaseStart" date,
      ADD COLUMN IF NOT EXISTS "tenantName" varchar(100),
      ADD COLUMN IF NOT EXISTS "tenantPhone" varchar(30)`);
  }

  async down(): Promise<void> {
    throw new Error('租房表单字段可能已有业务数据，请备份并人工确认后回退；禁止自动删列。');
  }
}
