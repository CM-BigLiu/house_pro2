import { MigrationInterface, QueryRunner } from 'typeorm';

/** 补齐租房管理列表、筛选与房东合同所需字段。 */
export class RentalListFields1790467200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE house_rental_set
      ADD COLUMN IF NOT EXISTS "district" varchar(100),
      ADD COLUMN IF NOT EXISTS "landlordPaymentMethod" varchar(50),
      ADD COLUMN IF NOT EXISTS "leaseTerm" varchar(50),
      ADD COLUMN IF NOT EXISTS "operationStatus" varchar(30) NOT NULL DEFAULT 'normal',
      ADD COLUMN IF NOT EXISTS "businessStatus" varchar(30)`);
  }

  async down(): Promise<void> {
    throw new Error('租房列表字段可能已有业务数据，请备份并人工确认后回退；禁止自动删列。');
  }
}
