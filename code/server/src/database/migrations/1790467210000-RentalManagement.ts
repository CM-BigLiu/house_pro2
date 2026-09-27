import { MigrationInterface, QueryRunner } from 'typeorm';

export class RentalManagement1790467210000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE house_rental_set ADD COLUMN IF NOT EXISTS is_managed boolean NOT NULL DEFAULT false`);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE house_rental_set DROP COLUMN IF EXISTS is_managed`);
  }
}
