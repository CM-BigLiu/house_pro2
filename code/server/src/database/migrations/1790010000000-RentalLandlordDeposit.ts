import { MigrationInterface, QueryRunner } from 'typeorm';

/** 为收房合同补充独立的房东押金，避免与租客押金混用。 */
export class RentalLandlordDeposit1790010000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE house_rental_set
      ADD COLUMN IF NOT EXISTS "landlordDeposit" numeric(12,2) DEFAULT 0`);
  }

  async down(): Promise<void> {
    throw new Error('房东押金可能已有业务数据，请备份并人工确认后回退；禁止自动删列。');
  }
}
