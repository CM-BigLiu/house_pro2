import { MigrationInterface, QueryRunner } from 'typeorm';

export class CheckoutSettlement1788998403000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query('ALTER TABLE "house_checkout" ADD COLUMN IF NOT EXISTS "expected_deposit_amount" decimal(12,2), ADD COLUMN IF NOT EXISTS "confirmed_at" timestamp, ADD COLUMN IF NOT EXISTS "completed_at" timestamp');
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('ALTER TABLE "house_checkout" DROP COLUMN IF EXISTS "completed_at", DROP COLUMN IF EXISTS "confirmed_at", DROP COLUMN IF EXISTS "expected_deposit_amount"');
  }
}
