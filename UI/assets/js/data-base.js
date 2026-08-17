window.PROTOTYPE_PAGES = {};

Object.assign(window.PROTOTYPE_PAGES, {
  rent: {
    id: 'rent', title: '租房管理', group: '房屋管理',
    description: '套 → 房间两层结构，支持整租与合租房源全生命周期',
    note: '原型演示：视图切换、状态 Tab、综合查询、批量操作和行级操作均可点击；数据权限按当前演示角色切换。',
    actions: [
      { label: '偏好设置', icon: 'settings-2', permission: 'rent:update' },
      { label: '登记房东', icon: 'user-plus', permission: 'rent:create' },
      { label: '删图模式', icon: 'image-off', toggle: 'no-image' },
      { label: '帮助', icon: 'circle-help' },
      { label: '新房源录入', icon: 'plus', variant: 'btn-primary', permission: 'rent:create', href: 'house-wizard.html?type=rent' }
    ],
    batchActions: [
      { label: '批量录入租客' }, { label: '批量录入房间价格' }, { label: '批量导入账单' },
      { label: '批量录入特色标签' }, { label: '批量录入合租房源' }
    ],
    summary: [
      { label: '合计', value: '153 间' }, { label: '未租', value: '59 间' },
      { label: '已租', value: '94 间' }, { label: '已定', value: '18 间' }, { label: '冻结', value: '6 间' }
    ],
    tabs: [{ label: '房间信息' }, { label: '房东信息' }],
    typeTabs: [{ label: '整租', count: 96 }, { label: '合租', count: 57 }],
    statusTabs: [{ label: '全部', count: 153 }, { label: '可租', count: 72 }, { label: '已定', count: 18 }, { label: '冻结', count: 6 }],
    views: ['默认视图', '公司视图', '新建视图'],
    filters: [
      { label: '综合查询', placeholder: '房源编号/物业地址/门牌号/租客姓名/租客电话/同住人/业务员/管家' },
      { label: '排序方式', type: 'select', options: ['按物业排序', '按时间排序'] },
      { label: '店面', type: 'select', options: ['张江店', '浦东店', '联洋店'] },
      { label: '门牌号', placeholder: '5幢1单元302' },
      { label: '房源编号', placeholder: 'F202608001' },
      { label: '业务员', type: 'select', options: ['李芳', '赵强', '王晓明'] },
      { label: '管家', type: 'select', options: ['王晓明', '李芳', '赵强'] },
      { label: '缴费方式', type: 'select', options: ['月付', '二月付', '季付', '四月付', '半年付', '年付', '二年付', '三年付', '四年付', '全额支付', '不规则缴费'] },
      { label: '租赁期限', type: 'select', options: ['1个月', '2个月', '3个月', '半年', '1年', '2年', '3年', '其他'] },
      { label: '户型', type: 'select', options: ['1室', '2室', '3室', '4室', '5室及以上'] },
      { label: '区域', type: 'select', options: ['浦东', '闵行', '长宁', '静安'] },
      { label: '物业地址', placeholder: '汤臣豪园' },
      { label: '楼栋', placeholder: '3幢' },
      { label: '单元', placeholder: '1单元' },
      { label: '运营状态', type: 'select', options: ['正常', '配置脏房'] },
      { label: '业务状态', type: 'select', options: ['待收款', '账单逾期', '已到期', '有欠款', '水电欠费', '快到期'] }
    ],
    layout: 'cards',
    cards: [
      {
        title: '汤臣豪园 3幢1单元301 · 整租', thumb: true, tags: [{ label: '已租', type: 'green' }, { label: '缴齐', type: 'blue' }],
        fields: [['租客', '王先生'], ['状态', '已租'], ['租价', '¥6,800'], ['定价', '¥6,800'], ['户型', '2室1厅'], ['到期', '2027-08-16'], ['缴费', '季付'], ['合同期限', '1年'], ['业务员', '李芳'], ['管家', '王晓明']],
        actions: [{ label: '详情' }, { label: '去房东' }, { label: '退房登记', permission: 'rent:update' }, { label: '维修' }, { label: '配置' }]
      },
      {
        title: '天赋领墅 2幢2单元601 · 合租套', thumb: true, tags: [{ label: '合租', type: 'blue' }, { label: '套利润 -¥500', type: 'red' }],
        fields: [['房东', '李先生'], ['房东收租', '¥5,000'], ['户型', '3室2厅'], ['到期', '2031-08-13'], ['合同期限', '5年'], ['免租期', '20天'], ['本套租客租金', '¥4,500'], ['本套押金', '¥9,000'], ['本套利润', '-¥500'], ['店面', '张江店'], ['业务员', '赵强'], ['管家', '王晓明']],
        rooms: [
          { fields: [['房间', '1号房 / 主卧独卫'], ['状态', '空 15天'], ['定价', '¥2,300'], ['租客', '—'], ['到期', '—']] },
          { fields: [['房间', '2号房 / 次卧'], ['状态', '已租'], ['定价', '¥2,000'], ['租客', '周女士'], ['到期', '2027-03-12']] },
          { fields: [['房间', '3号房 / 暗隔'], ['状态', '配置'], ['定价', '¥1,800'], ['租客', '—'], ['装修', '地板更换中']] }
        ],
        actions: [{ label: '详情' }, { label: '批量改价', permission: 'rent:update' }, { label: '登记房东', permission: 'rent:create' }, { label: '帮助' }]
      }
    ],
    pagination: { total: 153, from: 1, to: 2, current: 1 },
    tabPanels: [
      null,
      { layout: 'cards', cards: [
        {
          title: '李先生 · 天赋领墅 2幢2单元601', thumb: true, tags: [{ label: '房东', type: 'orange' }, { label: '在约', type: 'blue' }],
          fields: [['手机号', '136****5678'], ['身份证', '310***********5678'], ['房东收租', '¥5,000/月'], ['合同期限', '5年'], ['到期', '2031-08-13'], ['免租期', '20天'], ['付款方式', '月付'], ['业务员', '赵强'], ['管家', '王晓明'], ['店面', '张江店']],
          actions: [{ label: '房东详情' }, { label: '合同' }, { label: '账单' }, { label: '短信房东' }]
        },
        {
          title: '张女士 · 星光佳园 5幢702', thumb: true, tags: [{ label: '房东', type: 'orange' }, { label: '已签约', type: 'green' }],
          fields: [['手机号', '138****2211'], ['身份证', '310***********2211'], ['房东收租', '¥7,800/月'], ['合同期限', '3年'], ['到期', '2028-08-09'], ['免租期', '15天'], ['付款方式', '季付'], ['业务员', '李芳'], ['管家', '王晓明'], ['店面', '浦东店']],
          actions: [{ label: '房东详情' }, { label: '合同' }, { label: '账单' }, { label: '续约提醒' }]
        }
      ], pagination: { total: 46, from: 1, to: 2, current: 1 } }
    ]
  },

  sale: {
    id: 'sale', title: '售房管理', group: '房屋管理',
    description: '二手房出售房源筛选、质量、跟进与生命周期管理',
    note: '原型演示：小区 → 楼栋 → 单元 → 房号四级级联筛选；卡片操作按角色动态展示。',
    actions: [
      { label: '偏好设置', icon: 'settings-2', permission: 'sale:update' },
      { label: '列表自定义', icon: 'columns-3', permission: 'sale:update' },
      { label: '删图模式', icon: 'image-off', toggle: 'no-image' },
      { label: '操作日志', icon: 'history' },
      { label: '新房源录入', icon: 'plus', variant: 'btn-primary', permission: 'sale:create', href: 'house-wizard.html?type=sale' }
    ],
    tabs: [{ label: '售房房源', count: 326 }, { label: '成交房源', count: 48 }, { label: '我的房源', count: 38 }, { label: '我的预录入房源', count: 12 }, { label: '我的收藏', count: 9 }],
    statusTabs: [{ label: '全部' }, { label: '今日新上' }, { label: '3日新上' }, { label: '已验真' }, { label: '待验真' }, { label: '速销' }, { label: '议价' }],
    filters: [
      { label: '城市', type: 'select', options: ['上海'] }, { label: '范围', type: 'select', options: ['全部', '门店', '我的'] },
      { label: '用途', type: 'select', options: ['普通住宅', '别墅', '商住两用', '车位', '商铺', '写字楼', '厂房', '土地'] },
      { label: '小区', placeholder: '名称/别名/地址' }, { label: '楼栋', placeholder: '楼栋' }, { label: '单元', placeholder: '单元' }, { label: '房号', placeholder: '房号' },
      { label: '房源码', placeholder: 'S202608001' }, { label: '栋座', placeholder: '栋座' }, { label: '维护人', placeholder: '姓名/手机号' }, { label: '创建人', placeholder: '姓名/手机号' },
      { label: '门店支队', type: 'select', options: ['张江店', '浦东店'] }, { label: '上架', type: 'select', options: ['上架', '下架'] }, { label: '房源状态', type: 'select', options: ['今日新上', '3日新上', '上架', '下架'] },
      { label: '业主电话', placeholder: '138****5678' }, { label: '备用电话', placeholder: '备用手机号' }, { label: '品牌', type: 'select', options: ['优居', '加盟品牌'] }, { label: '验真', type: 'select', options: ['已验真', '待验真', '无需验真'] },
      { label: '首付', type: 'range', rangeType: 'number', unit: '万' }, { label: '底价', type: 'range', rangeType: 'number', unit: '万' },
      { label: '售价', type: 'range', rangeType: 'number', unit: '万' }, { label: '质量分', type: 'range', rangeType: 'number', unit: '分' },
      { label: '面积', type: 'range', rangeType: 'number', unit: '㎡' }, { label: '楼层', type: 'range', rangeType: 'number', unit: '层' },
      { label: '未跟进天数', placeholder: '天' }, { label: '调价幅度', placeholder: '%' },
      { label: '发布日期', type: 'range', rangeType: 'date' }, { label: '新增日期', type: 'range', rangeType: 'date' },
      { label: '更新价格', type: 'range', rangeType: 'date' }, { label: '下架日期', type: 'range', rangeType: 'date' },
      { label: '速销日期', type: 'range', rangeType: 'date' }, { label: '议价日期', type: 'range', rangeType: 'date' },
      { label: '验真剩余', type: 'range', rangeType: 'number', unit: '小时' }, { label: '建筑年代', placeholder: '年' }, { label: '来源（多选）', type: 'select', options: ['业主委托', '同行', '个人', '网络'] },
      { label: '户型', type: 'select', options: ['1室', '2室', '3室', '4室+'] }, { label: '室', type: 'select', options: ['不限', '1', '2', '3', '4', '5+'] }, { label: '厅', type: 'select', options: ['不限', '0', '1', '2', '3'] }, { label: '卫', type: 'select', options: ['不限', '1', '2', '3'] }, { label: '阳', type: 'select', options: ['不限', '0', '1', '2'] },
      { label: '朝向', type: 'select', options: ['东', '南', '西', '北', '南北', '东南', '西南', '东北', '西北', '东西'] },
      { label: '业主行为', type: 'select', options: ['在售', '出租', '自住', '闲置'] }, { label: '质量等级', type: 'select', options: ['S', 'A', 'B', 'C', 'D'] },
      { label: '全城联卖', type: 'select', options: ['是', '否'] }
    ],
    sorts: ['发布时间', '新增时间', '总价', '单价', '面积', '楼层', '跟进时间', '房源质量', '更多'],
    filterQuick: 4,
    layout: 'cards',
    cards: [
      {
        title: '仁恒河滨城 15-2301', thumb: true, tags: [{ label: '全城联卖', type: 'blue' }, { label: '满五唯一', type: 'green' }, { label: '验真', type: 'green' }, { label: 'VR房勘', type: 'purple' }, { label: '议价', type: 'orange' }, { label: '委托书', type: 'gray' }],
        fields: [['户型面积', '4室2厅 156㎡ 南北 精装 15/28F'], ['总价单价', '1,680万 / 107,692元/㎡'], ['用途', '普通住宅'], ['状态', '3日新上'], ['质量', '42分 B级'], ['跟进', '今天 15:23 查看跟进'], ['发布时间', '08-15 09:12'], ['维护人', '刘思思']],
        actions: [{ label: '详情' }, { label: '查看房号' }, { label: '修改', permission: 'sale:update' }, { label: '跟进' }, { label: '验真' }, { label: '议价' }]
      },
      {
        title: '世茂滨江花园 2-1802', thumb: true, tags: [{ label: '满二', type: 'green' }, { label: '视频房勘', type: 'purple' }, { label: '近地铁', type: 'blue' }, { label: '速销', type: 'orange' }],
        fields: [['户型面积', '3室2厅 210㎡ 南 高区 23/40F'], ['总价单价', '2,350万 / 111,905元/㎡'], ['用途', '普通住宅'], ['状态', '上架'], ['质量', '86分 A级'], ['跟进', '1天未跟进'], ['发布时间', '08-13 20:40'], ['维护人', '赵强']],
        actions: [{ label: '详情' }, { label: '查看房号' }, { label: '上架/下架', permission: 'sale:update' }, { label: '转维护人' }, { label: '标记' }]
      }
    ],
    pagination: { total: 326, from: 1, to: 2, current: 1 }
  },

  'reserve-house': {
    id: 'reserve-house', title: '储备房源', group: '房屋管理',
    description: '未签房东合同的潜在房源与拿房签约流转',
    actions: [
      { label: '偏好设置', icon: 'settings-2' }, { label: '列表自定义', icon: 'columns-3' },
      { label: '操作日志', icon: 'history' }, { label: '使用说明', icon: 'circle-help' },
      { label: '导出房源', icon: 'download' },
      { label: '录入房源', icon: 'plus', variant: 'btn-primary', permission: 'reserve:create', href: 'house-wizard.html?type=reserve' }
    ],
    tabs: [{ label: '全部房源', count: 64 }, { label: '我的房源', count: 23 }, { label: '录入房源' }],
    filters: [
      { label: '店面', type: 'select', options: ['张江店', '浦东店'] }, { label: '分组', type: 'select', options: ['1组', '2组', '转移1', '转移2'] },
      { label: '房源状态', type: 'select', options: ['未租', '已租', '已售', '暂不租', '已拿房成交', '已签约', '已交定'] },
      { label: '门牌号', placeholder: '门牌号' }, { label: '综合查询', placeholder: '请输入文字进行搜索' }
    ],
    layout: 'cards',
    cards: [
      {
        title: '顺通家园 2幢1单元101', tags: [{ label: '未租', type: 'orange' }, { label: '私盘', type: 'red' }, { label: '未留钥匙', type: 'gray' }],
        fields: [['店面/分组', '张江店 1组'], ['区域', '浦东'], ['物业地址', '顺通家园'], ['商圈', '张江'], ['门牌号', '2幢1单元101'], ['户型', '1室0厅0厨1卫'], ['面积', '58㎡'], ['装修', '简装房'], ['业主', '啊先生【年轻男性】'], ['报价', '¥5,600'], ['来源', '58同城'], ['业务员', '赵强'], ['录入', '2026-08-12 / 赵强'], ['跟进', '未跟进'], ['状态', '未租']],
        actions: [{ label: '查看' }, { label: '修改房源', permission: 'reserve:update' }, { label: '完善房源' }, { label: '拿房签约' }, { label: '私盘转公盘' }, { label: '短信房东' }]
      },
      {
        title: '星光佳园 5幢702', tags: [{ label: '已签约', type: 'green' }, { label: '公盘', type: 'blue' }, { label: '留钥匙', type: 'gray' }],
        fields: [['店面/分组', '浦东店 2组'], ['区域', '浦东'], ['物业地址', '星光佳园'], ['商圈', '金桥'], ['门牌号', '5幢702'], ['户型', '2室1厅0厨1卫'], ['面积', '89㎡'], ['装修', '精装房'], ['业主', '张女士【30-50岁】'], ['报价', '¥7,800'], ['来源', '网上联系'], ['业务员', '李芳'], ['录入', '2026-08-10 / 李芳'], ['跟进', '2026-08-15【王晓明】'], ['状态', '已签约']],
        actions: [{ label: '查看' }, { label: '修改房源', permission: 'reserve:update' }, { label: '完善房源' }, { label: '删除房源' }, { label: '批量修改业务员' }]
      }
    ],
    pagination: { total: 64, from: 1, to: 2, current: 1 }
  },

  'reserve-client': {
    id: 'reserve-client', title: '储备客源', group: '房屋管理',
    description: '求租 / 求购客源储备、跟进与跨模块流转',
    actions: [
      { label: '偏好设置', icon: 'settings-2' }, { label: '列表自定义', icon: 'columns-3' }, { label: '使用说明', icon: 'circle-help' },
      { label: '导出客源', icon: 'download' },
      { label: '录入求租', icon: 'plus', variant: 'btn-primary', permission: 'client:create' }
    ],
    tabs: [{ label: '求租', count: 126 }, { label: '求购', count: 43 }, { label: '我的客源', count: 38 }, { label: '录入求租' }],
    filters: [
      { label: '店面', type: 'select', options: ['张江店', '浦东店'] }, { label: '客户姓氏', placeholder: '张' },
      { label: '租赁用途', type: 'select', options: ['自住', '办公', '宿舍', '库房', '开麻将馆', '开饭店'] },
      { label: '客户状态', type: 'select', options: ['未租', '已租', '暂不租', '电话未接听', '转到合租', '转到整租', '已定', '转到集中'] },
      { label: '客户性质', type: 'select', options: ['公客', '私客'] }
    ],
    layout: 'cards',
    cards: [
      {
        title: '张叔叔 · 求租', tags: [{ label: '公客', type: 'blue' }, { label: '未租', type: 'orange' }, { label: '一般', type: 'gray' }],
        fields: [['店面', '张江店'], ['求租位置', '阳光星苑2幢1单元0101附近'], ['求租类型', '合租'], ['需求户型', '不限'], ['面积区间', '30-50㎡'], ['价格区间', '¥2,000-3,000'], ['来源', '网上联系'], ['用途', '自住'], ['业务员', '赵强'], ['客源归属', '公客'], ['跟进', '赵强 2026-08-15 17:28'], ['状态', '未租'], ['数据来源', '求租录入'], ['登记时间', '2026-08-10']],
        actions: [{ label: '查看' }, { label: '跟进' }, { label: '转签约' }, { label: '转到合租' }, { label: '转到整租' }, { label: '加入黑名单' }]
      },
      {
        title: '王女士 · 求购', tags: [{ label: '私客', type: 'red' }, { label: '已定', type: 'green' }, { label: '着急', type: 'orange' }],
        fields: [['店面', '联洋店'], ['求购区域', '联洋板块'], ['需求户型', '3房'], ['面积区间', '120-150㎡'], ['价格区间', '¥1,400-1,600万'], ['来源', '中介介绍'], ['用途', '自住'], ['业务员', '刘思思'], ['客源归属', '私客'], ['跟进', '今天 10:20'], ['状态', '已定'], ['数据来源', '带看录入'], ['登记时间', '2026-08-09']],
        actions: [{ label: '查看' }, { label: '跟进' }, { label: '转签约' }, { label: '短信联系' }]
      }
    ],
    pagination: { total: 169, from: 1, to: 2, current: 1 }
  },

  customer: {
    id: 'customer', title: '客户管理', group: '房屋管理',
    description: '租客、买家、业主与储备客源统一视图',
    actions: [{ label: '导出', icon: 'download' }, { label: '批量跟进', icon: 'messages-square' }, { label: '新增客户', icon: 'plus', variant: 'btn-primary', permission: 'client:create' }],
    tabs: [{ label: '全部', count: 526 }, { label: '租客', count: 312 }, { label: '买家', count: 86 }, { label: '业主', count: 92 }, { label: '储备客源', count: 36 }],
    filters: [
      { label: '客户类型', type: 'select', options: ['全部', '租客', '买家', '业主', '储备客源'] }, { label: '姓名/手机号', placeholder: '客户姓名/手机号' },
      { label: '店面', type: 'select', options: ['全部', '张江店', '浦东店', '联洋店'] }, { label: '客户状态', type: 'select', options: ['全部', '在租', '已定', '已退租', '在约', '暂不租'] },
      { label: '来源渠道', type: 'select', options: ['全部', '58同城', '安居客', '闲鱼', '中介介绍', '上门客', '朋友介绍'] }, { label: '跟进时间', type: 'range', rangeType: 'date' },
      { label: '来源', type: 'select', options: ['签约转化', '成交转化', '房源录入', '储备转入'] }, { label: '黑名单', type: 'select', options: ['否', '是'] }
    ],
    filterQuick: 4,
    matchPanel: {
      client: '王女士（求购 · 3房 · 联洋板块 · 1,400-1,600万）',
      rule: '按需求户型 / 板块 / 价格区间自动匹配在售房源',
      matches: [
        { title: '仁恒河滨城 15-2301', rate: 96, meta: '4室2厅 · 156㎡ · 1,680万 · 联洋', reason: '板块一致，面积与总价略超上限，满五唯一' },
        { title: '联洋花园 8-1202', rate: 92, meta: '3室2厅 · 128㎡ · 1,480万 · 联洋', reason: '户型、板块、价格区间全部命中' },
        { title: '水清木华 3-801', rate: 85, meta: '3室2厅 · 135㎡ · 1,560万 · 联洋', reason: '价格区间内，楼层与朝向待客户确认' }
      ]
    },
    layout: 'cards',
    cards: [
      {
        title: '王小明 · 租客', tags: [{ label: '租客', type: 'blue' }, { label: '在租', type: 'green' }],
        fields: [['手机号', '138****1234'], ['身份证', '310***********1234'], ['关联房源', '汤臣豪园3-301'], ['合同到期', '2027-08-16'], ['状态', '在租'], ['来源', '签约转化'], ['业务员', '李芳'], ['最近跟进', '08-15']],
        actions: [{ label: '查看' }, { label: '跟进' }, { label: '转签约', permission: 'client:create' }, { label: '加入黑名单' }]
      },
      {
        title: '王女士 · 买家', tags: [{ label: '买家', type: 'purple' }, { label: '已定', type: 'blue' }],
        fields: [['手机号', '139****7788'], ['身份证', '310***********7788'], ['关联房源', '仁恒河滨城15-2301'], ['合同到期', '2026-09-30'], ['状态', '已定'], ['来源', '成交转化'], ['业务员', '刘思思'], ['最近跟进', '今天']],
        actions: [{ label: '查看' }, { label: '匹配房源' }, { label: '一键带看' }, { label: '跟进' }]
      },
      {
        title: '李先生 · 业主', tags: [{ label: '业主', type: 'orange' }, { label: '在约', type: 'blue' }],
        fields: [['手机号', '136****5678'], ['身份证', '310***********5678'], ['关联房源', '天赋领墅2-601'], ['合同到期', '2031-08-13'], ['状态', '在约'], ['来源', '房源录入'], ['业务员', '赵强'], ['最近跟进', '昨天']],
        actions: [{ label: '查看' }, { label: '跟进' }, { label: '短信联系' }]
      },
      {
        title: '周先生 · 租客', tags: [{ label: '租客', type: 'blue' }, { label: '黑名单', type: 'red' }],
        fields: [['手机号', '135****8899'], ['身份证', '310***********8899'], ['关联房源', '—'], ['合同到期', '—'], ['状态', '已退租'], ['来源', '储备转入'], ['业务员', '赵强'], ['最近跟进', '08-02']],
        actions: [{ label: '查看' }, { label: '移出黑名单' }, { label: '跟进' }]
      }
    ],
    pagination: { total: 526, from: 1, to: 4, current: 1 }
  },

  community: {
    id: 'community', title: '小区管理', group: '房屋管理',
    description: '小区、楼栋、单元、楼层、房号五级地址库',
    note: '原型演示：§5.6.1 按区域分组卡片视图；卡片字段与地址库 12 列等价，操作保留查看楼栋 / 编辑 / 删除。',
    actions: [{ label: '批量导入', icon: 'upload' }, { label: '导出', icon: 'download' }, { label: '操作日志', icon: 'history' }, { label: '新增小区', icon: 'plus', variant: 'btn-primary' }],
    filters: [
      { label: '城市', type: 'select', options: ['上海'] }, { label: '区域', type: 'select', options: ['浦东', '闵行', '长宁', '静安'] },
      { label: '小区名称', placeholder: '小区名称' }, { label: '别名', placeholder: '别名' }
    ],
    layout: 'cards',
    cardGroups: [
      { group: '浦东', cards: [
        {
          title: '汤臣豪园', tags: [{ label: '浦东', type: 'blue' }, { label: '张江', type: 'gray' }],
          fields: [['别名', '汤臣豪园一期'], ['城市', '上海'], ['区域', '浦东'], ['商圈', '张江'], ['详细地址', '晨晖路825弄'], ['经纬度', '121.586,31.204'], ['楼栋', '18'], ['单元', '36'], ['房间', '812'], ['当前房源', '46']],
          actions: [{ label: '查看楼栋' }, { label: '编辑' }, { label: '删除' }]
        },
        {
          title: '仁恒河滨城', tags: [{ label: '浦东', type: 'blue' }, { label: '联洋', type: 'gray' }],
          fields: [['别名', '仁恒滨江园'], ['城市', '上海'], ['区域', '浦东'], ['商圈', '联洋'], ['详细地址', '芳甸路333弄'], ['经纬度', '121.558,31.223'], ['楼栋', '12'], ['单元', '24'], ['房间', '526'], ['当前房源', '28']],
          actions: [{ label: '查看楼栋' }, { label: '编辑' }, { label: '删除' }]
        },
        {
          title: '天赋领墅', tags: [{ label: '浦东', type: 'blue' }, { label: '张江', type: 'gray' }],
          fields: [['别名', '—'], ['城市', '上海'], ['区域', '浦东'], ['商圈', '张江'], ['详细地址', '李冰路800弄'], ['经纬度', '121.592,31.211'], ['楼栋', '9'], ['单元', '18'], ['房间', '216'], ['当前房源', '12']],
          actions: [{ label: '查看楼栋' }, { label: '编辑' }, { label: '删除' }]
        },
        {
          title: '世茂滨江花园', tags: [{ label: '浦东', type: 'blue' }, { label: '陆家嘴', type: 'gray' }],
          fields: [['别名', '世茂滨江'], ['城市', '上海'], ['区域', '浦东'], ['商圈', '陆家嘴'], ['详细地址', '潍坊西路1弄'], ['经纬度', '121.514,31.228'], ['楼栋', '7'], ['单元', '14'], ['房间', '980'], ['当前房源', '19']],
          actions: [{ label: '查看楼栋' }, { label: '编辑' }, { label: '删除' }]
        }
      ] },
      { group: '闵行', cards: [
        {
          title: '星光佳园', tags: [{ label: '闵行', type: 'purple' }, { label: '金桥', type: 'gray' }],
          fields: [['别名', '—'], ['城市', '上海'], ['区域', '闵行'], ['商圈', '金桥'], ['详细地址', '金平路558弄'], ['经纬度', '121.401,31.182'], ['楼栋', '6'], ['单元', '12'], ['房间', '302'], ['当前房源', '8']],
          actions: [{ label: '查看楼栋' }, { label: '编辑' }, { label: '删除' }]
        }
      ] },
      { group: '长宁', cards: [
        {
          title: '顺通家园', tags: [{ label: '长宁', type: 'orange' }, { label: '中山公园', type: 'gray' }],
          fields: [['别名', '—'], ['城市', '上海'], ['区域', '长宁'], ['商圈', '中山公园'], ['详细地址', '长宁路1135弄'], ['经纬度', '121.414,31.219'], ['楼栋', '4'], ['单元', '8'], ['房间', '256'], ['当前房源', '6']],
          actions: [{ label: '查看楼栋' }, { label: '编辑' }, { label: '删除' }]
        }
      ] },
      { group: '静安', cards: [
        {
          title: '阳光星苑', tags: [{ label: '静安', type: 'green' }, { label: '大宁', type: 'gray' }],
          fields: [['别名', '—'], ['城市', '上海'], ['区域', '静安'], ['商圈', '大宁'], ['详细地址', '广中西路99弄'], ['经纬度', '121.446,31.273'], ['楼栋', '2'], ['单元', '4'], ['房间', '128'], ['当前房源', '3']],
          actions: [{ label: '查看楼栋' }, { label: '编辑' }, { label: '删除' }]
        }
      ] }
    ],
    pagination: { total: 36, from: 1, to: 7, current: 1 }
  },

  'house-wizard': {
    id: 'house-wizard', title: '统一房源录入', group: '房屋管理',
    description: '租房 / 售房 / 储备房源共用的 4 步向导',
    note: '原型演示：步骤、标签、模板、业主校验和黑名单预警均为交互示意，不执行真实提交。',
    defaultType: 'rent',
    steps: ['楼盘选择', '基本信息', '特色信息', '完成'],
    types: {
      rent: { label: '租房', description: '在售房字段基础上增加月租、押付、租期、出租方式和缴费方式', backHref: 'rent.html' },
      sale: { label: '售房', description: '价格、户型、面积、朝向、税费、来源、建筑年代与智能标题', backHref: 'sale.html' },
      reserve: { label: '储备', description: '精简字段：地址、门牌、户型、报价、来源、钥匙与盘源', backHref: 'reserve-house.html' }
    }
  }
});
