// UTF-8。本地开发库只读权限回归：不创建业务数据，拒绝非回环地址。
const assert = require('node:assert/strict');
const base = new URL(process.env.QA_BASE_URL || 'http://localhost:3000/api/');
assert(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), '仅允许本地测试环境');
let checks = 0;
async function request(path, token, method = 'GET', body) {
  const response = await fetch(new URL(path, base), {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  return { status: response.status, data: result.data ?? result };
}
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  checks++;
}
(async () => {
  for (const account of ['super_admin', 'finance', 'salesman', 'agent01', 'housekeeper', 'store_manager', 'readonly']) {
    const login = await request('auth/login', undefined, 'POST', {
      mobile: account, password: process.env.QA_PASSWORD || '123456',
    });
    assert(login.status < 300 && login.data.accessToken, `测试账户 ${account} 登录失败`);
    const { accessToken, refreshToken } = login.data;
    try {
      equal((await request('house/blacklist', accessToken)).status, 404, `${account} 已移除的业务接口`);
      const overview = await request('dashboard/overview', accessToken);
      equal(overview.status, 200, `${account} 经营概览`);
      assert(!overview.data.kpis.some(item => item.label === '客户总数'), `${account} 已移除客户总数`);
      for (const card of overview.data.kpis) {
        const detail = await request(`dashboard/details/${card.key}`, accessToken);
        equal(detail.status, 200, `${account} ${card.label}详情`);
        if (['properties', 'rented', 'vacant'].includes(card.key)) equal(detail.data.total, card.value, `${account} ${card.label}总数`);
        else assert(Math.abs(Number(card.value) * 10000 - detail.data.totalAmount) <= 50, `${account} ${card.label}金额`);
      }
      const costs = await request('finance/business/income-costs?period=2026-09', accessToken);
      assert([200, 403].includes(costs.status), `${account} 收支成本权限或响应异常`);
      if (costs.status === 200) {
        equal(Math.round(costs.data.net * 100), Math.round((costs.data.totalIncome - costs.data.totalCost) * 100), `${account} 收支成本净额`);
        equal(new Set(costs.data.list.map(row => row.id)).size, costs.data.list.length, `${account} 收支来源不重复`);
      }
      if (account === 'super_admin') {
        const communities = await request('community', accessToken);
        equal(communities.status, 200, '小区列表及实时统计');
        const tree = await request('community/filters', accessToken);
        equal(tree.data.reduce((sum, city) => sum + city.count, 0), communities.data.total, '小区树总数与列表一致');
      } else {
        // 故意使用不完整 DTO。即便权限回归失败，也不会创建有效业务数据。
          equal((await request('community', accessToken, 'POST', {})).status, 403, `${account} 小区新增拒绝`);
      }
      if (account === 'readonly') {
        equal((await request('house/rental-sets/1', accessToken)).status, 403, '只读账号不得读取未脱敏编辑详情');
        equal((await request('house/rental-sets/1', accessToken, 'PUT', {})).status, 403, '只读账号不得编辑租房');
      }
      console.log(`PASS ${account}`);
    } finally {
      await request('auth/logout', undefined, 'POST', { refreshToken });
    }
  }
  console.log(`PASS ${checks} live API assertions; no business records written`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
