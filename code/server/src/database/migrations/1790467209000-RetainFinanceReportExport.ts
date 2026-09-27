import { MigrationInterface, QueryRunner } from 'typeorm';

/** 保留模块仍使用共享报表导出；旧账单父节点退休后，归属财务模块。 */
export class RetainFinanceReportExport1790467209000 implements MigrationInterface {
  name = 'RetainFinanceReportExport1790467209000';
  async up(runner: QueryRunner): Promise<void> {
    const existing = await runner.query(`SELECT id FROM sys_permission WHERE code = 'finance:export'`);
    if (!existing.length) {
      await runner.query(`INSERT INTO sys_permission (code, name, type, module, "parentId", status, sort)
        SELECT 'finance:export', '导出保留的财务报表', 'action', 'finance', id, 'active', 99
        FROM sys_permission WHERE code = 'finance'`);
      // 首次补回时恢复原内置角色的默认授权；已存在的权限不覆盖管理员的撤销。
      await runner.query(`INSERT INTO sys_role_permission ("sysRoleId", "sysPermissionId")
        SELECT r.id, p.id FROM sys_role r CROSS JOIN sys_permission p
        WHERE p.code = 'finance:export' AND r.code IN ('super_admin','company_admin','store_manager','finance_manager')
        ON CONFLICT DO NOTHING`);
    }
    await runner.query(`UPDATE sys_permission SET "parentId" = (SELECT id FROM sys_permission WHERE code = 'finance') WHERE code = 'finance:export'`);
  }
  async down(): Promise<void> {
    // 不删除仍被收入成本、核算、欠款和开票使用的共享权限。
  }
}
