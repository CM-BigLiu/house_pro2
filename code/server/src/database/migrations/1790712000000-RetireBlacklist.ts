import { MigrationInterface, QueryRunner } from 'typeorm';

/** 停用业务入口，原始历史数据保存在归档表，避免丢失历史记录。 */
export class RetireBlacklist1790712000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`CREATE TABLE IF NOT EXISTS retired_feature_archive (source text PRIMARY KEY, records jsonb NOT NULL)`);
    const sources = [
      ['permissions', `SELECT * FROM sys_permission WHERE code LIKE 'house:blacklist%'`],
      ['role_permissions', `SELECT * FROM sys_role_permission WHERE "sysPermissionId" IN (SELECT id FROM sys_permission WHERE code LIKE 'house:blacklist%')`],
      ['dicts', `SELECT * FROM sys_dict WHERE code IN ('blacklist_type','blacklist_status')`],
      ['dict_items', `SELECT * FROM sys_dict_item WHERE dict_code IN ('blacklist_type','blacklist_status')`],
      ['config', `SELECT * FROM sys_config WHERE "configKey" = 'business.blacklist_check'`],
      ['customer_status', `SELECT id, status, "isBlacklist" FROM house_customer WHERE status = 'blacklist' OR "isBlacklist" = true`],
    ];
    for (const [source, sql] of sources) await q.query(`INSERT INTO retired_feature_archive(source,records) SELECT $1, COALESCE(jsonb_agg(to_jsonb(r)), '[]'::jsonb) FROM (${sql}) r ON CONFLICT(source) DO NOTHING`, [source]);
    await q.query(`DELETE FROM sys_role_permission WHERE "sysPermissionId" IN (SELECT id FROM sys_permission WHERE code LIKE 'house:blacklist%')`);
    await q.query(`DELETE FROM sys_permission WHERE code LIKE 'house:blacklist%'`);
    await q.query(`DELETE FROM sys_dict_item WHERE dict_code IN ('blacklist_type','blacklist_status')`);
    await q.query(`DELETE FROM sys_dict WHERE code IN ('blacklist_type','blacklist_status')`);
    await q.query(`DELETE FROM sys_config WHERE "configKey" = 'business.blacklist_check'`);
    await q.query(`UPDATE house_customer SET status = 'active' WHERE status = 'blacklist'`);
    await q.query(`ALTER TABLE house_customer RENAME COLUMN "isBlacklist" TO archived_risk_flag`);
    if (await q.hasTable('house_blacklist')) await q.renameTable('house_blacklist', 'archived_house_blacklist');
  }
  async down(q: QueryRunner) {
    if (await q.hasTable('archived_house_blacklist')) await q.renameTable('archived_house_blacklist', 'house_blacklist');
    await q.query(`ALTER TABLE house_customer RENAME COLUMN archived_risk_flag TO "isBlacklist"`);
    for (const [source, table] of [['permissions', 'sys_permission'], ['role_permissions', 'sys_role_permission'], ['dicts', 'sys_dict'], ['dict_items', 'sys_dict_item'], ['config', 'sys_config']]) {
      await q.query(`INSERT INTO ${table} SELECT r.* FROM retired_feature_archive a CROSS JOIN LATERAL jsonb_populate_recordset(NULL::${table}, a.records) r WHERE a.source = $1 ON CONFLICT DO NOTHING`, [source]);
    }
    await q.query(`UPDATE house_customer c SET status = r.status, "isBlacklist" = r.flag FROM (SELECT (value->>'id')::int id, value->>'status' status, (value->>'isBlacklist')::boolean flag FROM retired_feature_archive a CROSS JOIN LATERAL jsonb_array_elements(a.records) WHERE source = 'customer_status') r WHERE c.id = r.id AND c.status = 'active'`);
  }
}
