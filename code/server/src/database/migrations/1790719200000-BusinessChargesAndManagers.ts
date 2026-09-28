import { MigrationInterface, QueryRunner } from 'typeorm';
export class BusinessChargesAndManagers1790719200000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`CREATE TABLE IF NOT EXISTS fin_business_charge (
      id SERIAL PRIMARY KEY, source_key VARCHAR(150) NOT NULL UNIQUE, deal_id INTEGER, property_id INTEGER NOT NULL, room_id INTEGER,
      property_name VARCHAR(255) NOT NULL, direction VARCHAR(10) NOT NULL, category VARCHAR(30) NOT NULL, due_date DATE NOT NULL,
      amount DECIMAL(14,2) NOT NULL, settled_amount DECIMAL(14,2) NOT NULL DEFAULT 0, status VARCHAR(20) NOT NULL DEFAULT 'pending',
      counterparty VARCHAR(100) NOT NULL DEFAULT '', remark VARCHAR(500) NOT NULL DEFAULT '', employee_id INTEGER NOT NULL, store_id INTEGER NOT NULL, group_id INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
    await q.query(`ALTER TABLE fin_cash_entry ALTER COLUMN schedule_id DROP NOT NULL`);
    await q.query(`ALTER TABLE fin_cash_entry ADD COLUMN IF NOT EXISTS charge_id INTEGER`);
    await q.query(`ALTER TABLE sys_employee ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES sys_employee(id) ON DELETE SET NULL`);
  }
  async down(q: QueryRunner) {
    // 有实际项目流水时不能丢弃其来源关联。
    const rows = await q.query(`SELECT COUNT(*)::int AS count FROM fin_cash_entry WHERE charge_id IS NOT NULL`);
    if (rows[0].count) throw new Error('存在项目收付款记录，不能回退此迁移');
    await q.query(`ALTER TABLE sys_employee DROP COLUMN manager_id`);
    await q.query(`ALTER TABLE fin_cash_entry DROP COLUMN charge_id`);
    await q.query(`ALTER TABLE fin_cash_entry ALTER COLUMN schedule_id SET NOT NULL`);
    await q.query(`DROP TABLE fin_business_charge`);
  }
}
