import { MigrationInterface, QueryRunner } from 'typeorm';

export class BusinessFinanceWorkflow1790575200000
  implements MigrationInterface
{
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      `ALTER TABLE house_deal ADD COLUMN IF NOT EXISTS workflow_type varchar(20) NOT NULL DEFAULT 'regular', ADD COLUMN IF NOT EXISTS details text`,
    );
    await runner.query(
      `UPDATE house_deal SET workflow_type = 'sale' WHERE biz_type = 'sale'`,
    );
    await runner.query(`CREATE TABLE fin_contract_schedule (
      id serial PRIMARY KEY, deal_id integer NOT NULL REFERENCES house_deal(id), property_id integer NOT NULL,
      "propertyName" varchar(255) NOT NULL, direction varchar(10) NOT NULL CHECK (direction IN ('pay','receive')),
      sequence integer NOT NULL, "dueDate" date NOT NULL, "periodStart" date NOT NULL, "periodEnd" date NOT NULL,
      amount numeric(14,2) NOT NULL CHECK (amount >= 0), "settledAmount" numeric(14,2) NOT NULL DEFAULT 0 CHECK ("settledAmount" >= 0 AND "settledAmount" <= amount),
      status varchar(20) NOT NULL DEFAULT 'pending', employee_id integer NOT NULL, store_id integer NOT NULL, group_id integer,
      "createdAt" timestamptz NOT NULL DEFAULT now(), UNIQUE (deal_id, sequence))`);
    await runner.query(
      `CREATE INDEX idx_contract_schedule_due ON fin_contract_schedule (status, "dueDate", direction)`,
    );
    await runner.query(`CREATE TABLE fin_cash_account (id serial PRIMARY KEY, code varchar(30) NOT NULL UNIQUE, name varchar(50) NOT NULL,
      "openingBalance" numeric(14,2) NOT NULL DEFAULT 0, "updatedAt" timestamptz NOT NULL DEFAULT now())`);
    await runner.query(
      `INSERT INTO fin_cash_account (code,name) VALUES ('bank_ccb','建设银行'),('bank_rural','农商银行'),('wechat','微信'),('cash','现金'),('corporate','公户')`,
    );
    await runner.query(`CREATE TABLE fin_cash_entry (id serial PRIMARY KEY, "requestKey" varchar(100) NOT NULL UNIQUE,
      schedule_id integer NOT NULL REFERENCES fin_contract_schedule(id), "accountCode" varchar(30) NOT NULL REFERENCES fin_cash_account(code), direction varchar(10) NOT NULL,
      "paymentDate" date NOT NULL, amount numeric(14,2) NOT NULL CHECK (amount > 0), "payerAccount" varchar(255) NOT NULL, payer varchar(100) NOT NULL,
      "payeeAccount" varchar(255) NOT NULL, payee varchar(100) NOT NULL, employee_id integer NOT NULL, store_id integer NOT NULL, group_id integer,
      "createdAt" timestamptz NOT NULL DEFAULT now())`);
    await runner.query(`CREATE TABLE fin_property_configuration (id serial PRIMARY KEY, property_id integer NOT NULL UNIQUE REFERENCES house_rental_set(id),
      items jsonb NOT NULL DEFAULT '[]', adjustments jsonb NOT NULL DEFAULT '[]', employee_id integer NOT NULL, store_id integer NOT NULL, group_id integer,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now())`);
    await runner.query(`CREATE TABLE fin_business_submission (id serial PRIMARY KEY, type varchar(20) NOT NULL, period varchar(7) NOT NULL,
      snapshot jsonb NOT NULL, status varchar(20) NOT NULL DEFAULT 'submitted', "reviewNote" varchar(500) NOT NULL DEFAULT '',
      employee_id integer NOT NULL, "employeeName" varchar(50) NOT NULL, store_id integer NOT NULL, group_id integer, "reviewedBy" integer,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now())`);
    await runner.query(
      `UPDATE sys_permission SET name = '房管房业务' WHERE code = 'finance:arrears'`,
    );
    await runner.query(
      `UPDATE sys_permission SET name = '公司现金流' WHERE code = 'finance:plan'`,
    );
    await runner.query(
      `UPDATE sys_permission SET name = '财务管理' WHERE code = 'finance:accounting'`,
    );
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      `DROP TABLE fin_business_submission, fin_property_configuration, fin_cash_entry, fin_cash_account, fin_contract_schedule`,
    );
    await runner.query(
      `ALTER TABLE house_deal DROP COLUMN details, DROP COLUMN workflow_type`,
    );
    await runner.query(
      `UPDATE sys_permission SET name = '欠款统计' WHERE code = 'finance:arrears'`,
    );
    await runner.query(
      `UPDATE sys_permission SET name = '收支计划' WHERE code = 'finance:plan'`,
    );
    await runner.query(
      `UPDATE sys_permission SET name = '财务报表' WHERE code = 'finance:accounting'`,
    );
  }
}
