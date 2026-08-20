/* 共享原型框架：菜单、角色权限、通用页面渲染 */
window.PROTOTYPE_MODULES = [
  { id: 'home', label: '首页', icon: 'layout-dashboard', href: '../index.html', roles: ['super_admin', 'store_manager', 'finance_manager', 'housekeeper', 'salesman', 'readonly'] },
  { id: 'house', label: '房屋管理', icon: 'building-2', children: [
    { id: 'rent', label: '租房管理', href: 'rent.html', roles: ['super_admin', 'store_manager', 'housekeeper', 'salesman'] },
    { id: 'sale', label: '售房管理', href: 'sale.html', roles: ['super_admin', 'store_manager', 'salesman'] },
    { id: 'reserve-house', label: '储备房源', href: 'reserve-house.html', roles: ['super_admin', 'store_manager', 'housekeeper', 'salesman'] },
    { id: 'reserve-client', label: '储备客源', href: 'reserve-client.html', roles: ['super_admin', 'store_manager', 'housekeeper', 'salesman'] },
    { id: 'customer', label: '客户管理', href: 'customer.html', roles: ['super_admin', 'store_manager', 'housekeeper', 'salesman'] },
    { id: 'community', label: '小区管理', href: 'community.html', roles: ['super_admin', 'store_manager', 'salesman'] }
  ]},
  { id: 'finance', label: '财务管理', icon: 'banknote', children: [
    { id: 'bill', label: '账单', href: 'finance-bill.html', roles: ['super_admin', 'store_manager', 'finance_manager'] },
    { id: 'flow', label: '流水账', href: 'finance-flow.html', roles: ['super_admin', 'store_manager', 'finance_manager'] },
    { id: 'rent-increase', label: '涨价统计', href: 'finance-rent-increase.html', roles: ['super_admin', 'finance_manager'] },
    { id: 'profit', label: '公寓利润', href: 'finance-profit.html', roles: ['super_admin', 'finance_manager'] },
    { id: 'partner', label: '合伙人', href: 'finance-partner.html', roles: ['super_admin', 'finance_manager'] },
    { id: 'income-cost', label: '收入成本', href: 'finance-income-cost.html', roles: ['super_admin', 'finance_manager'] },
    { id: 'performance', label: '业绩核算', href: 'finance-performance.html', roles: ['super_admin', 'finance_manager'] },
    { id: 'accounting', label: '财务核算', href: 'finance-accounting.html', roles: ['super_admin', 'finance_manager'] },
    { id: 'arrears', label: '欠款统计', href: 'finance-arrears.html', roles: ['super_admin', 'store_manager', 'finance_manager'] },
    { id: 'plan', label: '收支计划', href: 'finance-plan.html', roles: ['super_admin', 'finance_manager'] },
    { id: 'payout', label: '代付管理', href: 'finance-payout.html', roles: ['super_admin', 'finance_manager'] },
    { id: 'billing', label: '开票管理', href: 'finance-billing.html', roles: ['super_admin', 'finance_manager'] }
  ]},
  { id: 'system', label: '系统管理', icon: 'settings', children: [
    { id: 'role', label: '角色管理', href: 'system-role.html', roles: ['super_admin'] },
    { id: 'permission', label: '权限管理', href: 'system-permission.html', roles: ['super_admin'] },
    { id: 'dictionary', label: '字典管理', href: 'system-dictionary.html', roles: ['super_admin'] },
    { id: 'employee', label: '人员管理', href: 'system-employee.html', roles: ['super_admin'] }
  ]}
];

window.PROTOTYPE_ROLES = [
  { id: 'super_admin', label: '超级管理员' },
  { id: 'store_manager', label: '店长' },
  { id: 'finance_manager', label: '财务负责人' },
  { id: 'housekeeper', label: '管家' },
  { id: 'salesman', label: '业务员' },
  { id: 'readonly', label: '只读账号' }
];

const ACTION_PERMISSIONS = {
  super_admin: ['*'],
  store_manager: ['rent:create', 'rent:update', 'sale:create', 'sale:update', 'reserve:create', 'client:create', 'bill:update', 'bill:collect'],
  finance_manager: ['bill:update', 'bill:collect', 'flow:create', 'finance:update'],
  housekeeper: ['rent:update', 'reserve:create', 'client:create'],
  salesman: ['rent:create', 'sale:create', 'reserve:create', 'client:create'],
  readonly: []
};

function getCurrentRole() {
  return localStorage.getItem('prototype-role') || 'super_admin';
}

function hasMenuPermission(item, role) {
  return item.roles.indexOf(role) !== -1;
}

function hasActionPermission(action, role) {
  if (!action.permission) return true;
  const permissions = ACTION_PERMISSIONS[role] || [];
  return permissions.indexOf('*') !== -1 || permissions.indexOf(action.permission) !== -1;
}

/* 首页位于站点根目录，其余页面位于 pages/ 下，链接前缀需按当前页位置区分 */
function getRootPrefix() {
  const page = window.PROTOTYPE_PAGE;
  return page && page.id === 'home' ? 'pages/' : '';
}

function getHomeHref() {
  return getRootPrefix() ? 'index.html' : '../index.html';
}

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
    sidebar.insertAdjacentHTML('afterbegin', '<div class="brand"><div class="brand-icon"><i data-lucide="home"></i></div><div class="brand-title">优居 ERP</div></div>');
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
    html += `<div class="nav-item${expanded ? ' expanded' : ''}" data-toggle href="#"><i data-lucide="${group.icon}"></i> ${group.label}<i data-lucide="chevron-right" class="nav-chevron"></i></div>`;
    html += '<div class="subnav' + (expanded ? ' show' : '') + '">';
    children.forEach(item => {
      html += `<a href="${getRootPrefix() + item.href}"${item.id === activeId ? ' class="active"' : ''}>${item.label}</a>`;
    });
    html += '</div>';
  });
  nav.innerHTML = html + '</div>';
}

