/* ============================================================
   优居 ERP · 高保真渲染引擎 —— 核心框架
   模块 / 角色 / 权限 / 侧边栏 / 顶栏 / 通用构件
   ============================================================ */
/* 菜单权限矩阵（产品文档 §3.2）：侧边栏菜单可见性的唯一数据源。
   super_admin 恒可见全部；home 全角色可见；boss 仅首页。 */
const MENU_ROLE_MATRIX = {
  home: ['*'],
  rent: ['salesman', 'agent', 'housekeeper', 'store_manager'],
  sale: ['salesman', 'agent', 'store_manager'],
  'reserve-house': ['salesman', 'agent', 'housekeeper'],
  'reserve-client': ['salesman', 'agent'],
  customer: ['salesman', 'agent', 'store_manager'],
  community: ['salesman', 'agent', 'store_manager'],
  bill: ['finance_manager', 'finance_clerk', 'store_manager'],
  flow: ['finance_manager', 'finance_clerk', 'store_manager'],
  'rent-increase': ['finance_manager', 'finance_clerk'],
  profit: ['finance_manager'],
  partner: ['finance_manager'],
  'income-cost': ['finance_manager'],
  performance: ['finance_manager'],
  accounting: ['finance_manager'],
  arrears: ['finance_manager', 'finance_clerk', 'store_manager'],
  plan: ['finance_manager', 'finance_clerk'],
  payout: ['finance_manager', 'finance_clerk'],
  billing: ['finance_manager', 'finance_clerk', 'store_manager'],
  role: ['super_admin'],
  permission: ['super_admin'],
  dictionary: ['super_admin', 'company_admin'],
  employee: ['super_admin', 'company_admin', 'store_manager']
};

window.PROTOTYPE_MODULES = [
  { id: 'home', label: '首页', icon: 'layout-dashboard', href: '../index.html' },
  { id: 'house', label: '房屋管理', icon: 'building-2', children: [
    { id: 'rent', label: '租房管理', href: 'rent.html' },
    { id: 'sale', label: '售房管理', href: 'sale.html' },
    { id: 'reserve-house', label: '储备房源', href: 'reserve-house.html' },
    { id: 'reserve-client', label: '储备客源', href: 'reserve-client.html' },
    { id: 'customer', label: '客户管理', href: 'customer.html' },
    { id: 'community', label: '小区管理', href: 'community.html' }
  ]},
  { id: 'finance', label: '财务管理', icon: 'banknote', children: [
    { id: 'bill', label: '账单', href: 'finance-bill.html' },
    { id: 'flow', label: '流水账', href: 'finance-flow.html' },
    { id: 'rent-increase', label: '涨价统计', href: 'finance-rent-increase.html' },
    { id: 'profit', label: '公寓利润', href: 'finance-profit.html' },
    { id: 'partner', label: '合伙人', href: 'finance-partner.html' },
    { id: 'income-cost', label: '收入成本', href: 'finance-income-cost.html' },
    { id: 'performance', label: '业绩核算', href: 'finance-performance.html' },
    { id: 'accounting', label: '财务核算', href: 'finance-accounting.html' },
    { id: 'arrears', label: '欠款统计', href: 'finance-arrears.html' },
    { id: 'plan', label: '收支计划', href: 'finance-plan.html' },
    { id: 'payout', label: '代付管理', href: 'finance-payout.html' },
    { id: 'billing', label: '开票管理', href: 'finance-billing.html' }
  ]},
  { id: 'system', label: '系统管理', icon: 'settings', children: [
    { id: 'role', label: '角色管理', href: 'system-role.html' },
    { id: 'permission', label: '权限管理', href: 'system-permission.html' },
    { id: 'dictionary', label: '字典管理', href: 'system-dictionary.html' },
    { id: 'employee', label: '人员管理', href: 'system-employee.html' }
  ]}
];

