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
