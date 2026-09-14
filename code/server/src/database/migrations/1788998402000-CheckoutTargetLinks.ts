import { MigrationInterface, QueryRunner } from 'typeorm';

export class CheckoutTargetLinks1788998402000 implements MigrationInterface {
  name = 'CheckoutTargetLinks1788998402000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "house_checkout" ADD COLUMN IF NOT EXISTS "rental_set_id" integer');
    await queryRunner.query('ALTER TABLE "house_checkout" ADD COLUMN IF NOT EXISTS "rental_room_id" integer');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_house_checkout_rental_set" ON "house_checkout" ("rental_set_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_house_checkout_rental_room" ON "house_checkout" ("rental_room_id")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_house_checkout_rental_room"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_house_checkout_rental_set"');
    await queryRunner.query('ALTER TABLE "house_checkout" DROP COLUMN IF EXISTS "rental_room_id"');
    await queryRunner.query('ALTER TABLE "house_checkout" DROP COLUMN IF EXISTS "rental_set_id"');
  }
}
