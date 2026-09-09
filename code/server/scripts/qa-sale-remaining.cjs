// UTF-8。仅对本机开发库执行；只清理本脚本精确 ID + 随机编码创建的售房记录。
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const base = new URL(process.env.QA_BASE_URL || 'http://localhost:3000/api/');
assert(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), '仅允许本地测试');
let checks = 0;
const sessions = [];
const code = 'QA-SALE-' + randomUUID().slice(0, 12);
let createdId;
async function req(path, token, method = 'GET', body) {
  const r = await fetch(new URL(path, base), { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const json = await r.json();
  return { status: r.status, data: json.data ?? json };
}
function check(condition, label) { assert(condition, label); checks++; console.log('PASS ' + label); }
async function login(mobile) {
  const r = await req('auth/login', null, 'POST', { mobile, password: process.env.QA_PASSWORD || '123456' });
  assert(r.status < 300, '登录失败: ' + mobile);
  sessions.push(r.data);
  return r.data.accessToken;
}
(async () => {
  const db = new Client({ host: 'localhost', database: 'house_pro', user: 'postgres', password: process.env.QA_DB_PASSWORD || 'postgres' });
  await db.connect();
  try {
    const admin = await login('super_admin');
    const readonly = await login('readonly');
    const agent = await login('agent01');
    const community = (await req('community', admin)).data.list[0];
    const baseline = (await req('house/sale-properties', admin)).data.total;
    const payload = { code, propertyType: '住宅', communityId: community.id, building: 'QA栋', unit: 'QA单元', floor: '9', roomNo: 'QA909', layoutRooms: 2, layoutHalls: 1, layoutBathrooms: 1, layoutBalconies: 0, buildingArea: 88.88, orientation: 'south', decoration: 'fine', elevator: 'yes', salePrice: 1234567.89, sourceChannel: 'visit', title: code, ownerName: code, ownerPhone: '19900009091', ownerIdCard: '110101199001010019' };
    const created = await req('house/sale-properties', admin, 'POST', payload);
    check(created.status === 201, '售房新增 201');
    createdId = created.data.id;
    let detail = await req('house/sale-properties/' + createdId + '/edit', admin);
    check(detail.status === 200 && detail.data.totalPrice === 1234567.89 && detail.data.ownerPhone === payload.ownerPhone, '编辑详情价格及授权完整手机号');
    const list = await req('house/sale-properties?keyword=' + code, admin);
    check(list.data.total === 1 && list.data.list[0].ownerPhone.includes('*') && list.data.list[0].ownerIdCard.includes('*'), '售房列表电话及身份证脱敏');
    check((await req('house/sale-properties?keyword=' + code, agent)).data.total === 0, '标题命中不得绕过 agent 自有数据范围');
    check((await req('house/sale-properties/' + createdId + '/edit', readonly)).status === 403, '只读账号拒绝编辑详情');
    check((await req('house/sale-properties/' + createdId, readonly, 'PUT', { title: 'forbidden' })).status === 403, '只读账号拒绝编辑');
    const update = await req('house/sale-properties/' + createdId, admin, 'PUT', { salePrice: 2345678.91, buildingArea: 99.99, roomNo: 'QA910', ownerPhone: '19900009092', tags: ['QA'], description: 'UTF-8 中文复测' });
    check(update.status === 200, '售房编辑成功');
    detail = await req('house/sale-properties/' + createdId + '/edit', admin);
    check(detail.data.totalPrice === 2345678.91 && detail.data.buildingArea === 99.99 && detail.data.roomNo === 'QA910' && detail.data.ownerPhone === '19900009092', '编辑字段重新读取无丢失');
    check((await req('house/sale-properties/' + createdId, admin, 'PUT', { status: 'sold' })).status === 400, '普通编辑不能变更状态');
    check((await req('property/update/' + createdId, admin, 'PUT', { transType: 2, status: 'sold' })).status === 400, '统一别名不能绕过状态接口');
    check((await req('house/sale-properties/' + createdId + '/status', readonly, 'PUT', { status: 'published' })).status === 403, '只读账号拒绝状态变更');
    check((await req('house/sale-properties/' + createdId + '/status', admin, 'PUT', { status: 'sold' })).status === 400, '待发布不能直接已售');
    check((await req('house/sale-properties/' + createdId + '/status', admin, 'PUT', { status: 'published' })).status === 200, '合法状态变更成功');
    check((await req('house/sale-properties?keyword=' + code + '&status=pre_publish', admin)).data.total === 0, '状态与关键词同时生效');
    const exported = await req('house/sale-properties/export?keyword=' + code, admin);
    check(exported.status === 200 && exported.data.total === 1 && exported.data.list[0].ownerPhone.includes('*'), '导出接口受过滤并保持脱敏');
    check((await req('house/sale-properties/export', readonly)).status === 403, '只读账号拒绝导出');
    check((await req('house/sale-properties?page=-1', admin)).status === 400, '分页边界拒绝非法值');
    check((await req('house/sale-properties/' + createdId, admin, 'PUT', { salePrice: -1 })).status === 400, '拒绝负售价');
    const paid = await req('finance/bills?status=paid', admin);
    check(paid.status === 200 && paid.data.total > 0 && paid.data.list.every((x) => x.status === 'paid'), '已缴账单筛选与显示一致');
    check((await req('finance/bills?keyword=' + code, admin)).data.total === 0, '账单不存在关键词返回空');
    check((await req('finance/flows?keyword=' + code, admin)).data.total === 0, '流水不存在摘要返回空');
    const income = await req('finance/flows?type=income', admin);
    check(income.status === 200 && income.data.total > 0 && income.data.list.every((x) => x.type === 'income'), '收入流水方向和筛选一致');
    for (const path of ['finance/rent-increases', 'finance/profits', 'finance/partners', 'finance/income-costs', 'finance/performances', 'finance/accountings', 'finance/arrears', 'finance/plans', 'finance/payouts', 'finance/invoices', 'system/roles', 'system/permissions/tree', 'system/dicts', 'system/employees', 'system/stores', 'system/logs', 'system/configs']) {
      check((await req(path, admin)).status === 200, path + ' 管理员读取 200（仅连通性）');
    }
    await db.query('DELETE FROM house_sale WHERE id = $1 AND code = $2', [createdId, code]);
    createdId = undefined;
    check((await req('house/sale-properties', admin)).data.total === baseline, '精确清理后售房总数恢复');
    console.log('PASS ' + checks + ' live API assertions; no financial writes');
  } finally {
    if (createdId) await db.query('DELETE FROM house_sale WHERE id = $1 AND code = $2', [createdId, code]);
    for (const session of sessions) await req('auth/logout', null, 'POST', { refreshToken: session.refreshToken });
    await db.end();
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