window.PROTOTYPE_ROLES = [
  { id: 'super_admin', label: '超级管理员' },
  { id: 'boss', label: '老板' },
  { id: 'company_admin', label: '公司管理员' },
  { id: 'store_manager', label: '店长' },
  { id: 'finance_manager', label: '财务负责人' },
  { id: 'finance_clerk', label: '财务专员' },
  { id: 'housekeeper', label: '管家' },
  { id: 'salesman', label: '业务员' },
  { id: 'agent', label: '综合经纪人' },
  { id: 'readonly', label: '只读账号' }
];

const ACTION_PERMISSIONS = {
  super_admin: ['*'],
  boss: [],
  company_admin: ['rent:create', 'rent:update', 'sale:create', 'sale:update', 'reserve:create', 'reserve:update', 'client:create', 'bill:update', 'bill:collect', 'flow:create', 'finance:update'],
  store_manager: ['rent:create', 'rent:update', 'sale:create', 'sale:update', 'reserve:create', 'client:create', 'bill:update', 'bill:collect'],
  finance_manager: ['bill:update', 'bill:collect', 'flow:create', 'finance:update'],
  finance_clerk: ['bill:collect', 'flow:create'],
  housekeeper: ['rent:update', 'reserve:create', 'client:create'],
  salesman: ['rent:create', 'sale:create', 'reserve:create', 'client:create'],
  agent: ['sale:create', 'reserve:create', 'client:create'],
  readonly: []
};

function getCurrentRole() {
  try {
    const viaUrl = new URLSearchParams(window.location.search).get('role');
    if (viaUrl && PROTOTYPE_ROLES.some(item => item.id === viaUrl)) return viaUrl;
  } catch (err) { /* 忽略 */ }
  return localStorage.getItem('prototype-role') || 'super_admin';
}
function roleLabel(id) {
  const role = PROTOTYPE_ROLES.find(item => item.id === id);
  return role ? role.label : id;
}
function hasMenuPermission(item, role) {
  if (role === 'super_admin') return true;
  const roles = MENU_ROLE_MATRIX[item.id];
  if (!roles) return false;
  return roles.indexOf('*') !== -1 || roles.indexOf(role) !== -1;
}
function hasActionPermission(action, role) {
  if (!action.permission) return true;
  const permissions = ACTION_PERMISSIONS[role] || [];
  return permissions.indexOf('*') !== -1 || permissions.indexOf(action.permission) !== -1;
}

/* 首页位于站点根目录，其余页面位于 pages/ 下 */
function getRootPrefix() {
  const page = window.PROTOTYPE_PAGE;
  return page && page.id === 'home' ? 'pages/' : '';
}
function getHomeHref() { return getRootPrefix() ? 'index.html' : '../index.html'; }

/* ---------------- 状态 → 胶囊配色 ---------------- */
const STATUS_COLORS = [
  ['green', ['已租', '已收', '已付', '已平账', '已审核', '启用', '正常', '在租', '缴齐', '已签约', '已支付', '已开票', '成功', '验真', '已验真', '公盘', '留钥匙', '满五唯一', '满五', '满二', '有']],
  ['red', ['逾期', '已逾期', '坏账', '私盘', '私客', '已冲红', '已驳回', '开票失败', '诉讼', '冻结', '冲红', '着急', '删除']],
  ['orange', ['待收', '待付', '待平账', '待审核', '未租', '未还', '待处理', '配置', '脏房', '维修', '待验真', '议价', '速销', '急售', '未跟进', '部分出租', '未留钥匙', '已下载,未确认', '待定']],
  ['blue', ['合租', '整租', '已定', '开票中', '未逾期', '在约', '今日新上', '3日新上', '上架', '已确认', '近地铁', 'VR房勘', '视频房勘', '全城联卖']],
  ['purple', ['A级', 'S级']],
  ['cyan', ['B级']]
];
function pillFor(raw) {
  if (raw === undefined || raw === null) return null;
  const text = String(raw).trim();
  if (!text || text === '—' || text.length > 14) return null;
  for (const [color, words] of STATUS_COLORS) {
    if (words.some(word => text === word || (word.length >= 2 && text.startsWith(word) && !/^\d/.test(text.replace(word, ''))))) {
      return `<span class="pill pill-${color}">${text}</span>`;
    }
  }
  return null;
}

