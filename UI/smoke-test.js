/* 渲染冒烟测试：最小 DOM 桩驱动 ui-core / ui-render，验证每页渲染无异常且产出关键内容 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function makeEl() {
  return {
    innerHTML: '',
    querySelector() { return makeEl(); },
    insertAdjacentHTML(pos, html) { this.innerHTML += html; },
    addEventListener() {},
    setAttribute() {},
    appendChild() {}
  };
}
const elements = { '.sidebar': makeEl(), '.header': makeEl(), '.content': makeEl() };
const sandbox = {
  document: {
    querySelector(sel) { return elements[sel] || makeEl(); },
    addEventListener() {},
    createElement() { return makeEl(); },
    body: makeEl()
  },
  localStorage: { getItem: () => 'super_admin', setItem() {} },
  URLSearchParams,
  console
};
sandbox.window = sandbox;
sandbox.location = { search: '' };
vm.createContext(sandbox);

const load = file => vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), sandbox, { filename: file });
['assets/js/ui-core.js', 'assets/js/ui-render.js', 'assets/js/data-base.js', 'assets/js/data-finance.js', 'assets/js/data-system.js'].forEach(load);

const PAGES = ['home', 'rent', 'sale', 'reserve-house', 'reserve-client', 'customer', 'community', 'house-wizard',
  'bill', 'flow', 'rent-increase', 'profit', 'partner', 'income-cost', 'performance', 'accounting',
  'arrears', 'plan', 'payout', 'billing', 'role', 'permission', 'dictionary', 'employee'];

const EXPECT = {
  customer: ['王小明 · 租客', '黑名单', 'match-panel', '来源渠道'],
  community: ['个小区', '世茂滨江花园', '静安'],
  sale: ['sort-bar', 'card-thumb', 'data-toggle-no-image', '速销日期', 'filter-more', '更多筛选', '备用电话', '来源（多选）'],
  rent: ['card-thumb', 'data-toggle-no-image', 'data-tab-host'],
  bill: ['收付款人', '房源编号', 'data-tab-host', '账单工作台'],
  flow: ['收付款人', '房源编号', 'data-tab-host', '待平账', '已付'],
  profit: ['data-tab-host', '业务类型'],
  'income-cost': ['租金差额', '本月服务费收入', '上月服务费收入'],
  plan: ['录入人员'],
  role: ['role-config', '菜单权限', '数据范围', '权限预览', '员工数'],
  employee: ['data-tab-host', '组织树'],
  home: ['data-todo-dialog', '我的待办', 'viz-ring', 'viz-hbars', 'large-card-actions']
};

let failed = 0;
for (const id of PAGES) {
  elements['.content'].innerHTML = '';
  elements['.header'].innerHTML = '';
  try {
    if (id === 'home') {
      sandbox.PROTOTYPE_PAGE = { id: 'home', title: '首页看板', group: '首页' };
      vm.runInContext('renderDashboard()', sandbox);
    } else {
      sandbox.PROTOTYPE_PAGE = vm.runInContext(`PROTOTYPE_PAGES['${id}']`, sandbox);
      if (!sandbox.PROTOTYPE_PAGE) throw new Error('页面数据缺失: ' + id);
      vm.runInContext(id === 'house-wizard' ? 'renderWizard(window.PROTOTYPE_PAGE)' : 'renderPage(window.PROTOTYPE_PAGE)', sandbox);
    }
    const html = elements['.content'].innerHTML;
    if (!html || html.length < 500) throw new Error('渲染内容过少: ' + html.length);
    for (const marker of (EXPECT[id] || [])) {
      if (!html.includes(marker)) throw new Error('缺少修复标记: ' + marker);
    }
    console.log(`OK   ${id.padEnd(16)} ${html.length} bytes`);
  } catch (err) {
    failed++;
    console.log(`FAIL ${id.padEnd(16)} ${err.message}`);
  }
}
console.log(failed === 0 ? `\n全部 ${PAGES.length} 个页面渲染通过（含修复标记断言）` : `\n${failed} 个页面失败`);
process.exit(failed ? 1 : 0);
