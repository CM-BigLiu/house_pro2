/* ============================================================
   优居 ERP · 高保真渲染引擎 —— 页面 / 向导 / 看板渲染
   ============================================================ */
function noteHtml(note) {
  return note ? `<div class="prototype-note"><i data-lucide="info"></i><span>${note}</span></div>` : '';
}

/* 筛选条：page.filterQuick > 0 时前 N 项为快速筛选，其余折叠进「更多筛选」（§5.2.3） */
function filterBarHtml(page) {
  const buttons = `<div class="filter-group filter-actions"><button class="btn btn-primary btn-sm"><i data-lucide="search"></i> 搜索</button><button class="btn btn-default btn-sm"><i data-lucide="rotate-ccw"></i> 重置</button><button class="btn btn-default btn-sm" data-more-filters aria-expanded="false"><i data-lucide="sliders-horizontal"></i> <span>更多筛选</span><i data-lucide="chevron-down" class="more-caret"></i></button></div>`;
  const quick = page.filterQuick || 0;
  if (!quick || quick >= page.filters.length) {
    return `<div class="filter-bar">${filtersHtml(page.filters)}${buttons}</div>`;
  }
  return `<div class="filter-bar filter-bar-collapsible">${filtersHtml(page.filters.slice(0, quick))}${buttons}<div class="filter-more">${filtersHtml(page.filters.slice(quick))}</div></div>`;
}

/* 列表主体（卡片分组 / 分栏 / 卡片 / 表格），供 renderPage 与 Tab 面板切换复用 */
function buildListHtml(page) {
  if (page.cardGroups) {
    return page.cardGroups.map(group => `
      <div class="dashboard-section">
        <div class="section-header"><div class="section-title"><i data-lucide="map-pin"></i> ${group.group}</div><span class="text-muted">${group.cards.length} 个小区</span></div>
        <div class="house-grid">${cardsHtml(group.cards)}</div>
      </div>`).join('') + `<div class="card" style="margin-top:4px">${paginationHtml(page)}</div>`;
  }
  if (page.layout === 'split') {
    return `<div class="split-layout"><aside class="tree-panel"><div class="card-title"><i data-lucide="list-tree"></i> ${page.tree.title}</div><ul class="tree">${page.tree.nodes.map(node => treeHtml(node)).join('')}</ul></aside><div class="split-main card">${page.layoutType === 'cards' ? `<div class="card-body">${cardsHtml(page.cards)}</div>` : tableHtml(page.columns, page.rows, page)}${paginationHtml(page)}</div></div>`;
  }
  if (page.layout === 'cards') {
    return `<div class="house-grid">${cardsHtml(page.cards)}</div><div class="card" style="margin-top:16px">${paginationHtml(page)}</div>`;
  }
  return `<div class="card">${tableHtml(page.columns, page.rows, page)}${paginationHtml(page)}</div>`;
}

/* Tab 面板切换：panel.html 原样输出；否则用 panel 覆盖 columns/rows 等字段后复用 buildListHtml */
function renderTabPanel(page, index) {
  const panel = (page.tabPanels || [])[index];
  if (!panel) return buildListHtml(page);
  if (panel.html) return panel.html;
  return buildListHtml(Object.assign({}, page, panel, { cardGroups: panel.cardGroups, tree: panel.tree || page.tree }));
}

