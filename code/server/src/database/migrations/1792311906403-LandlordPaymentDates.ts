import { MigrationInterface, QueryRunner } from 'typeorm';

export class LandlordPaymentDates1792311906403 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`ALTER TABLE house_rental_set ADD COLUMN IF NOT EXISTS landlord_payment_dates jsonb`);
  }
  async down(q: QueryRunner) {
    await q.query(`ALTER TABLE house_rental_set DROP COLUMN IF EXISTS landlord_payment_dates`);
  }
}
