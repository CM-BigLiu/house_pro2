import { MigrationInterface, QueryRunner } from 'typeorm';
export class IncomeCostLabel1790715600000 implements MigrationInterface {
  async up(q: QueryRunner) { await q.query(`UPDATE sys_permission SET name = '收支成本' WHERE code = 'finance:income_cost'`); }
  async down(q: QueryRunner) { await q.query(`UPDATE sys_permission SET name = '收入成本' WHERE code = 'finance:income_cost'`); }
}