function renderHeader(title, group) {
  const header = document.querySelector('.header');
  if (!header) return;
  const role = getCurrentRole();
  const isHome = window.PROTOTYPE_PAGE && window.PROTOTYPE_PAGE.id === 'home';
  const breadcrumb = isHome
    ? `<span class="current">${title}</span>`
    : `<a href="${getHomeHref()}">首页</a><span>/</span><span>${group || '系统'}</span><span>/</span><span class="current">${title}</span>`;
  header.innerHTML = `
    <div class="header-left">
      <button class="icon-btn" data-menu-toggle aria-label="打开菜单"><i data-lucide="menu"></i></button>
      <div class="breadcrumb">${breadcrumb}</div>
    </div>
    <div class="header-right">
      <button class="icon-btn" aria-label="搜索"><i data-lucide="search"></i></button>
      <button class="icon-btn" aria-label="消息"><i data-lucide="bell"></i><span class="badge"></span></button>
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

function buttonHtml(action, small) {
  if (getCurrentRole() === 'readonly') return '';
  if (!hasActionPermission(action, getCurrentRole())) return '';
  const tag = action.href ? 'a' : 'button';
  const href = action.href ? ` href="${action.href}"` : '';
  return `<${tag} class="btn ${small ? 'btn-sm' : ''} ${action.variant || 'btn-default'}"${href}><i data-lucide="${action.icon || 'mouse-pointer-click'}"></i> ${action.label}</${tag}>`;
}

function filtersHtml(filters) {
  if (!filters || !filters.length) return '';
  return filters.map(filter => {
    let control = '';
    if (filter.type === 'select') {
      control = `<select class="select" aria-label="${filter.label}">${filter.options.map(option => `<option>${option}</option>`).join('')}</select>`;
    } else if (filter.type === 'date') {
      control = `<input class="input input-sm" type="date" value="${filter.value || '2026-08-01'}" aria-label="${filter.label}">`;
    } else {
      control = `<input class="input" placeholder="${filter.placeholder || filter.label}" aria-label="${filter.label}">`;
    }
    return `<div class="filter-group"><span class="filter-label">${filter.label}</span>${control}</div>`;
  }).join('');
}

function tabsHtml(tabs, className) {
  if (!tabs || !tabs.length) return '';
  return `<div class="${className || 'tabs'}">${tabs.map((tab, index) => `<div class="tab${index === 0 ? ' active' : ''}">${tab.label}${tab.count !== undefined ? ` (${tab.count})` : ''}</div>`).join('')}</div>`;
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
      } else if (Array.isArray(value)) {
        value = value.join(' / ');
      } else if (value && value.href) {
        value = `<a class="text-primary" href="${value.href}">${value.text || value.href}</a>`;
      }
      return `<td>${value === undefined || value === null || value === '' ? '—' : value}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function cardsHtml(cards) {
  return cards.map(card => `
    <article class="detail-card">
      <header class="detail-card-header">
        <div>
          <div class="detail-card-title">${card.title}</div>
          <div class="house-tags">${(card.tags || []).map(tag => `<span class="tag tag-${tag.type || 'gray'}">${tag.label || tag}</span>`).join('')}</div>
        </div>
        <div class="house-actions">${(card.actions || []).map(action => buttonHtml(action, true)).join('')}</div>
      </header>
      <div class="detail-card-body">
        <div class="field-grid">
          ${(card.fields || []).map(field => `<div class="field-item"><span class="field-label">${field.label}</span><span class="field-value">${field.value}</span></div>`).join('')}
        </div>
        ${card.rooms && card.rooms.length ? `<ul class="room-list">${card.rooms.map(room => `<li>${(room.fields || []).map(field => `<div class="field-item"><span class="field-label">${field.label}</span><span class="field-value">${field.value}</span></div>`).join('')}</li>`).join('')}</ul>` : ''}
        ${card.extra ? `<div class="prototype-note" style="margin:12px 0 0">${card.extra}</div>` : ''}
      </div>
    </article>`).join('');
}

function paginationHtml(page) {
  const pagination = page.pagination || {};
  const current = pagination.current || 1;
  const total = pagination.total || 0;
  const from = pagination.from || 1;
  const to = pagination.to || total;
  return `<div class="table-footer"><span class="text-muted">当前显示 ${from} 到 ${to} 条 / 共 ${total} 条</span><div class="pagination" style="padding:0"><button class="page-btn" aria-label="首页">«</button><button class="page-btn" aria-label="上一页"><i data-lucide="chevron-left"></i></button><button class="page-btn active">${current}</button><button class="page-btn">2</button><button class="page-btn">3</button><button class="page-btn" aria-label="下一页"><i data-lucide="chevron-right"></i></button><button class="page-btn" aria-label="末页">»</button></div></div>`;
}

function renderPage(page) {
  if (!page) return;
  renderHeader(page.title, page.group);
  const content = document.querySelector('.content');
  const role = getCurrentRole();
  const toolbar = (page.actions || []).filter(action => hasActionPermission(action, role)).map(action => buttonHtml(action)).join('');
  let html = `
    ${page.note ? `<div class="prototype-note">${page.note}</div>` : ''}
    <div class="page-header"><div><div class="page-title">${page.title}</div><div class="text-muted">${page.description || ''}</div></div><div class="page-actions">${toolbar}</div></div>
    ${summaryHtml(page.summary)}
    ${tabsHtml(page.tabs)}
    ${page.typeTabs ? `<div class="status-tabs" role="tablist" aria-label="类型切换">${page.typeTabs.map((tab, index) => `<button class="status-tab${index === 0 ? ' active' : ''}">${tab.label || tab}</button>`).join('')}</div>` : ''}
    ${page.statusTabs ? `<div class="status-tabs">${page.statusTabs.map((tab, index) => `<button class="status-tab${index === 0 ? ' active' : ''}">${tab.label}${tab.count !== undefined ? ` ${tab.count}` : ''}</button>`).join('')}</div>` : ''}
    ${page.views ? `<div class="toolbar-row"><span class="toolbar-label">视图</span><div class="view-switch">${page.views.map((view, index) => `<button class="${index === 0 ? 'active' : ''}">${view}</button>`).join('')}</div><span class="toolbar-label">视图权限：个人视图 / 公司视图</span></div>` : ''}
    ${page.filters ? `<div class="filter-bar">${filtersHtml(page.filters)}<div class="filter-group" style="margin-left:auto"><button class="btn btn-primary btn-sm"><i data-lucide="search"></i> 搜索</button><button class="btn btn-default btn-sm"><i data-lucide="rotate-ccw"></i> 重置</button><button class="btn btn-default btn-sm"><i data-lucide="sliders-horizontal"></i> 更多筛选</button></div></div>` : ''}
    ${page.batchActions ? `<div class="toolbar-row"><span class="toolbar-label">批量</span>${page.batchActions.map(action => buttonHtml(action, true)).join('')}</div>` : ''}
  `;

  if (page.layout === 'split') {
    html += `<div class="split-layout"><aside class="tree-panel"><div class="card-title">${page.tree.title}</div><ul class="tree">${page.tree.nodes.map(node => treeHtml(node)).join('')}</ul></aside><div class="split-main">${page.layoutType === 'cards' ? cardsHtml(page.cards) : tableHtml(page.columns, page.rows, page)}</div>${paginationHtml(page)}</div>`;
  } else if (page.layout === 'cards') {
    html += `<div class="house-grid">${cardsHtml(page.cards)}</div>${paginationHtml(page)}`;
  } else {
    html += `<div class="card">${tableHtml(page.columns, page.rows, page)}${paginationHtml(page)}</div>`;
  }
  content.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

function renderWizard(page) {
  renderHeader(page.title, page.group);
  const content = document.querySelector('.content');
  const params = new URLSearchParams(window.location.search);
  const type = page.types[params.get('type')] ? params.get('type') : page.defaultType;
  const config = page.types[type];
  const readonly = getCurrentRole() === 'readonly';
  const field = (label, control, required, wide) => `
    <label class="form-field${wide ? ' wide' : ''}">
      <span>${label}${required ? ' <em>*</em>' : ''}</span>${control}
    </label>`;
  const text = (placeholder, value) => `<input class="input" placeholder="${placeholder}"${value ? ` value="${value}"` : ''}>`;
  const select = options => `<select class="select">${options.map(option => `<option>${option}</option>`).join('')}</select>`;
  const readonlyValue = value => `<div class="readonly-field">${value}</div>`;

  const commonFields = [
    field('价格 / 总价', text('万元'), true),
    field('底价', text('万元')),
    field('户型', `${select(['1', '2', '3', '4'])} 室 ${select(['0', '1', '2'])} 厅 ${select(['0', '1', '2'])} 卫 ${select(['0', '1', '2'])} 阳`, true, true),
    field('建筑面积', text('㎡'), true),
    field('朝向', select(['南', '北', '东', '西', '南北', '西南', '东南', '西北', '东北', '东西']), true),
    field('装修', select(['毛坯', '清水', '普装', '精装', '豪装']), true),
    field('电梯', select(['有', '无']), true),
    field('税费', select(['个税', '免税', '正常税', '双税', '综合税'])),
    field('欠款', text('万元')),
    field('来源', select(['58同城', '搜房', '赶集', '百姓网', '安居客', '闲鱼', '上门客', '朋友介绍', '来电', '老客户', '同行']), true),
    field('建筑年代', text('例如 2018'), true),
    field('产证情况', select(['房产证', '购房合同', '购房协议', '其他'])),
    field('标题', '<div class="inline-control"><input class="input" placeholder="房源标题"><button class="btn btn-default btn-sm">智能标题</button></div>', true, true)
  ];
  const rentFields = [
    field('月租', text('元 / 月'), true),
    field('押付方式', select(['押一付一', '押一付三', '押二付一', '押零付三']), true),
    field('租期', select(['1个月', '2个月', '3个月', '半年', '1年', '2年', '3年', '其他']), true),
    field('出租方式', select(['整租', '合租']), true),
    field('缴费方式', select(['月付', '二月付', '季付', '半年付', '年付']))
  ];
  const reserveFields = [
    field('物业地址', text('省市区 + 详细地址'), true, true),
    field('商圈', text('商圈')),
    field('门牌号', text('5幢1单元302'), true),
    field('户型', text('1室1厅1厨1卫'), true),
    field('建筑面积', text('㎡')),
    field('装修情况', select(['毛坯房', '简装房', '精装房', '豪装房'])),
    field('业主报价', text('元')),
    field('来源渠道', select(['58同城', '闲鱼', '网上联系', '中介介绍', '自己主动上门', '看到我们广告', '开盘', '商铺', '自定义']), true),
    field('钥匙状态', select(['留钥匙', '未留钥匙'])),
    field('盘源', select(['公盘', '私盘']))
  ];
  const basicFields = type === 'rent' ? rentFields.concat(commonFields) : type === 'sale' ? commonFields : reserveFields;
  const tags = ['满五唯一', '满五', '满二唯一', '满二', '不满二', '近地铁', '钥匙房', '急售', '带车位', '附近学校', '处置房', '带车库', '带下房', '带花园', '赠露台', '带阁楼', '跃层', '复式', '江景房', '新房专用', '置换', '店长推荐', '法拍房', '重置房源', '单边代理', '优居大渝铺', '以旧换新', '自建房'];

  content.innerHTML = `
    ${page.note ? `<div class="prototype-note">${page.note}</div>` : ''}
    <div class="page-header">
      <div>
        <div class="page-title">${page.title} · ${config.label}</div>
        <div class="text-muted">${config.description}</div>
      </div>
      <div class="page-actions"><a class="btn btn-default" href="${config.backHref}"><i data-lucide="arrow-left"></i> 返回列表</a></div>
    </div>
    <div class="wizard-layout">
      <aside class="wizard-steps" aria-label="录入步骤">
        ${page.steps.map((step, index) => `<button class="wizard-step${index === 0 ? ' active' : ''}" data-wizard-step="${index}"><span>${index + 1}</span><div><strong>${step}</strong><small>Step ${index + 1}</small></div></button>`).join('')}
        ${readonly ? '' : '<div class="wizard-help"><i data-lucide="info"></i> 必填项由 transType 接口返回，前端按租房 / 售房 / 储备规则校验。</div>'}
      </aside>
      <section class="wizard-panel">
        <div class="wizard-step-panel active" data-wizard-panel="0">
          <div class="card-header"><div class="card-title">Step 1 · 楼盘选择</div><a class="text-primary" href="#">楼盘信息有误？</a></div>
          <div class="card-body">
            <div class="form-grid">
              ${field('租售类型', `<select class="select" data-wizard-type>${Object.keys(page.types).map(key => `<option value="${key}"${key === type ? ' selected' : ''}>${page.types[key].label}</option>`).join('')}</select>`, true)}
              ${field('房屋用途', select(['普通住宅', '别墅', '商住两用', '车位', '商铺', '写字楼', '厂房', '土地']), true)}
              ${field('小区选择', '<div class="inline-control"><input class="input" value="汤臣豪园"><button class="btn btn-default btn-sm">搜索小区</button></div>', true, true)}
              ${field('城市', readonlyValue('上海'))}
              ${field('小区地址', readonlyValue('晨晖路825弄'), false, true)}
              ${field('栋座', select(['3幢', '5幢', '15幢']), true)}
              ${field('单元', select(['1单元', '2单元']), true)}
              ${field('楼层', select(['3层', '18层', '23层']), true)}
              ${field('房号', select(['301', '1802', '2301']), true)}
            </div>
            ${type === 'reserve' ? '<div class="prototype-note">储备房源适配：无精确楼栋时可切换为「小区 + 物业地址 + 门牌号」文本录入。</div>' : ''}
          </div>
        </div>
        <div class="wizard-step-panel" data-wizard-panel="1">
          <div class="card-header"><div class="card-title">Step 2 · 基本信息</div><span class="text-muted">Step 1 自动带出，不可修改</span></div>
          <div class="card-body">
            <div class="readonly-summary">
              <div><span>小区名称</span><strong>汤臣豪园</strong></div>
              <div><span>房屋用途</span><strong>普通住宅</strong></div>
              <div><span>详细房号</span><strong>3幢1单元301</strong></div>
              <div><span>小区地址</span><strong>上海市浦东新区晨晖路825弄</strong></div>
            </div>
            <div class="form-grid">${basicFields.join('')}</div>
          </div>
        </div>
        <div class="wizard-step-panel" data-wizard-panel="2">
          <div class="card-header"><div class="card-title">Step 3 · 特色信息</div><span class="text-muted">VR / 图片 / 视频房勘在上架后维护</span></div>
          <div class="card-body">
            <div class="form-grid">
              ${field('房源现状', select(['空房', '自住', '出租']))}
              ${field('房源标签', '<span class="text-muted">28 个标签，可多选</span>', true, true)}
            </div>
            <div class="tag-select">${tags.map((tag, index) => `<button class="${index === 5 || index === 6 ? 'active' : ''}">${tag}</button>`).join('')}</div>
            <label class="form-field wide"><span>房源介绍 <em>*</em></span>
              <div class="inline-control">
                <textarea class="input" rows="5" placeholder="试试 ai 生成？"></textarea>
                <div class="button-row"><button class="btn btn-default btn-sm">选择模板</button><button class="btn btn-default btn-sm">保存模板</button></div>
              </div>
            </label>
            <div class="upload-grid">
              <button class="upload-card"><i data-lucide="image-plus"></i><span>房源图片<br>首图为主图</span></button>
              <button class="upload-card"><i data-lucide="rotate-3d"></i><span>VR 房勘</span></button>
              <button class="upload-card"><i data-lucide="video"></i><span>视频房勘</span></button>
            </div>
          </div>
        </div>
        <div class="wizard-step-panel" data-wizard-panel="3">
          <div class="card-header"><div class="card-title">Step 4 · 完成（业主信息 + 发布）</div><span class="text-warning">业主电话实时校验黑名单</span></div>
          <div class="card-body">
            <div class="form-grid">
              ${field('业主姓名', text('业主姓名'), true)}
              ${field('业主电话', '<div class="inline-control"><input class="input" placeholder="手机号"><button class="btn btn-default btn-sm" data-owner-verify>业主校验</button></div>', true, true)}
              ${field('备用电话', text('手机号'))}
              ${field('首选带看时间', '<input class="input" type="datetime-local">', true)}
              ${field('备选带看时间', '<input class="input" type="datetime-local">')}
              ${field('跟进内容', '<textarea class="input" rows="4" placeholder="最多 500 字"></textarea>', false, true)}
            </div>
            <div class="blacklist-warning"><i data-lucide="triangle-alert"></i> 黑名单命中时弹窗预警；手机号为空提交时提示「手机号不可为空」。</div>
          </div>
        </div>
        <div class="wizard-footer">
          <button class="btn btn-default" data-wizard-prev><i data-lucide="chevron-left"></i> 上一步</button>
          <button class="btn btn-default" data-wizard-next>下一步 <i data-lucide="chevron-right"></i></button>
          ${readonly ? '' : '<button class="btn btn-primary" data-wizard-submit><i data-lucide="send"></i> 发布</button>'}
        </div>
        <dialog class="prototype-dialog" data-blacklist-dialog>
          <div class="dialog-header"><i data-lucide="triangle-alert"></i><strong>黑名单命中预警</strong></div>
          <p>该业主手机号 / 身份证 / 姓名组合命中黑名单规则，请先核对历史欠款、违约和投诉记录。</p>
          <div class="dialog-actions">
            <button class="btn btn-default" data-dialog-close>取消录入</button>
            <button class="btn btn-primary" data-dialog-close>继续录入并记录</button>
          </div>
        </dialog>
      </section>
    </div>`;
  if (window.lucide) lucide.createIcons();
}

function treeHtml(node) {
  const children = node.children ? `<ul>${node.children.map(child => treeHtml(child)).join('')}</ul>` : '';
  return `<li class="${node.active ? 'active' : ''}"><span>${node.label}${node.count !== undefined ? ` (${node.count})` : ''}</span>${children}</li>`;
}

function renderDashboardLegacy() {
  renderHeader('首页看板', '首页');
  const content = document.querySelector('.content');
  const role = getCurrentRole();
  const toolbarActions = [
    { label: '老板视角', icon: 'user-cog', variant: 'btn-primary' },
    { label: '我的展示', icon: 'layout-dashboard' },
    { label: '配置', icon: 'settings-2' },
    { label: '收款码', icon: 'qr-code' },
    { label: '我的钱包', icon: 'wallet' },
    { label: '首页设置', icon: 'sliders-horizontal' },
    { label: '帮助', icon: 'circle-help' },
    { label: '客服', icon: 'headset' },
    { label: '管理员', icon: 'shield-check' },
    { label: '上海', icon: 'map-pin' }
  ].filter(action => hasActionPermission(action, role));

  const warnings = [
    ['租客水费', '38', '3 户今日到期', 'warning'], ['租客电费', '26', '2 户已逾期', 'danger'],
    ['租客燃气费', '12', '1 户待确认', 'warning'], ['租客房租', '96', '本月待收', 'primary'],
    ['租客押金', '18', '3 笔待退', 'success'], ['租客其他', '9', '2 笔待处理', 'warning'],
    ['房东水费', '7', '1 户待缴', 'warning'], ['房东电费', '5', '0 户逾期', 'success'],
    ['房东燃气费', '3', '今日无待办', 'success'], ['房东房租', '45', '5 笔应付', 'danger'],
    ['房东押金', '11', '2 笔在途', 'primary'], ['房东其他', '6', '1 笔待审核', 'warning']
  ].map(item => ({ title: item[0], value: item[1], meta: item[2], type: item[3] }));

  const largeCards = [
    { title: '房源概况', metrics: [['在租', '248'], ['空置', '59'], ['已定', '18'], ['冻结', '6']] },
    { title: '平均租差', metrics: [['套均租差', '¥1,286'], ['毛利率', '38.6%'], ['环比', '+1.8%']] },
    { title: '出租率', metrics: [['整租', '82.4%'], ['合租', '76.1%'], ['集中', '79.8%']] },
    { title: '房间状态', metrics: [['空', '59'], ['配置', '12'], ['脏房', '8'], ['维修', '5']] },
    { title: '财务流水', metrics: [['今日收入', '¥86,400'], ['支出', '¥32,100'], ['净流入', '¥54,300']] },
    { title: '押金统计', metrics: [['期末余额', '¥486,200'], ['本月新增', '¥36,000'], ['应退', '¥18,000']] },
    { title: '剩余价值', metrics: [['合同价值', '¥2,860万'], ['未实现', '¥916万'], ['衰减', '-2.4%']] },
    { title: '合同管理', metrics: [['本月到期', '38'], ['续签', '21'], ['退租', '10'], ['预警', '7']] },
    { title: '行政审批', metrics: [['待处理', '12'], ['今日超时', '2'], ['平均耗时', '4.2h']] },
    { title: '业务审批', metrics: [['待处理', '18'], ['已通过', '64'], ['已驳回', '5']] },
    { title: '空置预警', metrics: [['>15天', '31'], ['>30天', '12'], ['>60天', '4']] },
    { title: '智能设备', metrics: [['在线门锁', '382'], ['离线', '15'], ['低电量', '28']] },
    { title: '房东缺失', metrics: [['身份证缺失', '36'], ['银行卡缺失', '22'], ['合同缺失', '9']] },
    { title: '房东状态', metrics: [['在约', '326'], ['即将到期', '18'], ['诉讼', '2']] },
    { title: '我的待办', metrics: [['待跟进', '38'], ['待审批', '18'], ['待收款', '26']] },
    { title: '最新公告', metrics: [['系统维护', '本周日'], ['账单生成', '已完成'], ['新制度', '8-11']] },
    { title: '储备房源', metrics: [['本月录入', '64'], ['转化', '18'], ['私盘', '23']] },
    { title: '增量分析', metrics: [['新增房源', '+8.6%'], ['新增客源', '+12.3%'], ['转化率', '28.1%']] }
  ];

  const rankRows = [
    ['1', '陈小伟', '张江店', '¥128,000', '92'], ['2', '刘思思', '浦东店', '¥96,500', '72'],
    ['3', '赵强', '张江店', '¥74,200', '55'], ['4', '李芳', '联洋店', '¥68,900', '48'],
    ['5', '王晓明', '金桥店', '¥56,300', '38'], ['6', '陈静', '碧云店', '¥49,800', '31'],
    ['7', '张伟', '张江店', '¥42,100', '24'], ['8', '周敏', '浦东店', '¥38,700', '19']
  ];

  content.innerHTML = `
    <div class="toolbar-row">
      ${toolbarActions.map(action => buttonHtml(action)).join('')}
      <span class="toolbar-label">视图模式：老板 / 我的展示</span>
    </div>
    <div class="dashboard-section">
      <div class="section-header"><div class="section-title">数据概览</div><div class="tabs"><div class="tab active">本月</div><div class="tab">本季</div><div class="tab">本年</div></div></div>
      <div class="kpi-grid">
        ${[['收房', '38', '+4'], ['收客', '126', '+18'], ['带看', '286', '+32'], ['应收', '¥86.5万', '+5.2%'], ['实收', '¥74.8万', '86.6%']].map(item => `<div class="kpi-card blue"><div class="kpi-label">${item[0]}</div><div class="kpi-value">${item[1]}<span class="kpi-unit">${item[2]}</span></div></div>`).join('')}
      </div>
    </div>
    <div class="dashboard-section">
      <div class="section-header"><div class="section-title">财务到期预警（12 小卡片）</div><span class="text-muted">数据快照 30s / 实时刷新 ≤ 5min</span></div>
      <div class="warning-grid">${warnings.map(item => `<div class="warning-card ${item.type}"><div class="warning-title">${item.title}</div><div class="warning-value">${item.value}</div><div class="warning-meta">${item.meta}</div></div>`).join('')}</div>
    </div>
    <div class="dashboard-section">
      <div class="section-header"><div class="section-title">业绩排行榜 TOP20</div><div class="tabs"><div class="tab active">经纪人</div><div class="tab">支队</div><div class="tab">门店</div></div></div>
      <div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>排名</th><th>对象</th><th>归属</th><th>业绩</th><th>达成率</th></tr></thead><tbody>${rankRows.map(row => `<tr>${row.slice(0, 4).map(value => `<td>${value}</td>`).join('')}<td><div class="rank-bar"><div class="rank-fill" style="width:${row[4]}%"></div></div></td></tr>`).join('')}</tbody></table></div></div>
    </div>
    <div class="dashboard-section">
      <div class="section-header"><div class="section-title">待办审批</div>${getCurrentRole() === 'readonly' ? '' : '<button class="btn btn-default btn-sm"><i data-lucide="filter"></i> 全部</button>'}</div>
      <div class="status-tabs"><button class="status-tab active">待处理 18</button><button class="status-tab">已发起 12</button><button class="status-tab">已处理 64</button><button class="status-tab">抄送我 9</button></div>
      <div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>类型</th><th>标题</th><th>发起人</th><th>当前节点</th><th>时限</th></tr></thead><tbody><tr><td>退租</td><td>王大雷 退租申请</td><td>李芳</td><td>店长审批</td><td>今日 18:00</td></tr><tr><td>换房</td><td>李梅 换房申请</td><td>王晓明</td><td>区域审批</td><td>明日 12:00</td></tr><tr><td>维修</td><td>汤臣豪园 3-1201 水管维修</td><td>赵强</td><td>派单</td><td>今日 16:00</td></tr></tbody></table></div></div>
    </div>
    <div class="dashboard-section">
      <div class="section-header"><div class="section-title">系统公告</div><div class="tabs"><div class="tab active">全部</div><div class="tab">活动通知</div><div class="tab">新闻公告</div><div class="tab">制度</div></div></div>
      <div class="card"><div class="card-body"><div class="dashboard-list"><ul class="dashboard-list"><li><span>【通知】8 月房租账单已生成</span><span class="text-muted">今天</span></li><li><span>【制度】新增客源录入规范</span><span class="text-muted">昨天</span></li><li><span>【培训】新角色权限模型说明</span><span class="text-muted">08-11</span></li></ul></div></div></div>
    </div>
    <div class="dashboard-section">
      <div class="section-header"><div class="section-title">业务大卡片（18 张）</div>${getCurrentRole() === 'readonly' ? '' : '<button class="btn btn-default btn-sm"><i data-lucide="layout-grid"></i> 卡片库</button>'}</div>
      <div class="large-card-grid">${largeCards.map(card => `<div class="large-card"><h3>${card.title}</h3><div class="metric-grid">${card.metrics.map(metric => `<div><div class="metric-label">${metric[0]}</div><div class="metric-value">${metric[1]}</div></div>`).join('')}</div></div>`).join('')}</div>
    </div>`;
  if (window.lucide) lucide.createIcons();
}

function renderDashboard() {
  renderHeader('首页看板', '首页');
  const role = getCurrentRole();
  const headerRight = document.querySelector('.header-right');
  if (headerRight && role !== 'readonly') {
    headerRight.insertAdjacentHTML('afterbegin', `
      <div class="view-switch dashboard-view-switch" role="tablist" aria-label="视角切换"><button class="active">老板</button><button>我的展示</button></div>
      <button class="btn btn-ghost btn-sm" title="看板自定义"><i data-lucide="settings-2"></i> 配置</button>
      <button class="btn btn-ghost btn-sm" title="收款码"><i data-lucide="qr-code"></i> 收款码</button>
      <button class="btn btn-ghost btn-sm" title="我的钱包"><i data-lucide="wallet"></i> 我的钱包</button>
      <button class="btn btn-ghost btn-sm" title="首页设置"><i data-lucide="sliders"></i> 首页设置</button>
      <button class="icon-btn" title="客服"><i data-lucide="headphones"></i></button>
      <button class="icon-btn" title="管理员"><i data-lucide="user-cog"></i></button>
      <select class="dashboard-city" aria-label="切换城市"><option>上海</option><option>北京</option><option>深圳</option></select>`);
  }

  const content = document.querySelector('.content');
  const warningCard = item => `
    <div class="warning-card ${item[2]}${/^0|¥0\.00/.test(item[1]) ? ' zero' : ''}">
      <div class="warning-title">${item[0]}</div><div class="warning-value">${item[1]}</div>
      <div class="warning-meta"><a href="#">详情 &gt;</a></div>
    </div>`;
  const tenantWarnings = [
    ['目前已到期应收(元)', '¥7067.53万', 'danger'], ['未来30天到期租客', '4', 'primary'],
    ['未来应支', '4天 ¥5.40万', 'warning'], ['今日租客到期', '0', 'success'],
    ['已逾期租客欠款(元)', '¥0.00元', 'success'], ['目前租客已到期(个)', '204', 'danger']
  ];
  const landlordWarnings = [
    ['目前已到期应支(元)', '¥3036.93万', 'danger'], ['未来应收', '4天 ¥6530.00元', 'primary'],
    ['未来30天到期房东', '5', 'warning'], ['今日房东到期', '0', 'success'],
    ['已逾期房东欠款(元)', '¥0.00元', 'success'], ['已逾期未续房东', '151', 'danger']
  ];

  const roleGroups = {
    super_admin: '*', store_manager: '*', readonly: '*',
    finance_manager: ['finance', 'contract', 'work'],
    housekeeper: ['housing', 'risk', 'contract', 'work'],
    salesman: ['housing', 'work']
  }[role];
  const dashboardGroups = [
    { id: 'housing', title: '房源相关（4 张）', cards: [
      { title: '房源概况', metrics: [['有效', '904间'], ['冻结', '2间'], ['租房', '152'], ['售房', '364'], ['储备', '388']] },
      { title: '平均租差 / 续约率', metrics: [['总平均租差', '1205.20元'], ['整租续约', '82.4%'], ['合租续约', '76.1%']] },
      { title: '当前出租率 / 空置率', metrics: [['总出租率', '31.75%'], ['月空置率', '68.25%'], ['租房', '30.2%'], ['储备', '35.1%']] },
      { title: '房间状态', metrics: [['未租', '561'], ['已租', '287'], ['配置', '12'], ['脏房', '8'], ['已到期', '204']] }
    ]},
    { id: 'finance', title: '财务相关（3 张）', cards: [
      { title: '财务流水', metrics: [['今日待出纳', '¥0.00'], ['收入', '¥86,400'], ['支出', '¥32,100'], ['未出纳', '0笔'], ['终审待审', '0笔']] },
      { title: '押金统计', metrics: [['房东押金', '¥10.83万'], ['租客押金', '¥51.40万'], ['押金差', '-¥40.57万']] },
      { title: '剩余价值 / 负债', metrics: [['剩余价值', '¥1480.14万'], ['租房', '¥980.20万'], ['储备', '¥499.94万']] }
    ]},
    { id: 'contract', title: '合同相关（3 张）', cards: [
      { title: '合同管理', metrics: [['待签字', '170'], ['在租中', '287'], ['将到期', '4'], ['已到期', '204']] },
      { title: '行政审批', metrics: [['待我处理', '0'], ['我发起的', '0'], ['平均耗时', '4.2h']] },
      { title: '业务审批', metrics: [['待我处理', '136'], ['我发起的', '167'], ['总数', '303']] }
    ]},
    { id: 'risk', title: '风险预警（2 张）', cards: [
      { title: '空置预警', metrics: [['累计空置', '561间'], ['0-7天', '82'], ['8-15天', '66'], ['16-30天', '94'], ['90天以上', '118']] },
      { title: '智能设备', metrics: [['在线', '4'], ['离线', '0'], ['低电量', '0'], ['门锁', '2'], ['水表', '2']] }
    ]},
    { id: 'landlord', title: '房东相关（2 张）', cards: [
      { title: '房东缺失统计', metrics: [['装修前图片', '152'], ['证件照', '151'], ['纸质合同照', '152'], ['房产证照', '150']] },
      { title: '房东状态', metrics: [['冻结', '0'], ['已到期', '77'], ['诉讼中', '2']] }
    ]},
    { id: 'work', title: '我的工作（4 张）', cards: [
      { title: '我的待办', metrics: [['全部', '38'], ['审批流程', '12'], ['巡房逾期', '9'], ['反馈回复', '5']] },
      { title: '最新公告', metrics: [['一天公告', '3条'], ['未读', '1条'], ['强提示', '0条']] },
      { title: '储备房源录入分析', metrics: [['近30天', '64'], ['环比', '+8.6%'], ['张江店', '22']] },
      { title: '储备房源增量分析', metrics: [['本月增量', '+18'], ['转化率', '28.1%'], ['私盘', '23']] }
    ]}
  ].filter(group => roleGroups === '*' || roleGroups.indexOf(group.id) !== -1);

  const rankRows = [
    ['1', '梁成肖', '建外SOHO店A组', '¥97,515', 100],
    ['2', '李阳', '建外SOHO店B组', '¥75,629', 78],
    ['3', '王芳', '北辛安店', '¥58,420', 60],
    ['4', '张伟', '张江店', '¥48,900', 50],
    ['5', '刘思思', '浦东店', '¥42,100', 43]
  ];
  const statusTabs = (tabs, activeIndex) => `<div class="status-tabs compact">${tabs.map((tab, index) => `<button class="status-tab${index === activeIndex ? ' active' : ''}">${tab}</button>`).join('')}</div>`;

  content.innerHTML = `
    <div class="dashboard-hero">
      <section class="user-card">
        <div class="user-avatar large">代</div>
        <div class="min-width-0">
          <div class="user-greeting">代建伟，下午好~</div>
          <div class="text-muted">优居上海-张江店 · 综合经纪人 · 137****6208</div>
          ${role === 'readonly' ? '' : `
            <div class="quick-links">
              <a href="pages/house-wizard.html?type=rent"><i data-lucide="house-plus"></i> 录入租房</a>
              <a href="pages/house-wizard.html?type=sale"><i data-lucide="key-round"></i> 录入售房</a>
              <a href="pages/house-wizard.html?type=reserve"><i data-lucide="layers"></i> 录入储备</a>
            </div>`}
        </div>
      </section>
      <section class="cms-banner">
        <div class="min-width-0"><strong>平台战略合作单位 · 月度排行榜 · 活动方案</strong><div class="text-muted">8 类合作渠道与联系方式，内容由 CMS 配置。</div></div>
        ${role === 'readonly' ? '' : '<button class="btn btn-default btn-sm"><i data-lucide="external-link"></i> 查看合作渠道</button>'}
      </section>
      <section class="quick-entry">
        <div class="section-title"><i data-lucide="layout-grid"></i> 快捷入口</div>
        <div class="quick-entry-grid"><button><i data-lucide="clipboard-check"></i>待办审批</button><button><i data-lucide="megaphone"></i>系统公告</button><button><i data-lucide="trophy"></i>业绩排行榜</button></div>
        ${role === 'readonly' ? '' : '<button class="btn btn-ghost btn-sm"><i data-lucide="pencil"></i> 编辑</button>'}
      </section>
    </div>

    <div class="dashboard-duo">
      <section class="dashboard-panel">
        <div class="section-header"><div class="section-title"><i data-lucide="pie-chart"></i> 数据概览 · 我的数据</div>${statusTabs(['今日', '本周', '本月', '上月'], 0)}</div>
        <div class="kpi-grid">
          <div class="kpi-card pink"><div class="kpi-label">收房</div><div class="kpi-value">3<span class="kpi-unit">套</span></div></div>
          <div class="kpi-card yellow"><div class="kpi-label">收客</div><div class="kpi-value">12<span class="kpi-unit">人</span></div></div>
          <div class="kpi-card green"><div class="kpi-label">带看</div><div class="kpi-value">8<span class="kpi-unit">次</span></div></div>
          <div class="kpi-card blue"><div class="kpi-label">应收</div><div class="kpi-value">9.75<span class="kpi-unit">万</span></div></div>
          <div class="kpi-card purple"><div class="kpi-label">实收</div><div class="kpi-value">7.56<span class="kpi-unit">万</span></div></div>
        </div>
      </section>
      <section class="dashboard-panel">
        <div class="section-header"><div class="section-title"><i data-lucide="trophy"></i> 业绩排行榜 TOP20</div><span class="text-muted">前 3 名高亮</span></div>
        <div class="rank-tabs">
          ${statusTabs(['经纪人', '支队', '门店'], 0)}
          ${statusTabs(['应收业绩', '实收业绩'], 0)}
          ${statusTabs(['本月', '上月'], 0)}
        </div>
        <div class="bar-list">
          ${rankRows.map(row => `
            <div class="bar-row top-${row[0] <= 3 ? row[0] : 'default'}">
              <span>${row[0]} ${row[1]}</span><div class="rank-bar"><div class="rank-fill${row[0] <= 3 ? ' top-' + row[0] : ''}" style="width:${row[4]}%"></div></div><strong>${row[3]}</strong><small>${row[2]}</small>
            </div>`).join('')}
        </div>
      </section>
    </div>

    <div class="dashboard-section"><div class="section-header"><div class="section-title"><i data-lucide="bell"></i> 财务到期预警 · 租客</div><span class="text-muted">实时刷新 ≤ 5min</span></div><div class="warning-grid six">${tenantWarnings.map(warningCard).join('')}</div></div>
    <div class="dashboard-section"><div class="section-header"><div class="section-title"><i data-lucide="bell-ring"></i> 财务到期预警 · 房东</div><span class="text-muted">零值灰显 / 超阈值标红</span></div><div class="warning-grid six">${landlordWarnings.map(warningCard).join('')}</div></div>
    ${dashboardGroups.map(group => `
      <div class="dashboard-section">
        <div class="section-header"><div class="section-title">${group.title}</div>${group.id === 'work' && role !== 'readonly' ? '<button class="btn btn-default btn-sm"><i data-lucide="layout-grid"></i> 卡片库</button>' : ''}</div>
        <div class="large-card-grid">${group.cards.map(card => `<div class="large-card"><h3>${card.title}</h3><div class="metric-grid">${card.metrics.map(metric => `<div><div class="metric-label">${metric[0]}</div><div class="metric-value">${metric[1]}</div></div>`).join('')}</div></div>`).join('')}</div>
      </div>`).join('')}
    <div class="dashboard-duo">
      <section class="dashboard-panel">
        <div class="section-header"><div class="section-title"><i data-lucide="clipboard-check"></i> 待办审批</div>${role === 'readonly' ? '' : '<button class="btn btn-default btn-sm"><i data-lucide="filter"></i> 全部</button>'}</div>
        ${statusTabs(['待处理 18', '已发起 12', '已处理 64', '抄送我 9'], 0)}
        <div class="dashboard-list"><ul class="dashboard-list"><li><span>【退租】王大雷 退租申请</span><span class="text-danger">今日 18:00</span></li><li><span>【换房】李梅 换房申请</span><span>明日 12:00</span></li><li><span>【维修】汤臣豪园 3-1201 水管维修</span><span>今日 16:00</span></li></ul></div>
      </section>
      <section class="dashboard-panel">
        <div class="section-header"><div class="section-title"><i data-lucide="megaphone"></i> 系统公告</div><a href="#" class="text-primary">查看更多</a></div>
        <div class="announcement-tabs">${statusTabs(['全部 1', '活动通知', '新闻公告', '公司动态', '售后管理', '政策', '区域动态', '平台通知', '笋盘推荐'], 0)}</div>
        <div class="dashboard-list"><ul class="dashboard-list"><li><span><span class="tag tag-red">公告</span> 8 月房租账单已生成</span><span class="text-muted">今天</span></li><li><span><span class="tag tag-red">制度</span> 新增客源录入规范</span><span class="text-muted">昨天</span></li><li><span><span class="tag tag-red">培训</span> 新角色权限模型说明</span><span class="text-muted">08-11</span></li></ul></div>
      </section>
    </div>`;
  if (window.lucide) lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', function() {
  const page = window.PROTOTYPE_PAGE;
  if (!page) return;
  renderSidebar(page.id, getCurrentRole());
  if (page.id === 'home') renderDashboard();
  else if (page.id === 'house-wizard') renderWizard(page);
  else renderPage(page);
});
