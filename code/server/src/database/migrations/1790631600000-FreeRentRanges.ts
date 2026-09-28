import { MigrationInterface, QueryRunner } from 'typeorm';

export class FreeRentRanges1790631600000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`ALTER TABLE house_rental_set ADD COLUMN IF NOT EXISTS free_rent_ranges jsonb NOT NULL DEFAULT '[]'::jsonb`);
    await q.query(`UPDATE sys_permission SET name = '收支计划（公司现金流）' WHERE code = 'finance:plan'`);
  }
  async down(q: QueryRunner) {
    await q.query(`ALTER TABLE house_rental_set DROP COLUMN IF EXISTS free_rent_ranges`);
    await q.query(`UPDATE sys_permission SET name = '公司现金流' WHERE code = 'finance:plan'`);
  }
}
