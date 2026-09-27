import { MigrationInterface, QueryRunner } from 'typeorm';

export class PropertyManagementRetireReserves1790467206000 implements MigrationInterface {
  name = 'PropertyManagementRetireReserves1790467206000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 先移除授权关联，再移除已退休入口。历史业务表留档，不删除用户数据。
    const obsolete = `"code" IN ('house:reserve_house', 'house:reserve_client')
      OR "code" LIKE 'reserve:%' OR "code" LIKE 'reserve_house:%' OR "code" LIKE 'reserve_client:%'`;
    await queryRunner.query(`DELETE FROM sys_role_permission WHERE "sysPermissionId" IN (SELECT id FROM sys_permission WHERE ${obsolete})`);
    await queryRunner.query(`UPDATE sys_permission SET "parentId" = NULL WHERE "parentId" IN (SELECT id FROM sys_permission WHERE ${obsolete})`);
    await queryRunner.query(`DELETE FROM sys_permission WHERE ${obsolete}`);
    await queryRunner.query(`DELETE FROM sys_dict_item WHERE (dict_code = 'biz_type' AND value = 'reserve') OR (dict_code = 'customer_status' AND value = 'converted')`);
  }

  async down(): Promise<void> {
    throw new Error('储备功能已退休；请使用备份恢复历史权限配置，不自动恢复废弃接口。');
  }
}