/* 数字 / 金额着色 */
function decorateValue(value, columnKey) {
  if (value === undefined || value === null || value === '') return '—';
  if (value && value.href) return `<a class="text-primary" href="${value.href}">${value.text || value.href}</a>`;
  if (Array.isArray(value)) value = value.join(' / ');
  const text = String(value);
  const pill = pillFor(text);
  if (pill) return pill;
  if (/^\+¥|^\+[\d.]+%?$/.test(text)) return `<span class="num-pos">${text}</span>`;
  if (/^-¥|^-\d/.test(text)) return `<span class="num-neg">${text}</span>`;
  if (/^[¥￥]/.test(text) || /^\d+(\.\d+)?%$/.test(text) || /万$/.test(text) || columnKey === 'code' || /^\d{4}-\d{2}/.test(text)) {
    return `<span class="mono">${text}</span>`;
  }
  return text;
}

/* ---------------- 侧边栏 ---------------- */
function renderSidebar(activeId, role) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  let nav = document.querySelector('.nav');
  if (!nav) {
    nav = document.createElement('nav');
    nav.className = 'nav';
    sidebar.appendChild(nav);
  }
  if (!sidebar.querySelector('.brand')) {
    sidebar.insertAdjacentHTML('afterbegin',
      '<div class="brand"><div class="brand-icon"><i data-lucide="home"></i></div>' +
      '<div><div class="brand-title">优居 ERP</div><div class="brand-sub">HOUSE RENT &amp; SALE</div></div></div>');
  }
  let html = '<div class="nav-group"><div class="nav-label">主菜单</div>';
  PROTOTYPE_MODULES.forEach(group => {
    if (group.id === 'home') {
      html += `<a class="nav-item${activeId === 'home' ? ' active' : ''}" href="${getHomeHref()}"><i data-lucide="${group.icon}"></i> ${group.label}</a>`;
      return;
    }
    const children = group.children.filter(item => hasMenuPermission(item, role));
    if (!children.length) return;
    const expanded = children.some(item => item.id === activeId);
    html += `<div class="nav-item${expanded ? ' expanded' : ''}" data-toggle><i data-lucide="${group.icon}"></i> ${group.label}<i data-lucide="chevron-right" class="nav-chevron"></i></div>`;
    html += '<div class="subnav' + (expanded ? ' show' : '') + '">';
    children.forEach(item => {
      html += `<a href="${getRootPrefix() + item.href}"${item.id === activeId ? ' class="active"' : ''}>${item.label}</a>`;
    });
    html += '</div>';
  });
  nav.innerHTML = html + '</div>';
  if (!sidebar.querySelector('.sidebar-user')) {
    sidebar.insertAdjacentHTML('beforeend',
      `<div class="sidebar-user"><div class="user-avatar">张</div><div><div class="su-name">张店长</div><div class="su-role">${roleLabel(role)} · 张江店</div></div></div>`);
  } else {
    const roleEl = sidebar.querySelector('.sidebar-user .su-role');
    if (roleEl) roleEl.textContent = roleLabel(role) + ' · 张江店';
  }
}