/* ---------------- 通用列表页 ---------------- */
function renderPage(page) {
  if (!page) return;
  if (page.layout === 'role-config') { renderRoleConfig(page); return; }
  window.__CURRENT_PAGE = page;
  renderHeader(page.title, page.group);
  const content = document.querySelector('.content');
  const role = getCurrentRole();
  const toolbar = (page.actions || []).filter(action => hasActionPermission(action, role)).map(action => buttonHtml(action)).join('');
  let html = `
    ${noteHtml(page.note)}
    <div class="page-header"><div><div class="page-title">${page.title}</div><div class="page-desc">${page.description || ''}</div></div><div class="page-actions">${toolbar}</div></div>
    ${summaryHtml(page.summary)}
    ${page.tabPanels ? `<div class="tabs" data-tab-host>${page.tabs.map((tab, index) => `<div class="tab${index === 0 ? ' active' : ''}" data-tab-index="${index}">${tab.label}${tab.count !== undefined ? ` <span class="text-muted">(${tab.count})</span>` : ''}</div>`).join('')}</div>` : tabsHtml(page.tabs)}
    ${page.typeTabs ? `<div class="status-tabs" role="tablist" aria-label="类型切换">${page.typeTabs.map((tab, index) => `<button class="status-tab${index === 0 ? ' active' : ''}">${tab.label || tab}${tab.count !== undefined ? ` ${tab.count}` : ''}</button>`).join('')}</div>` : ''}
    ${page.statusTabs ? `<div class="status-tabs">${page.statusTabs.map((tab, index) => `<button class="status-tab${index === 0 ? ' active' : ''}">${tab.label}${tab.count !== undefined ? ` ${tab.count}` : ''}</button>`).join('')}</div>` : ''}
    ${page.views ? `<div class="toolbar-row"><span class="toolbar-label">视图</span><div class="view-switch">${page.views.map((view, index) => `<button class="${index === 0 ? 'active' : ''}">${view}</button>`).join('')}</div><span class="toolbar-label">视图权限：个人视图 / 公司视图</span></div>` : ''}
    ${page.sorts ? `<div class="sort-bar"><span class="toolbar-label">排序</span>${page.sorts.map((sort, index) => `<button class="${index === 0 ? 'active' : ''}">${sort}${index === 0 ? ' <i data-lucide="arrow-down-wide-narrow"></i>' : ''}</button>`).join('')}</div>` : ''}
    ${page.filters ? filterBarHtml(page) : ''}
    ${page.matchPanel ? matchPanelHtml(page.matchPanel) : ''}
    ${page.batchActions ? `<div class="toolbar-row"><span class="toolbar-label">批量</span>${page.batchActions.map(action => buttonHtml(action, true)).join('')}</div>` : ''}
  `;

  const listHtml = page.tabPanels ? renderTabPanel(page, 0) : buildListHtml(page);
  html += page.tabPanels ? `<div id="tab-panel-host">${listHtml}</div>` : listHtml;
  content.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

/* 客户匹配结果区（§5.4 客源-房源智能匹配） */
function matchPanelHtml(panel) {
  return `
    <div class="match-panel">
      <div class="section-header"><div class="section-title"><i data-lucide="crosshair"></i> 客户匹配 · ${panel.client}</div><span class="text-muted">${panel.rule}</span></div>
      <div class="match-grid">
        ${panel.matches.map(item => `
          <div class="match-card">
            <div class="match-head"><strong>${item.title}</strong><span class="match-rate">${item.rate}% 匹配</span></div>
            <div class="match-meta">${item.meta}</div>
            <div class="match-reason">${item.reason}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

/* ---------------- 角色管理（§3.1 角色-权限配置） ---------------- */
function renderRoleConfig(page) {
  renderHeader(page.title, page.group);
  const content = document.querySelector('.content');
  const list = page.roleList || [];
  const detail = page.roleDetail || {};
  const activeCode = page.activeRole || (list[0] && list[0].code);
  const current = list.find(item => item.code === activeCode) || list[0] || {};

  const menuTreeHtml = nodes => `<ul class="perm-tree">${(nodes || []).map(node => `
    <li>
      <label class="perm-node${node.children ? ' perm-parent' : ''}"><input type="checkbox"${node.checked ? ' checked' : ''}><span>${node.label}</span></label>
      ${node.children ? menuTreeHtml(node.children) : ''}
    </li>`).join('')}</ul>`;

  content.innerHTML = `
    ${noteHtml(page.note)}
    <div class="page-header"><div><div class="page-title">${page.title}</div><div class="page-desc">${page.description || ''}</div></div>
      <div class="page-actions">${(page.actions || []).map(action => buttonHtml(action)).join('')}</div></div>
    <div class="role-config">
      <aside class="role-list card">
        <div class="card-title"><i data-lucide="users-round"></i> 角色列表（${list.length}）</div>
        <ul>
          ${list.map(item => `
            <li class="role-item${item.code === current.code ? ' active' : ''}" data-role-code="${item.code}">
              <div class="role-item-head"><strong>${item.name}</strong>${item.builtin ? '<span class="tag tag-gray">内置</span>' : ''}${item.active === false ? '<span class="tag tag-red">停用</span>' : ''}</div>
              <div class="role-item-meta"><span class="mono">${item.code}</span> · ${item.scopeText} · 员工数 ${item.staff}</div>
            </li>`).join('')}
        </ul>
      </aside>
      <section class="role-detail">
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="id-card"></i> 基本信息</div><span class="text-muted">${current.name}${current.parent ? `（继承自「${current.parent}」的权限模板）` : ''}</span></div>
          <div class="card-body"><div class="form-grid">
            ${(detail.basic || []).map(field => {
              const pair = Array.isArray(field) ? { label: field[0], value: field[1] } : field;
              return `<label class="form-field${pair.wide ? ' wide' : ''}"><span>${pair.label}${pair.required ? '<em>*</em>' : ''}</span><input class="input" value="${pair.value || ''}"${pair.readonly ? ' readonly' : ''}></label>`;
            }).join('')}
          </div></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="list-tree"></i> 菜单权限</div><span class="text-muted">父子级联勾选</span></div>
          <div class="card-body"><div class="perm-groups">
            ${(detail.menuTree || []).map(node => `
              <div class="perm-group">
                <div class="perm-group-title">${node.label}</div>
                ${menuTreeHtml(node.children || [node])}
              </div>`).join('')}
          </div></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="mouse-pointer-click"></i> 操作权限</div><span class="text-muted">按钮级控制</span></div>
          <div class="card-body"><div class="perm-groups">
            ${(detail.actionGroups || []).map(group => `
              <div class="perm-group">
                <div class="perm-group-title">${group.group || group.module}</div>
                <div class="perm-actions">${(group.actions || []).map(action => {
                  const pair = Array.isArray(action) ? { label: action[0], checked: action[1] } : action;
                  return `<label class="perm-node"><input type="checkbox"${pair.checked ? ' checked' : ''}><span>${pair.label}</span></label>`;
                }).join('')}</div>
              </div>`).join('')}
          </div></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="database-zap"></i> 数据范围</div><span class="text-muted">决定列表可见数据</span></div>
          <div class="card-body">
            <div class="scope-radios">
              ${(detail.scopes || []).map(scope => {
                const pair = Array.isArray(scope) ? { value: scope[0], label: scope[1] } : scope;
                return `<label class="perm-node scope-radio"><input type="radio" name="data-scope"${pair.value === detail.activeScope ? ' checked' : ''}><span><strong>${pair.label}</strong><small class="mono">${pair.value}</small></span></label>`;
              }).join('')}
            </div>
            ${detail.overrides ? `<div class="prototype-note" style="margin:14px 0 0"><i data-lucide="info"></i><span>数据权限独立配置覆盖：${(Array.isArray(detail.overrides) ? detail.overrides : []).map(item => Array.isArray(item) ? `${item[0]} → ${item[1]}` : item).join('；')}</span></div>` : ''}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title"><i data-lucide="eye"></i> 权限预览</div></div>
          <div class="card-body"><div class="prototype-note" style="margin:0"><i data-lucide="info"></i><span>${detail.preview || ''}</span></div></div>
          <div class="card-footer dialog-actions" style="justify-content:flex-end">
            <button class="btn btn-default"><i data-lucide="rotate-ccw"></i> 重置</button>
            <button class="btn btn-primary" data-role-save><i data-lucide="save"></i> 保存配置</button>
          </div>
        </div>
      </section>
    </div>`;
  if (window.lucide) lucide.createIcons();
}

/* ---------------- 统一房源录入向导 ---------------- */
function renderWizard(page) {
  renderHeader(page.title, page.group);
  const content = document.querySelector('.content');
  const params = new URLSearchParams(window.location.search);
  const type = page.types[params.get('type')] ? params.get('type') : page.defaultType;
  const config = page.types[type];
  const readonly = getCurrentRole() === 'readonly';
  const field = (label, control, required, wide) => `
    <label class="form-field${wide ? ' wide' : ''}">
      <span>${label}${required ? '<em>*</em>' : ''}</span>${control}
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
    field('标题', '<div class="inline-control"><input class="input" placeholder="房源标题"><div class="button-row"><button class="btn btn-default btn-sm"><i data-lucide="sparkles"></i> 智能标题</button></div></div>', true, true)
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
    ${noteHtml(page.note)}
    <div class="page-header">
      <div>
        <div class="page-title">${page.title} · ${config.label}</div>
        <div class="page-desc">${config.description}</div>
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
          <div class="card-header"><div class="card-title"><i data-lucide="map-pin"></i> Step 1 · 楼盘选择</div><a class="text-primary" href="#">楼盘信息有误？</a></div>
          <div class="card-body">
            <div class="form-grid">
              ${field('租售类型', `<select class="select" data-wizard-type>${Object.keys(page.types).map(key => `<option value="${key}"${key === type ? ' selected' : ''}>${page.types[key].label}</option>`).join('')}</select>`, true)}
              ${field('房屋用途', select(['普通住宅', '别墅', '商住两用', '车位', '商铺', '写字楼', '厂房', '土地']), true)}
              ${field('小区选择', '<div class="inline-control"><input class="input" value="汤臣豪园"><div class="button-row"><button class="btn btn-default btn-sm"><i data-lucide="search"></i> 搜索小区</button></div></div>', true, true)}
              ${field('城市', readonlyValue('上海'))}
              ${field('小区地址', readonlyValue('晨晖路825弄'), false, true)}
              ${field('栋座', select(['3幢', '5幢', '15幢']), true)}
              ${field('单元', select(['1单元', '2单元']), true)}
              ${field('楼层', select(['3层', '18层', '23层']), true)}
              ${field('房号', select(['301', '1802', '2301']), true)}
            </div>
            ${type === 'reserve' ? '<div class="prototype-note" style="margin-top:14px"><i data-lucide="info"></i><span>储备房源适配：无精确楼栋时可切换为「小区 + 物业地址 + 门牌号」文本录入。</span></div>' : ''}
          </div>
        </div>
        <div class="wizard-step-panel" data-wizard-panel="1">
          <div class="card-header"><div class="card-title"><i data-lucide="clipboard-list"></i> Step 2 · 基本信息</div><span class="text-muted">Step 1 自动带出，不可修改</span></div>
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
          <div class="card-header"><div class="card-title"><i data-lucide="tags"></i> Step 3 · 特色信息</div><span class="text-muted">VR / 图片 / 视频房勘在上架后维护</span></div>
          <div class="card-body">
            <div class="form-grid">
              ${field('房源现状', select(['空房', '自住', '出租']))}
              ${field('房源标签', '<span class="text-muted">28 个标签，可多选</span>', true, true)}
            </div>
            <div class="tag-select">${tags.map((tag, index) => `<button class="${index === 5 || index === 6 ? 'active' : ''}">${tag}</button>`).join('')}</div>
            <label class="form-field wide"><span>房源介绍 <em>*</em></span>
              <div class="inline-control">
                <textarea class="input" rows="5" placeholder="试试 ai 生成？"></textarea>
                <div class="button-row"><button class="btn btn-default btn-sm"><i data-lucide="layout-template"></i> 选择模板</button><button class="btn btn-default btn-sm"><i data-lucide="save"></i> 保存模板</button></div>
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
          <div class="card-header"><div class="card-title"><i data-lucide="send"></i> Step 4 · 完成（业主信息 + 发布）</div><span class="text-warning">业主电话实时校验黑名单</span></div>
          <div class="card-body">
            <div class="form-grid">
              ${field('业主姓名', text('业主姓名'), true)}
              ${field('业主电话', '<div class="inline-control"><input class="input" placeholder="手机号" data-owner-phone><div class="button-row"><button class="btn btn-default btn-sm" data-owner-verify><i data-lucide="shield-check"></i> 业主校验</button></div></div>', true, true)}
              ${field('备用电话', text('手机号'))}
              ${field('首选带看时间', '<input class="input" type="datetime-local">', true)}
              ${field('备选带看时间', '<input class="input" type="datetime-local">')}
              ${field('跟进内容', '<textarea class="input" rows="4" maxlength="500" placeholder="最多 500 字" data-char-count></textarea><div class="char-counter"><span data-char-count-num>0</span>/500</div>', false, true)}
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

/* ---------------- 首页看板 ---------------- */
function timeGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '凌晨好';
  if (h < 12) return '上午好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

/* 大卡可视化：环形占比 / 横向柱条 */
function ringViz(percent, label) {
  const r = 30;
  const c = (2 * Math.PI * r).toFixed(1);
  const offset = (c * (1 - percent / 100)).toFixed(1);
  return `<div class="viz-ring"><svg viewBox="0 0 80 80"><circle class="ring-bg" cx="40" cy="40" r="${r}"/><circle class="ring-fg" cx="40" cy="40" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${offset}"/></svg><div class="ring-label"><strong>${percent}%</strong><span>${label}</span></div></div>`;
}
function hbarsViz(items) {
  return `<div class="viz-hbars">${items.map(item => `<div class="hbar-row"><span>${item[0]}</span><div class="hbar"><div class="hbar-fill${item[3] ? ' ' + item[3] : ''}" style="width:${item[2]}%"></div></div><strong class="mono">${item[1]}</strong></div>`).join('')}</div>`;
}
function cardVizHtml(card) {
  if (!card.viz) return '';
  if (card.viz.type === 'ring') return ringViz(card.viz.percent, card.viz.label);
  if (card.viz.type === 'hbars') return hbarsViz(card.viz.items);
  return '';
}

function sparkline(color, seed) {
  const points = [];
  for (let i = 0; i <= 11; i++) {
    const x = i * 10;
    const y = 26 - (Math.sin(i * 0.9 + seed) * 8 + Math.cos(i * 0.5 + seed * 2) * 5 + 12);
    points.push(`${x},${Math.max(4, Math.min(28, y)).toFixed(1)}`);
  }
  const line = points.join(' ');
  return `<svg class="kpi-spark" width="110" height="30" viewBox="0 0 110 30" aria-hidden="true"><polygon points="0,30 ${line} 110,30"/><polyline points="${line}"/></svg>`;
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
      <button class="btn btn-ghost btn-sm" title="首页设置" data-dismiss-todo><i data-lucide="sliders"></i> 首页设置</button>
      <button class="icon-btn" title="客服"><i data-lucide="headphones"></i></button>
      <button class="icon-btn" title="管理员"><i data-lucide="user-cog"></i></button>
      <select class="dashboard-city" aria-label="切换城市"><option>上海</option><option>北京</option><option>深圳</option></select>
      <select class="dashboard-city" aria-label="切换店面"><option>张江店</option><option>浦东店</option><option>联洋店</option></select>
      <span class="header-divider"></span>`);
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
    super_admin: '*', store_manager: '*', readonly: '*', company_admin: '*',
    boss: ['housing', 'finance', 'contract', 'risk', 'landlord'],
    finance_manager: ['finance', 'contract', 'work'],
    finance_clerk: ['finance', 'work'],
    housekeeper: ['housing', 'risk', 'contract', 'work'],
    salesman: ['housing', 'work'],
    agent: ['housing', 'work']
  }[role];
  const dashboardGroups = [
    { id: 'housing', title: '房源相关', icon: 'building-2', cards: [
      { title: '房源概况', metrics: [['有效', '904间'], ['冻结', '2间'], ['租房', '152'], ['售房', '364'], ['储备', '388']] },
      { title: '平均租差 / 续约率', metrics: [['总平均租差', '1205.20元'], ['整租续约', '82.4%'], ['合租续约', '76.1%']] },
      { title: '当前出租率 / 空置率', metrics: [['总出租率', '31.75%'], ['月空置率', '68.25%'], ['租房', '30.2%'], ['储备', '35.1%']], viz: { type: 'ring', percent: 31.75, label: '总出租率' } },
      { title: '房间状态', metrics: [['未租', '561'], ['已租', '287'], ['配置', '12'], ['脏房', '8'], ['已到期', '204']] }
    ]},
    { id: 'finance', title: '财务相关', icon: 'banknote', cards: [
      { title: '财务流水', metrics: [['今日待出纳', '¥0.00'], ['收入', '¥86,400'], ['支出', '¥32,100'], ['未出纳', '0笔'], ['终审待审', '0笔']] },
      { title: '押金统计', metrics: [['房东押金', '¥10.83万'], ['租客押金', '¥51.40万'], ['押金差', '-¥40.57万']] },
      { title: '剩余价值 / 负债', metrics: [['剩余价值', '¥1480.14万'], ['租房', '¥980.20万'], ['储备', '¥499.94万']] }
    ]},
    { id: 'contract', title: '合同相关', icon: 'file-signature', cards: [
      { title: '合同管理', metrics: [['待签字', '170'], ['在租中', '287'], ['将到期', '4'], ['已到期', '204']] },
      { title: '行政审批', metrics: [['待我处理', '0'], ['我发起的', '0'], ['平均耗时', '4.2h']] },
      { title: '业务审批', metrics: [['待我处理', '136'], ['我发起的', '167'], ['总数', '303']] }
    ]},
    { id: 'risk', title: '风险预警', icon: 'siren', cards: [
      { title: '空置预警', metrics: [['累计空置', '561间'], ['0-7天', '82'], ['8-15天', '66'], ['16-30天', '94'], ['90天以上', '118']], viz: { type: 'hbars', items: [['0-7天', 82, 22], ['8-15天', 66, 18], ['16-30天', 94, 26], ['31-90天', 201, 55], ['90天以上', 118, 32, 'danger']] } },
      { title: '智能设备', metrics: [['在线', '4'], ['离线', '0'], ['低电量', '0'], ['门锁', '2'], ['水表', '2']] }
    ]},
    { id: 'landlord', title: '房东相关', icon: 'user-round', cards: [
      { title: '房东缺失统计', metrics: [['装修前图片', '152'], ['证件照', '151'], ['纸质合同照', '152'], ['房产证照', '150']] },
      { title: '房东状态', metrics: [['冻结', '0'], ['已到期', '77'], ['诉讼中', '2']] }
    ]},
    { id: 'work', title: '我的工作', icon: 'briefcase-business', cards: [
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

  const kpis = [
    ['pink', '收房', '3', '套', 1.0], ['yellow', '收客', '12', '人', 2.2], ['green', '带看', '8', '次', 3.4],
    ['blue', '应收', '9.75', '万', 4.1], ['purple', '实收', '7.56', '万', 5.3]
  ];

  content.innerHTML = `
    <div class="dashboard-hero">
      <section class="user-card">
        <div class="user-avatar large">代</div>
        <div class="min-width-0">
          <div class="user-greeting">代建伟，${timeGreeting()}~</div>
          <div class="text-muted" style="margin-top:3px">优居上海-张江店 · 综合经纪人 · 137****6208</div>
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
          ${kpis.map(kpi => `<div class="kpi-card ${kpi[0]}"><div class="kpi-label">${kpi[1]}<i data-lucide="trending-up" style="width:13px;height:13px;color:var(--ink-300)"></i></div><div class="kpi-value">${kpi[2]}<span class="kpi-unit">${kpi[3]}</span></div>${sparkline(kpi[0], kpi[4])}</div>`).join('')}
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
              <span><i class="rank-no">${row[0]}</i>${row[1]}</span><div class="rank-bar"><div class="rank-fill${row[0] <= 3 ? ' top-' + row[0] : ''}" style="width:${row[4]}%"></div></div><strong>${row[3]}</strong><small>${row[2]}</small>
            </div>`).join('')}
        </div>
      </section>
    </div>

    <div class="dashboard-section"><div class="section-header"><div class="section-title"><i data-lucide="bell"></i> 财务到期预警 · 租客</div><span class="text-muted">实时刷新 ≤ 5min</span></div><div class="warning-grid six">${tenantWarnings.map(warningCard).join('')}</div></div>
    <div class="dashboard-section"><div class="section-header"><div class="section-title"><i data-lucide="bell-ring"></i> 财务到期预警 · 房东</div><span class="text-muted">零值灰显 / 超阈值标红</span></div><div class="warning-grid six">${landlordWarnings.map(warningCard).join('')}</div></div>
    ${dashboardGroups.map(group => `
      <div class="dashboard-section">
        <div class="section-header"><div class="section-title"><i data-lucide="${group.icon}"></i> ${group.title}（${group.cards.length} 张）</div>${group.id === 'work' && role !== 'readonly' ? '<button class="btn btn-default btn-sm"><i data-lucide="layout-grid"></i> 卡片库</button>' : ''}</div>
        <div class="large-card-grid">${group.cards.map(card => `<div class="large-card${card.viz ? ' has-viz' : ''}"><div class="large-card-actions"><button class="icon-btn" title="详情"><i data-lucide="arrow-up-right"></i></button><button class="icon-btn" title="复制链接"><i data-lucide="link"></i></button></div><h3>${card.title}</h3><div class="large-card-body"><div class="metric-grid">${card.metrics.map(metric => `<div><div class="metric-label">${metric[0]}</div><div class="metric-value">${decorateValue(metric[1])}</div></div>`).join('')}</div>${cardVizHtml(card)}</div></div>`).join('')}</div>
      </div>`).join('')}
    <div class="dashboard-duo">
      <section class="dashboard-panel">
        <div class="section-header"><div class="section-title"><i data-lucide="clipboard-check"></i> 待办审批</div>${role === 'readonly' ? '' : '<button class="btn btn-default btn-sm"><i data-lucide="filter"></i> 全部</button>'}</div>
        ${statusTabs(['待处理 18', '已发起 12', '已处理 64', '抄送我 9'], 0)}
        <ul class="dashboard-list"><li><span>【退租】王大雷 退租申请</span><span class="text-danger">今日 18:00</span></li><li><span>【换房】李梅 换房申请</span><span>明日 12:00</span></li><li><span>【维修】汤臣豪园 3-1201 水管维修</span><span>今日 16:00</span></li></ul>
      </section>
      <section class="dashboard-panel">
        <div class="section-header"><div class="section-title"><i data-lucide="megaphone"></i> 系统公告</div><a href="#" class="text-primary">查看更多</a></div>
        <div class="announcement-tabs">${statusTabs(['全部 1', '活动通知', '新闻公告', '公司动态', '售后管理', '政策', '区域动态', '平台通知', '笋盘推荐'], 0)}</div>
        <ul class="dashboard-list"><li><span><span class="tag tag-red">公告</span> 8 月房租账单已生成</span><span class="text-muted">今天</span></li><li><span><span class="tag tag-red">制度</span> 新增客源录入规范</span><span class="text-muted">昨天</span></li><li><span><span class="tag tag-red">培训</span> 新角色权限模型说明</span><span class="text-muted">08-11</span></li></ul>
      </section>
    </div>
    <dialog class="prototype-dialog todo-dialog" data-todo-dialog>
      <div class="dialog-header" style="color:var(--ink-800)"><i data-lucide="clipboard-check" style="color:var(--primary)"></i><strong>我的待办</strong></div>
      <ul class="dashboard-list" style="margin-bottom:14px">
        <li><span><span class="tag tag-orange">审批流程</span> 待我处理的审批</span><strong class="mono">12</strong></li>
        <li><span><span class="tag tag-red">巡房逾期</span> 已超过巡房时限</span><strong class="mono">9</strong></li>
        <li><span><span class="tag tag-blue">反馈回复</span> 待回复的租客反馈</span><strong class="mono">5</strong></li>
      </ul>
      <div class="dialog-actions">
        <button class="btn btn-default" data-dialog-close>关闭</button>
        <button class="btn btn-primary" data-dialog-close>逐条处理</button>
      </div>
    </dialog>`;
  if (window.lucide) lucide.createIcons();
  let todoDismissed = false;
  try { todoDismissed = sessionStorage.getItem('todo-dialog-off') === '1'; } catch (err) { /* 无 sessionStorage 环境 */ }
  const skipTodo = new URLSearchParams(window.location.search).has('noTodo');
  if (role !== 'readonly' && !todoDismissed && !skipTodo) {
    const dialog = document.querySelector('[data-todo-dialog]');
    if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
  }
}

/* ---------------- 启动 ---------------- */
window.__renderTabPanel = renderTabPanel;
document.addEventListener('DOMContentLoaded', function() {
  const page = window.PROTOTYPE_PAGE;
  if (!page) return;
  renderSidebar(page.id, getCurrentRole());
  if (page.id === 'home') renderDashboard();
  else if (page.id === 'house-wizard') renderWizard(page);
  else renderPage(page);
});
