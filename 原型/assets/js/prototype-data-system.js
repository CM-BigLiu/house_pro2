Object.assign(window.PROTOTYPE_PAGES, {
  role: {
    id: 'role', title: '角色管理', group: '系统管理',
    description: '角色、继承、菜单权限、操作权限与数据范围配置',
    note: '权限模型：角色 + 数据范围 + 权限点；数据范围枚举为 self / group / store / company / assigned / custom。',
    actions: [
      { label: '复制角色', icon: 'copy' }, { label: '权限预览', icon: 'eye' }, { label: '保存配置', icon: 'save', variant: 'btn-primary' },
      { label: '新增角色', icon: 'plus', variant: 'btn-primary' }
    ],
    filters: [
      { label: '角色名称', placeholder: '搜索角色' }, { label: '数据范围', type: 'select', options: ['全部', 'self', 'group', 'store', 'company', 'assigned', 'custom'] },
      { label: '状态', type: 'select', options: ['启用', '停用'] }
    ],
    layout: 'split', layoutType: 'table',
    tree: {
      title: '菜单 / 操作权限树', nodes: [
        { label: '首页', active: true }, { label: '房屋管理', children: [{ label: '租房管理', children: [{ label: '新增 / 编辑 / 退房 / 导出 / 审批' }] }, { label: '售房管理', children: [{ label: '录入 / 修改 / 上下架 / 导出' }] }] },
        { label: '财务管理', children: [{ label: '账单', children: [{ label: '修改 / 作废 / 收款 / 开票' }] }, { label: '代付', children: [{ label: '批量代付 / 审核' }] }] },
        { label: '系统管理', children: [{ label: '角色 / 权限 / 字典 / 人员' }] }
      ]
    },
    columns: [
      { label: '角色名称', key: 'name' }, { label: '角色编码', key: 'code' }, { label: '默认数据范围', key: 'scope' }, { label: '默认可见店面', key: 'stores' },
      { label: '自定义范围', key: 'custom' }, { label: '菜单权限集', key: 'menus' }, { label: '操作权限集', key: 'actions' }, { label: '数据权限覆盖', key: 'overrides' },
      { label: '内置', key: 'builtin' }, { label: '父角色', key: 'parent' }, { label: '状态', key: 'status' }, { label: '创建人/时间', key: 'creator' }, { label: '备注', key: 'remark' }, { label: '操作', key: 'operations' }
    ],
    rows: [
      { name: '超级管理员', code: 'super_admin', scope: 'company', stores: '全部', custom: '—', menus: '全部菜单', actions: '全部操作', overrides: '无', builtin: '是', parent: '—', status: '启用', creator: '系统 / 初始化', remark: '不可删除', operations: [{ label: '编辑' }, { label: '复制' }] },
      { name: '店长', code: 'store_manager', scope: 'store', stores: '本店 + 跨店授权', custom: '—', menus: '业务 + 账单', actions: '审批 / 编辑 / 导出', overrides: '财务报表 company', builtin: '否', parent: 'salesman', status: '启用', creator: '张伟 / 2026-01-12', remark: '继承业务员权限', operations: [{ label: '编辑' }, { label: '复制' }, { label: '删除' }] },
      { name: '管家', code: 'housekeeper', scope: 'group', stores: '本组', custom: 'housekeeper_id = ${self.id}', menus: '房源 / 租客 / 合同', actions: '跟进 / 退房', overrides: '租房 group', builtin: '否', parent: '—', status: '启用', creator: '系统 / 2026-02-08', remark: '本组数据', operations: [{ label: '编辑' }, { label: '复制' }, { label: '删除' }] }
    ],
    pagination: { total: 12, from: 1, to: 3, current: 1 }
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
      title: '23 类字典 / 物业地址库', nodes: [
        { label: 'city 城市', count: 30, active: true, children: [{ label: 'district 区域', count: 200, children: [{ label: 'business_circle 商圈', count: 500 }] }] },
        { label: 'property_type 房屋类型', count: 8 }, { label: 'decoration_level 装修情况', count: 5 }, { label: 'payment_method 缴费方式', count: 11 },
        { label: 'lease_term 租赁期限', count: 8 }, { label: 'room_type 房型', count: 9 }, { label: 'room_status 房间状态', count: 7 },
        { label: 'source_channel 来源', count: 12 }, { label: 'house_status 房源状态', count: 8 }, { label: 'customer_status 客户状态', count: 9 },
        { label: 'identity 欠款身份', count: 7 }, { label: 'billing_category 款项种类', count: 8 }, { label: 'ticket_status 开票状态', count: 6 },
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
    pagination: { total: 38, from: 1, to: 3, current: 1 }
  }
});
