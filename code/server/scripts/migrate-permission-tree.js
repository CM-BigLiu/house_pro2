/**
 * 修复权限树层级（一次性数据迁移，幂等）
 *
 * 背景：历史数据的 sys_permission.parentId 全部为 NULL，导致
 * GET /api/system/permissions/tree 返回扁平列表（菜单 children 恒为空），
 * 角色权限配置面板因此显示「暂无权限数据」，无法配置角色权限。
 *
 * 本脚本按 code 推导父子关系：
 *   1) 顶层菜单补 module，便于前端按模块分组
 *   2) 二级菜单（house:rent）挂到一级模块（house / finance / system）
 *   3) 操作权限挂到对应菜单（前缀最长匹配，或按语义兜底映射）
 *
 * 用法：npm run migrate:permission-tree
 */
require('dotenv').config();
const { Client } = require('pg');

const TOP_MODULES = ['house', 'finance', 'system'];

// 顶层菜单 -> module
const TOP_MODULE_LABEL = {
  home: 'home',
  house: 'house',
  finance: 'finance',
  system: 'system',
};

// 无直接前缀菜单的操作权限，按语义归属到对应菜单
const ACTION_FALLBACK = {
  'finance:ticket:apply': 'finance:billing',
  'finance:ticket:approve': 'finance:billing',
  'finance:export': 'finance:bill',
  'renting:add': 'house:rent',
  'renting:edit': 'house:rent',
  'renting:checkout': 'house:rent',
  'renting:export': 'house:rent',
  'sale:add': 'house:sale',
  'sale:edit': 'house:sale',
  'sale:changeStatus': 'house:sale',
  'sale:export': 'house:sale',
  'reserve:house:add': 'house:reserve_house',
  'reserve:house:take': 'house:reserve_house',
  'reserve:house:transfer': 'house:reserve_house',
  'reserve:client:add': 'house:reserve_client',
  'reserve:client:transfer': 'house:reserve_client',
};

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'house_pro',
  });

  await client.connect();
  try {
    for (const [code, module] of Object.entries(TOP_MODULE_LABEL)) {
      await client.query('UPDATE sys_permission SET module = $1 WHERE code = $2', [module, code]);
    }

    const { rows: perms } = await client.query(
      'SELECT id, code, type FROM sys_permission ORDER BY id',
    );
    const byCode = new Map(perms.map((p) => [p.code, p]));

    let linked = 0;
    for (const p of perms) {
      if (p.type === 'menu') {
        if (TOP_MODULES.includes(p.code)) continue;
        const parentCode = TOP_MODULES.find((t) => p.code.startsWith(`${t}:`));
        const parent = parentCode ? byCode.get(parentCode) : undefined;
        if (parent) {
          await client.query('UPDATE sys_permission SET "parentId" = $1 WHERE id = $2', [
            parent.id,
            p.id,
          ]);
          linked++;
        }
        continue;
      }

      let best = null;
      for (const node of perms) {
        if (node.type === 'menu' && p.code.startsWith(`${node.code}:`)) {
          if (!best || node.code.length > best.code.length) best = node;
        }
      }
      const fallbackCode = ACTION_FALLBACK[p.code];
      const target = (fallbackCode && byCode.get(fallbackCode)) || best;
      if (target) {
        await client.query('UPDATE sys_permission SET "parentId" = $1 WHERE id = $2', [
          target.id,
          p.id,
        ]);
        linked++;
      }
    }

    const { rows: stat } = await client.query(
      'SELECT type, count(*)::int AS total, count("parentId")::int AS linked FROM sys_permission GROUP BY type',
    );
    console.log(`✅ 权限层级修复完成，本次关联 ${linked} 个节点`);
    for (const r of stat) {
      console.log(`   ${r.type}: ${r.total} 条，已挂父级 ${r.linked} 条`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌ 权限层级修复失败:', err.message);
  process.exit(1);
});
