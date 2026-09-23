import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReserveClientToCustomer1790000000000 implements MigrationInterface {
  name = 'ReserveClientToCustomer1790000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "sys_permission"
      SET "name" = '转正式客户'
      WHERE "code" = 'reserve:client:transfer' AND "name" = '转签约'`);
    await queryRunner.query(`INSERT INTO "sys_dict_item" ("dict_code", "value", "label", "sort", "enabled", "isBuiltin")
      SELECT 'customer_status', 'converted', '已转正式客户', 10, true, true
      WHERE EXISTS (SELECT 1 FROM "sys_dict" WHERE "code" = 'customer_status')
        AND NOT EXISTS (
          SELECT 1 FROM "sys_dict_item" WHERE "dict_code" = 'customer_status' AND "value" = 'converted'
        )`);
  }

  async down(): Promise<void> {
    throw new Error('已有储备客源可能使用已转正式客户状态，不应自动回退字典或权限名称。');
  }
}
