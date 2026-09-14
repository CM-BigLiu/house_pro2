const assert = require('node:assert/strict');
const { once } = require('node:events');
const { test, before, after } = require('node:test');
const app = require('./server');

let server, base, token;
async function request(path, method = 'GET', data) {
  const response = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  return response.json();
}
async function ok(path, method, data) {
  const response = await request(path, method, data);
  assert.equal(response.code, 0, response.message);
  return response.data;
}
async function requestAs(authToken, path, method = 'GET', data) {
  const response = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  return response.json();
}
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}/api`;
  token = (await ok('/auth/login', 'POST', { mobile: 'super_admin', password: '123456' })).accessToken;
});
after(() => new Promise(resolve => server.close(resolve)));

test('homepage API returns the dashboard contract and readable unfinished todos', async () => {
  const overview = await ok('/dashboard/overview');
  assert.ok(overview.kpis.length > 0);
  assert.ok(overview.kpis.every(item => item.label && item.value !== undefined));
  assert.ok(Array.isArray(overview.charts.monthly));
  assert.ok(Array.isArray(overview.bigCards));
  assert.ok(Array.isArray(overview.smallCards));
  const rankings = await ok('/dashboard/rankings');
  assert.ok(rankings.performance.length > 0);
  assert.ok(rankings.performance.every(item => item.name && typeof item.value === 'number'));
  const todos = await ok('/dashboard/todos');
  assert.ok(todos.length > 0);
  assert.ok(todos.every(item => typeof item.id === 'string' && item.title && !item.done));
  assert.ok(todos.every(item => ['high', 'medium', 'low'].includes(item.priority)));
  assert.ok(Array.isArray(await ok('/dashboard/warnings')));
  assert.ok((await ok('/auth/menus')).some(menu => menu.path === '/home'));
});

test('employee page receives a paginated list and normalized employment status', async () => {
  const first = await ok('/system/employees?pageSize=2');
  const second = await ok('/system/employees?pageSize=2&page=2');
  assert.equal(first.list.length, 2);
  assert.ok(first.total > 2);
  assert.notEqual(first.list[0].id, second.list[0].id);
  const filtered = await ok('/system/employees?statusFilter=normal&storeId=1');
  assert.ok(filtered.list.length > 0);
  assert.ok(filtered.list.every(employee => employee.status === 'normal' && employee.stores.some(store => store.id === 1)));
});

test('community filters and pagination agree with the community list', async () => {
  const tree = await ok('/community/filters');
  const all = await ok('/community?pageSize=200');
  assert.equal(tree.reduce((sum, city) => sum + city.count, 0), all.total);
  assert.ok(tree.every(city => city.children.reduce((sum, child) => sum + child.count, 0) === city.count));
  const city = tree[0], child = city.children[0];
  const filtered = await ok(`/community?cityId=${city.id}&businessCircle=${encodeURIComponent(child.name)}`);
  assert.equal(filtered.total, child.count);
  assert.equal((await ok('/community?pageSize=2')).list.length, 2);
  assert.equal((await ok('/community?cityId=999')).total, 0);
});

test('sale form dropdowns contain enabled labeled options from backend dictionaries', async () => {
  for (const code of ['property_type', 'decoration_level', 'orientation', 'source_channel', 'tax_type', 'certificate_type']) {
    const items = await ok(`/system/dicts/${code}/items`);
    assert.ok(items.length > 0, `${code} must not be empty`);
    assert.ok(items.every(item => item.value && item.label && item.enabled));
  }
  assert.ok((await ok('/system/dicts/property_type/items')).some(item => item.value === 'residential'));
  assert.ok((await ok('/system/dicts/tax_type/items')).some(item => item.value === 'normal'));
  assert.ok((await ok('/system/dicts/certificate_type/items')).some(item => item.value === 'property'));
});

test('room checkout: submit locks room, approval releases it, old settlement leaves new tenant untouched', async () => {
  const set = await ok('/house/rental-sets/2');
  set.rooms.find(room => room.id === 101).depositAmount = 0;
  await ok('/house/rental-sets/2', 'PUT', { rooms: set.rooms });
  const input = { rentalSetId: 2, rentalRoomId: 101, houseInfo: '回归测试 A室', tenantName: '测试租客' };
  const created = await ok('/house/checkouts', 'POST', input);
  assert.equal(created.status, 'pending');
  let current = await ok('/house/rental-sets/2');
  assert.equal(current.rooms.find(room => room.id === 101).status, 'checkout');
  assert.equal(current.rooms.find(room => room.id === 102).status, set.rooms.find(room => room.id === 102).status);
  assert.equal((await request('/house/checkouts', 'POST', input)).code, 400);
  assert.equal((await ok(`/house/checkouts/${created.id}`)).rentalRoomId, 101);
  await ok(`/house/checkouts/${created.id}/confirm`, 'POST', {});
  current = await ok('/house/rental-sets/2');
  assert.equal(current.rooms.find(room => room.id === 101).status, 'vacant');
  assert.equal(current.rooms.find(room => room.id === 101).tenantName, null);
  assert.equal((await request(`/house/checkouts/${created.id}/confirm`, 'POST', {})).code, 400);
  const newRoom = current.rooms.find(room => room.id === 101);
  Object.assign(newRoom, { status: 'rented', tenantName: '新租客' });
  await ok('/house/rental-sets/2', 'PUT', { rooms: current.rooms });
  await ok(`/house/checkouts/${created.id}/complete`, 'POST', {});
  current = await ok('/house/rental-sets/2');
  assert.equal(current.rooms.find(room => room.id === 101).tenantName, '新租客');
  assert.equal(current.rooms.find(room => room.id === 101).status, 'rented');
  await ok('/house/checkouts', 'POST', input);
});

test('entire property follows rented → checkout → vacant and remains in the vacant filter', async () => {
  const created = await ok('/house/checkouts', 'POST', { rentalSetId: 1, houseInfo: '回归测试整租', tenantName: '测试租客' });
  assert.equal((await ok('/house/rental-sets/1')).status, 'checkout');
  await ok(`/house/checkouts/${created.id}/confirm`, 'POST', {});
  const set = await ok('/house/rental-sets/1');
  assert.equal(set.status, 'vacant');
  assert.equal(set.tenantLeaseEnd, null);
  assert.ok((await ok('/house/rental-sets?status=vacant')).list.some(item => item.id === 1));
  const checkout = await ok(`/house/checkouts/${created.id}`);
  assert.equal(checkout.canComplete, false);
  assert.match(checkout.settlementBlockReason, /未找到对应押金/);
  assert.equal((await request(`/house/checkouts/${created.id}/complete`, 'POST', {})).code, 400);
  const detail = await ok('/house/details/rent/1');
  assert.ok(detail.checkouts.some(record => record.id === created.id && record.confirmedAt));
  assert.ok(detail.property.landlordPhone.includes('****'));
});

test('pending deposits disable checkout settlement until disposition', async () => {
  let checkout = await ok('/house/checkouts/1');
  assert.equal(checkout.canComplete, false);
  assert.equal(checkout.pendingDepositCount, 1);
  assert.equal((await ok('/house/checkouts')).list.find(c => c.id === 1).canComplete, false);
  assert.equal((await request('/house/checkouts/1/complete', 'POST', {})).code, 400);
  await ok('/house/deposits/1/refund', 'POST', {});
  checkout = await ok('/house/checkouts/1');
  assert.equal(checkout.canComplete, true);
  assert.equal((await ok('/house/checkouts/1/complete', 'POST', {})).status, 'completed');
  assert.equal((await request('/house/checkouts/1/complete', 'POST', {})).code, 400);
});

test('shared property details contain rooms and room-specific history only', async () => {
  const detail = await ok('/house/details/rent/2');
  assert.equal(detail.property.rooms.length, 4);
  const room = await ok('/house/details/rent/2?roomId=101');
  assert.equal(room.roomId, 101);
  assert.ok(room.checkouts.length > 0);
  assert.ok(room.checkouts.every(c => c.rentalRoomId === 101));
  assert.equal((await ok('/house/details/rent/2?roomId=102')).checkouts.length, 0);
  assert.equal((await request('/house/details/rent/2?roomId=999')).code, 404);
});

test('sale: editable detail, saved price/title, allowed transitions and approval apply consistently', async () => {
  const list = await ok('/house/sale-properties');
  assert.ok(list.list.every(item => item.allowedStatuses.length > 0));
  const detail = await ok('/house/sale-properties/1/edit');
  assert.ok(detail.communityId && /^1\d{10}$/.test(detail.ownerPhone));
  const updated = await ok('/house/sale-properties/1', 'PUT', { title: '回归测试售房', salePrice: 999 });
  assert.equal(updated.totalPrice, 999);
  const listed = (await ok('/house/sale-properties?keyword=回归测试售房')).list[0];
  assert.equal(listed.totalPrice, 999);
  assert.equal(listed.title, '回归测试售房');
  const beforeStatus = listed.status;
  const targetStatus = listed.allowedStatuses[0];
  const approval = await ok('/house/sale-properties/1/change-status', 'POST', { status: targetStatus });
  assert.equal((await ok('/house/sale-properties/1/edit')).status, beforeStatus);
  assert.equal((await request('/house/sale-properties/1/change-status', 'POST', { status: targetStatus })).code, 400);
  await ok(`/system/approvals/${approval.id}/approve`, 'POST', {});
  const readOnly = await ok('/house/details/sale/1');
  assert.equal(readOnly.property.id, 1);
  assert.ok(readOnly.property.ownerPhone.includes('****'));
  assert.ok(readOnly.operations.some(log => log.action === 'sale:update'));
  assert.ok(readOnly.approvals.some(record => record.id === approval.id && record.result === 'approved'));
  assert.equal(readOnly.checkouts.length, 0);
  assert.equal((await ok('/house/sale-properties/1/edit')).status, targetStatus);
  assert.equal((await request('/house/sale-properties/1/change-status', 'POST', { status: 'invalid' })).code, 400);
  assert.equal((await request('/house/sale-properties/1', 'PUT', { status: 'sold' })).code, 400);
  assert.equal((await request('/house/sale-properties/9999/edit')).code, 404);
});

test('reported list pages return distinct slices and normalized customer fields', async () => {
  for (const path of ['/house/rental-sets', '/house/customers', '/finance/bills', '/finance/flows']) {
    const first = await ok(`${path}?page=1&pageSize=2`);
    const second = await ok(`${path}?page=2&pageSize=2`);
    assert.equal(first.list.length, 2, path);
    assert.equal(second.list.length, 2, path);
    assert.notEqual(first.list[0].id, second.list[0].id, path);
  }
  const customers = await ok('/house/customers?customerType=tenant&status=active&pageSize=5');
  assert.ok(customers.list.length > 0);
  assert.ok(customers.list.every(item => item.mobile && item.customerType === 'tenant' && item.status === 'active'));
  const editable = await ok(`/house/customers/${customers.list[0].id}/edit`);
  assert.equal(editable.mobile, customers.list[0].mobile);
});

test('reserve property and client workflows expose one contract for list, edit and actions', async () => {
  const properties = await ok('/house/reserve-properties?status=not_rented&pageSize=3');
  assert.ok(properties.list.length > 0);
  assert.ok(properties.list.every(item => item.ownerQuote >= 0 && item.sourceChannel && item.status === 'not_rented'));
  const property = properties.list[0];
  assert.equal((await ok(`/house/reserve-properties/${property.id}/edit`)).id, property.id);
  assert.equal((await ok(`/house/reserve-properties/${property.id}/transfer`, 'POST', { salesmanId: 4 })).salesmanName, '李娜');

  for (const code of ['demand_type', 'urgency', 'blacklist_status', 'payment_type', 'ticket_status', 'identity']) {
    assert.ok((await ok(`/system/dicts/${code}/items`)).length > 0, code);
  }
  const clients = await ok('/house/reserve-clients?status=not_rented&pageSize=2');
  assert.equal(clients.list.length, 2);
  assert.ok(clients.list.every(item => item.clientName && item.clientMobile && item.demandType));
  const client = clients.list[0];
  assert.equal((await ok(`/house/reserve-clients/${client.id}/edit`)).clientName, client.clientName);
  assert.ok((await ok(`/house/reserve-clients/${client.id}/follow-ups`, 'POST', { followType: 'phone', content: '回归跟进' })).id);
  const converted = await ok(`/house/reserve-clients/${client.id}/convert`, 'POST', { contractCode: 'HT-REGRESSION-001' });
  assert.ok(converted.customerId > 0);
});

test('system forms reject blank base data and roles reflect runtime permissions', async () => {
  assert.equal((await request('/system/dicts', 'POST', { code: '', name: '' })).code, 400);
  assert.equal((await request('/system/dicts/items', 'POST', { dictCode: 'source_channel', value: '', label: '' })).code, 400);
  assert.equal((await request('/system/roles', 'POST', { code: '', name: '' })).code, 400);
  const roles = await ok('/system/roles');
  assert.ok(roles.every(role => Array.isArray(role.permissions) && role.permissions.length > 0));
  assert.equal((await ok('/system/employees/4/edit')).name, '李娜');
  assert.equal((await ok('/house/blacklist/1')).name, '张某某');
  assert.equal((await ok('/community/1')).id, 1);
});

test('financial forms validate data and preserve submitted DTO fields', async () => {
  assert.equal((await request('/finance/rent-increases', 'POST', { roomCode: '', lastRent: 0, currentRent: 0 })).code, 400);
  assert.equal((await request('/finance/profits', 'POST', { period: '', income: 0, cost: 0 })).code, 400);
  assert.equal((await request('/finance/plans', 'POST', { planType: 'income', totalPeriods: 1, totalAmount: 0 })).code, 400);
  const plan = await ok('/finance/plans', 'POST', { planType: 'income', billingCategory: '其他收入', reason: '计划搜索回归', totalPeriods: 2, totalAmount: 200 });
  assert.equal(plan.title, '计划搜索回归');
  assert.equal((await ok('/finance/plans?keyword=计划搜索回归')).total, 1);
  const flow = await ok('/finance/flows', 'POST', { remark: '回归流水', direction: 'income', amount: 123, paymentType: 'bank' });
  assert.equal(flow.title, '回归流水');
  assert.equal(flow.type, 'income');
  assert.equal((await ok(`/finance/flows/${flow.id}/edit`)).direction, 'income');
  const filtered = await ok('/finance/flows?keyword=回归流水&type=income');
  assert.equal(filtered.total, 1);
  const summary = await ok('/finance/profits/summary');
  assert.equal(typeof summary.margin, 'number');
  const legacy = await ok('/house/checkouts/3/confirm', 'POST', {});
  assert.equal(legacy.manualHouseStateRequired, true);
});

test('high-impact lifecycle: destructive cleanup, account, permissions, approval and finance actions', async () => {
  assert.equal((await requestAs('', '/finance/payouts/batch-pay', 'POST', { ids: [5] })).code, 401);
  const blacklist = await ok('/house/blacklist', 'POST', {
    name: '高影响测试黑名单', mobile: '13900009996', type: 'other', reason: '隔离回归数据', status: 'active',
  });
  await ok(`/house/blacklist/${blacklist.id}`, 'DELETE');
  assert.equal((await request(`/house/blacklist/${blacklist.id}`)).code, 404);
  assert.equal((await request(`/house/blacklist/${blacklist.id}`, 'DELETE')).code, 404);

  const community = await ok('/community', 'POST', { name: '高影响测试小区', cityId: 1, district: '浦东新区', address: '测试地址' });
  await ok(`/community/${community.id}`, 'DELETE');
  assert.equal((await request(`/community/${community.id}`)).code, 404);

  const dict = await ok('/system/dicts', 'POST', { code: 'high_impact_test', name: '高影响测试字典' });
  const dictItem = await ok('/system/dicts/items', 'POST', { dictCode: dict.code, value: 'test', label: '测试项', sort: 1, enabled: true });
  await ok(`/system/dicts/items/${dictItem.id}`, 'DELETE');
  assert.equal((await ok(`/system/dicts/${dict.code}/items`)).length, 0);
  await ok(`/system/dicts/${dict.id}`, 'DELETE');
  assert.equal((await request(`/system/dicts/id/${dict.id}`)).code, 404);
  assert.equal((await request(`/system/dicts/${dict.id}`, 'DELETE')).code, 404);

  const employeePayload = {
    name: '高影响测试员工', mobile: '13900009998', password: 'Tmp123456!', status: 'normal',
    roleIds: [4], storeIds: [1], positionIds: [2], entryDate: '2026-09-14',
  };
  const employee = await ok('/system/employees', 'POST', employeePayload);
  assert.equal(employee.entryDate, employeePayload.entryDate);
  assert.equal(employee.roles[0].id, 4);
  assert.equal(employee.stores[0].id, 1);
  assert.equal(employee.positions[0].id, 2);
  assert.equal(Object.hasOwn(employee, 'password'), false);
  const employeeLogin = await ok('/auth/login', 'POST', { mobile: employeePayload.mobile, password: employeePayload.password });
  assert.equal(employeeLogin.user.role, 'salesman');
  assert.equal((await request('/system/employees', 'POST', employeePayload)).code, 400);
  assert.equal((await request('/system/employees', 'POST', { ...employeePayload, mobile: '13900009997', roleIds: [] })).code, 400);
  await ok(`/system/employees/${employee.id}`, 'DELETE');
  assert.equal((await ok(`/system/employees?keyword=${employeePayload.mobile}`)).total, 0);
  assert.equal((await request('/auth/login', 'POST', { mobile: employeePayload.mobile, password: employeePayload.password })).code, 401);
  assert.equal((await request(`/system/employees/${employee.id}`, 'DELETE')).code, 404);
  assert.equal((await request('/system/employees/1', 'DELETE')).code, 400);

  const roles = await ok('/system/roles');
  const salesman = roles.find(role => role.code === 'salesman');
  const originalPermissionIds = salesman.permissions.map(permission => permission.id);
  await ok(`/system/roles/${salesman.id}`, 'PUT', { permissionIds: [1] });
  const restrictedLogin = await ok('/auth/login', 'POST', { mobile: 'salesman', password: '123456' });
  const restrictedMe = await requestAs(restrictedLogin.accessToken, '/auth/me');
  assert.deepEqual(restrictedMe.data.permissions, ['home']);
  assert.equal((await requestAs(restrictedLogin.accessToken, '/system/employees/9999', 'DELETE')).code, 403);
  await ok(`/system/roles/${salesman.id}`, 'PUT', { permissionIds: originalPermissionIds });
  const restored = (await ok('/system/roles')).find(role => role.id === salesman.id);
  assert.deepEqual(restored.permissions.map(permission => permission.id).sort((a, b) => a - b), originalPermissionIds.sort((a, b) => a - b));
  assert.equal((await request('/system/roles/1', 'DELETE')).code, 400);

  const saleList = await ok('/house/sale-properties?pageSize=50');
  const sale = saleList.list.find(item => item.allowedStatuses.length > 0);
  const targetStatus = sale.allowedStatuses[0];
  const approval = await ok(`/house/sale-properties/${sale.id}/change-status`, 'POST', { status: targetStatus, remark: '高影响审批回归' });
  await ok(`/system/approvals/${approval.id}/approve`, 'POST', { remark: '回归通过' });
  assert.equal((await ok(`/house/sale-properties/${sale.id}/edit`)).status, targetStatus);

  const pendingPayouts = await ok('/finance/payouts?status=pending&pageSize=20');
  const payoutIds = pendingPayouts.list.map(item => item.id);
  assert.equal(payoutIds.length, 2);
  assert.equal((await ok('/finance/payouts/batch-pay', 'POST', { ids: payoutIds })).count, 2);
  const paidPayouts = await ok('/finance/payouts?status=paid&pageSize=50');
  assert.ok(payoutIds.every(id => paidPayouts.list.some(item => item.id === id && item.actualAmount === item.payoutAmount)));
  assert.equal((await request('/finance/payouts/batch-pay', 'POST', { ids: payoutIds })).code, 400);

  const invoice = await ok('/finance/invoices', 'POST', {
    applySource: 'manual', buyerName: '高影响测试开票', buyerTaxNo: '91310000TEST000001',
    amountWithoutTax: 943.4, taxAmount: 56.6, amountWithTax: 1000, invoiceType: 'special', remark: '隔离回归数据',
  });
  assert.equal(invoice.status, 'pending');
  assert.equal(invoice.invoiceType, 'special');
  assert.equal((await request('/finance/invoices', 'POST', { applySource: 'manual', buyerName: '缺少税号', amountWithTax: 1000, invoiceType: 'special' })).code, 400);
  assert.ok((await ok('/finance/invoices?keyword=高影响测试开票')).list.some(item => item.id === invoice.id));

  const plan = await ok('/finance/plans', 'POST', {
    planType: 'expense', billingCategory: '测试支出', reason: '高影响计划回归', totalPeriods: 2, totalAmount: 2000,
  });
  assert.equal(plan.amount, 1000);
  assert.ok((await ok('/finance/plans?keyword=高影响计划回归')).list.some(item => item.id === plan.id));
});
