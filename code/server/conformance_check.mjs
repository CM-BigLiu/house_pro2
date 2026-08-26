// 符合性检查脚本：验证运行中的系统是否满足验收标准
const BASE = 'http://localhost:3000/api';
const results = [];
let pass = 0, fail = 0;

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  if (ok) pass++; else fail++;
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
}

async function login(mobile, password = '123456') {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, password }),
  });
  if (res.status !== 200 && res.status !== 201) throw new Error(`login failed ${mobile}: ${res.status}`);
  return res.json();
}

async function api(token, method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // 1. 登录认证
  const superAdmin = await login('super_admin');
  record('登录 super_admin', !!superAdmin.token);
  const agent02 = await login('agent02');
  record('登录 agent02', !!agent02.token);
  const salesman = await login('salesman');
  record('登录 salesman', !!salesman.token);
  const readonly = await login('readonly');
  record('登录 readonly', !!readonly.token);
  const boss = await login('boss');
  record('登录 boss', !!boss.token);

  // 2. 未登录 401
  const anon = await api(null, 'GET', '/house/sale-properties');
  record('未登录访问返回 401', anon.status === 401, `status=${anon.status}`);

  // 3. 数据权限验证（售房）
  const saleSuper = await api(superAdmin.token, 'GET', '/house/sale-properties?page=1&pageSize=50');
  const saleAgent = await api(agent02.token, 'GET', '/house/sale-properties?page=1&pageSize=50');
  const saleSalesman = await api(salesman.token, 'GET', '/house/sale-properties?page=1&pageSize=50');
  record('super_admin 售房总数', saleSuper.status === 200, `total=${saleSuper.data?.total}`);
  record('agent02 售房总数', saleAgent.status === 200, `total=${saleAgent.data?.total}`);
  record('数据范围隔离 agent02 < super_admin', (saleAgent.data?.total ?? 0) < (saleSuper.data?.total ?? 0),
    `super=${saleSuper.data?.total} agent02=${saleAgent.data?.total} salesman=${saleSalesman.data?.total}`);

  // 4. 售房总价字段映射 (Bug-2)
  const firstSale = saleSuper.data?.list?.[0];
  record('售房卡片 totalPrice 字段', firstSale && typeof firstSale.totalPrice === 'number' && firstSale.totalPrice > 0,
    `totalPrice=${firstSale?.totalPrice}`);

  // 5. 租房月租/押金/房间数 (Bug-3)
  const rentSuper = await api(superAdmin.token, 'GET', '/house/rental-sets?page=1&pageSize=50');
  const firstRent = rentSuper.data?.list?.[0];
  record('租房套 rent/deposit/roomCount 字段', firstRent && 'rent' in firstRent && 'roomCount' in firstRent,
    `rent=${firstRent?.rent} deposit=${firstRent?.deposit} roomCount=${firstRent?.roomCount} vacantCount=${firstRent?.vacantCount}`);

  // 6. 账单字段映射 (Bug-1)
  const billSuper = await api(superAdmin.token, 'GET', '/finance/bills?page=1&pageSize=50');
  const firstBill = billSuper.data?.list?.[0];
  record('账单 title/category/status 字段', firstBill && 'title' in firstBill && 'status' in firstBill,
    `title=${firstBill?.title} status=${firstBill?.status}`);

  // 7. 角色权限越权检查 (Bug-4): agent02 不应有 system 权限
  const agentPerms = agent02.user || {};
  const jwtPerms = JSON.parse(Buffer.from(agent02.token.split('.')[1], 'base64').toString()).permissions || [];
  record('agent02 无 system 菜单权限', !jwtPerms.includes('system'), `perms含system=${jwtPerms.includes('system')}`);
  record('agent02 无 system:role 权限', !jwtPerms.includes('system:role'));

  // readonly 无操作权限但可看菜单
  const readonlyPerms = JSON.parse(Buffer.from(readonly.token.split('.')[1], 'base64').toString()).permissions || [];
  const readonlyHasSystem = readonlyPerms.includes('system:role');
  record('readonly 无 system:role 权限', !readonlyHasSystem);

  // 8. 黑名单 check
  const blk = await api(superAdmin.token, 'GET', '/house/blacklist?page=1&pageSize=50');
  record('黑名单列表', blk.status === 200, `total=${blk.data?.total ?? blk.data?.list?.length}`);
  const blkCheck = await api(superAdmin.token, 'GET', '/house/blacklist/check?mobile=13800138001');
  record('黑名单命中校验', blkCheck.status === 200, JSON.stringify(blkCheck.data).slice(0, 120));

  // 9. 小区级联
  const comm = await api(superAdmin.token, 'GET', '/house/communities?page=1&pageSize=50');
  const cid = comm.data?.list?.[0]?.id;
  record('小区列表', comm.status === 200, `total=${comm.data?.total}`);
  const buildings = cid ? await api(superAdmin.token, 'GET', `/house/communities/${cid}/buildings`) : null;
  record('楼栋级联接口', buildings && buildings.status === 200, `count=${buildings?.data?.length ?? buildings?.data?.total}`);

  // 10. 看板真实数据
  const overview = await api(boss.token, 'GET', '/dashboard/overview');
  record('看板 overview 真实数据', overview.status === 200, `kpis=${overview.data?.kpis?.length}`);
  const warnings = await api(boss.token, 'GET', '/dashboard/warnings');
  record('看板 warnings', warnings.status === 200, `warnings=${warnings.data?.length}`);
  const rankings = await api(boss.token, 'GET', '/dashboard/rankings');
  record('看板 rankings', rankings.status === 200, `performance=${rankings.data?.performance?.length}`);
  const todos = await api(boss.token, 'GET', '/dashboard/todos');
  record('看板 todos', todos.status === 200, `todos=${todos.data?.length}`);

  // 11. 财务 12 模块接口探测
  const finEndpoints = [
    ['账单', '/finance/bills'],
    ['流水账', '/finance/flows'],
    ['涨价统计', '/finance/rent-increases'],
    ['公寓利润', '/finance/profits'],
    ['合伙人', '/finance/partners'],
    ['收入成本', '/finance/income-costs'],
    ['业绩核算', '/finance/performances'],
    ['财务核算', '/finance/accountings'],
    ['欠款统计', '/finance/arrears'],
    ['收支计划', '/finance/plans'],
    ['代付管理', '/finance/payouts'],
    ['开票管理', '/finance/invoices'],
  ];
  let finOk = 0;
  for (const [name, path] of finEndpoints) {
    const r = await api(superAdmin.token, 'GET', path + '?page=1&pageSize=5');
    if (r.status === 200) finOk++;
    else console.log(`   └ ${name} (${path}) → status=${r.status}`);
  }
  record('财务 12 模块接口可达', finOk === 12, `${finOk}/12`);

  // 12. 系统管理接口
  const sysEndpoints = [
    ['角色', '/system/roles'],
    ['权限树', '/system/permissions/tree'],
    ['字典', '/system/dicts'],
    ['员工', '/system/employees'],
  ];
  let sysOk = 0;
  for (const [name, path] of sysEndpoints) {
    const r = await api(superAdmin.token, 'GET', path + '?page=1&pageSize=5');
    if (r.status === 200) sysOk++;
    else console.log(`   └ ${name} (${path}) → status=${r.status}`);
  }
  record('系统管理接口可达', sysOk === 4, `${sysOk}/4`);

  // 13. 储备房源/客源
  const reserveProp = await api(superAdmin.token, 'GET', '/house/reserves/properties?page=1&pageSize=50');
  const reserveClient = await api(superAdmin.token, 'GET', '/house/reserves/clients?page=1&pageSize=50');
  record('储备房源', reserveProp.status === 200, `total=${reserveProp.data?.total}`);
  record('储备客源', reserveClient.status === 200, `total=${reserveClient.data?.total}`);

  // 14. 客户
  const customers = await api(superAdmin.token, 'GET', '/house/customers?page=1&pageSize=50');
  record('客户管理', customers.status === 200, `total=${customers.data?.total}`);

  // 15. 字典
  const dicts = await api(superAdmin.token, 'GET', '/system/dicts');
  record('字典列表', dicts.status === 200, `count=${dicts.data?.length}`);

  console.log('\n================ 结果汇总 ================');
  console.log(`通过 ${pass} 项 / 失败 ${fail} 项`);
  if (fail > 0) {
    console.log('\n失败项：');
    results.filter((r) => !r.ok).forEach((r) => console.log(`  ❌ ${r.name} — ${r.detail}`));
  }
}

main().catch((e) => {
  console.error('脚本执行异常：', e);
  process.exit(1);
});
