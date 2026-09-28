import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplifiedRentalRooms1790625600000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE house_rental_room
      ADD COLUMN IF NOT EXISTS "privateBathroom" boolean,
      ADD COLUMN IF NOT EXISTS balcony boolean,
      ADD COLUMN IF NOT EXISTS "airConditioner" boolean,
      ADD COLUMN IF NOT EXISTS "interiorArea" numeric(10,2),
      ADD COLUMN IF NOT EXISTS orientation varchar(50),
      ADD COLUMN IF NOT EXISTS facilities text,
      ADD COLUMN IF NOT EXISTS "sortOrder" integer NOT NULL DEFAULT 0`);
    // 只从已有房型中提取明确的独卫信息，不猜测阳台、空调或面积。
    await runner.query(`UPDATE house_rental_room SET "privateBathroom" = true
      WHERE "privateBathroom" IS NULL AND ("roomType" LIKE '%_bath' OR "roomType" LIKE '%独卫%')`);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE house_rental_room
      DROP COLUMN "privateBathroom", DROP COLUMN balcony, DROP COLUMN "airConditioner",
      DROP COLUMN "interiorArea", DROP COLUMN orientation, DROP COLUMN facilities, DROP COLUMN "sortOrder"`);
  }
}
