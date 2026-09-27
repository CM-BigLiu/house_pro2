import { MigrationInterface, QueryRunner } from 'typeorm';

export class CustomerDealsRetireFinance1790467208000 implements MigrationInterface {
  name = 'CustomerDealsRetireFinance1790467208000';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE IF NOT EXISTS house_sale_appointment (
      id SERIAL PRIMARY KEY, sale_property_id integer NOT NULL, customer_id integer NOT NULL,
      customer_name varchar(100) NOT NULL, property_code varchar(50) NOT NULL, property_name varchar(255) NOT NULL,
      scheduled_at timestamptz NOT NULL, responsible_employee_id integer NOT NULL, responsible_employee_name varchar(50) NOT NULL,
      store_id integer NOT NULL, group_id integer, status varchar(30) NOT NULL DEFAULT 'scheduled', remark varchar(500),
      "createdAt" timestamp NOT NULL DEFAULT now())`);
    await runner.query(`CREATE TABLE IF NOT EXISTS house_deal (
      id SERIAL PRIMARY KEY, contract_code varchar(50) NOT NULL UNIQUE, biz_type varchar(10) NOT NULL,
      customer_id integer, customer_name varchar(100) NOT NULL, customer_phone varchar(20),
      property_id integer NOT NULL, room_id integer, property_code varchar(50) NOT NULL, property_name varchar(255) NOT NULL,
      rental_appointment_id integer UNIQUE, sale_appointment_id integer UNIQUE, signed_at timestamptz NOT NULL,
      amount numeric(14,2), deposit numeric(14,2), lease_start date, lease_end date, payment_method varchar(50),
      responsible_employee_id integer NOT NULL, responsible_employee_name varchar(50) NOT NULL, store_id integer NOT NULL, group_id integer,
      status varchar(30) NOT NULL DEFAULT 'active', checkout_id integer, previous_property_status varchar(30),
      terminated_on date, termination_reason varchar(500), remark varchar(500),
      "createdAt" timestamp NOT NULL DEFAULT now(), "updatedAt" timestamp NOT NULL DEFAULT now())`);
    await runner.query(`CREATE INDEX IF NOT EXISTS idx_deal_customer ON house_deal(customer_id)`);
    // 只迁移有真实签约时间和合同号的约看，不用房态或起租日伪造成交。
    await runner.query(`INSERT INTO house_deal (contract_code, biz_type, customer_id, customer_name, customer_phone,
      property_id, room_id, property_code, property_name, rental_appointment_id, signed_at, amount, deposit,
      lease_start, lease_end, payment_method, responsible_employee_id, responsible_employee_name, store_id, group_id, remark)
      SELECT a.contract_code, 'rent', a.customer_id, COALESCE(a.customer_name, c.name, '历史租客'), c.mobile,
        a.rental_set_id, a.rental_room_id, a.property_code, a.property_name, a.id, a.signed_at,
        (x.details->>'rent')::numeric, (x.details->>'deposit')::numeric,
        (x.details->>'leaseStart')::date, (x.details->>'leaseEnd')::date, x.details->>'paymentMethod',
        a.responsible_employee_id, a.responsible_employee_name, a.store_id, a.group_id, x.content
      FROM house_rental_appointment a LEFT JOIN house_customer c ON c.id = a.customer_id
      LEFT JOIN LATERAL (SELECT details, content FROM house_rental_appointment_action WHERE appointment_id = a.id AND action = 'sign' ORDER BY id DESC LIMIT 1) x ON true
      WHERE a.status = 'signed' AND a.signed_at IS NOT NULL AND a.contract_code IS NOT NULL ON CONFLICT DO NOTHING`);
    await runner.query(`UPDATE house_deal d SET checkout_id = x.id,
      status = CASE WHEN x.status = 'pending' THEN 'termination_pending' ELSE 'terminated' END,
      terminated_on = x."checkoutDate", termination_reason = x.reason
      FROM house_checkout x WHERE x."contractCode" = d.contract_code AND x.status IN ('pending','confirmed','completed')`);
    await runner.query(`UPDATE house_customer c SET status = 'done' WHERE status = 'active'
      AND EXISTS (SELECT 1 FROM house_deal d WHERE d.customer_id = c.id AND d.status IN ('active','termination_pending'))`);
    // 历史财务表只留档，停止四个已退休模块的入口、业务写入和权限授权。
    // 将保留功能的旧共享写权限拆分到各自菜单，保留自定义角色原先的有效授权。
    for (const menu of ['plan', 'income_cost', 'performance', 'accounting', 'arrears']) {
      await runner.query(`INSERT INTO sys_permission (code, name, type, module, "parentId", status, sort)
        SELECT $1, '新增/编辑记录', 'action', 'finance', id, 'active', 1 FROM sys_permission WHERE code = $2
        ON CONFLICT (code) DO NOTHING`, [`finance:${menu}:modify`, `finance:${menu}`]);
      await runner.query(`INSERT INTO sys_role_permission ("sysRoleId", "sysPermissionId")
        SELECT old."sysRoleId", target.id FROM sys_role_permission old
        JOIN sys_permission p ON p.id = old."sysPermissionId" AND p.code = 'finance:bill:modify'
        JOIN sys_permission target ON target.code = $1
        WHERE EXISTS (SELECT 1 FROM sys_role_permission allowed JOIN sys_permission m ON m.id = allowed."sysPermissionId"
          WHERE allowed."sysRoleId" = old."sysRoleId" AND m.code = $2) ON CONFLICT DO NOTHING`, [`finance:${menu}:modify`, `finance:${menu}`]);
    }
    await runner.query(`UPDATE sys_permission SET "parentId" = (SELECT id FROM sys_permission WHERE code = 'finance') WHERE code = 'finance:export'`);
    const obsolete = `code ~ '^finance:(bill|flow|rent_increase|payout)(:|$)'`;
    await runner.query(`DELETE FROM sys_role_permission WHERE "sysPermissionId" IN (SELECT id FROM sys_permission WHERE ${obsolete})`);
    await runner.query(`UPDATE sys_permission SET "parentId" = NULL WHERE "parentId" IN (SELECT id FROM sys_permission WHERE ${obsolete})`);
    await runner.query(`DELETE FROM sys_permission WHERE ${obsolete}`);
  }
  async down(): Promise<void> {
    throw new Error('成交记录及历史财务数据不可自动删除；请通过备份恢复。');
  }
}
