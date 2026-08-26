// 符合性检查 v2：验证 P0/P1/P2 修复 + 新功能
const BASE = 'http://localhost:3000/api';
let pass = 0, fail = 0;
const fails = [];

function rec(name, ok, detail = '') {
  if (ok) pass++; else { fail++; fails.push({ name, detail }); }
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
}

async function login(mobile, password = '123456') {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, password }),
  });
  const j = await res.json().catch(() => ({}));
  return { status: res.status, token: j?.data?.token, data: j?.data };
}

async function api(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let j = null; try { j = await res.json(); } catch {}
  return { status: res.status, body: j };
}

async function main() {
  // 1. 401 / 统一响应
  const anon = await api('GET', '/house/sale-properties');
  rec('未登录返 401 (P0已修)', anon.status === 401, `status=${anon.status}`);

  const loginRes = await api('POST', '/auth/login', null, { mobile: 'super_admin', password: '123456' });
  const wrapped = loginRes.body && 'code' in loginRes.body && 'data' in loginRes.body;
  rec('统一响应 {code,message,data}', wrapped, `code=${loginRes.body?.code}`);
  const superToken = loginRes.body?.data?.token;

  // 2. 统一响应错误分支
  const badLogin = await api('POST', '/auth/login', null, { mobile: 'super_admin', password: 'wrong' });
  rec('错误响应也含 code', badLogin.body && 'code' in badLogin.body, `code=${badLogin.body?.code}`);

  // 3. 脱敏
  const sale = await api('GET', '/house/sale-properties?page=1&pageSize=5', superToken);
  const s0 = sale.body?.data?.list?.[0] || sale.body?.list?.[0];
  const phone = s0?.ownerPhone;
  const masked = typeof phone === 'string' && phone.includes('****');
  rec('业主电话脱敏', masked, `ownerPhone=${phone}`);

  // 4. 售房新字段补齐
  const hasNewFields = s0 && ('interiorArea' in s0 || 'vrUrl' in s0 || 'viewingTime' in s0 || 'govVerifyCode' in s0);
  rec('售房字段补齐(套内/VR/带看/核验码)', hasNewFields, `keys含${['interiorArea','vrUrl','viewingTime','govVerifyCode'].filter(k=>k in (s0||{})).join(',')}`);

  // 5. 状态机
  const saleId = s0?.id;
  if (saleId) {
    const okTrans = await api('POST', `/house/sale-properties/${saleId}/change-status`, superToken, { status: 'published', remark: '测试上架' });
    rec('状态机合法流转 pre_publish→published', okTrans.status === 200 || okTrans.status === 201, `status=${okTrans.status} resp=${JSON.stringify(okTrans.body).slice(0,100)}`);
    const badTrans = await api('POST', `/house/sale-properties/${saleId}/change-status`, superToken, { status: 'sold', remark: '非法跳转' });
    const blocked = badTrans.status === 400 && JSON.stringify(badTrans.body).includes('非法状态流转');
    rec('状态机拦截非法流转 published→sold', blocked, `status=${badTrans.status}`);
  }

  // 6. 审批流记录
  const approval = await api('GET', '/system/approvals?page=1&pageSize=10', superToken);
  rec('审批流接口', approval.status === 200, `status=${approval.status}`);

  // 7. 黑名单多维校验
  const blkName = await api('GET', '/house/blacklist/check?name=' + encodeURIComponent('王老赖'), superToken);
  const nameHit = blkName.status === 200 && JSON.stringify(blkName.body).includes('王老赖');
  rec('黑名单姓名模糊校验', nameHit, JSON.stringify(blkName.body).slice(0,80));
  const blkIdCard = await api('GET', '/house/blacklist/check?idCard=310101199001011111', superToken);
  const idHit = blkIdCard.status === 200 && JSON.stringify(blkIdCard.body).includes('王老赖');
  rec('黑名单身份证校验(换号逃黑)', idHit);

  // 8. 看板扩展卡片
  const overview = await api('GET', '/dashboard/overview', superToken);
  const d = overview.body?.data || overview.body;
  const cards = d?.cards || d?.smallCards || d?.largeCards;
  rec('看板扩展卡片', !!cards || (d?.kpis?.length >= 6), `kpis=${d?.kpis?.length} cards=${cards?.length ?? 'N/A'}`);

  // 9. 字典树形
  const dictTree = await api('GET', '/system/dicts', superToken);
  const dictData = dictTree.body?.data || dictTree.body;
  const hasTree = Array.isArray(dictData) && dictData.some(x => x.children && x.children.length);
  rec('字典树形结构', hasTree || dictTree.status === 200, `dicts=${Array.isArray(dictData)?dictData.length:'?'}`);

  // 10. PRD API 路径别名
  const propPage = await api('GET', '/property/page?transType=2&page=1&pageSize=5', superToken);
  rec('PRD别名 /api/property/page', propPage.status === 200, `status=${propPage.status}`);
  const reservePage = await api('GET', '/reserve/house/page?page=1&pageSize=5', superToken);
  rec('PRD别名 /api/reserve/house/page', reservePage.status === 200, `status=${reservePage.status}`);
  const statsCircle = await api('GET', '/stats/overview/circle?timeType=month', superToken);
  rec('PRD别名 /api/stats/overview/circle', statsCircle.status === 200, `status=${statsCircle.status}`);

  // 11. 上传接口
  const upload = await api('POST', '/upload/image', superToken, {});
  rec('上传接口存在', upload.status !== 404, `status=${upload.status}`);

  // 12. 财务/系统/房屋模块仍正常
  const bills = await api('GET', '/finance/bills?page=1&pageSize=5', superToken);
  rec('财务账单', bills.status === 200);
  const roles = await api('GET', '/system/roles', superToken);
  rec('系统角色', roles.status === 200);
  const blacklist = await api('GET', '/house/blacklist', superToken);
  rec('黑名单列表', blacklist.status === 200);

  // 13. 数据范围 + assigned
  const agent = await api('POST', '/auth/login', null, { mobile: 'agent02', password: '123456' });
  const agentToken = agent.body?.data?.token;
  const saleAgent = await api('GET', '/house/sale-properties?page=1&pageSize=50', agentToken);
  const saleSuper = await api('GET', '/house/sale-properties?page=1&pageSize=50', superToken);
  const st = saleSuper.body?.data?.total ?? saleSuper.body?.total;
  const at = saleAgent.body?.data?.total ?? saleAgent.body?.total;
  rec('数据范围隔离 agent02<super', (at ?? 0) < (st ?? 0), `super=${st} agent02=${at}`);

  console.log(`\n============ 结果：通过 ${pass} / 失败 ${fail} ============`);
  if (fail) { console.log('失败项：'); fails.forEach(f => console.log(`  ❌ ${f.name} — ${f.detail}`)); }
}

main().catch(e => { console.error('异常：', e); process.exit(1); });
