import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReservePropertyTypes1789990000000 implements MigrationInterface {
  name = 'ReservePropertyTypes1789990000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "house_reserve"
      ADD COLUMN IF NOT EXISTS "reserveType" varchar(10) NOT NULL DEFAULT 'rent',
      ADD COLUMN IF NOT EXISTS "details" jsonb`);
    await queryRunner.query(`ALTER TABLE "house_reserve"
      ALTER COLUMN "address" DROP NOT NULL,
      ALTER COLUMN "roomNo" DROP NOT NULL,
      ALTER COLUMN "layout" DROP NOT NULL,
      ALTER COLUMN "ownerName" DROP NOT NULL,
      ALTER COLUMN "sourceChannel" DROP NOT NULL`);
    await queryRunner.query('ALTER TABLE "house_reserve" ALTER COLUMN "ownerQuote" TYPE numeric(14,2)');
  }

  async down(): Promise<void> {
    throw new Error('储备房源类型及详情可能已有业务数据，请备份并人工确认后回退；禁止自动删列。');
  }
}
