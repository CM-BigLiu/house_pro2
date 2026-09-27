import { MigrationInterface, QueryRunner } from 'typeorm';

export class RetireReserveDictionaries1790467207000 implements MigrationInterface {
  name = 'RetireReserveDictionaries1790467207000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 仅移除原储备表单专用的字典；房源状态、客户状态等共用字典继续保留。
    await queryRunner.query(`DELETE FROM sys_dict_item WHERE dict_code IN ('disk_type', 'demand_type', 'urgency')`);
    await queryRunner.query(`DELETE FROM sys_dict WHERE code IN ('disk_type', 'demand_type', 'urgency')`);
  }

  async down(): Promise<void> {
    throw new Error('储备专用字典已退休，请通过备份恢复历史配置。');
  }
}
