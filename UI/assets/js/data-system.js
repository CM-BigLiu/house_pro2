Object.assign(window.PROTOTYPE_PAGES, {
  role: {
    id: 'role', title: '角色管理', group: '系统管理',
    description: '角色、继承、菜单权限、操作权限与数据范围配置',
    note: '权限模型：角色 + 数据范围 + 权限点；选中左侧角色后右侧展开权限配置（§7.1.1）。',
    actions: [
      { label: '复制角色', icon: 'copy' }, { label: '权限预览', icon: 'eye' },
      { label: '新增角色', icon: 'plus', variant: 'btn-primary' }
    ],
    filters: [
      { label: '角色名称', placeholder: '搜索角色' }, { label: '数据范围', type: 'select', options: ['全部', 'self', 'group', 'store', 'company', 'assigned', 'custom'] },
      { label: '状态', type: 'select', options: ['启用', '停用'] }
    ],
    layout: 'role-config',
    roleList: [
      { name: '超级管理员', code: 'super_admin', scope: 'company', scopeText: '全公司', staff: 1, builtin: true, active: true },
      { name: '老板', code: 'boss', scope: 'company', scopeText: '全公司', staff: 1, builtin: true },
      { name: '公司管理员', code: 'company_admin', scope: 'company', scopeText: '全公司', staff: 2, builtin: true },
      { name: '店长', code: 'store_manager', scope: 'store', scopeText: '本店', staff: 5, parent: 'salesman' },
      { name: '财务负责人', code: 'finance_manager', scope: 'company', scopeText: '全公司', staff: 2 },
      { name: '财务专员', code: 'finance_clerk', scope: 'store', scopeText: '本店', staff: 3 },
      { name: '管家', code: 'housekeeper', scope: 'group', scopeText: '本组', staff: 12 },
      { name: '业务员', code: 'salesman', scope: 'self', scopeText: '仅自己', staff: 10 },
      { name: '综合经纪人', code: 'agent', scope: 'self', scopeText: '仅自己', staff: 8 },
      { name: '只读账号', code: 'readonly', scope: 'assigned', scopeText: '指定范围', staff: 4 }
    ],
    roleDetail: {
      basic: [['角色名称', '超级管理员'], ['角色编码', 'super_admin'], ['默认数据范围', 'company（全公司）'], ['员工数', '1'], ['内置角色', '是（不可删除）'], ['父角色', '—'], ['状态', '启用'], ['创建人/时间', '系统 / 初始化'], ['备注', '拥有全部菜单与操作权限']],
      menuTree: [
        { label: '首页', checked: true },
        { label: '房屋管理', checked: true, children: [
          { label: '租房管理', checked: true }, { label: '售房管理', checked: true }, { label: '储备房源', checked: true },
          { label: '储备客源', checked: true }, { label: '客户管理', checked: true }, { label: '小区管理', checked: true }
        ] },
        { label: '财务管理', checked: true, children: [
          { label: '账单', checked: true }, { label: '流水账', checked: true }, { label: '涨价统计', checked: true },
          { label: '公寓利润', checked: true }, { label: '合伙人', checked: true }, { label: '收入成本', checked: true },
          { label: '业绩核算', checked: true }, { label: '财务核算', checked: true }, { label: '欠款统计', checked: true },
          { label: '收支计划', checked: true }, { label: '代付管理', checked: true }, { label: '开票管理', checked: true }
        ] },
        { label: '系统管理', checked: true, children: [
          { label: '角色管理', checked: true }, { label: '权限管理', checked: true }, { label: '字典管理', checked: true }, { label: '人员管理', checked: true }
        ] }
      ],
      actionGroups: [
        { module: '租房管理', actions: [['新建', true], ['编辑', true], ['退房', true], ['导出', true], ['审批', true]] },
        { module: '售房管理', actions: [['录入', true], ['修改', true], ['上架下架', true], ['导出', true]] },
        { module: '财务管理', actions: [['修改账单', true], ['作废账单', true], ['开票申请', true], ['批量代付', true]] },
        { module: '系统管理', actions: [['角色配置', true], ['权限点维护', true], ['字典维护', true], ['人员维护', true]] }
      ],
      scopes: [['self', '仅自己'], ['group', '本组'], ['store', '本店'], ['company', '全公司'], ['assigned', '指定范围'], ['custom', '自定义 DSL']],
      activeScope: 'company',
      overrides: [['财务报表', 'company'], ['租房管理', '（跟随默认）']],
      preview: '菜单 22/22 · 操作 18/18 · 数据范围 company · 继承链：无父角色'
    },
    pagination: { total: 12, from: 1, to: 10, current: 1 }
  },

  permission: {
    id: 'permission', title: '权限管理', group: '系统管理',
    description: '权限点、数据范围表达式与待分配员工审核',
    note: '自定义范围 DSL 支持 =, !=, in, not in, >, <, between, like, is null, is not null；示例：housekeeper_id = ${self.id} AND status in (vacant, reserved, rented, collected)。',
    actions: [{ label: '刷新缓存', icon: 'refresh-cw' }, { label: '导出权限', icon: 'download' }, { label: '新增权限点', icon: 'plus', variant: 'btn-primary' }],
    tabs: [{ label: '权限点' }, { label: '数据权限独立配置' }, { label: '待分配员工' }, { label: '审计日志' }],
    filters: [
      { label: '类型', type: 'select', options: ['全部', '菜单权限', '操作权限', '数据权限'] }, { label: '模块', type: 'select', options: ['全部', '租房', '售房', '财务', '系统'] },
      { label: '状态', type: 'select', options: ['启用', '停用'] }
    ],
    layout: 'split', layoutType: 'table',
    tree: {
      title: '权限点三级分类', nodes: [
        { label: '菜单权限 menu', children: [{ label: '房屋管理', children: [{ label: 'rent / sale / reserve / customer / community' }] }, { label: '财务管理', children: [{ label: 'bill / flow / billing' }] }] },
        { label: '操作权限 action', children: [{ label: 'create / update / delete / export / approve' }] },
        { label: '数据权限 data', children: [{ label: 'self / group / store / company / assigned / custom' }] }
      ]
    },
    columns: [
      { label: '权限名称', key: 'name' }, { label: '编码', key: 'code' }, { label: '类型', key: 'type' }, { label: '所属模块', key: 'module' },
      { label: '默认范围', key: 'scope' }, { label: '可覆盖为', key: 'overrides' }, { label: '状态', key: 'status' }, { label: '最近更新', key: 'updatedAt' }, { label: '操作', key: 'operations' }
    ],
    rows: [
      { name: '租房管理可见', code: 'menu:rent', type: '菜单权限', module: '租房管理', scope: 'self', overrides: 'group / store / company / assigned', status: '启用', updatedAt: '2026-08-12', operations: [{ label: '编辑' }] },
      { name: '新增租房', code: 'action:rent:create', type: '操作权限', module: '租房管理', scope: '—', overrides: '—', status: '启用', updatedAt: '2026-08-12', operations: [{ label: '编辑' }] },
      { name: '财务报表数据', code: 'data:finance:report', type: '数据权限', module: '财务管理', scope: 'store', overrides: 'company / assigned', status: '启用', updatedAt: '2026-08-11', operations: [{ label: '编辑' }, { label: 'DSL' }] },
      { name: '待分配员工：周敏', code: 'invite:20260817001', type: '审核', module: '人员管理', scope: '—', overrides: '—', status: '待审核', updatedAt: '今天 09:12', operations: [{ label: '邀请详情' }, { label: '通过' }, { label: '拒绝' }] }
    ],
    pagination: { total: 186, from: 1, to: 4, current: 1 }
  },

  dictionary: {
    id: 'dictionary', title: '字典管理', group: '系统管理',
    description: '业务枚举、树形字典与物业地址库',
    note: '字典项修改后刷新缓存，业务模块下拉立即生效；物业地址被租房、售房、储备房源引用。',
    actions: [
      { label: '批量导入', icon: 'upload' }, { label: '导出字典', icon: 'download' }, { label: '刷新缓存', icon: 'refresh-cw', variant: 'btn-primary' },
      { label: '新增字典项', icon: 'plus', variant: 'btn-primary' }
    ],
    filters: [
      { label: '字典分类', type: 'select', options: ['城市', '区域', '商圈', '房屋类型', '装修情况', '缴费方式'] },
      { label: '字典名称/编码', placeholder: '搜索字典' }, { label: '状态', type: 'select', options: ['启用', '停用'] }, { label: '系统内置', type: 'select', options: ['是', '否'] }
    ],
    layout: 'split', layoutType: 'table',
    tree: {
      title: '23 类字典 / 物业地址库（§7.3.1 全量对齐）', nodes: [
        { label: 'city 城市', count: 30, active: true, children: [{ label: 'district 区域', count: 200, children: [{ label: 'business_circle 商圈', count: 500 }] }] },
        { label: 'property_type 房屋类型', count: 8 }, { label: 'decoration_level 装修情况', count: 5 }, { label: 'payment_method 缴费方式', count: 11 },
        { label: 'lease_term 租赁期限', count: 8 }, { label: 'room_type 房型', count: 9 }, { label: 'room_status 房间状态', count: 7 },
        { label: 'source_channel 来源', count: 12 }, { label: 'house_status 房源状态', count: 8 }, { label: 'disk_type 盘源', count: 2 }, { label: 'customer_status 客户状态', count: 9 },
        { label: 'identity 欠款身份', count: 7 }, { label: 'billing_category 款项种类', count: 8 }, { label: 'plan_type 计划类型', count: 2 }, { label: 'ticket_status 开票状态', count: 6 },
        { label: 'payment_type 支付方式', count: 5 }, { label: 'card_type 卡类型', count: 2 }, { label: 'biz_type 业务类型', count: 3 },
        { label: 'orientation 朝向', count: 10 }, { label: 'tax_type 税费', count: 5 }, { label: 'certificate_type 产证情况', count: 4 },
        { label: '物业地址库', count: 1268 }
      ]
    },
    columns: [
      { label: '字典编码', key: 'dictCode' }, { label: '字典名称', key: 'dictName' }, { label: '父级', key: 'parent' }, { label: '字典项值', key: 'value' },
      { label: '字典项文本', key: 'text' }, { label: '排序', key: 'sort' }, { label: '启用', key: 'enabled' }, { label: '内置', key: 'builtin' },
      { label: '创建人/时间', key: 'creator' }, { label: '备注', key: 'remark' }, { label: '操作', key: 'operations' }
    ],
    rows: [
      { dictCode: 'city', dictName: '城市', parent: '—', value: '310000', text: '上海', sort: 1, enabled: '是', builtin: '是', creator: '系统 / 初始化', remark: '城市级联根节点', operations: [{ label: '编辑' }, { label: '停用' }, { label: '新增子项' }] },
      { dictCode: 'district', dictName: '区域', parent: '上海', value: '310115', text: '浦东', sort: 1, enabled: '是', builtin: '是', creator: '系统 / 初始化', remark: '城市子级', operations: [{ label: '编辑' }, { label: '停用' }, { label: '新增子项' }] },
      { dictCode: 'payment_method', dictName: '缴费方式', parent: '—', value: 'quarterly', text: '季付', sort: 3, enabled: '是', builtin: '是', creator: '张伟 / 2026-03-12', remark: '租房账单使用', operations: [{ label: '编辑' }, { label: '停用' }, { label: '删除' }] },
      { dictCode: 'property_address', dictName: '物业地址库', parent: '浦东 / 张江', value: 'CY-001', text: '汤臣豪园', sort: 1, enabled: '是', builtin: '否', creator: '李芳 / 2026-08-12', remark: '经纬度 121.586,31.204', operations: [{ label: '编辑' }, { label: '删除' }] }
    ],
    pagination: { total: 856, from: 1, to: 4, current: 1 }
  },

  employee: {
    id: 'employee', title: '人员管理', group: '系统管理',
    description: '员工、部门、职位、店面、待分配与组织权限统一管理',
    actions: [
      { label: '批量转移店面', icon: 'building-2' }, { label: '批量分配角色', icon: 'user-check' }, { label: '批量重置密码', icon: 'key-round' },
      { label: '二维码邀请', icon: 'qr-code' }, { label: '添加店面', icon: 'store' }, { label: '添加员工', icon: 'plus', variant: 'btn-primary' }
    ],
    tabs: [{ label: '员工/部门' }, { label: '职位/权限' }, { label: '待分配员工' }, { label: '核心字段设置' }, { label: '人脸识别设置' }, { label: '操作日志' }],
    filters: [
      { label: '搜索', placeholder: '部门/姓名/手机号' }, { label: '状态', type: 'select', options: ['正常员工', '已停用'] },
      { label: '工作城市', type: 'select', options: ['上海'] }, { label: '工作店面', type: 'select', options: ['张江店', '浦东店', '联洋店'] },
      { label: '分组', type: 'select', options: ['1组', '2组', '转移1', '转移2'] }, { label: '职位', type: 'select', options: ['店长', '管家', '业务员', '财务'] }
    ],
    layout: 'split', layoutType: 'table',
    tree: {
      title: '组织树', nodes: [
        { label: '优居找房', count: 38, children: [{ label: '上海', children: [
          { label: '张江店', count: 16, active: true, children: [{ label: '业务部', count: 12, children: [{ label: '1组', count: 7 }, { label: '2组', count: 5 }] }, { label: '财务部', count: 4 }] },
          { label: '浦东店', count: 14 }, { label: '联洋店', count: 8 }
        ] }] }
      ]
    },
    columns: [
      { label: '姓名', key: 'name' }, { label: '手机号', key: 'mobile' }, { label: '职位', key: 'position' }, { label: '部门', key: 'department' },
      { label: '工作城市/店面', key: 'store' }, { label: '分组', key: 'group' }, { label: '可看房源范围', key: 'dataRange' }, { label: '角色', key: 'roles' },
      { label: '状态', key: 'status' }, { label: '入职', key: 'joined' }, { label: '离职', key: 'left' }, { label: '身份证', key: 'idcard' },
      { label: '银行卡', key: 'bankCard' }, { label: '开户行', key: 'bank' }, { label: '邮箱', key: 'email' }, { label: '备注', key: 'remark' }, { label: '操作', key: 'operations' }
    ],
    rows: [
      { name: '张伟', mobile: '138****0001', position: '店长', department: '业务部', store: '上海 / 张江店', group: '1组', dataRange: '本店 + 跨店授权', roles: 'store_manager', status: '正常', joined: '2024-03-01', left: '—', idcard: '310***********0001', bankCard: '**** **** **** 0001', bank: '招商银行', email: 'zhangwei@example.com', remark: '一店店长', operations: [{ label: '编辑' }, { label: '授权' }, { label: '转组' }, { label: '转移' }] },
      { name: '王晓明', mobile: '139****1122', position: '管家', department: '业务部', store: '上海 / 张江店', group: '1组', dataRange: '本组（本人）', roles: 'housekeeper', status: '正常', joined: '2024-06-12', left: '—', idcard: '310***********1122', bankCard: '**** **** **** 1122', bank: '工商银行', email: 'wangxm@example.com', remark: '负责汤臣板块', operations: [{ label: '编辑' }, { label: '授权' }, { label: '转组' }, { label: '转移' }] },
      { name: '李芳', mobile: '136****3344', position: '管家组长', department: '业务部', store: '上海 / 张江店', group: '2组', dataRange: '本组', roles: 'housekeeper', status: '正常', joined: '2025-01-08', left: '—', idcard: '310***********3344', bankCard: '**** **** **** 3344', bank: '建设银行', email: 'lifang@example.com', remark: '2组负责人', operations: [{ label: '编辑' }, { label: '授权' }, { label: '批量停用' }] }
    ],
    tabPanels: [
      null,
      { layout: 'table', columns: [
        { label: '职位', key: 'position' }, { label: '所属部门', key: 'department' }, { label: '关联角色', key: 'roles' },
        { label: '人数', key: 'staff' }, { label: '数据范围', key: 'dataRange' }, { label: '说明', key: 'remark' }, { label: '操作', key: 'operations' }
      ], rows: [
        { position: '店长', department: '业务部', roles: 'store_manager', staff: 5, dataRange: '本店', remark: '继承业务员权限模板', operations: [{ label: '配置权限' }, { label: '编辑' }] },
        { position: '管家', department: '业务部', roles: 'housekeeper', staff: 12, dataRange: '本组', remark: '巡房 / 维修 / 租客反馈', operations: [{ label: '配置权限' }, { label: '编辑' }] },
        { position: '财务专员', department: '财务部', roles: 'finance_clerk', staff: 3, dataRange: '本店', remark: '账单 / 流水 / 开票', operations: [{ label: '配置权限' }, { label: '编辑' }] }
      ], pagination: { total: 9, from: 1, to: 3, current: 1 } },
      { layout: 'table', columns: [
        { label: '姓名', key: 'name' }, { label: '手机号', key: 'mobile' }, { label: '来源', key: 'source' },
        { label: '申请时间', key: 'createdAt' }, { label: '邀请人', key: 'inviter' }, { label: '操作', key: 'operations' }
      ], rows: [
        { name: '陈晓', mobile: '137****5566', source: '二维码邀请', createdAt: '2026-08-16 10:12', inviter: '张伟', operations: [{ label: '通过', permission: 'system:update' }, { label: '拒绝', permission: 'system:update' }] },
        { name: '刘畅', mobile: '135****7788', source: '二维码邀请', createdAt: '2026-08-15 16:40', inviter: '张伟', operations: [{ label: '通过', permission: 'system:update' }, { label: '拒绝', permission: 'system:update' }] }
      ], pagination: { total: 2, from: 1, to: 2, current: 1 } },
      { html: `
        <div class="card"><div class="card-header"><div class="card-title"><i data-lucide="list-checks"></i> 核心字段设置</div><span class="text-muted">员工档案必填项</span></div>
        <div class="card-body"><div class="perm-groups">
          <div class="perm-group"><div class="perm-group-title">基础信息</div>
            <label class="perm-node"><input type="checkbox" checked disabled><span>姓名（系统必填）</span></label>
            <label class="perm-node"><input type="checkbox" checked disabled><span>手机号（系统必填）</span></label>
            <label class="perm-node"><input type="checkbox" checked><span>身份证号</span></label>
            <label class="perm-node"><input type="checkbox"><span>邮箱</span></label>
          </div>
          <div class="perm-group"><div class="perm-group-title">财务信息</div>
            <label class="perm-node"><input type="checkbox" checked><span>银行卡号</span></label>
            <label class="perm-node"><input type="checkbox" checked><span>开户行</span></label>
            <label class="perm-node"><input type="checkbox"><span>微信号</span></label>
          </div>
          <div class="perm-group"><div class="perm-group-title">组织信息</div>
            <label class="perm-node"><input type="checkbox" checked><span>工作店面</span></label>
            <label class="perm-node"><input type="checkbox" checked><span>分组</span></label>
            <label class="perm-node"><input type="checkbox"><span>备注</span></label>
          </div>
        </div></div>
        <div class="card-footer dialog-actions" style="justify-content:flex-end"><button class="btn btn-primary"><i data-lucide="save"></i> 保存设置</button></div></div>` },
      { html: `
        <div class="card"><div class="card-header"><div class="card-title"><i data-lucide="scan-face"></i> 人脸识别设置</div><span class="text-muted">打卡与登录校验</span></div>
        <div class="card-body"><div class="perm-groups">
          <div class="perm-group"><div class="perm-group-title">打卡校验</div>
            <label class="perm-node"><input type="checkbox" checked><span>外勤打卡需人脸识别</span></label>
            <label class="perm-node"><input type="checkbox"><span>巡房签到需人脸识别</span></label>
          </div>
          <div class="perm-group"><div class="perm-group-title">登录校验</div>
            <label class="perm-node"><input type="checkbox"><span>新设备登录需人脸识别</span></label>
            <label class="perm-node"><input type="checkbox" checked><span>敏感操作二次校验</span></label>
          </div>
        </div></div>
        <div class="card-footer dialog-actions" style="justify-content:flex-end"><button class="btn btn-primary"><i data-lucide="save"></i> 保存设置</button></div></div>` },
      { layout: 'table', columns: [
        { label: '时间', key: 'createdAt' }, { label: '操作人', key: 'operator' }, { label: '模块', key: 'module' },
        { label: '动作', key: 'action' }, { label: '对象', key: 'target' }, { label: '详情', key: 'detail' }
      ], rows: [
        { createdAt: '2026-08-16 14:20', operator: '张伟', module: '人员管理', action: '编辑', target: '王晓明', detail: '调整分组 1组 → 2组' },
        { createdAt: '2026-08-15 09:05', operator: '系统', module: '人员管理', action: '待分配提醒', target: '陈晓', detail: '二维码邀请待审核超 24h' }
      ], pagination: { total: 126, from: 1, to: 2, current: 1 } }
    ],
    pagination: { total: 38, from: 1, to: 3, current: 1 }
  }
});
