import { MigrationInterface, QueryRunner } from 'typeorm';

/** 移除公寓利润与合伙人模块，以及对应菜单权限和业务表。 */
export class RemoveProfitAndPartner1790020000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM sys_role_permission
      WHERE "sysPermissionId" IN (
        SELECT id FROM sys_permission
        WHERE code IN ('finance:profit', 'finance:partner')
      )
    `);
    await queryRunner.query(`
      DELETE FROM sys_permission
      WHERE code IN ('finance:profit', 'finance:partner')
    `);
    await queryRunner.query('DROP TABLE IF EXISTS fin_profit');
    await queryRunner.query('DROP TABLE IF EXISTS fin_partner');
  }

  async down(): Promise<void> {
    throw new Error('公寓利润和合伙人模块已删除，可能涉及业务数据，禁止自动回退。');
  }
}
