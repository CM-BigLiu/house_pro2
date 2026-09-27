import { MigrationInterface, QueryRunner } from 'typeorm';

/** 补齐租房新增/编辑需要的基础房源、房东收款与租客身份字段。 */
export class RentalEditFields1790467201000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE house_rental_set
      ADD COLUMN IF NOT EXISTS "floor" varchar(50),
      ADD COLUMN IF NOT EXISTS "totalFloor" integer,
      ADD COLUMN IF NOT EXISTS "propertyType" varchar(30),
      ADD COLUMN IF NOT EXISTS "orientation" varchar(20),
      ADD COLUMN IF NOT EXISTS "elevator" varchar(10),
      ADD COLUMN IF NOT EXISTS "sourceChannel" varchar(50),
      ADD COLUMN IF NOT EXISTS "tags" text,
      ADD COLUMN IF NOT EXISTS "description" text,
      ADD COLUMN IF NOT EXISTS "landlordIdCard" varchar(255),
      ADD COLUMN IF NOT EXISTS "landlordBankCard" varchar(255),
      ADD COLUMN IF NOT EXISTS "landlordBankName" varchar(100),
      ADD COLUMN IF NOT EXISTS "tenantIdCard" varchar(255)`);
    await queryRunner.query(`ALTER TABLE house_rental_room
      ADD COLUMN IF NOT EXISTS "tenantIdCard" varchar(255)`);
  }

  async down(): Promise<void> {
    throw new Error('租房编辑字段可能已有业务数据，请备份并人工确认后回退；禁止自动删列。');
  }
}
