import { MigrationInterface, QueryRunner } from 'typeorm';

export class LandlordPaymentDate1792310335547 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`ALTER TABLE house_rental_set ADD COLUMN IF NOT EXISTS landlord_payment_date date`);
  }
  async down(q: QueryRunner) {
    await q.query(`ALTER TABLE house_rental_set DROP COLUMN IF EXISTS landlord_payment_date`);
  }
}
