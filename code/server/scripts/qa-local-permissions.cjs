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
      const expectedRead = ['super_admin', 'store_manager', 'readonly'].includes(account) ? 200 : 403;
      equal((await request('house/blacklist', accessToken)).status, expectedRead, `${account} 黑名单读取`);
      if (account === 'super_admin') {
        const empty = await request('house/blacklist?keyword=QA-NONEXISTENT-0909', accessToken);
        equal({ list: empty.data.list, total: empty.data.total }, { list: [], total: 0 }, '空搜索总数');
        const communities = await request('community', accessToken);
        equal(communities.status, 200, '小区列表及实时统计');
        const tree = await request('community/filters', accessToken);
        equal(tree.data.reduce((sum, city) => sum + city.count, 0), communities.data.total, '小区树总数与列表一致');
      } else {
        // 故意使用不完整 DTO。即便权限回归失败，也不会创建有效业务数据。
        equal((await request('house/blacklist', accessToken, 'POST', {})).status, 403, `${account} 黑名单新增拒绝`);
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