/* ---------------- 顶栏 ---------------- */
function renderHeader(title, group) {
  const header = document.querySelector('.header');
  if (!header) return;
  const role = getCurrentRole();
  const isHome = window.PROTOTYPE_PAGE && window.PROTOTYPE_PAGE.id === 'home';
  const breadcrumb = isHome
    ? `<span class="current">${title}</span>`
    : `<a href="${getHomeHref()}">首页</a><span class="sep">/</span><span>${group || '系统'}</span><span class="sep">/</span><span class="current">${title}</span>`;
  header.innerHTML = `
    <div class="header-left">
      <button class="icon-btn" data-menu-toggle aria-label="打开菜单"><i data-lucide="menu"></i></button>
      <div class="breadcrumb">${breadcrumb}</div>
    </div>
    <div class="header-right">
      <button class="icon-btn" aria-label="搜索"><i data-lucide="search"></i></button>
      <button class="icon-btn" aria-label="帮助"><i data-lucide="circle-help"></i></button>
      <button class="icon-btn" aria-label="消息"><i data-lucide="bell"></i><span class="badge"></span></button>
      <span class="header-divider"></span>
      <select class="role-switch" aria-label="切换演示角色"></select>
      <div class="user"><div class="user-avatar">张</div><span class="user-name">张店长</span></div>
    </div>`;
  const select = header.querySelector('.role-switch');
  select.innerHTML = PROTOTYPE_ROLES.map(item => `<option value="${item.id}"${item.id === role ? ' selected' : ''}>${item.label}</option>`).join('');
  select.addEventListener('change', function() {
    localStorage.setItem('prototype-role', select.value);
    const page = window.PROTOTYPE_PAGE;
    if (page && page.id === 'home') renderDashboard();
    else if (page && page.id === 'house-wizard') renderWizard(page);
    else renderPage(page);
    renderSidebar(page.id, select.value);
    if (window.lucide) lucide.createIcons();
  });
}

/* ---------------- 通用构件 ---------------- */
function buttonHtml(action, small) {
  if (getCurrentRole() === 'readonly') return '';
  if (!hasActionPermission(action, getCurrentRole())) return '';
  const tag = action.href ? 'a' : 'button';
  const href = action.href ? ` href="${action.href}"` : '';
  const toggle = action.toggle ? ` data-toggle-${action.toggle}` : '';
  return `<${tag} class="btn ${small ? 'btn-sm' : ''} ${action.variant || 'btn-default'}"${href}${toggle}><i data-lucide="${action.icon || 'mouse-pointer-click'}"></i> ${action.label}</${tag}>`;
}

function filtersHtml(filters) {
  if (!filters || !filters.length) return '';
  return filters.map(filter => {
    let control = '';
    if (filter.type === 'select') {
      control = `<select class="select" aria-label="${filter.label}">${filter.options.map(option => `<option>${option}</option>`).join('')}</select>`;
    } else if (filter.type === 'date') {
      control = `<input class="input input-sm" type="date" value="${filter.value || '2026-08-01'}" aria-label="${filter.label}">`;
    } else if (filter.type === 'range') {
      const isDate = filter.rangeType === 'date';
      const unit = filter.unit ? `<span class="range-unit">${filter.unit}</span>` : '';
      const first = isDate
        ? `<input class="input input-sm" type="date" value="2026-08-01" aria-label="${filter.label}起">`
        : `<input class="input input-xs" type="number" placeholder="最低" aria-label="${filter.label}最低">`;
      const second = isDate
        ? `<input class="input input-sm" type="date" value="2026-08-31" aria-label="${filter.label}止">`
        : `<input class="input input-xs" type="number" placeholder="最高" aria-label="${filter.label}最高">`;
      control = `<span class="range-control">${first}<span class="range-sep">-</span>${second}${unit}</span>`;
    } else {
      control = `<input class="input" placeholder="${filter.placeholder || filter.label}" aria-label="${filter.label}">`;
    }
    return `<div class="filter-group"><span class="filter-label">${filter.label}</span>${control}</div>`;
  }).join('');
}

function tabsHtml(tabs, className) {
  if (!tabs || !tabs.length) return '';
  return `<div class="${className || 'tabs'}">${tabs.map((tab, index) => `<div class="tab${index === 0 ? ' active' : ''}">${tab.label}${tab.count !== undefined ? ` <span class="text-muted">(${tab.count})</span>` : ''}</div>`).join('')}</div>`;
}

