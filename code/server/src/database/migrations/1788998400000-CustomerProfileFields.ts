import { MigrationInterface, QueryRunner } from 'typeorm';

export class CustomerProfileFields1788998400000 implements MigrationInterface {
  name = 'CustomerProfileFields1788998400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "house_customer" ADD COLUMN IF NOT EXISTS "desiredDistrict" character varying(100)');
    await queryRunner.query('ALTER TABLE "house_customer" ADD COLUMN IF NOT EXISTS "budgetMin" numeric(14,2)');
    await queryRunner.query('ALTER TABLE "house_customer" ADD COLUMN IF NOT EXISTS "budgetMax" numeric(14,2)');
    await queryRunner.query('ALTER TABLE "house_customer" ADD COLUMN IF NOT EXISTS "remark" character varying(500)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "house_customer" DROP COLUMN IF EXISTS "remark"');
    await queryRunner.query('ALTER TABLE "house_customer" DROP COLUMN IF EXISTS "budgetMax"');
    await queryRunner.query('ALTER TABLE "house_customer" DROP COLUMN IF EXISTS "budgetMin"');
    await queryRunner.query('ALTER TABLE "house_customer" DROP COLUMN IF EXISTS "desiredDistrict"');
  }
}
