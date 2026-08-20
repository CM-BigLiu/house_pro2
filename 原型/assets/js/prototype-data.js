window.PROTOTYPE_PAGES = {};

Object.assign(window.PROTOTYPE_PAGES, {
  rent: {
    id: 'rent', title: '租房管理', group: '房屋管理',
    description: '套 → 房间两层结构，支持整租与合租房源全生命周期',
    note: '原型演示：视图切换、状态 Tab、综合查询、批量操作和行级操作均可点击；数据权限按当前演示角色切换。',
    actions: [
      { label: '偏好设置', icon: 'settings-2', permission: 'rent:update' },
      { label: '登记房东', icon: 'user-plus', permission: 'rent:create' },
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
        title: '汤臣豪园 3幢1单元301 · 整租', tags: [{ label: '已租', type: 'green' }, { label: '缴齐', type: 'blue' }],
        fields: [['租客', '王先生'], ['状态', '已租'], ['租价', '¥6,800'], ['定价', '¥6,800'], ['户型', '2室1厅'], ['到期', '2027-08-16'], ['缴费', '季付'], ['合同期限', '1年'], ['业务员', '李芳'], ['管家', '王晓明']],
        actions: [{ label: '详情' }, { label: '去房东' }, { label: '退房登记', permission: 'rent:update' }, { label: '维修' }, { label: '配置' }]
      },
      {
        title: '天赋领墅 2幢2单元601 · 合租套', tags: [{ label: '合租', type: 'blue' }, { label: '套利润 -¥500', type: 'red' }],
        fields: [['房东', '李先生'], ['房东收租', '¥5,000'], ['户型', '3室2厅'], ['到期', '2031-08-13'], ['合同期限', '5年'], ['免租期', '20天'], ['本套租客租金', '¥4,500'], ['本套押金', '¥9,000'], ['本套利润', '-¥500'], ['店面', '张江店'], ['业务员', '赵强'], ['管家', '王晓明']],
        rooms: [
          { fields: [['房间', '1号房 / 主卧独卫'], ['状态', '空 15天'], ['定价', '¥2,300'], ['租客', '—'], ['到期', '—']] },
          { fields: [['房间', '2号房 / 次卧'], ['状态', '已租'], ['定价', '¥2,000'], ['租客', '周女士'], ['到期', '2027-03-12']] },
          { fields: [['房间', '3号房 / 暗隔'], ['状态', '配置'], ['定价', '¥1,800'], ['租客', '—'], ['装修', '地板更换中']] }
        ],
        actions: [{ label: '详情' }, { label: '批量改价', permission: 'rent:update' }, { label: '登记房东', permission: 'rent:create' }, { label: '帮助' }]
      }
    ],
    pagination: { total: 153, from: 1, to: 2, current: 1 }
  },

  sale: {
    id: 'sale', title: '售房管理', group: '房屋管理',
    description: '二手房出售房源筛选、质量、跟进与生命周期管理',
    note: '原型演示：小区 → 楼栋 → 单元 → 房号四级级联筛选；卡片操作按角色动态展示。',
    actions: [
      { label: '偏好设置', icon: 'settings-2', permission: 'sale:update' },
      { label: '列表自定义', icon: 'columns-3', permission: 'sale:update' },
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
      { label: '业主电话', placeholder: '138****5678' }, { label: '品牌', type: 'select', options: ['优居', '加盟品牌'] }, { label: '验真', type: 'select', options: ['已验真', '待验真', '无需验真'] },
      { label: '首付最低', placeholder: '万' }, { label: '首付最高', placeholder: '万' }, { label: '底价最低', placeholder: '万' }, { label: '底价最高', placeholder: '万' },
      { label: '质量分最低', placeholder: '分' }, { label: '质量分最高', placeholder: '分' }, { label: '未跟进天数', placeholder: '天' }, { label: '发布日期', type: 'date' },
      { label: '更新价格', type: 'date' }, { label: '新增日期', type: 'date' }, { label: '下架日期', type: 'date' }, { label: '速销起始', type: 'date' }, { label: '速销截止', type: 'date' },
      { label: '议价日期', type: 'date' }, { label: '验真剩余', placeholder: '小时/天' }, { label: '建筑年代', placeholder: '年' }, { label: '来源', type: 'select', options: ['业主委托', '同行', '个人', '网络'] },
      { label: '户型', type: 'select', options: ['1室', '2室', '3室', '4室+'] }, { label: '朝向', type: 'select', options: ['东', '南', '西', '北', '南北'] },
      { label: '业主行为', type: 'select', options: ['在售', '出租', '自住', '闲置'] }, { label: '质量等级', type: 'select', options: ['S', 'A', 'B', 'C', 'D'] },
      { label: '全城联卖', type: 'select', options: ['是', '否'] }, { label: '售价最低', placeholder: '万' }, { label: '售价最高', placeholder: '万' },
      { label: '面积最低', placeholder: '㎡' }, { label: '面积最高', placeholder: '㎡' }, { label: '楼层最低', placeholder: '层' }, { label: '楼层最高', placeholder: '层' }, { label: '调价幅度', placeholder: '%' }
    ],
    views: ['发布时间', '新增时间', '总价', '单价', '面积', '楼层', '跟进时间', '房源质量', '更多'],
    layout: 'cards',
    cards: [
      {
        title: '仁恒河滨城 15-2301', tags: [{ label: '全城联卖', type: 'blue' }, { label: '满五唯一', type: 'green' }, { label: '验真', type: 'green' }, { label: 'VR房勘', type: 'purple' }, { label: '议价', type: 'orange' }, { label: '委托书', type: 'gray' }],
        fields: [['户型面积', '4室2厅 156㎡ 南北 精装 15/28F'], ['总价单价', '1,680万 / 107,692元/㎡'], ['用途', '普通住宅'], ['状态', '3日新上'], ['质量', '42分 B级'], ['跟进', '今天 15:23 查看跟进'], ['发布时间', '08-15 09:12'], ['维护人', '刘思思']],
        actions: [{ label: '详情' }, { label: '查看房号' }, { label: '修改', permission: 'sale:update' }, { label: '跟进' }, { label: '验真' }, { label: '议价' }]
      },
      {
        title: '世茂滨江花园 2-1802', tags: [{ label: '满二', type: 'green' }, { label: '视频房勘', type: 'purple' }, { label: '近地铁', type: 'blue' }, { label: '速销', type: 'orange' }],
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
      { label: '来源', type: 'select', options: ['签约转化', '成交转化', '房源录入', '储备转入'] }, { label: '黑名单', type: 'select', options: ['否', '是'] }
    ],
    layout: 'table',
    columns: [
      { label: '客户姓名', key: 'name' }, { label: '类型', key: 'type' }, { label: '手机号', key: 'mobile' }, { label: '身份证', key: 'idcard' },
      { label: '关联房源', key: 'house' }, { label: '合同到期', key: 'contract' }, { label: '状态', key: 'status' }, { label: '来源', key: 'source' },
      { label: '业务员', key: 'owner' }, { label: '最近跟进', key: 'follow' }, { label: '黑名单', key: 'black' }, { label: '操作', key: 'operations' }
    ],
    rows: [
      { name: '王小明', type: '租客', mobile: '138****1234', idcard: '310***********1234', house: '汤臣豪园3-301', contract: '2027-08-16', status: '在租', source: '签约转化', owner: '李芳', follow: '08-15', black: '否', operations: [{ label: '查看' }, { label: '跟进' }, { label: '转签约' }] },
      { name: '王女士', type: '买家', mobile: '139****7788', idcard: '310***********7788', house: '仁恒河滨城15-2301', contract: '2026-09-30', status: '已定', source: '成交转化', owner: '刘思思', follow: '今天', black: '否', operations: [{ label: '查看' }, { label: '匹配房源' }, { label: '一键带看' }] },
      { name: '李先生', type: '业主', mobile: '136****5678', idcard: '310***********5678', house: '天赋领墅2-601', contract: '2031-08-13', status: '在约', source: '房源录入', owner: '赵强', follow: '昨天', black: '否', operations: [{ label: '查看' }, { label: '跟进' }, { label: '短信联系' }] }
    ],
    pagination: { total: 526, from: 1, to: 3, current: 1 }
  },

  community: {
    id: 'community', title: '小区管理', group: '房屋管理',
    description: '小区、楼栋、单元、楼层、房号五级地址库',
    actions: [{ label: '批量导入', icon: 'upload' }, { label: '导出', icon: 'download' }, { label: '操作日志', icon: 'history' }, { label: '新增小区', icon: 'plus', variant: 'btn-primary' }],
    filters: [
      { label: '城市', type: 'select', options: ['上海'] }, { label: '区域', type: 'select', options: ['浦东', '闵行', '长宁', '静安'] },
      { label: '小区名称', placeholder: '小区名称' }, { label: '别名', placeholder: '别名' }
    ],
    layout: 'split', layoutType: 'table',
    tree: { title: '小区 → 楼栋 → 单元', nodes: [{ label: '汤臣豪园', count: 18, active: true, children: [{ label: '3幢', children: [{ label: '1单元', children: [{ label: '3层', children: [{ label: '301' }] }] }] }] }, { label: '仁恒河滨城', count: 12, children: [{ label: '15幢', children: [{ label: '2单元' }] }] }] },
    columns: [
      { label: '小区名称', key: 'name' }, { label: '别名', key: 'alias' }, { label: '城市', key: 'city' }, { label: '区域', key: 'district' }, { label: '商圈', key: 'area' },
      { label: '详细地址', key: 'address' }, { label: '经纬度', key: 'geo' }, { label: '楼栋', key: 'buildings' }, { label: '单元', key: 'units' }, { label: '房间', key: 'rooms' }, { label: '当前房源', key: 'houses' }, { label: '操作', key: 'operations' }
    ],
    rows: [
      { name: '汤臣豪园', alias: '汤臣豪园一期', city: '上海', district: '浦东', area: '张江', address: '晨晖路825弄', geo: '121.586,31.204', buildings: 18, units: 36, rooms: 812, houses: 46, operations: [{ label: '查看楼栋' }, { label: '编辑' }, { label: '删除' }] },
      { name: '仁恒河滨城', alias: '仁恒滨江园', city: '上海', district: '浦东', area: '联洋', address: '芳甸路333弄', geo: '121.558,31.223', buildings: 12, units: 24, rooms: 526, houses: 28, operations: [{ label: '查看楼栋' }, { label: '编辑' }, { label: '删除' }] }
    ],
    pagination: { total: 36, from: 1, to: 2, current: 1 }
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