function summaryHtml(summary) {
  if (!summary || !summary.length) return '';
  return `<div class="summary-row">${summary.map(item => `<div class="summary-chip">${item.label}<strong>${item.value}</strong></div>`).join('')}</div>`;
}

function tableHtml(columns, rows, options) {
  const head = columns.map(column => `<th${column.width ? ` style="min-width:${column.width}px"` : ''}>${column.label}</th>`).join('');
  const body = rows.map(row => {
    const cells = columns.map(column => {
      let value = row[column.key];
      if (column.key === 'operations') {
        value = `<div class="operation-cell">${(row.operations || options.operations || []).map(action => {
          const config = typeof action === 'string' ? { label: action } : action;
          return buttonHtml(config, true);
        }).join('')}</div>`;
        return `<td>${value}</td>`;
      }
      return `<td>${decorateValue(value, column.key)}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function cardsHtml(cards) {
  return cards.map((card, cardIndex) => `
    <article class="detail-card">
      ${card.thumb ? `<div class="card-thumb thumb-${cardIndex % 4}"><i data-lucide="building"></i><span>${card.title.split(' ')[0]}</span></div>` : ''}
      <header class="detail-card-header">
        <div>
          <div class="detail-card-title">${card.title}</div>
          <div class="house-tags">${(card.tags || []).map(tag => `<span class="tag tag-${tag.type || 'gray'}">${tag.label || tag}</span>`).join('')}</div>
        </div>
        <div class="house-actions">${(card.actions || []).map(action => buttonHtml(action, true)).join('')}</div>
      </header>
      <div class="detail-card-body">
        <div class="field-grid">
          ${(card.fields || []).map(field => {
            const pair = Array.isArray(field) ? { label: field[0], value: field[1] } : field;
            return `<div class="field-item"><span class="field-label">${pair.label}</span><span class="field-value">${decorateValue(pair.value)}</span></div>`;
          }).join('')}
        </div>
        ${card.rooms && card.rooms.length ? `<ul class="room-list">${card.rooms.map(room => `<li>${(room.fields || []).map(field => {
          const pair = Array.isArray(field) ? { label: field[0], value: field[1] } : field;
          return `<div class="field-item"><span class="field-label">${pair.label}</span><span class="field-value">${decorateValue(pair.value)}</span></div>`;
        }).join('')}</li>`).join('')}</ul>` : ''}
        ${card.extra ? `<div class="prototype-note" style="margin:12px 0 0"><i data-lucide="info"></i>${card.extra}</div>` : ''}
      </div>
    </article>`).join('');
}

function paginationHtml(page) {
  const pagination = page.pagination || {};
  const current = pagination.current || 1;
  const total = pagination.total || 0;
  const from = pagination.from || 1;
  const to = pagination.to || total;
  return `<div class="table-footer"><span class="text-muted">当前显示 <b class="mono">${from}</b> 到 <b class="mono">${to}</b> 条 / 共 <b class="mono">${total}</b> 条</span><div class="pagination"><button class="page-btn" aria-label="首页">«</button><button class="page-btn" aria-label="上一页"><i data-lucide="chevron-left"></i></button><button class="page-btn active">${current}</button><button class="page-btn">2</button><button class="page-btn">3</button><button class="page-btn" aria-label="下一页"><i data-lucide="chevron-right"></i></button><button class="page-btn" aria-label="末页">»</button></div></div>`;
}

function treeHtml(node) {
  const children = node.children ? `<ul>${node.children.map(child => treeHtml(child)).join('')}</ul>` : '';
  return `<li class="${node.active ? 'active' : ''}"><span>${node.label}${node.count !== undefined ? ` <i class="tree-count">${node.count}</i>` : ''}</span>${children}</li>`;
}
