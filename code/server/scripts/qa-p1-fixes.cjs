// UTF-8。只在本地开发库创建随机隔离数据，并在 finally 中按精确 ID 清理。
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');

const base = new URL(process.env.QA_BASE_URL || 'http://localhost:3000/api/');
assert(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), '仅允许本地测试');
const tag = `QA-P1-${randomUUID().slice(0, 8)}`;
const created = { reserveHouseId: 0, rentalSetId: 0, reserveClientId: 0, customerIds: [], followUpId: 0, billId: 0, flowId: 0, checkoutId: 0, roleId: 0 };
const sessions = [];
let checks = 0;

async function req(path, token, method = 'GET', body) {
  const response = await fetch(new URL(path, base), {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  let json = {};
  try { json = await response.json(); } catch {}
  return { status: response.status, data: json.data ?? json, message: json.message };
}
function check(value, label) { assert(value, label); checks++; console.log(`PASS ${label}`); }
async function login(mobile) {
  const result = await req('auth/login', null, 'POST', { mobile, password: process.env.QA_PASSWORD || '123456' });
  assert(result.status < 300, `登录失败: ${mobile}`);
  sessions.push(result.data);
  return result.data.accessToken;
}

(async () => {
  const db = new Client({ host: 'localhost', database: 'house_pro', user: 'postgres', password: process.env.QA_DB_PASSWORD || 'postgres' });
  await db.connect();
  try {
    const admin = await login('super_admin');
    const readonly = await login('readonly');
    const stores = (await req('system/stores', admin)).data;
    const store = stores[0];
    check(store && store.cityName && Number.isInteger(store.employeeCount), '门店返回城市和员工数');
    check((await req(`system/stores?keyword=${encodeURIComponent(tag)}`, admin)).data.length === 0, '不存在门店关键词返回 0 条');
    const employees = (await req(`system/employees?storeId=${store.id}`, admin)).data.list;
    const targetEmployee = employees.find((employee) => employee.status === 'normal');
    check(Boolean(targetEmployee), '门店员工筛选有效');
    check((await req(`system/employees/${targetEmployee.id}/edit`, admin)).status === 200, '人员编辑详情可读取');
    check((await req(`system/employees/${targetEmployee.id}/edit`, readonly)).status === 403, '只读账号不能读取人员编辑详情');
    check((await req(`system/stores/${store.id}/edit`, admin)).data.name === store.name, '门店编辑详情可读取');

    const permissionTree = (await req('system/permissions/tree', admin)).data;
    const houseRoot = permissionTree.find((node) => node.code === 'house');
    const saleMenu = houseRoot.children.find((node) => node.code === 'house:sale');
    const saleAdd = saleMenu.children.find((node) => node.code === 'sale:add');
    const saleEdit = saleMenu.children.find((node) => node.code === 'sale:edit');
    check(Boolean(saleAdd && saleEdit), '权限树包含第三级售房操作权限');
    const role = await req('system/roles', admin, 'POST', { code: tag.toLowerCase(), name: tag, dataScope: 'self', permissionIds: [houseRoot.id, saleMenu.id, saleAdd.id] });
    check(role.status === 201, '隔离角色创建并保存三级授权');
    created.roleId = role.data.id;
    await req(`system/roles/${created.roleId}`, admin, 'PUT', { permissionIds: [houseRoot.id, saleMenu.id, saleAdd.id, saleEdit.id] });
    const savedRole = (await req('system/roles', admin)).data.find((item) => item.id === created.roleId);
    check(savedRole.permissions.some((permission) => permission.code === 'sale:edit'), '角色操作授权更新后持久化');

    const customerPayload = { name: tag, mobile: '199' + String(Date.now()).slice(-8), idCard: '110101199001010019', customerType: 'buyer', sourceChannel: 'online', desiredDistrict: 'QA区域', budgetMin: 100, budgetMax: 200, remark: 'UTF-8 客户测试' };
    const customer = await req('house/customers', admin, 'POST', customerPayload);
    check(customer.status === 201, '客户创建字段与 DTO 对接');
    created.customerIds.push(customer.data.id);
    let customerList = await req(`house/customers?keyword=${tag}&customerType=buyer&budgetMin=150&budgetMax=180&page=1&pageSize=5`, admin);
    check(customerList.data.total === 1 && customerList.data.list[0].mobile.includes('*'), '客户电话、身份、预算和分页查询生效');
    check((await req(`house/customers?keyword=${tag}&status=invalid`, admin)).data.total === 0, '已失效筛选不混入 active 客户');
    check((await req(`house/customers/${customer.data.id}/edit`, admin)).data.mobile === customerPayload.mobile, '客户编辑详情返回授权完整电话');
    check((await req(`house/customers/${customer.data.id}`, readonly, 'PUT', { status: 'invalid' })).status === 403, '只读账号不能编辑客户');
    await req(`house/customers/${customer.data.id}`, admin, 'PUT', { ...customerPayload, status: 'invalid', budgetMax: 220 });
    check((await req(`house/customers?keyword=${tag}&status=invalid`, admin)).data.total === 1, '客户编辑及已失效筛选持久化');

    const community = (await req('community', admin)).data.list[0];
    const reserveHouse = await req('house/reserve-properties', admin, 'POST', { storeId: store.id, communityId: community.id, address: `${tag} 地址`, roomNo: 'QA101', layout: '2室1厅1卫', buildingArea: 80, decoration: 'fine', ownerName: tag, ownerPhone: '19900001111', ownerQuote: 3200, sourceChannel: 'online', diskType: 'public' });
    check(reserveHouse.status === 201, '储备房源隔离创建');
    created.reserveHouseId = reserveHouse.data.id;
    check((await req(`house/reserve-properties/${created.reserveHouseId}/edit`, admin)).data.ownerPhone === '19900001111', '储备房源编辑详情可读取');
    await req(`house/reserve-properties/${created.reserveHouseId}`, admin, 'PUT', { ownerQuote: 3300, layout: '2室2厅1卫' });
    check((await req(`house/reserve-properties/${created.reserveHouseId}/edit`, admin)).data.ownerQuote === '3300.00' || Number((await req(`house/reserve-properties/${created.reserveHouseId}/edit`, admin)).data.ownerQuote) === 3300, '储备房源编辑持久化');
    check((await req(`house/reserve-properties/${created.reserveHouseId}/transfer`, admin, 'POST', { salesmanId: targetEmployee.id })).status === 201, '储备房源转业务员受控接口成功');
    const contractCode = `${tag}-RENT`;
    const signed = await req(`house/reserve-properties/${created.reserveHouseId}/sign-contract`, admin, 'POST', { contractCode, bizType: 'entire', leaseStart: '2026-09-01', leaseEnd: '2027-09-01', landlordRent: 3300, deposit: 3300 });
    check(signed.status === 201 && signed.data.rentalSetId, '拿房签约原子创建租房档案');
    created.rentalSetId = signed.data.rentalSetId;
    check((await req(`house/rental-sets?keyword=${encodeURIComponent(contractCode)}`, admin)).data.total === 1, '签约流转结果可在租房管理查询');
    check((await req(`house/reserve-properties/${created.reserveHouseId}/sign-contract`, admin, 'POST', { contractCode: contractCode + '-2', bizType: 'entire', leaseStart: '2026-09-01', leaseEnd: '2027-09-01', landlordRent: 3300 })).status === 400, '已拿房储备记录不能重复签约');

    const reserveClient = await req('house/reserve-clients', admin, 'POST', { storeId: store.id, clientName: tag, clientMobile: '19900002222', desiredLocation: 'QA区域', demandType: 'rent', desiredLayout: '一室', priceMin: 2000, priceMax: 3000, sourceChannel: 'online', ownership: 'public' });
    check(reserveClient.status === 201, '储备客源隔离创建');
    created.reserveClientId = reserveClient.data.id;
    await req(`house/reserve-clients/${created.reserveClientId}`, admin, 'PUT', { desiredLocation: 'QA新区', priceMax: 3500 });
    check((await req(`house/reserve-clients/${created.reserveClientId}/edit`, admin)).data.desiredLocation === 'QA新区', '储备客源编辑持久化');
    const follow = await req(`house/reserve-clients/${created.reserveClientId}/follow-ups`, admin, 'POST', { followType: 'phone', content: `${tag} 跟进`, status: 'completed' });
    check(follow.status === 201, '储备客源跟进记录已保存');
    created.followUpId = follow.data.id;
    const converted = await req(`house/reserve-clients/${created.reserveClientId}/convert`, admin, 'POST', { contractCode: `${tag}-CLIENT`, contractEndDate: '2027-09-01' });
    check(converted.status === 201 && converted.data.customerId, '储备客源转签约原子创建正式客户');
    created.customerIds.push(converted.data.customerId);
    const overview = (await req('dashboard/overview', admin)).data;
    const reserveKpi = overview.kpis.find((item) => item.label === '储备客源').value;
    const reserveTotal = (await req('house/reserve-clients?page=1&pageSize=1', admin)).data.total;
    check(Number(reserveKpi) === Number(reserveTotal), '首页与储备客源列表使用相同数据范围口径');

    const bill = await req('finance/bills', admin, 'POST', { bizType: 'rent', bizId: tag, billSource: 'rent_deposit', payer: tag, payee: 'QA公司', dueDate: '2026-09-30', amount: 123.45, roomCode: tag, billPeriod: '2026-09' });
    check(bill.status === 201 && bill.data.status === 'pending', '账单表单字段与 DTO 一致');
    created.billId = bill.data.id;
    await req(`finance/bills/${created.billId}`, admin, 'PUT', { amount: 234.56, dueDate: '2026-10-01' });
    check(Number((await req(`finance/bills/${created.billId}/edit`, admin)).data.amount) === 234.56, '账单编辑持久化');
    check((await req(`finance/bills/${created.billId}/void`, admin, 'POST')).data.status === 'cancelled', '账单作废独立状态接口成功');

    const flow = await req('finance/flows', admin, 'POST', { direction: 'income', amount: 88.88, paymentType: 'bank', bizType: 'rent', occurredOn: '2026-09-09', remark: tag });
    check(flow.status === 201 && flow.data.status === 'pending', '流水创建写入门店、创建人和业务字段');
    created.flowId = flow.data.id;
    await req(`finance/flows/${created.flowId}`, admin, 'PUT', { amount: 99.99, paymentType: 'wechat', remark: `${tag}-EDIT` });
    const flowDetail = await req(`finance/flows/${created.flowId}/edit`, admin);
    check(Number(flowDetail.data.amount) === 99.99 && flowDetail.data.paymentType === 'wechat', '未审核流水编辑持久化');

    const checkout = await req('house/checkouts', admin, 'POST', { contractCode: `${tag}-CO`, tenantName: tag, houseInfo: `${tag} 房源`, checkoutDate: '2026-09-09', reason: '隔离测试', settlementAmount: 10, remark: 'UTF-8 详情' });
    check(checkout.status === 201, '隔离退租记录创建');
    created.checkoutId = checkout.data.id;
    const checkoutDetail = await req(`house/checkouts/${created.checkoutId}`, admin);
    check(checkoutDetail.status === 200 && checkoutDetail.data.remark === 'UTF-8 详情', '退租详情返回完整信息');
    check((await req(`house/checkouts/${created.checkoutId}/confirm`, admin, 'POST')).data.status === 'confirmed', '隔离退租确认链路成功');
    check((await req(`house/checkouts/${created.checkoutId}/complete`, admin, 'POST')).data.status === 'completed', '隔离退租清算链路成功');

    console.log(`PASS ${checks} live assertions; duplicate business data was not merged or deleted`);
  } finally {
    await db.query('BEGIN');
    try {
      if (created.checkoutId) await db.query('DELETE FROM house_checkout WHERE id = $1 AND "contractCode" = $2', [created.checkoutId, `${tag}-CO`]);
      if (created.flowId) await db.query('DELETE FROM fin_flow WHERE id = $1', [created.flowId]);
      if (created.billId) await db.query('DELETE FROM fin_bill WHERE id = $1 AND "bizId" = $2', [created.billId, tag]);
      if (created.followUpId) await db.query('DELETE FROM house_follow_up WHERE id = $1 AND biz_id = $2', [created.followUpId, created.reserveClientId]);
      for (const id of created.customerIds) await db.query('DELETE FROM house_customer WHERE id = $1', [id]);
      if (created.reserveClientId) await db.query('DELETE FROM house_reserve_client WHERE id = $1 AND "clientName" = $2', [created.reserveClientId, tag]);
      if (created.rentalSetId) { await db.query('DELETE FROM house_rental_room WHERE "set_id" = $1', [created.rentalSetId]); await db.query('DELETE FROM house_rental_set WHERE id = $1', [created.rentalSetId]); }
      if (created.reserveHouseId) await db.query('DELETE FROM house_reserve WHERE id = $1 AND "ownerName" = $2', [created.reserveHouseId, tag]);
      if (created.roleId) { await db.query('DELETE FROM sys_role_permission WHERE "sysRoleId" = $1', [created.roleId]); await db.query('DELETE FROM sys_role WHERE id = $1 AND code = $2', [created.roleId, tag.toLowerCase()]); }
      await db.query('COMMIT');
    } catch (error) { await db.query('ROLLBACK'); throw error; }
    for (const session of sessions) await req('auth/logout', null, 'POST', { refreshToken: session.refreshToken });
    await db.end();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
