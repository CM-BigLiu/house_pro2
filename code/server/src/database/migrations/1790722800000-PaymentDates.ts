import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentDates1790722800000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`ALTER TABLE house_rental_room ADD COLUMN IF NOT EXISTS payment_dates jsonb`);
  }
  async down(q: QueryRunner) {
    await q.query(`ALTER TABLE house_rental_room DROP COLUMN IF EXISTS payment_dates`);
  }
}
