const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const JWT_SECRET = 'house_pro_jwt_secret_key_change_in_production';

// Mock users
const USERS = {
  super_admin: {
    id: 1, name: '超级管理员', mobile: 'super_admin', avatar: '',
    role: 'super_admin', roleName: '超级管理员', dataScope: 'company',
    storeIds: [1,2,3], groupIds: [1,2], assignedStoreIds: [],
    permissions: ['*'],
  },
  boss: {
    id: 2, name: '王老板', mobile: 'boss', avatar: '',
    role: 'company_admin', roleName: '公司管理员', dataScope: 'company',
    storeIds: [1,2,3], groupIds: [1,2], assignedStoreIds: [],
    permissions: ['*'],
  },
  store_manager: {
    id: 3, name: '张店长', mobile: 'store_manager', avatar: '',
    role: 'store_manager', roleName: '店长', dataScope: 'store',
    storeIds: [1], groupIds: [1], assignedStoreIds: [],
    permissions: ['home', 'house', 'house:rent', 'house:sale', 'house:reserve_house', 'house:customer', 'house:community', 'house:blacklist', 'house:checkout', 'house:deposit', 'renting:add', 'renting:edit', 'renting:checkout', 'renting:export', 'renting:approve', 'checkout:list', 'checkout:confirm', 'checkout:export', 'deposit:list', 'deposit:refund', 'deposit:deduct', 'deposit:export', 'sale:add', 'sale:edit', 'sale:changeStatus', 'sale:export', 'reserve:house:add', 'reserve:house:take', 'reserve:house:transfer', 'reserve:house:export', 'reserve:client:add', 'reserve:client:transfer', 'reserve:client:export', 'finance', 'finance:bill', 'finance:flow', 'finance:arrears', 'finance:plan', 'finance:payout'],
  },
  salesman: {
    id: 4, name: '李业务员', mobile: 'salesman', avatar: '',
    role: 'salesman', roleName: '业务员', dataScope: 'self',
    storeIds: [1], groupIds: [1], assignedStoreIds: [],
    permissions: ['home', 'house', 'house:rent', 'house:sale', 'house:reserve_house', 'house:reserve_client', 'house:customer', 'house:community', 'renting:add', 'renting:edit', 'renting:checkout', 'sale:add', 'sale:edit', 'sale:changeStatus', 'sale:export', 'reserve:house:add', 'reserve:house:take', 'reserve:house:transfer', 'reserve:client:add', 'reserve:client:transfer'],
  },
  finance: {
    id: 5, name: '赵财务', mobile: 'finance', avatar: '',
    role: 'finance_manager', roleName: '财务负责人', dataScope: 'company',
    storeIds: [1,2,3], groupIds: [1,2], assignedStoreIds: [],
    permissions: ['home', 'finance', 'finance:bill', 'finance:flow', 'finance:arrears', 'finance:plan', 'finance:payout', 'house:deposit', 'deposit:list', 'deposit:refund', 'deposit:deduct', 'deposit:export'],
  },
  housekeeper: {
    id: 6, name: '周管家', mobile: 'housekeeper', avatar: '',
    role: 'housekeeper', roleName: '管家', dataScope: 'group',
    storeIds: [1], groupIds: [1], assignedStoreIds: [],
    permissions: ['home', 'house', 'house:rent', 'house:reserve_house', 'house:customer', 'house:checkout', 'renting:add', 'renting:edit', 'renting:checkout', 'checkout:list'],
  },
};

// All menus
const ALL_MENUS = [
  { id: 'home', label: '首页', icon: 'layout-dashboard', path: '/home' },
  {
    id: 'house', label: '房屋管理', icon: 'building-2',
    children: [
      { id: 'rent', label: '租房管理', path: '/house/rent', permission: 'house:rent' },
      { id: 'checkout', label: '退租管理', path: '/house/checkout', permission: 'house:checkout' },
      { id: 'deposit', label: '押金管理', path: '/house/deposit', permission: 'house:deposit' },
      { id: 'sale', label: '售房管理', path: '/house/sale', permission: 'house:sale' },
      { id: 'reserve-house', label: '储备房源', path: '/house/reserve-house', permission: 'house:reserve_house' },
      { id: 'reserve-client', label: '储备客源', path: '/house/reserve-client', permission: 'house:reserve_client' },
      { id: 'customer', label: '客户管理', path: '/house/customer', permission: 'house:customer' },
      { id: 'blacklist', label: '黑名单', path: '/house/blacklist', permission: 'house:blacklist' },
      { id: 'community', label: '小区管理', path: '/house/community', permission: 'house:community' },
    ],
  },
  {
    id: 'finance', label: '财务管理', icon: 'banknote',
    children: [
      { id: 'bill', label: '账单', path: '/finance/bill', permission: 'finance:bill' },
      { id: 'daily-account', label: '流水账', path: '/finance/daily-account', permission: 'finance:flow' },
      { id: 'rent-increase', label: '涨价统计', path: '/finance/rent-increase', permission: 'finance:rent_increase' },
      { id: 'profit', label: '公寓利润', path: '/finance/profit', permission: 'finance:profit' },
      { id: 'partner', label: '合伙人', path: '/finance/partner', permission: 'finance:partner' },
      { id: 'income-cost', label: '收入成本', path: '/finance/income-cost', permission: 'finance:income_cost' },
      { id: 'performance', label: '业绩核算', path: '/finance/performance', permission: 'finance:performance' },
      { id: 'accounting', label: '财务核算', path: '/finance/accounting', permission: 'finance:accounting' },
      { id: 'arrears', label: '欠款统计', path: '/finance/arrears', permission: 'finance:arrears' },
      { id: 'plan', label: '收支计划', path: '/finance/plan', permission: 'finance:plan' },
      { id: 'payout', label: '代付管理', path: '/finance/payout', permission: 'finance:payout' },
      { id: 'billing', label: '开票管理', path: '/finance/billing', permission: 'finance:billing' },
    ],
  },
  {
    id: 'system', label: '系统管理', icon: 'settings',
    children: [
      { id: 'role', label: '角色管理', path: '/system/role', permission: 'system:role' },
      { id: 'permission', label: '权限管理', path: '/system/permission', permission: 'system:permission' },
      { id: 'dictionary', label: '字典管理', path: '/system/dictionary', permission: 'system:dictionary' },
      { id: 'employee', label: '人员管理', path: '/system/employee', permission: 'system:employee' },
    ],
  },
];

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ code: 401, message: 'token 已过期' });
  }
}

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { mobile, password } = req.body;
  const user = USERS[mobile];
  if (!user || password !== '123456') {
    return res.json({ code: 401, message: '账号或密码错误' });
  }
  const payload = {
    employeeId: user.id,
    mobile: user.mobile,
    name: user.name,
    storeIds: user.storeIds,
    assignedStoreIds: user.assignedStoreIds,
    groupIds: user.groupIds,
    dataScope: user.dataScope,
    permissions: user.permissions,
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    code: 0,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'),
        avatar: user.avatar || '',
      },
    },
  });
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ code: 0, data: req.user });
});

// GET /api/auth/menus
app.get('/api/auth/menus', authMiddleware, (req, res) => {
  const perms = req.user.permissions;
  const filtered = ALL_MENUS.map((group) => {
    if (group.id === 'home') return group;
    const children = (group.children || []).filter(
      (item) => perms.includes('*') || perms.includes(item.permission)
    );
    return children.length ? { ...group, children } : null;
  }).filter(Boolean);
  res.json({ code: 0, data: filtered });
});

// GET /api/dashboard/overview
app.get('/api/dashboard/overview', authMiddleware, (req, res) => {
  res.json({
    code: 0,
    data: {
      totalRent: { value: '126.8', unit: '万', trend: 12.5, trendLabel: '较上月' },
      totalSale: { value: '89.3', unit: '万', trend: -3.2, trendLabel: '较上月' },
      occupancyRate: { value: '94.2', unit: '%', trend: 2.1, trendLabel: '较上月' },
      renewalRate: { value: '78.5', unit: '%', trend: 5.8, trendLabel: '较上月' },
      totalRevenue: { value: '216.1', unit: '万', trend: 8.6, trendLabel: '较上月' },
    },
  });
});

// GET /api/dashboard/expiry-warnings
app.get('/api/dashboard/expiry-warnings', authMiddleware, (req, res) => {
  res.json({
    code: 0,
    data: [
      { title: '即将到期租客', value: 23, meta: '7天内到期', borderColor: 'red', isOverThreshold: true },
      { title: '逾期未缴费', value: 8, meta: '超期3天以上', borderColor: 'red', isOverThreshold: true },
      { title: '待续约合同', value: 15, meta: '本月到期', borderColor: 'orange' },
      { title: '欠款总额', value: '¥45,200', meta: '累计未缴', borderColor: 'orange' },
      { title: '待退押金', value: 12, meta: '待处理退租', borderColor: 'blue' },
      { title: '智能设备告警', value: 0, meta: '全部正常', borderColor: 'green', isZero: true },
      { title: '房东到期', value: 5, meta: '30天内到期', borderColor: 'red', isOverThreshold: true },
      { title: '房东欠款', value: '¥12,800', meta: '应付未付', borderColor: 'red', isOverThreshold: true },
      { title: '待签房东合同', value: 7, meta: '本月需签约', borderColor: 'orange' },
      { title: '租金调整申请', value: 3, meta: '待审批', borderColor: 'blue' },
      { title: '房东投诉', value: 2, meta: '本月收到', borderColor: 'orange' },
      { title: '设备维修待处理', value: 0, meta: '全部已处理', borderColor: 'green', isZero: true },
    ],
  });
});

// GET /api/dashboard/house-status
app.get('/api/dashboard/house-status', authMiddleware, (req, res) => {
  res.json({
    code: 0,
    data: {
      pieData: [
        { name: '租房中', value: 156, color: '#3b82f6' },
        { name: '待租房', value: 12, color: '#f59e0b' },
        { name: '出售中', value: 28, color: '#10b981' },
        { name: '储备房源', value: 45, color: '#8b5cf6' },
      ],
      validCount: 180,
      frozenCount: 15,
      totalCount: 241,
    },
  });
});

// GET /api/dashboard/large-cards
app.get('/api/dashboard/large-cards', authMiddleware, (req, res) => {
  res.json({
    code: 0,
    data: [
      {
        id: 'avg-diff',
        title: '平均租差',
        stats: [
          { label: '平均售价', value: '¥5,800/㎡', color: '#3b82f6' },
          { label: '平均租金', value: '¥4,500/月', color: '#10b981' },
          { label: '售租比', value: '1:129', color: '#f59e0b', highlight: true },
          { label: '价差', value: '¥1,300', color: '#ef4444', highlight: true },
          { label: '近30天涨幅', value: '+2.3%', trend: 'up' },
        ],
      },
      {
        id: 'renewal',
        title: '续约率/出租率',
        stats: [
          { label: '总房源数', value: 241, color: '#3b82f6' },
          { label: '总出租数', value: 156 },
          { label: '总空置数', value: 12 },
          { label: '续约率', value: '78.5%', progress: 78.5, barColor: '#10b981' },
          { label: '出租率', value: '94.2%', progress: 94.2, barColor: '#3b82f6' },
        ],
      },
      {
        id: 'room-status',
        title: '房间状态',
        stats: [
          { label: '已出租', value: 156, color: '#10b981', percent: 65 },
          { label: '空置', value: 12, color: '#f59e0b', percent: 5 },
          { label: '维修中', value: 8, color: '#f97316', percent: 3.3 },
          { label: '待清洁', value: 15, color: '#6366f1', percent: 6.2 },
          { label: '已冻结', value: 15, color: '#94a3b8', percent: 6.2 },
          { label: '出售中', value: 28, color: '#3b82f6', percent: 11.6 },
        ],
      },
      {
        id: 'finance-flow',
        title: '财务流水',
        stats: [
          { label: '本月收入', value: '¥216,800', color: '#10b981', highlight: true },
          { label: '本月支出', value: '¥89,200', color: '#ef4444' },
          { label: '本月结余', value: '¥127,600', color: '#3b82f6', highlight: true },
          { label: '上月收入', value: '¥198,500' },
          { label: '上月支出', value: '¥82,100' },
          { label: '环比增长', value: '+9.2%', color: '#10b981', trend: 'up' },
        ],
      },
      {
        id: 'deposit-stats',
        title: '押金统计',
        stats: [
          { label: '实收押金', value: '¥312,000', color: '#10b981', highlight: true },
          { label: '待退押金', value: '¥36,000', color: '#ef4444' },
          { label: '已退押金', value: '¥156,000', color: '#64748b', secondHighlight: true },
          { label: '在租押金', value: '¥276,000', color: '#3b82f6' },
        ],
        depositProgress: 88.5,
      },
      {
        id: 'vacancy-warning',
        title: '空置预警',
        stats: [
          { label: '0-7天', value: 3, color: '#10b981', percent: 25 },
          { label: '8-15天', value: 2, color: '#fbbf24', percent: 16.7 },
          { label: '16-30天', value: 4, color: '#fb923c', percent: 33.3 },
          { label: '31-90天', value: 2, color: '#f97316', percent: 16.7 },
          { label: '90天以上', value: 1, color: '#ef4444', percent: 8.3 },
        ],
      },
      {
        id: 'avg-diff2',
        title: '平均租差',
        stats: [
          { label: '最高租金', value: '¥8,500', color: '#10b981' },
          { label: '最低租金', value: '¥2,800', color: '#3b82f6' },
          { label: '中位数', value: '¥4,800', color: '#f59e0b' },
          { label: '差比', value: '3.04x', color: '#8b5cf6', highlight: true },
        ],
      },
      {
        id: 'contract-mgmt',
        title: '合同管理',
        stats: [
          { label: '本月新签', value: 18, color: '#10b981', highlight: true },
          { label: '本月到期', value: 23, color: '#ef4444' },
          { label: '待续约', value: 15, color: '#f59e0b' },
          { label: '有效合同', value: 142, color: '#3b82f6' },
        ],
      },
      {
        id: 'approval',
        title: '行政审批',
        stats: [
          { label: '待审批', value: 7, color: '#f59e0b' },
          { label: '已通过', value: 45, color: '#10b981' },
          { label: '已拒绝', value: 3, color: '#ef4444' },
          { label: '总审批量', value: 55, color: '#3b82f6' },
        ],
      },
      {
        id: 'business-approval',
        title: '业务审批',
        stats: [
          { label: '待审批', value: 5, color: '#f59e0b' },
          { label: '已通过', value: 32, color: '#10b981' },
          { label: '已拒绝', value: 2, color: '#ef4444' },
          { label: '总审批量', value: 39, color: '#3b82f6' },
        ],
      },
      {
        id: 'smart-devices',
        title: '智能设备',
        stats: [
          { label: '智能门锁', value: '156/160', progress: 97.5, barColor: '#10b981' },
          { label: '智能电表', value: '148/160', progress: 92.5, barColor: '#3b82f6' },
          { label: '冷水表', value: '140/160', progress: 87.5, barColor: '#f59e0b' },
          { label: '热水表', value: '120/160', progress: 75, barColor: '#6366f1' },
        ],
      },
      {
        id: 'landlord-missing',
        title: '房东缺失统计',
        stats: [
          { label: '缺身份证', value: 8, color: '#ef4444' },
          { label: '缺合同', value: 5, color: '#f59e0b' },
          { label: '缺房产证', value: 12, color: '#ef4444' },
          { label: '缺银行卡', value: 6, color: '#f59e0b' },
          { label: '信息完整', value: 45, color: '#10b981' },
          { label: '总房东数', value: 76, color: '#3b82f6' },
        ],
      },
      {
        id: 'landlord-status',
        title: '房东状态',
        stats: [
          { label: '活跃', value: 58, color: '#10b981', progress: 76.3, barColor: '#10b981' },
          { label: '不活跃', value: 12, color: '#94a3b8', progress: 15.8, barColor: '#94a3b8' },
          { label: '已停租', value: 6, color: '#ef4444', progress: 7.9, barColor: '#ef4444' },
        ],
      },
      {
        id: 'my-work',
        title: '我的工作',
        stats: [
          { label: '今日待办', value: 5, color: '#ef4444' },
          { label: '待跟客源', value: 12, color: '#f59e0b' },
          { label: '待签合同', value: 8, color: '#3b82f6' },
          { label: '储备房源', value: '45套', color: '#10b981' },
        ],
      },
      {
        id: 'reserve-house-analysis',
        title: '储备房源分析',
        stats: [
          { label: '一室户', value: 12, color: '#3b82f6' },
          { label: '两室一厅', value: 18, color: '#10b981' },
          { label: '三室一厅', value: 10, color: '#f59e0b' },
          { label: '三室两厅', value: 5, color: '#6366f1' },
          { label: '四室及以上', value: 3, color: '#8b5cf6' },
          { label: '商铺', value: 7, color: '#ec4899' },
        ],
      },
      {
        id: 'landlord-renewal',
        title: '房东续约',
        stats: [
          { label: '本月到期房东', value: 5, color: '#ef4444' },
          { label: '已续约', value: 3, color: '#10b981', highlight: true },
          { label: '待续约', value: 2, color: '#f59e0b' },
          { label: '续约率', value: '60%', color: '#3b82f6' },
        ],
      },
      {
        id: 'performance-metrics',
        title: '绩效指标',
        stats: [
          { label: '本月业绩', value: '¥156,800', color: '#10b981', highlight: true },
          { label: '本月目标', value: '¥200,000' },
          { label: '完成率', value: '78.4%', progress: 78.4, barColor: '#3b82f6', highlight: true },
          { label: '排名', value: '#3', color: '#f59e0b' },
        ],
      },
    ],
  });
});

// GET /api/dashboard/announcements
app.get('/api/dashboard/announcements', authMiddleware, (req, res) => {
  res.json({
    code: 0,
    data: {
      tabs: [
        { key: 'all', label: '全部' },
        { key: 'company', label: '公司公告' },
        { key: 'store', label: '门店通知' },
        { key: 'system', label: '系统消息' },
      ],
      list: [
        { id: 1, title: '2026年第三季度工作会议通知', type: 'company', date: '2026-08-25', read: false },
        { id: 2, title: '新版租赁合同模板已上线', type: 'company', date: '2026-08-24', read: false },
        { id: 3, title: '关于调整中介服务费的通知', type: 'company', date: '2026-08-23', read: true },
        { id: 4, title: '张江店月度业绩表彰', type: 'store', date: '2026-08-22', read: false },
        { id: 5, title: '系统维护通知（8月30日凌晨）', type: 'system', date: '2026-08-21', read: true },
        { id: 6, title: '8月消防安全培训安排', type: 'company', date: '2026-08-20', read: true },
        { id: 7, title: '浦东店搬迁公告', type: 'store', date: '2026-08-19', read: false },
        { id: 8, title: '人事变动通知', type: 'company', date: '2026-08-18', read: true },
        { id: 9, title: '财务系统升级至v3.2版本', type: 'system', date: '2026-08-17', read: true },
        { id: 10, title: '2026年度评优方案通知', type: 'company', date: '2026-08-16', read: false },
        { id: 11, title: '第三季度房源盘点要求', type: 'store', date: '2026-08-15', read: true },
        { id: 12, title: '服务器迁移完成通知', type: 'system', date: '2026-08-14', read: true },
      ],
    },
  });
});

// GET /api/dashboard/ranking
app.get('/api/dashboard/ranking', authMiddleware, (req, res) => {
  res.json({
    code: 0,
    data: [
      { rank: 1, name: '张伟', teamName: '张江店一组', score: 98500 },
      { rank: 2, name: '李娜', teamName: '张江店二组', score: 87200 },
      { rank: 3, name: '王强', teamName: '浦东店一组', score: 75600 },
      { rank: 4, name: '刘洋', teamName: '张江店一组', score: 68300 },
      { rank: 5, name: '陈静', teamName: '联洋店一组', score: 61200 },
      { rank: 6, name: '赵磊', teamName: '浦东店二组', score: 55800 },
      { rank: 7, name: '孙悦', teamName: '张江店二组', score: 49500 },
      { rank: 8, name: '周涛', teamName: '联洋店二组', score: 43200 },
      { rank: 9, name: '吴杰', teamName: '浦东店一组', score: 38900 },
      { rank: 10, name: '郑爽', teamName: '张江店一组', score: 34500 },
      { rank: 11, name: '黄磊', teamName: '联洋店一组', score: 31200 },
      { rank: 12, name: '钱峰', teamName: '浦东店二组', score: 28800 },
      { rank: 13, name: '许晴', teamName: '张江店二组', score: 25600 },
      { rank: 14, name: '何雨', teamName: '联洋店二组', score: 22300 },
      { rank: 15, name: '马超', teamName: '浦东店一组', score: 19800 },
      { rank: 16, name: '林芝', teamName: '张江店一组', score: 17500 },
      { rank: 17, name: '胡兵', teamName: '联洋店一组', score: 15200 },
      { rank: 18, name: '高峰', teamName: '浦东店二组', score: 12800 },
      { rank: 19, name: '罗琳', teamName: '张江店二组', score: 10500 },
      { rank: 20, name: '谢芳', teamName: '联洋店二组', score: 8200 },
    ],
  });
});

// Dashboard todo list
let todos = [
  { id: 1, text: '完成本月合同续签', done: false, priority: 'high', date: '2026-08-28' },
  { id: 2, text: '整理张江店客户资料', done: false, priority: 'medium', date: '2026-08-28' },
  { id: 3, text: '回复联洋店装修报价', done: true, priority: 'high', date: '2026-08-27' },
  { id: 4, text: '财务报销审批', done: false, priority: 'urgent', date: '2026-08-28' },
  { id: 5, text: '新员工入职培训安排', done: false, priority: 'medium', date: '2026-08-29' },
];

let todoIdCounter = 6;

app.get('/api/dashboard/todos', authMiddleware, (req, res) => {
  res.json({ code: 0, data: todos });
});

app.post('/api/dashboard/todos', authMiddleware, (req, res) => {
  const { text, priority } = req.body;
  const todo = { id: todoIdCounter++, text, done: false, priority: priority || 'medium', date: new Date().toISOString().slice(0, 10) };
  todos.unshift(todo);
  res.json({ code: 0, data: todo });
});

app.put('/api/dashboard/todos/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.find(t => t.id === id);
  if (!todo) return res.json({ code: 404, message: '待办不存在' });
  Object.assign(todo, req.body);
  res.json({ code: 0, data: todo });
});

app.delete('/api/dashboard/todos/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  todos = todos.filter(t => t.id !== id);
  res.json({ code: 0, data: null });
});

// API path aliases (for frontend dashboard.ts calls)
app.get('/api/dashboard/warnings', authMiddleware, (req, res) => {
  res.json({ code: 0, data: [
    { title: '即将到期', value: 23, label: '7天内到期', color: 'red' },
    { title: '逾期未缴费', value: 8, label: '超期3天以上', color: 'red' },
    { title: '待续约合同', value: 15, label: '本月到期', color: 'orange' },
    { title: '欠款总额', value: 45200, label: '累计未缴', color: 'orange' },
    { title: '待退押金', value: 12, label: '待处理退租', color: 'blue' },
    { title: '智能设备告警', value: 0, label: '全部正常', color: 'green' },
    { title: '房东到期', value: 5, label: '30天内到期', color: 'red' },
    { title: '房东欠款', value: 12800, label: '应付未付', color: 'red' },
    { title: '待签房东合同', value: 7, label: '本月需签约', color: 'orange' },
    { title: '租金调整申请', value: 3, label: '待审批', color: 'blue' },
    { title: '房东投诉', value: 2, label: '本月收到', color: 'orange' },
    { title: '设备维修待处理', value: 0, label: '全部已处理', color: 'green' },
  ]});
});
app.get('/api/dashboard/rankings', authMiddleware, (req, res) => {
  res.json({ code: 0, data: { list: [
    { label: '业绩 TOP', value: 98500, name: '张伟', },
    { label: '带看量 TOP', value: 56, name: '李娜' },
    { label: '签单 TOP', value: 12, name: '王强' },
  ]}});
});

// ============================================================
//  MOCK DATA: 字典数据
// ============================================================
const DICTS = [
  { id: 1, code: 'house_status', name: '房源状态', description: '房源状态字典', enabled: true },
  { id: 2, code: 'room_status', name: '房间状态', description: '房间状态字典', enabled: true },
  { id: 3, code: 'biz_type', name: '业务类型', description: '整租/合租/售房', enabled: true },
  { id: 4, code: 'customer_identity', name: '客户身份', description: '求租/求购', enabled: true },
  { id: 5, code: 'customer_status', name: '客户状态', description: '客源跟进状态', enabled: true },
  { id: 6, code: 'decoration', name: '装修情况', description: '毛坯/简装/精装/豪装', enabled: true },
  { id: 7, code: 'orientation', name: '朝向', description: '东南西北朝向', enabled: true },
  { id: 8, code: 'source_channel', name: '客源渠道', description: '58/贝壳/安居客/抖音/微信/门店/老客户/中介/其他', enabled: true },
  { id: 9, code: 'disk_type', name: '储备盘源类型', description: '住宅/商铺/写字楼/公寓', enabled: true },
  { id: 10, code: 'blacklist_type', name: '黑名单类型', description: '恶意欠款/损坏房屋/扰民/违约/诈骗/其他', enabled: true },
  { id: 11, code: 'payment_method', name: '付款方式', description: '月付/季付/半年付/年付', enabled: true },
  { id: 12, code: 'bill_category', name: '账单类型', description: '租金/押金/物业费/水费/电费/燃气费/其他', enabled: true },
  { id: 13, code: 'employee_status', name: '员工状态', description: '在职/离职/休假', enabled: true },
  { id: 14, code: 'building_type', name: '楼栋类型', description: '多层/高层/小高层/别墅/商铺', enabled: true },
  { id: 15, code: 'decoration_level', name: '装修情况', description: '毛坯/简装/精装/豪装', enabled: true },
  { id: 16, code: 'lease_term', name: '租期', description: '一年/两年/三年/五年', enabled: true },
  { id: 17, code: 'checkout_status', name: '退租状态', description: '待确认/已确认/已完成', enabled: true },
  { id: 18, code: 'deposit_status', name: '押金状态', description: '待退/已退/已扣', enabled: true },
];
const DICT_ITEMS = [
  // house_status
  { id: 1, dictCode: 'house_status', value: 'rented', label: '已出租', sort: 1, enabled: true, isBuiltin: false },
  { id: 2, dictCode: 'house_status', value: 'vacant', label: '待租', sort: 2, enabled: true, isBuiltin: false },
  { id: 3, dictCode: 'house_status', value: 'off_shelf', label: '已下架', sort: 3, enabled: true, isBuiltin: false },
  { id: 4, dictCode: 'house_status', value: 'checkout', label: '已退租', sort: 4, enabled: true, isBuiltin: false },
  // room_status
  { id: 5, dictCode: 'room_status', value: 'rented', label: '已出租', sort: 1, enabled: true, isBuiltin: false },
  { id: 6, dictCode: 'room_status', value: 'vacant', label: '空置', sort: 2, enabled: true, isBuiltin: false },
  { id: 7, dictCode: 'room_status', value: 'reserved', label: '已预定', sort: 3, enabled: true, isBuiltin: false },
  { id: 8, dictCode: 'room_status', value: 'maintenance', label: '维修中', sort: 4, enabled: true, isBuiltin: false },
  // biz_type
  { id: 9, dictCode: 'biz_type', value: 'entire', label: '整租', sort: 1, enabled: true, isBuiltin: false },
  { id: 10, dictCode: 'biz_type', value: 'shared', label: '合租', sort: 2, enabled: true, isBuiltin: false },
  { id: 11, dictCode: 'biz_type', value: 'sale', label: '出售', sort: 3, enabled: true, isBuiltin: false },
  // customer_identity
  { id: 12, dictCode: 'customer_identity', value: 'rent_a', label: '求租 A', sort: 1, enabled: true, isBuiltin: false },
  { id: 13, dictCode: 'customer_identity', value: 'rent_b', label: '求租 B', sort: 2, enabled: true, isBuiltin: false },
  { id: 14, dictCode: 'customer_identity', value: 'buy', label: '求购', sort: 3, enabled: true, isBuiltin: false },
  { id: 15, dictCode: 'customer_identity', value: 'both', label: '租购均可', sort: 4, enabled: true, isBuiltin: false },
  // customer_status
  { id: 16, dictCode: 'customer_status', value: 'pending', label: '待跟进', sort: 1, enabled: true, isBuiltin: false },
  { id: 17, dictCode: 'customer_status', value: 'following', label: '跟进中', sort: 2, enabled: true, isBuiltin: false },
  { id: 18, dictCode: 'customer_status', value: 'done', label: '已成交', sort: 3, enabled: true, isBuiltin: false },
  { id: 19, dictCode: 'customer_status', value: 'invalid', label: '已失效', sort: 4, enabled: true, isBuiltin: false },
  // decoration
  { id: 20, dictCode: 'decoration', value: 'rough', label: '毛坯', sort: 1, enabled: true, isBuiltin: false },
  { id: 21, dictCode: 'decoration', value: 'simple', label: '简装', sort: 2, enabled: true, isBuiltin: false },
  { id: 22, dictCode: 'decoration', value: 'fine', label: '精装', sort: 3, enabled: true, isBuiltin: false },
  { id: 23, dictCode: 'decoration', value: 'luxury', label: '豪装', sort: 4, enabled: true, isBuiltin: false },
  // orientation
  { id: 24, dictCode: 'orientation', value: 'east', label: '东', sort: 1, enabled: true, isBuiltin: false },
  { id: 25, dictCode: 'orientation', value: 'south', label: '南', sort: 2, enabled: true, isBuiltin: false },
  { id: 26, dictCode: 'orientation', value: 'west', label: '西', sort: 3, enabled: true, isBuiltin: false },
  { id: 27, dictCode: 'orientation', value: 'north', label: '北', sort: 4, enabled: true, isBuiltin: false },
  { id: 28, dictCode: 'orientation', value: 'south_north', label: '南北', sort: 5, enabled: true, isBuiltin: false },
  // payment_method
  { id: 29, dictCode: 'payment_method', value: 'monthly', label: '月付', sort: 1, enabled: true, isBuiltin: false },
  { id: 30, dictCode: 'payment_method', value: 'quarterly', label: '季付', sort: 2, enabled: true, isBuiltin: false },
  { id: 31, dictCode: 'payment_method', value: 'semi_annual', label: '半年付', sort: 3, enabled: true, isBuiltin: false },
  { id: 32, dictCode: 'payment_method', value: 'annual', label: '年付', sort: 4, enabled: true, isBuiltin: false },
  // bill_category
  { id: 33, dictCode: 'bill_category', value: 'rent', label: '租金', sort: 1, enabled: true, isBuiltin: false },
  { id: 34, dictCode: 'bill_category', value: 'deposit', label: '押金', sort: 2, enabled: true, isBuiltin: false },
  { id: 35, dictCode: 'bill_category', value: 'property', label: '物业费', sort: 3, enabled: true, isBuiltin: false },
  { id: 36, dictCode: 'bill_category', value: 'water', label: '水费', sort: 4, enabled: true, isBuiltin: false },
  { id: 37, dictCode: 'bill_category', value: 'electric', label: '电费', sort: 5, enabled: true, isBuiltin: false },
  { id: 38, dictCode: 'bill_category', value: 'gas', label: '燃气费', sort: 6, enabled: true, isBuiltin: false },
  { id: 39, dictCode: 'bill_category', value: 'other', label: '其他', sort: 7, enabled: true, isBuiltin: false },
  // employee_status
  { id: 40, dictCode: 'employee_status', value: 'active', label: '在职', sort: 1, enabled: true, isBuiltin: false },
  { id: 41, dictCode: 'employee_status', value: 'left', label: '离职', sort: 2, enabled: true, isBuiltin: false },
  { id: 42, dictCode: 'employee_status', value: 'vacation', label: '休假', sort: 3, enabled: true, isBuiltin: false },
  // disk_type
  { id: 43, dictCode: 'disk_type', value: 'house', label: '住宅', sort: 1, enabled: true, isBuiltin: false },
  { id: 44, dictCode: 'disk_type', value: 'shop', label: '商铺', sort: 2, enabled: true, isBuiltin: false },
  { id: 45, dictCode: 'disk_type', value: 'office', label: '写字楼', sort: 3, enabled: true, isBuiltin: false },
  { id: 46, dictCode: 'disk_type', value: 'apartment', label: '公寓', sort: 4, enabled: true, isBuiltin: false },
  // blacklist_type
  { id: 47, dictCode: 'blacklist_type', value: 'debt', label: '恶意欠款', sort: 1, enabled: true, isBuiltin: false },
  { id: 48, dictCode: 'blacklist_type', value: 'damage', label: '损坏房屋', sort: 2, enabled: true, isBuiltin: false },
  { id: 49, dictCode: 'blacklist_type', value: 'noise', label: '扰民', sort: 3, enabled: true, isBuiltin: false },
  { id: 50, dictCode: 'blacklist_type', value: 'breach', label: '违约', sort: 4, enabled: true, isBuiltin: false },
  { id: 51, dictCode: 'blacklist_type', value: 'fraud', label: '诈骗', sort: 5, enabled: true, isBuiltin: false },
  { id: 52, dictCode: 'blacklist_type', value: 'other', label: '其他', sort: 6, enabled: true, isBuiltin: false },
  // source_channel
  { id: 53, dictCode: 'source_channel', value: '58', label: '58同城', sort: 1, enabled: true, isBuiltin: false },
  { id: 54, dictCode: 'source_channel', value: 'beike', label: '贝壳', sort: 2, enabled: true, isBuiltin: false },
  { id: 55, dictCode: 'source_channel', value: 'anjuke', label: '安居客', sort: 3, enabled: true, isBuiltin: false },
  { id: 56, dictCode: 'source_channel', value: 'douyin', label: '抖音', sort: 4, enabled: true, isBuiltin: false },
  { id: 57, dictCode: 'source_channel', value: 'wechat', label: '微信', sort: 5, enabled: true, isBuiltin: false },
  { id: 58, dictCode: 'source_channel', value: 'store', label: '门店', sort: 6, enabled: true, isBuiltin: false },
  { id: 59, dictCode: 'source_channel', value: 'referral', label: '老客户', sort: 7, enabled: true, isBuiltin: false },
  { id: 60, dictCode: 'source_channel', value: 'agent', label: '中介', sort: 8, enabled: true, isBuiltin: false },
  { id: 61, dictCode: 'source_channel', value: 'other', label: '其他', sort: 9, enabled: true, isBuiltin: false },
  // building_type
  { id: 62, dictCode: 'building_type', value: 'multi', label: '多层', sort: 1, enabled: true, isBuiltin: false },
  { id: 63, dictCode: 'building_type', value: 'high', label: '高层', sort: 2, enabled: true, isBuiltin: false },
  { id: 64, dictCode: 'building_type', value: 'small_high', label: '小高层', sort: 3, enabled: true, isBuiltin: false },
  { id: 65, dictCode: 'building_type', value: 'villa', label: '别墅', sort: 4, enabled: true, isBuiltin: false },
  { id: 66, dictCode: 'building_type', value: 'shop', label: '商铺', sort: 5, enabled: true, isBuiltin: false },
  // decoration_level (前端使用的装修字典)
  { id: 67, dictCode: 'decoration_level', value: 'rough', label: '毛坯', sort: 1, enabled: true, isBuiltin: false },
  { id: 68, dictCode: 'decoration_level', value: 'simple', label: '简装', sort: 2, enabled: true, isBuiltin: false },
  { id: 69, dictCode: 'decoration_level', value: 'fine', label: '精装', sort: 3, enabled: true, isBuiltin: false },
  { id: 70, dictCode: 'decoration_level', value: 'luxury', label: '豪装', sort: 4, enabled: true, isBuiltin: false },
  // lease_term
  { id: 71, dictCode: 'lease_term', value: '1_year', label: '一年', sort: 1, enabled: true, isBuiltin: false },
  { id: 72, dictCode: 'lease_term', value: '2_years', label: '两年', sort: 2, enabled: true, isBuiltin: false },
  { id: 73, dictCode: 'lease_term', value: '3_years', label: '三年', sort: 3, enabled: true, isBuiltin: false },
  { id: 74, dictCode: 'lease_term', value: '5_years', label: '五年', sort: 4, enabled: true, isBuiltin: false },
  // checkout_status
  { id: 75, dictCode: 'checkout_status', value: 'pending', label: '待确认', sort: 1, enabled: true, isBuiltin: false },
  { id: 76, dictCode: 'checkout_status', value: 'confirmed', label: '已确认', sort: 2, enabled: true, isBuiltin: false },
  { id: 77, dictCode: 'checkout_status', value: 'completed', label: '已完成', sort: 3, enabled: true, isBuiltin: false },
  // deposit_status
  { id: 78, dictCode: 'deposit_status', value: 'pending', label: '待退', sort: 1, enabled: true, isBuiltin: false },
  { id: 79, dictCode: 'deposit_status', value: 'refunded', label: '已退', sort: 2, enabled: true, isBuiltin: false },
  { id: 80, dictCode: 'deposit_status', value: 'deducted', label: '已扣', sort: 3, enabled: true, isBuiltin: false },
];

// ============================================================
//  MOCK DATA: 门店 & 员工
// ============================================================
const STORES = [
  { id: 1, name: '张江店', cityId: 1, address: '上海市浦东新区张江路588号', phone: '021-58581234', manager: '张店长' },
  { id: 2, name: '联洋店', cityId: 1, address: '上海市浦东新区联洋路218号', phone: '021-58585678', manager: '刘店长' },
  { id: 3, name: '浦东店', cityId: 1, address: '上海市浦东新区浦东南路1288号', phone: '021-58589012', manager: '陈店长' },
  { id: 4, name: '金桥店', cityId: 1, address: '上海市浦东新区金桥路1398号', phone: '021-58583456', manager: '褚店长' },
  { id: 5, name: '北蔡店', cityId: 1, address: '上海市浦东新区沪南路2420号', phone: '021-58587890', manager: '卫店长' },
];
const CITIES = [
  { id: 1, name: '上海市' },
  { id: 2, name: '北京市' },
  { id: 3, name: '深圳市' },
];
const DEPARTMENTS = [
  { id: 1, name: '销售一组', storeId: 1 },
  { id: 2, name: '销售二组', storeId: 1 },
  { id: 3, name: '销售一组', storeId: 2 },
  { id: 4, name: '销售二组', storeId: 2 },
  { id: 5, name: '财务部' },
];
const POSITIONS = [
  { id: 1, name: '店长', code: 'store_manager' },
  { id: 2, name: '业务员', code: 'salesman' },
  { id: 3, name: '管家', code: 'housekeeper' },
  { id: 4, name: '财务', code: 'finance' },
  { id: 5, name: '行政', code: 'admin' },
];
const EMPLOYEES = [
  { id: 1, name: '超级管理员', mobile: 'super_admin', status: 'active', entryDate: '2023-01-01', roles: [{ id: 1, name: '超级管理员' }], stores: [{ id: 1, name: '张江店' }], departments: [], positions: [{ id: 5, name: '行政' }] },
  { id: 2, name: '王老板', mobile: '13800000001', status: 'active', entryDate: '2023-01-15', roles: [{ id: 2, name: '公司管理员' }], stores: [{ id: 1, name: '张江店' }, { id: 2, name: '联洋店' }, { id: 3, name: '浦东店' }], departments: [], positions: [{ id: 5, name: '行政' }] },
  { id: 3, name: '张伟', mobile: '13800000002', status: 'active', entryDate: '2023-02-01', roles: [{ id: 3, name: '店长' }], stores: [{ id: 1, name: '张江店' }], departments: [{ id: 1, name: '销售一组' }], positions: [{ id: 1, name: '店长' }] },
  { id: 4, name: '李娜', mobile: '13800000003', status: 'active', entryDate: '2023-03-01', roles: [{ id: 4, name: '业务员' }], stores: [{ id: 1, name: '张江店' }], departments: [{ id: 1, name: '销售一组' }], positions: [{ id: 2, name: '业务员' }] },
  { id: 5, name: '王强', mobile: '13800000004', status: 'active', entryDate: '2023-03-15', roles: [{ id: 4, name: '业务员' }], stores: [{ id: 1, name: '张江店' }], departments: [{ id: 2, name: '销售二组' }], positions: [{ id: 2, name: '业务员' }] },
  { id: 6, name: '刘洋', mobile: '13800000005', status: 'active', entryDate: '2023-04-01', roles: [{ id: 4, name: '业务员' }], stores: [{ id: 1, name: '张江店' }], departments: [{ id: 1, name: '销售一组' }], positions: [{ id: 2, name: '业务员' }] },
  { id: 7, name: '陈静', mobile: '13800000006', status: 'active', entryDate: '2023-04-15', roles: [{ id: 4, name: '业务员' }], stores: [{ id: 2, name: '联洋店' }], departments: [{ id: 3, name: '销售一组' }], positions: [{ id: 2, name: '业务员' }] },
  { id: 8, name: '赵磊', mobile: '13800000007', status: 'vacation', entryDate: '2023-05-01', roles: [{ id: 4, name: '业务员' }], stores: [{ id: 3, name: '浦东店' }], departments: [{ id: 4, name: '销售二组' }], positions: [{ id: 2, name: '业务员' }] },
  { id: 9, name: '孙悦', mobile: '13800000008', status: 'active', entryDate: '2023-05-15', roles: [{ id: 4, name: '业务员' }], stores: [{ id: 2, name: '联洋店' }], departments: [{ id: 3, name: '销售一组' }], positions: [{ id: 2, name: '业务员' }] },
  { id: 10, name: '周涛', mobile: '13800000009', status: 'left', entryDate: '2023-06-01', leaveDate: '2026-07-15', roles: [{ id: 4, name: '业务员' }], stores: [{ id: 2, name: '联洋店' }], departments: [{ id: 4, name: '销售二组' }], positions: [{ id: 2, name: '业务员' }] },
  { id: 11, name: '吴杰', mobile: '13800000010', status: 'active', entryDate: '2023-06-15', roles: [{ id: 4, name: '业务员' }], stores: [{ id: 3, name: '浦东店' }], departments: [{ id: 4, name: '销售二组' }], positions: [{ id: 2, name: '业务员' }] },
  { id: 12, name: '刘店长', mobile: '13800000011', status: 'active', entryDate: '2023-02-15', roles: [{ id: 3, name: '店长' }], stores: [{ id: 2, name: '联洋店' }], departments: [{ id: 3, name: '销售一组' }], positions: [{ id: 1, name: '店长' }] },
  { id: 13, name: '陈店长', mobile: '13800000012', status: 'active', entryDate: '2023-02-20', roles: [{ id: 3, name: '店长' }], stores: [{ id: 3, name: '浦东店' }], departments: [{ id: 4, name: '销售二组' }], positions: [{ id: 1, name: '店长' }] },
  { id: 14, name: '赵财务', mobile: '13800000013', status: 'active', entryDate: '2023-01-20', roles: [{ id: 5, name: '财务负责人' }], stores: [{ id: 1, name: '张江店' }, { id: 2, name: '联洋店' }, { id: 3, name: '浦东店' }], departments: [{ id: 5, name: '财务部' }], positions: [{ id: 4, name: '财务' }] },
  { id: 15, name: '周管家', mobile: '13800000014', status: 'active', entryDate: '2023-03-10', roles: [{ id: 6, name: '管家' }], stores: [{ id: 1, name: '张江店' }], departments: [{ id: 1, name: '销售一组' }], positions: [{ id: 3, name: '管家' }] },
  { id: 16, name: '吴管家', mobile: '13800000015', status: 'active', entryDate: '2023-04-05', roles: [{ id: 6, name: '管家' }], stores: [{ id: 1, name: '张江店' }], departments: [{ id: 1, name: '销售一组' }], positions: [{ id: 3, name: '管家' }] },
  { id: 17, name: '郑凯', mobile: '13800000016', status: 'active', entryDate: '2023-05-20', roles: [{ id: 4, name: '业务员' }], stores: [{ id: 2, name: '联洋店' }], departments: [{ id: 3, name: '销售一组' }], positions: [{ id: 2, name: '业务员' }] },
  { id: 18, name: '冯雪', mobile: '13800000017', status: 'active', entryDate: '2023-06-10', roles: [{ id: 4, name: '业务员' }], stores: [{ id: 3, name: '浦东店' }], departments: [{ id: 4, name: '销售二组' }], positions: [{ id: 2, name: '业务员' }] },
  { id: 19, name: '褚敏', mobile: '13800000018', status: 'active', entryDate: '2023-07-01', roles: [{ id: 6, name: '管家' }], stores: [{ id: 2, name: '联洋店' }], departments: [{ id: 3, name: '销售一组' }], positions: [{ id: 3, name: '管家' }] },
  { id: 20, name: '卫东', mobile: '13800000019', status: 'active', entryDate: '2023-08-15', roles: [{ id: 4, name: '业务员' }], stores: [{ id: 4, name: '金桥店' }], departments: [{ id: 2, name: '销售二组' }], positions: [{ id: 2, name: '业务员' }] },
];

// ============================================================
//  MOCK DATA: 角色 & 权限
// ============================================================
const ROLES = [
  { id: 1, code: 'super_admin', name: '超级管理员', dataScope: 'company', isBuiltin: true, status: 'active' },
  { id: 2, code: 'company_admin', name: '公司管理员', dataScope: 'company', isBuiltin: false, status: 'active', assignedStores: [1, 2, 3] },
  { id: 3, code: 'store_manager', name: '店长', dataScope: 'store', isBuiltin: false, status: 'active', assignedStores: [1] },
  { id: 4, code: 'salesman', name: '业务员', dataScope: 'self', isBuiltin: false, status: 'active', assignedStores: [1] },
  { id: 5, code: 'finance_manager', name: '财务负责人', dataScope: 'company', isBuiltin: false, status: 'active', assignedStores: [1, 2, 3] },
  { id: 6, code: 'housekeeper', name: '管家', dataScope: 'group', isBuiltin: false, status: 'active', assignedStores: [1] },
];
const PERM_TREE = [
  { id: 1, code: 'home', name: '首页', type: 'menu', sort: 1, status: 'active', icon: 'layout-dashboard', path: '/home', children: [] },
  { id: 2, code: 'house', name: '房屋管理', type: 'menu', sort: 2, status: 'active', icon: 'building-2', children: [
    { id: 21, code: 'house:rent', name: '租房管理', type: 'menu', sort: 1, status: 'active', children: [
      { id: 211, code: 'renting:list', name: '查看列表', type: 'action', sort: 1, status: 'active' },
      { id: 212, code: 'renting:create', name: '新增出租', type: 'action', sort: 2, status: 'active' },
      { id: 213, code: 'renting:edit', name: '编辑', type: 'action', sort: 3, status: 'active' },
      { id: 214, code: 'renting:checkout', name: '退租', type: 'action', sort: 4, status: 'active' },
      { id: 215, code: 'renting:export', name: '导出', type: 'action', sort: 5, status: 'active' },
    ]},
    { id: 22, code: 'house:sale', name: '售房管理', type: 'menu', sort: 2, status: 'active', children: [
      { id: 221, code: 'sale:list', name: '查看列表', type: 'action', sort: 1, status: 'active' },
      { id: 222, code: 'sale:create', name: '新增出售', type: 'action', sort: 2, status: 'active' },
      { id: 223, code: 'sale:edit', name: '编辑', type: 'action', sort: 3, status: 'active' },
    ]},
    { id: 23, code: 'house:reserve_house', name: '储备房源', type: 'menu', sort: 3, status: 'active', children: [
      { id: 231, code: 'reserve_house:list', name: '查看列表', type: 'action', sort: 1, status: 'active' },
      { id: 232, code: 'reserve_house:create', name: '新增', type: 'action', sort: 2, status: 'active' },
    ]},
    { id: 24, code: 'house:reserve_client', name: '储备客源', type: 'menu', sort: 4, status: 'active', children: [
      { id: 241, code: 'reserve_client:list', name: '查看列表', type: 'action', sort: 1, status: 'active' },
      { id: 242, code: 'reserve_client:create', name: '新增', type: 'action', sort: 2, status: 'active' },
    ]},
    { id: 25, code: 'house:customer', name: '客户管理', type: 'menu', sort: 5, status: 'active', children: [
      { id: 251, code: 'customer:list', name: '查看列表', type: 'action', sort: 1, status: 'active' },
      { id: 252, code: 'customer:create', name: '新增客户', type: 'action', sort: 2, status: 'active' },
      { id: 253, code: 'customer:follow', name: '跟进', type: 'action', sort: 3, status: 'active' },
    ]},
    { id: 26, code: 'house:blacklist', name: '黑名单', type: 'menu', sort: 6, status: 'active', children: [
      { id: 261, code: 'blacklist:list', name: '查看', type: 'action', sort: 1, status: 'active' },
      { id: 262, code: 'blacklist:create', name: '新增', type: 'action', sort: 2, status: 'active' },
    ]},
    { id: 27, code: 'house:community', name: '小区管理', type: 'menu', sort: 7, status: 'active', children: [
      { id: 271, code: 'community:list', name: '查看', type: 'action', sort: 1, status: 'active' },
      { id: 272, code: 'community:create', name: '新增小区', type: 'action', sort: 2, status: 'active' },
    ]},
    { id: 28, code: 'house:checkout', name: '退租管理', type: 'menu', sort: 8, status: 'active', children: [
      { id: 281, code: 'checkout:list', name: '查看', type: 'action', sort: 1, status: 'active' },
      { id: 282, code: 'checkout:confirm', name: '确认退租', type: 'action', sort: 2, status: 'active' },
      { id: 283, code: 'checkout:export', name: '导出', type: 'action', sort: 3, status: 'active' },
    ]},
    { id: 29, code: 'house:deposit', name: '押金管理', type: 'menu', sort: 9, status: 'active', children: [
      { id: 291, code: 'deposit:list', name: '查看', type: 'action', sort: 1, status: 'active' },
      { id: 292, code: 'deposit:refund', name: '退押金', type: 'action', sort: 2, status: 'active' },
      { id: 293, code: 'deposit:deduct', name: '扣留押金', type: 'action', sort: 3, status: 'active' },
      { id: 294, code: 'deposit:export', name: '导出', type: 'action', sort: 4, status: 'active' },
    ]},
  ]},
  { id: 3, code: 'finance', name: '财务管理', type: 'menu', sort: 3, status: 'active', icon: 'banknote', children: [
    { id: 31, code: 'finance:bill', name: '账单', type: 'menu', sort: 1, status: 'active' },
    { id: 32, code: 'finance:flow', name: '流水账', type: 'menu', sort: 2, status: 'active' },
    { id: 33, code: 'finance:rent_increase', name: '涨价统计', type: 'menu', sort: 3, status: 'active' },
    { id: 34, code: 'finance:profit', name: '公寓利润', type: 'menu', sort: 4, status: 'active' },
    { id: 35, code: 'finance:partner', name: '合伙人', type: 'menu', sort: 5, status: 'active' },
    { id: 36, code: 'finance:income_cost', name: '收入成本', type: 'menu', sort: 6, status: 'active' },
    { id: 37, code: 'finance:performance', name: '业绩核算', type: 'menu', sort: 7, status: 'active' },
    { id: 38, code: 'finance:accounting', name: '财务核算', type: 'menu', sort: 8, status: 'active' },
    { id: 39, code: 'finance:arrears', name: '欠款统计', type: 'menu', sort: 9, status: 'active' },
    { id: 310, code: 'finance:plan', name: '收支计划', type: 'menu', sort: 10, status: 'active' },
    { id: 311, code: 'finance:payout', name: '代付管理', type: 'menu', sort: 11, status: 'active' },
    { id: 312, code: 'finance:billing', name: '开票管理', type: 'menu', sort: 12, status: 'active' },
  ]},
  { id: 4, code: 'system', name: '系统管理', type: 'menu', sort: 4, status: 'active', icon: 'settings', children: [
    { id: 41, code: 'system:role', name: '角色管理', type: 'menu', sort: 1, status: 'active', children: [
      { id: 411, code: 'role:list', name: '查看', type: 'action', sort: 1, status: 'active' },
      { id: 412, code: 'role:create', name: '新增角色', type: 'action', sort: 2, status: 'active' },
      { id: 413, code: 'role:edit', name: '编辑角色', type: 'action', sort: 3, status: 'active' },
      { id: 414, code: 'role:delete', name: '删除角色', type: 'action', sort: 4, status: 'active' },
      { id: 415, code: 'role:assign', name: '分配权限', type: 'action', sort: 5, status: 'active' },
    ]},
    { id: 42, code: 'system:permission', name: '权限管理', type: 'menu', sort: 2, status: 'active' },
    { id: 43, code: 'system:dictionary', name: '字典管理', type: 'menu', sort: 3, status: 'active' },
    { id: 44, code: 'system:employee', name: '人员管理', type: 'menu', sort: 4, status: 'active', children: [
      { id: 441, code: 'employee:list', name: '查看', type: 'action', sort: 1, status: 'active' },
      { id: 442, code: 'employee:create', name: '新增员工', type: 'action', sort: 2, status: 'active' },
      { id: 443, code: 'employee:edit', name: '编辑', type: 'action', sort: 3, status: 'active' },
      { id: 444, code: 'employee:delete', name: '删除', type: 'action', sort: 4, status: 'active' },
    ]},
  ]},
];

// ============================================================
//  MOCK DATA: 小区
// ============================================================
const COMMUNITIES = [
  { id: 1, name: '张江汤臣豪园', cityName: '上海', district: '浦东新区', area: '张江', address: '浦东新区张江路688号', alias: '汤臣豪园', businessCircle: '张江', buildingCount: 32, unitCount: 64, roomCount: 1280 },
  { id: 2, name: '张江家园', cityName: '上海', district: '浦东新区', area: '张江', address: '浦东新区张江路128号', alias: '张江家园', businessCircle: '张江', buildingCount: 18, unitCount: 36, roomCount: 720 },
  { id: 3, name: '城市经典花园', cityName: '上海', district: '浦东新区', area: '张江', address: '浦东新区张江镇高科中路', alias: '经典花园', businessCircle: '张江', buildingCount: 24, unitCount: 48, roomCount: 960 },
  { id: 4, name: '联洋年华', cityName: '上海', district: '浦东新区', area: '联洋', address: '浦东新区联洋路168号', alias: '联洋年华', businessCircle: '联洋', buildingCount: 20, unitCount: 40, roomCount: 800 },
  { id: 5, name: '海上国际花园', cityName: '上海', district: '浦东新区', area: '联洋', address: '浦东新区联洋路333号', alias: '海上国际', businessCircle: '联洋', buildingCount: 28, unitCount: 56, roomCount: 1120 },
  { id: 6, name: '浦东世纪花园', cityName: '上海', district: '浦东新区', area: '花木', address: '浦东新区花木路188号', alias: '世纪花园', businessCircle: '花木', buildingCount: 22, unitCount: 44, roomCount: 880 },
  { id: 7, name: '金桥新村', cityName: '上海', district: '浦东新区', area: '金桥', address: '浦东新区金桥路580号', alias: '金桥新村', businessCircle: '金桥', buildingCount: 36, unitCount: 72, roomCount: 1440 },
  { id: 8, name: '碧云国际社区', cityName: '上海', district: '浦东新区', area: '碧云', address: '浦东新区碧云路118号', alias: '碧云国际', businessCircle: '碧云', buildingCount: 16, unitCount: 32, roomCount: 640 },
  { id: 9, name: '东陆新村', cityName: '上海', district: '浦东新区', area: '金桥', address: '浦东新区东陆路268号', alias: '东陆新村', businessCircle: '金桥', buildingCount: 40, unitCount: 80, roomCount: 1600 },
  { id: 10, name: '罗山花苑', cityName: '上海', district: '浦东新区', area: '花木', address: '浦东新区罗山路1688号', alias: '罗山花苑', businessCircle: '花木', buildingCount: 14, unitCount: 28, roomCount: 560 },
  { id: 11, name: '证大家园', cityName: '上海', district: '浦东新区', area: '金桥', address: '浦东新区利津路1280号', alias: '证大家园', businessCircle: '金桥', buildingCount: 30, unitCount: 60, roomCount: 1200 },
  { id: 12, name: '万科金色城市', cityName: '上海', district: '浦东新区', area: '北蔡', address: '浦东新区沪南路888号', alias: '金色城市', businessCircle: '北蔡', buildingCount: 26, unitCount: 52, roomCount: 1040 },
  { id: 13, name: '香楠小区', cityName: '上海', district: '浦东新区', area: '张江', address: '浦东新区香楠路88号', alias: '香楠小区', businessCircle: '张江', buildingCount: 20, unitCount: 40, roomCount: 800 },
  { id: 14, name: '川杨新苑', cityName: '上海', district: '浦东新区', area: '张江', address: '浦东新区川杨河路296号', alias: '川杨新苑', businessCircle: '张江', buildingCount: 26, unitCount: 52, roomCount: 1040 },
  { id: 15, name: '玉兰香苑', cityName: '上海', district: '浦东新区', area: '北蔡', address: '浦东新区莲安西路123弄', alias: '玉兰香苑', businessCircle: '北蔡', buildingCount: 34, unitCount: 68, roomCount: 1360 },
  { id: 16, name: '益丰新村', cityName: '上海', district: '浦东新区', area: '金桥', address: '浦东新区佳京路255弄', alias: '益丰新村', businessCircle: '金桥', buildingCount: 22, unitCount: 44, roomCount: 880 },
  { id: 17, name: '仁恒河滨城', cityName: '上海', district: '浦东新区', area: '联洋', address: '浦东新区罗山路1809号', alias: '河滨城', businessCircle: '联洋', buildingCount: 18, unitCount: 36, roomCount: 720 },
  { id: 18, name: '大华锦绣华城', cityName: '上海', district: '浦东新区', area: '北蔡', address: '浦东新区成山路2000号', alias: '锦绣华城', businessCircle: '北蔡', buildingCount: 40, unitCount: 80, roomCount: 1600 },
];

// ============================================================
//  MOCK DATA: 出租房源
// ============================================================
const RENTAL_SETS = [
  { id: 1, code: 'ZJ001', landlordPaymentMethod: 'quarterly', bizType: 'entire', communityId: 1, communityName: '张江汤臣豪园', address: '浦东新区张江路688号', building: '12', unit: '1', roomNo: '802', layout: '两室一厅', buildingArea: 85, decoration: 'fine', landlordRent: 4500, rent: 6200, deposit: 6200, leaseStart: '2026-01-15', leaseEnd: '2027-01-14', status: 'rented', storeId: 1, groupId: 1, landlordId: 1, salesmanId: 4, housekeeperId: 15, roomCount: 0, vacantCount: 0, createdAt: '2026-01-10', landlordName: '陈建国', landlordPhone: '13800001111', tenantName: '李明', tenantPhone: '13800002222', tenantLeaseStart: '2026-01-15', tenantLeaseEnd: '2027-01-14', tenantPaymentMethod: 'quarterly', rooms: [] },
  { id: 2, code: 'ZJ002', landlordPaymentMethod: 'monthly', bizType: 'shared', communityId: 1, communityName: '张江汤臣豪园', address: '浦东新区张江路688号', building: '8', unit: '2', roomNo: '501', layout: '四室一厅', buildingArea: 135, decoration: 'fine', landlordRent: 6800, rent: 8800, deposit: 4400, leaseStart: '2026-02-01', leaseEnd: '2027-01-31', status: 'rented', storeId: 1, groupId: 1, landlordId: 2, salesmanId: 4, housekeeperId: 15, roomCount: 4, vacantCount: 0, createdAt: '2026-01-20', landlordName: '陈美兰', landlordPhone: '13900001006',
    rooms: [
      { id: 101, leaseStart: '2026-06-05', setId: 2, roomNo: 'A', roomType: '主卧', rentPrice: 2800, listedPrice: 3000, status: 'rented', leaseEnd: '2026-12-31', paymentMethod: 'quarterly', depositAmount: 2800, tenantName: '刘洋', tenantPhone: '13900000001' },
      { id: 102, leaseStart: '2026-08-28', setId: 2, roomNo: 'B', roomType: '次卧', rentPrice: 2200, listedPrice: 2400, status: 'rented', leaseEnd: '2026-11-30', paymentMethod: 'quarterly', depositAmount: 2200, tenantName: '陈静', tenantPhone: '13900000002' },
      { id: 103, leaseStart: '2026-08-15', setId: 2, roomNo: 'C', roomType: '次卧', rentPrice: 2000, listedPrice: 2200, status: 'rented', leaseEnd: '2027-01-15', paymentMethod: 'monthly', depositAmount: 2000, tenantName: '赵磊', tenantPhone: '13900000003' },
      { id: 104, setId: 2, roomNo: 'D', roomType: '小卧', rentPrice: 1800, listedPrice: 2000, status: 'vacant', leaseEnd: null, paymentMethod: 'monthly', depositAmount: 1800, tenantName: null, tenantPhone: null },
    ]},
  { id: 3, code: 'ZJ003', landlordPaymentMethod: 'monthly', bizType: 'shared', communityId: 2, communityName: '张江家园', address: '浦东新区张江路128号', building: '5', unit: '1', roomNo: '302', layout: '三室一厅', buildingArea: 98, decoration: 'simple', landlordRent: 3500, rent: 5400, deposit: 2700, leaseStart: '2026-03-01', leaseEnd: '2027-02-28', status: 'rented', storeId: 1, groupId: 1, landlordId: 3, salesmanId: 6, housekeeperId: 15, roomCount: 3, vacantCount: 1, createdAt: '2026-02-15', landlordName: '吴建平', landlordPhone: '13900001007',
    rooms: [
      { id: 105, leaseStart: '2026-08-31', setId: 3, roomNo: 'A', roomType: '主卧', rentPrice: 2200, listedPrice: 2400, status: 'rented', leaseEnd: '2026-10-31', paymentMethod: 'quarterly', depositAmount: 2200, tenantName: '孙悦', tenantPhone: '13900000004' },
      { id: 106, leaseStart: '2026-09-01', setId: 3, roomNo: 'B', roomType: '次卧', rentPrice: 1800, listedPrice: 2000, status: 'rented', leaseEnd: '2027-01-31', paymentMethod: 'monthly', depositAmount: 1800, tenantName: '周涛', tenantPhone: '13900000005' },
      { id: 107, setId: 3, roomNo: 'C', roomType: '小卧', rentPrice: 1400, listedPrice: 1600, status: 'vacant', leaseEnd: null, paymentMethod: 'monthly', depositAmount: 1400, tenantName: null, tenantPhone: null },
    ]},
  { id: 4, code: 'ZJ004', landlordPaymentMethod: 'quarterly', bizType: 'entire', communityId: 3, communityName: '城市经典花园', address: '浦东新区张江镇高科中路', building: '3', unit: '2', roomNo: '1501', layout: '三室两厅', buildingArea: 120, decoration: 'luxury', landlordRent: 6000, rent: 8500, deposit: 8500, leaseStart: '2026-04-01', leaseEnd: '2027-03-31', status: 'rented', storeId: 1, groupId: 1, landlordId: 4, salesmanId: 4, housekeeperId: 15, roomCount: 0, vacantCount: 0, createdAt: '2026-03-15', landlordName: '张建国', landlordPhone: '13800001001', tenantName: '贺斌', tenantPhone: '13800004001', tenantLeaseStart: '2026-04-01', tenantLeaseEnd: '2027-03-31', tenantPaymentMethod: 'quarterly', rooms: [] },
  { id: 5, code: 'ZJ005', landlordPaymentMethod: 'quarterly', bizType: 'shared', communityId: 4, communityName: '联洋年华', address: '浦东新区联洋路168号', building: '9', unit: '1', roomNo: '601', layout: '四室两厅', buildingArea: 145, decoration: 'fine', landlordRent: 7500, rent: 9600, deposit: 4800, leaseStart: '2026-03-15', leaseEnd: '2027-03-14', status: 'rented', storeId: 2, groupId: 3, landlordId: 5, salesmanId: 7, housekeeperId: null, roomCount: 4, vacantCount: 1, createdAt: '2026-03-01', landlordName: '郑国栋', landlordPhone: '13900001008',
    rooms: [
      { id: 108, leaseStart: '2026-09-05', setId: 5, roomNo: 'A', roomType: '主卧独卫', rentPrice: 3200, listedPrice: 3500, status: 'rented', leaseEnd: '2026-12-31', paymentMethod: 'quarterly', depositAmount: 3200, tenantName: '吴杰', tenantPhone: '13900000006' },
      { id: 109, leaseStart: '2026-08-28', setId: 5, roomNo: 'B', roomType: '次卧', rentPrice: 2400, listedPrice: 2600, status: 'rented', leaseEnd: '2026-11-30', paymentMethod: 'quarterly', depositAmount: 2400, tenantName: '钱峰', tenantPhone: '13900000007' },
      { id: 110, leaseStart: '2026-08-15', setId: 5, roomNo: 'C', roomType: '书房', rentPrice: 2000, listedPrice: 2200, status: 'rented', leaseEnd: '2026-10-15', paymentMethod: 'monthly', depositAmount: 2000, tenantName: '许晴', tenantPhone: '13900000008' },
      { id: 111, setId: 5, roomNo: 'D', roomType: '小卧', rentPrice: 1800, listedPrice: 2000, status: 'vacant', leaseEnd: null, paymentMethod: 'monthly', depositAmount: 1800, tenantName: null, tenantPhone: null },
    ]},
  { id: 6, code: 'ZJ006', landlordPaymentMethod: 'monthly', bizType: 'entire', communityId: 5, communityName: '海上国际花园', address: '浦东新区联洋路333号', building: '6', unit: '3', roomNo: '1201', layout: '两室两厅', buildingArea: 95, decoration: 'fine', landlordRent: 5000, rent: 7200, deposit: 7200, leaseStart: '2026-05-01', leaseEnd: '2027-04-30', status: 'rented', storeId: 2, groupId: 3, landlordId: 6, salesmanId: 9, housekeeperId: null, roomCount: 0, vacantCount: 0, createdAt: '2026-04-10', landlordName: '李明华', landlordPhone: '13900001002', tenantName: '钱峰', tenantPhone: '13800004002', tenantLeaseStart: '2026-05-01', tenantLeaseEnd: '2027-04-30', tenantPaymentMethod: 'monthly', rooms: [] },
  { id: 7, code: 'ZJ007', landlordPaymentMethod: 'quarterly', bizType: 'entire', communityId: 6, communityName: '浦东世纪花园', address: '浦东新区花木路188号', building: '2', unit: '1', roomNo: '901', layout: '三室一厅', buildingArea: 108, decoration: 'fine', landlordRent: 5200, rent: 7500, deposit: 7500, leaseStart: '2026-06-01', leaseEnd: '2027-05-31', status: 'rented', storeId: 3, groupId: 4, landlordId: 7, salesmanId: 11, housekeeperId: null, roomCount: 0, vacantCount: 0, createdAt: '2026-05-10', landlordName: '王秀英', landlordPhone: '13900001003', tenantName: '刘伟', tenantPhone: '13800004003', tenantLeaseStart: '2026-06-01', tenantLeaseEnd: '2027-05-31', tenantPaymentMethod: 'quarterly', rooms: [] },
  { id: 8, code: 'ZJ008', landlordPaymentMethod: 'quarterly', bizType: 'shared', communityId: 7, communityName: '金桥新村', address: '浦东新区金桥路580号', building: '15', unit: '2', roomNo: '401', layout: '三室一厅', buildingArea: 88, decoration: 'simple', landlordRent: 3000, rent: 4800, deposit: 2400, leaseStart: '2026-06-15', leaseEnd: '2027-06-14', status: 'rented', storeId: 3, groupId: 4, landlordId: 8, salesmanId: 11, housekeeperId: null, roomCount: 3, vacantCount: 0, createdAt: '2026-06-01',
    rooms: [
      { id: 112, leaseStart: '2026-09-02', setId: 8, roomNo: 'A', roomType: '主卧', rentPrice: 2000, listedPrice: 2200, status: 'rented', leaseEnd: '2026-12-31', paymentMethod: 'quarterly', depositAmount: 2000, tenantName: '黄磊', tenantPhone: '13900000009' },
      { id: 113, leaseStart: '2026-09-01', setId: 8, roomNo: 'B', roomType: '次卧', rentPrice: 1500, listedPrice: 1700, status: 'rented', leaseEnd: '2027-01-31', paymentMethod: 'monthly', depositAmount: 1500, tenantName: '何雨', tenantPhone: '13900000010' },
      { id: 114, leaseStart: '2026-08-20', setId: 8, roomNo: 'C', roomType: '小卧', rentPrice: 1300, listedPrice: 1500, status: 'rented', leaseEnd: '2026-11-30', paymentMethod: 'monthly', depositAmount: 1300, tenantName: '马超', tenantPhone: '13900000011' },
    ]},
  { id: 9, code: 'ZJ009', landlordPaymentMethod: 'monthly', bizType: 'entire', communityId: 8, communityName: '碧云国际社区', address: '浦东新区碧云路118号', building: '9', unit: '1', roomNo: '702', layout: '两室一厅', buildingArea: 78, decoration: 'luxury', landlordRent: 5500, rent: 8000, deposit: 8000, leaseStart: '2026-07-01', leaseEnd: '2027-06-30', status: 'rented', storeId: 1, groupId: 2, landlordId: 9, salesmanId: 5, housekeeperId: 15, roomCount: 0, vacantCount: 0, createdAt: '2026-06-15', landlordName: '孙丽', landlordPhone: '13955555555', tenantName: '王芳', tenantPhone: '13800003333', tenantLeaseStart: '2026-07-01', tenantLeaseEnd: '2027-06-30', tenantPaymentMethod: 'monthly', rooms: [] },
  { id: 10, code: 'ZJ010', bizType: 'entire', communityId: 10, communityName: '罗山花苑', address: '浦东新区罗山路1688号', building: '4', unit: '2', roomNo: '301', layout: '两室一厅', buildingArea: 72, decoration: 'simple', landlordRent: 3200, rent: 4800, deposit: 4800, leaseStart: null, leaseEnd: null, status: 'vacant', storeId: 2, groupId: 3, landlordId: 10, salesmanId: 7, housekeeperId: null, roomCount: 0, vacantCount: 0, createdAt: '2026-08-10', landlordName: '赵德发', landlordPhone: '13900001004', rooms: [] },
  { id: 11, code: 'ZJ011', landlordPaymentMethod: 'monthly', bizType: 'shared', communityId: 9, communityName: '东陆新村', address: '浦东新区东陆路268号', building: '7', unit: '1', roomNo: '503', layout: '四室一厅', buildingArea: 125, decoration: 'simple', landlordRent: 4200, rent: 6000, deposit: 3000, leaseStart: '2026-07-15', leaseEnd: '2027-07-14', status: 'rented', storeId: 1, groupId: 1, landlordId: 11, salesmanId: 6, housekeeperId: 15, roomCount: 4, vacantCount: 1, createdAt: '2026-07-01',
    rooms: [
      { id: 115, leaseStart: '2026-09-01', setId: 11, roomNo: 'A', roomType: '主卧', rentPrice: 2000, listedPrice: 2200, status: 'rented', leaseEnd: '2027-01-31', paymentMethod: 'quarterly', depositAmount: 2000, tenantName: '林芝', tenantPhone: '13900000012' },
      { id: 116, leaseStart: '2026-08-29', setId: 11, roomNo: 'B', roomType: '次卧', rentPrice: 1600, listedPrice: 1800, status: 'rented', leaseEnd: '2026-12-31', paymentMethod: 'monthly', depositAmount: 1600, tenantName: '胡兵', tenantPhone: '13900000013' },
      { id: 117, setId: 11, roomNo: 'C', roomType: '次卧', rentPrice: 1400, listedPrice: 1600, status: 'vacant', leaseEnd: null, paymentMethod: 'monthly', depositAmount: 1400, tenantName: null, tenantPhone: null },
      { id: 118, leaseStart: '2026-09-03', setId: 11, roomNo: 'D', roomType: '小卧', rentPrice: 1000, listedPrice: 1200, status: 'rented', leaseEnd: '2027-02-28', paymentMethod: 'monthly', depositAmount: 1000, tenantName: '高峰', tenantPhone: '13900000014' },
    ]},
  { id: 12, code: 'ZJ012', bizType: 'entire', communityId: 12, communityName: '万科金色城市', address: '浦东新区沪南路888号', building: '10', unit: '1', roomNo: '1801', layout: '三室两厅', buildingArea: 115, decoration: 'fine', landlordRent: 4800, rent: 7000, deposit: 7000, leaseStart: null, leaseEnd: null, status: 'vacant', storeId: 1, groupId: 2, landlordId: 12, salesmanId: 5, housekeeperId: 15, roomCount: 0, vacantCount: 0, createdAt: '2026-08-15', landlordName: '周建华', landlordPhone: '13900001005', rooms: [] },
  { id: 13, code: 'ZJ013', landlordPaymentMethod: 'monthly', bizType: 'entire', communityId: 13, communityName: '香楠小区', address: '浦东新区香楠路88号', building: '3', unit: '1', roomNo: '201', layout: '一室一厅', buildingArea: 52, decoration: 'simple', landlordRent: 2600, rent: 3900, deposit: 3900, leaseStart: '2026-05-15', leaseEnd: '2027-05-14', status: 'rented', storeId: 1, groupId: 1, landlordId: 2, salesmanId: 6, housekeeperId: 15, roomCount: 0, vacantCount: 0, createdAt: '2026-05-01', landlordName: '钱国栋', landlordPhone: '13912121212', tenantName: '许晴', tenantPhone: '13900000001', tenantLeaseStart: '2026-05-15', tenantLeaseEnd: '2027-05-14', tenantPaymentMethod: 'monthly', rooms: [] },
  { id: 14, code: 'ZJ014', landlordPaymentMethod: 'monthly', bizType: 'shared', communityId: 14, communityName: '川杨新苑', address: '浦东新区川杨河路296号', building: '11', unit: '2', roomNo: '704', layout: '三室一厅', buildingArea: 92, decoration: 'simple', landlordRent: 3200, rent: 5000, deposit: 2500, leaseStart: '2026-04-10', leaseEnd: '2027-04-09', status: 'rented', storeId: 1, groupId: 1, landlordId: 3, salesmanId: 6, housekeeperId: 16, roomCount: 3, vacantCount: 1, createdAt: '2026-03-25',
    rooms: [
      { id: 119, leaseStart: '2026-08-30', setId: 14, roomNo: 'A', roomType: '主卧', rentPrice: 1900, listedPrice: 2100, status: 'rented', leaseEnd: '2027-03-31', paymentMethod: 'quarterly', depositAmount: 1900, tenantName: '罗琳', tenantPhone: '13900000015' },
      { id: 120, leaseStart: '2026-09-03', setId: 14, roomNo: 'B', roomType: '次卧', rentPrice: 1600, listedPrice: 1800, status: 'rented', leaseEnd: '2026-12-31', paymentMethod: 'monthly', depositAmount: 1600, tenantName: '谢芳', tenantPhone: '13900000016' },
      { id: 121, setId: 14, roomNo: 'C', roomType: '小卧', rentPrice: 1300, listedPrice: 1500, status: 'vacant', leaseEnd: null, paymentMethod: 'monthly', depositAmount: 1300, tenantName: null, tenantPhone: null },
    ]},
  { id: 15, code: 'ZJ015', landlordPaymentMethod: 'annual', bizType: 'entire', communityId: 15, communityName: '玉兰香苑', address: '浦东新区莲安西路123弄', building: '18', unit: '1', roomNo: '502', layout: '两室一厅', buildingArea: 76, decoration: 'fine', landlordRent: 3400, rent: 5000, deposit: 5000, leaseStart: '2026-07-10', leaseEnd: '2028-07-09', status: 'rented', storeId: 5, groupId: 2, landlordId: 4, salesmanId: 5, housekeeperId: 16, roomCount: 0, vacantCount: 0, createdAt: '2026-06-25', landlordName: '褚亮', landlordPhone: '13915151515', tenantName: '贺斌', tenantPhone: '13900000002', tenantLeaseStart: '2026-07-10', tenantLeaseEnd: '2028-07-09', tenantPaymentMethod: 'annual', rooms: [] },
  { id: 16, code: 'ZJ016', landlordPaymentMethod: 'monthly', bizType: 'shared', communityId: 16, communityName: '益丰新村', address: '浦东新区佳京路255弄', building: '6', unit: '3', roomNo: '301', layout: '四室一厅', buildingArea: 118, decoration: 'simple', landlordRent: 3800, rent: 5600, deposit: 2800, leaseStart: '2026-05-20', leaseEnd: '2027-05-19', status: 'rented', storeId: 4, groupId: 2, landlordId: 5, salesmanId: 20, housekeeperId: null, roomCount: 4, vacantCount: 2, createdAt: '2026-05-05',
    rooms: [
      { id: 122, leaseStart: '2026-09-04', setId: 16, roomNo: 'A', roomType: '主卧', rentPrice: 1800, listedPrice: 2000, status: 'rented', leaseEnd: '2027-04-30', paymentMethod: 'quarterly', depositAmount: 1800, tenantName: '唐娟', tenantPhone: '13900000017' },
      { id: 123, setId: 16, roomNo: 'B', roomType: '次卧', rentPrice: 1400, listedPrice: 1600, status: 'vacant', leaseEnd: null, paymentMethod: 'monthly', depositAmount: 1400, tenantName: null, tenantPhone: null },
      { id: 124, leaseStart: '2026-08-25', setId: 16, roomNo: 'C', roomType: '次卧', rentPrice: 1400, listedPrice: 1600, status: 'rented', leaseEnd: '2026-11-30', paymentMethod: 'monthly', depositAmount: 1400, tenantName: '曹俊', tenantPhone: '13900000018' },
      { id: 125, setId: 16, roomNo: 'D', roomType: '小卧', rentPrice: 1000, listedPrice: 1200, status: 'vacant', leaseEnd: null, paymentMethod: 'monthly', depositAmount: 1000, tenantName: null, tenantPhone: null },
    ]},
  { id: 17, code: 'ZJ017', landlordPaymentMethod: 'semi_annual', bizType: 'entire', communityId: 17, communityName: '仁恒河滨城', address: '浦东新区罗山路1809号', building: '5', unit: '2', roomNo: '1101', layout: '三室两厅', buildingArea: 132, decoration: 'luxury', landlordRent: 8500, rent: 12000, deposit: 12000, leaseStart: '2026-08-01', leaseEnd: '2027-07-31', status: 'rented', storeId: 2, groupId: 3, landlordId: 6, salesmanId: 17, housekeeperId: 19, roomCount: 0, vacantCount: 0, createdAt: '2026-07-20', landlordName: '孙建军', landlordPhone: '13913131313', tenantName: '邓超', tenantPhone: '13900000019', tenantLeaseStart: '2026-08-01', tenantLeaseEnd: '2027-07-31', tenantPaymentMethod: 'semi_annual', rooms: [] },
  { id: 18, code: 'ZJ018', landlordPaymentMethod: 'monthly', bizType: 'shared', communityId: 18, communityName: '大华锦绣华城', address: '浦东新区成山路2000号', building: '22', unit: '1', roomNo: '1103', layout: '四室两厅', buildingArea: 140, decoration: 'fine', landlordRent: 5200, rent: 7400, deposit: 3700, leaseStart: '2026-06-20', leaseEnd: '2027-06-19', status: 'rented', storeId: 5, groupId: 2, landlordId: 7, salesmanId: 5, housekeeperId: null, roomCount: 4, vacantCount: 1, createdAt: '2026-06-05',
    rooms: [
      { id: 126, leaseStart: '2026-08-28', setId: 18, roomNo: 'A', roomType: '主卧独卫', rentPrice: 2600, listedPrice: 2800, status: 'rented', leaseEnd: '2027-05-31', paymentMethod: 'quarterly', depositAmount: 2600, tenantName: '邓超', tenantPhone: '13900000019' },
      { id: 127, leaseStart: '2026-09-01', setId: 18, roomNo: 'B', roomType: '次卧', rentPrice: 1800, listedPrice: 2000, status: 'rented', leaseEnd: '2027-01-31', paymentMethod: 'quarterly', depositAmount: 1800, tenantName: '范玮', tenantPhone: '13900000020' },
      { id: 128, leaseStart: '2026-08-31', setId: 18, roomNo: 'C', roomType: '书房', rentPrice: 1600, listedPrice: 1800, status: 'rented', leaseEnd: '2026-12-31', paymentMethod: 'monthly', depositAmount: 1600, tenantName: '彭宇', tenantPhone: '13900000021' },
      { id: 129, setId: 18, roomNo: 'D', roomType: '小卧', rentPrice: 1400, listedPrice: 1600, status: 'vacant', leaseEnd: null, paymentMethod: 'monthly', depositAmount: 1400, tenantName: null, tenantPhone: null },
    ]},
  { id: 19, code: 'ZJ019', bizType: 'entire', communityId: 13, communityName: '香楠小区', address: '浦东新区香楠路88号', building: '7', unit: '2', roomNo: '603', layout: '两室一厅', buildingArea: 68, decoration: 'simple', landlordRent: 2900, rent: 4300, deposit: 4300, leaseStart: null, leaseEnd: null, status: 'vacant', storeId: 1, groupId: 1, landlordId: 8, salesmanId: 6, housekeeperId: 16, roomCount: 0, vacantCount: 0, createdAt: '2026-08-20', landlordName: '卫平', landlordPhone: '13916161616', rooms: [] },
  { id: 20, code: 'ZJ020', landlordPaymentMethod: 'monthly', bizType: 'entire', communityId: 15, communityName: '玉兰香苑', address: '浦东新区莲安西路123弄', building: '25', unit: '2', roomNo: '1201', layout: '三室一厅', buildingArea: 95, decoration: 'fine', landlordRent: 3800, rent: 5600, deposit: 5600, leaseStart: '2026-01-10', leaseEnd: '2026-09-09', status: 'rented', storeId: 5, groupId: 2, landlordId: 9, salesmanId: 5, housekeeperId: 16, roomCount: 0, vacantCount: 0, createdAt: '2026-01-05', landlordName: '韩雪', landlordPhone: '13919191919', tenantName: '章小鱼', tenantPhone: '13600000018', tenantLeaseStart: '2026-01-10', tenantLeaseEnd: '2026-09-09', tenantPaymentMethod: 'monthly', rooms: [] },
  { id: 21, code: 'ZJ021', landlordPaymentMethod: 'monthly', bizType: 'shared', communityId: 2, communityName: '张江家园', address: '浦东新区张江路128号', building: '12', unit: '1', roomNo: '801', layout: '三室两厅', buildingArea: 105, decoration: 'fine', landlordRent: 3800, rent: 5800, deposit: 2900, leaseStart: '2026-02-20', leaseEnd: '2027-02-19', status: 'rented', storeId: 1, groupId: 1, landlordId: 10, salesmanId: 4, housekeeperId: 15, roomCount: 3, vacantCount: 0, createdAt: '2026-02-05',
    rooms: [
      { id: 130, leaseStart: '2026-09-05', setId: 21, roomNo: 'A', roomType: '主卧', rentPrice: 2300, listedPrice: 2500, status: 'rented', leaseEnd: '2027-02-19', paymentMethod: 'quarterly', depositAmount: 2300, tenantName: '潘婷', tenantPhone: '13900000022' },
      { id: 131, leaseStart: '2026-08-28', setId: 21, roomNo: 'B', roomType: '次卧', rentPrice: 1900, listedPrice: 2100, status: 'rented', leaseEnd: '2026-12-31', paymentMethod: 'quarterly', depositAmount: 1900, tenantName: '俞飞', tenantPhone: '13900000023' },
      { id: 132, leaseStart: '2026-09-01', setId: 21, roomNo: 'C', roomType: '小卧', rentPrice: 1600, listedPrice: 1800, status: 'rented', leaseEnd: '2027-01-31', paymentMethod: 'monthly', depositAmount: 1600, tenantName: '崔健', tenantPhone: '13900000024' },
    ]},
  { id: 22, code: 'ZJ022', bizType: 'entire', communityId: 14, communityName: '川杨新苑', address: '浦东新区川杨河路296号', building: '20', unit: '2', roomNo: '1502', layout: '两室两厅', buildingArea: 88, decoration: 'fine', landlordRent: 3500, rent: 5300, deposit: 5300, leaseStart: '2026-03-10', leaseEnd: '2026-09-05', status: 'checkout', storeId: 1, groupId: 2, landlordId: 11, salesmanId: 5, housekeeperId: 15, roomCount: 0, vacantCount: 0, createdAt: '2026-02-25', landlordName: '吴刚', landlordPhone: '13912121212', tenantName: '华仔', tenantPhone: '13600000019', tenantLeaseStart: '2026-03-10', tenantLeaseEnd: '2026-09-05', tenantPaymentMethod: 'quarterly', rooms: [] },
];

// ============================================================
//  MOCK DATA: 退租记录
// ============================================================
const CHECKOUTS = [
  { id: 1, contractCode: 'CK-20260801', tenantName: '华仔', houseInfo: '川杨新苑 20-2-1502', checkoutDate: '2026-09-06', settlementAmount: 1500, reason: '合同到期正常退租', status: 'confirmed', remark: '已结清水电费', createdAt: '2026-08-01' },
  { id: 2, contractCode: 'CK-20260815', tenantName: '张伟', houseInfo: '张江汤臣豪园 5-1-802', checkoutDate: '2026-09-15', settlementAmount: 0, reason: '租客个人原因提前退租', status: 'pending', remark: '需退押金', createdAt: '2026-08-15' },
  { id: 3, contractCode: 'CK-20260820', tenantName: '刘丽', houseInfo: '联洋年华 9-1-601', checkoutDate: '2026-09-10', settlementAmount: -800, reason: '房屋质量问题', status: 'pending', remark: '房东需赔偿', createdAt: '2026-08-20' },
  { id: 4, contractCode: 'CK-20260825', tenantName: '王强', houseInfo: '海上国际花园 6-3-1201', checkoutDate: '2026-09-01', settlementAmount: 2000, reason: '合同到期正常退租', status: 'completed', remark: '', createdAt: '2026-08-25' },
];

// ============================================================
//  MOCK DATA: 押金记录
// ============================================================
const DEPOSITS = [
  { id: 1, contractCode: 'HT-20260101-001', tenantName: '华仔', houseInfo: '川杨新苑 20-2-1502', depositAmount: 3000, depositDate: '2026-01-05', status: 'pending', refundDate: '', deductReason: '', createdAt: '2026-01-05' },
  { id: 2, contractCode: 'HT-20260315-006', tenantName: '张伟', houseInfo: '张江汤臣豪园 5-1-802', depositAmount: 2400, depositDate: '2026-03-20', status: 'pending', refundDate: '', deductReason: '', createdAt: '2026-03-20' },
  { id: 3, contractCode: 'HT-20260510-012', tenantName: '刘丽', houseInfo: '联洋年华 9-1-601', depositAmount: 1800, depositDate: '2026-05-15', status: 'refunded', refundDate: '2026-08-30', deductReason: '', createdAt: '2026-05-15' },
  { id: 4, contractCode: 'HT-20260420-009', tenantName: '陈静', houseInfo: '金桥新村 12-1-401', depositAmount: 1500, depositDate: '2026-04-25', status: 'deducted', refundDate: '', deductReason: '墙面损坏扣款 500，剩余已退', createdAt: '2026-04-25' },
  { id: 5, contractCode: 'HT-20260601-015', tenantName: '王强', houseInfo: '海上国际花园 6-3-1201', depositAmount: 4000, depositDate: '2026-06-05', status: 'refunded', refundDate: '2026-09-01', deductReason: '', createdAt: '2026-06-05' },
  { id: 6, contractCode: 'HT-20260710-018', tenantName: '孙浩', houseInfo: '碧云国际社区 6-2-802', depositAmount: 3600, depositDate: '2026-07-15', status: 'pending', refundDate: '', deductReason: '', createdAt: '2026-07-15' },
];

// ============================================================
//  MOCK DATA: 出售房源
// ============================================================
const SALE_PROPERTIES = [
  { id: 1, code: 'SJ001', title: '张江汤臣豪园三室两厅', communityName: '张江汤臣豪园', communityId: 1, building: '5', unit: '1', floor: '10', roomNo: '1002', layoutRooms: 3, layoutHalls: 2, layoutBathrooms: 1, layoutBalconies: 1, buildingArea: 108, orientation: 'south_north', decoration: 'fine', elevator: 'yes', buildYear: 2015, totalPrice: 580, unitPrice: 53703, sourceChannel: 'store', ownerName: '刘建国', ownerPhone: '13911111111', status: 'selling', verified: true, createdAt: '2026-01-15', tags: ['满五唯一', '地铁房', '学区房'], propertyType: '住宅', floorPrice: 558, taxType: 'full', debt: 0, certificateType: 'full' },
  { id: 2, code: 'SJ002', title: '联洋年华两室一厅', communityName: '联洋年华', communityId: 4, building: '3', unit: '2', floor: '6', roomNo: '602', layoutRooms: 2, layoutHalls: 1, layoutBathrooms: 1, layoutBalconies: 0, buildingArea: 78, orientation: 'south', decoration: 'luxury', elevator: 'yes', buildYear: 2018, totalPrice: 420, unitPrice: 53846, sourceChannel: 'agent', ownerName: '王芳', ownerPhone: '13922222222', status: 'selling', verified: true, createdAt: '2026-02-01', tags: ['精装修', '地铁房'], propertyType: '住宅', floorPrice: 400, taxType: 'combined', debt: 80 },
  { id: 3, code: 'SJ003', title: '海上国际花园四室两厅', communityName: '海上国际花园', communityId: 5, building: '8', unit: '3', floor: '15', roomNo: '1501', layoutRooms: 4, layoutHalls: 2, layoutBathrooms: 2, layoutBalconies: 2, buildingArea: 165, orientation: 'south_north', decoration: 'luxury', elevator: 'yes', buildYear: 2020, totalPrice: 950, unitPrice: 57575, sourceChannel: 'referral', ownerName: '陈伟', ownerPhone: '13933333333', status: 'selling', verified: true, createdAt: '2026-03-10', tags: ['新房', '南北通透', '双阳台'], propertyType: '住宅' },
  { id: 4, code: 'SJ004', title: '金桥新村两室一厅', communityName: '金桥新村', communityId: 7, building: '12', unit: '1', floor: '4', roomNo: '401', layoutRooms: 2, layoutHalls: 1, layoutBathrooms: 1, layoutBalconies: 0, buildingArea: 65, orientation: 'east', decoration: 'simple', elevator: 'no', buildYear: 2005, totalPrice: 260, unitPrice: 40000, sourceChannel: '58', ownerName: '赵秀英', ownerPhone: '13944444444', status: 'sold', verified: true, createdAt: '2026-04-20', tags: ['低价急售'], propertyType: '住宅' },
  { id: 5, code: 'SJ005', title: '碧云国际社区三室两厅', communityName: '碧云国际社区', communityId: 8, building: '6', unit: '2', floor: '8', roomNo: '802', layoutRooms: 3, layoutHalls: 2, layoutBathrooms: 2, layoutBalconies: 1, buildingArea: 142, orientation: 'south_north', decoration: 'luxury', elevator: 'yes', buildYear: 2019, totalPrice: 850, unitPrice: 59859, sourceChannel: 'wechat', ownerName: '孙丽', ownerPhone: '13955555555', status: 'selling', verified: true, createdAt: '2026-05-15', tags: ['精装修', '地铁房', '学区房'], propertyType: '住宅' },
  { id: 6, code: 'SJ006', title: '万科金色城市三室一厅', communityName: '万科金色城市', communityId: 12, building: '8', unit: '1', floor: '12', roomNo: '1201', layoutRooms: 3, layoutHalls: 1, layoutBathrooms: 1, layoutBalconies: 1, buildingArea: 95, orientation: 'south', decoration: 'fine', elevator: 'yes', buildYear: 2021, totalPrice: 520, unitPrice: 54736, sourceChannel: 'beike', ownerName: '周强', ownerPhone: '13966666666', status: 'selling', verified: true, createdAt: '2026-06-01', tags: ['次新房', '精装修'], propertyType: '住宅' },
  { id: 7, code: 'SJ007', title: '张江家园两室一厅', communityName: '张江家园', communityId: 2, building: '3', unit: '2', floor: '5', roomNo: '502', layoutRooms: 2, layoutHalls: 1, layoutBathrooms: 1, layoutBalconies: 1, buildingArea: 82, orientation: 'south', decoration: 'fine', elevator: 'yes', buildYear: 2016, totalPrice: 380, unitPrice: 46341, sourceChannel: 'store', ownerName: '李明', ownerPhone: '13977777777', status: 'selling', verified: true, createdAt: '2026-07-01', tags: ['满五唯一'], propertyType: '住宅' },
  { id: 8, code: 'SJ008', title: '罗山花苑一室一厅', communityName: '罗山花苑', communityId: 10, building: '2', unit: '1', floor: '3', roomNo: '301', layoutRooms: 1, layoutHalls: 1, layoutBathrooms: 1, layoutBalconies: 0, buildingArea: 48, orientation: 'north', decoration: 'simple', elevator: 'no', buildYear: 2003, totalPrice: 165, unitPrice: 34375, sourceChannel: 'anjuke', ownerName: '张华', ownerPhone: '13988888888', status: 'off_shelf', verified: false, createdAt: '2026-07-20', tags: [], propertyType: '住宅' },
  { id: 9, code: 'SJ009', title: '川杨新苑两室一厅', communityName: '川杨新苑', communityId: 14, building: '9', unit: '2', floor: '11', roomNo: '1102', layoutRooms: 2, layoutHalls: 1, layoutBathrooms: 1, layoutBalconies: 1, buildingArea: 79, orientation: 'south', decoration: 'fine', elevator: 'yes', buildYear: 2012, totalPrice: 355, unitPrice: 44936, sourceChannel: '58', ownerName: '吴刚', ownerPhone: '13912121212', status: 'selling', verified: true, createdAt: '2026-08-01', tags: ['满五唯一', '电梯房'], propertyType: '住宅' },
  { id: 10, code: 'SJ010', title: '仁恒河滨城三室两厅', communityName: '仁恒河滨城', communityId: 17, building: '7', unit: '1', floor: '16', roomNo: '1601', layoutRooms: 3, layoutHalls: 2, layoutBathrooms: 2, layoutBalconies: 2, buildingArea: 155, orientation: 'south_north', decoration: 'luxury', elevator: 'yes', buildYear: 2017, totalPrice: 1180, unitPrice: 76129, sourceChannel: 'referral', ownerName: '郑浩', ownerPhone: '13913131313', status: 'selling', verified: true, createdAt: '2026-08-05', tags: ['南北通透', '高品质小区', '双阳台'], propertyType: '住宅' },
  { id: 11, code: 'SJ011', title: '玉兰香苑两室两厅', communityName: '玉兰香苑', communityId: 15, building: '20', unit: '1', floor: '6', roomNo: '602', layoutRooms: 2, layoutHalls: 2, layoutBathrooms: 1, layoutBalconies: 1, buildingArea: 84, orientation: 'south', decoration: 'simple', elevator: 'yes', buildYear: 2010, totalPrice: 310, unitPrice: 36904, sourceChannel: 'douyin', ownerName: '冯洁', ownerPhone: '13914141414', status: 'selling', verified: true, createdAt: '2026-08-10', tags: ['总价低'], propertyType: '住宅' },
  { id: 12, code: 'SJ012', title: '大华锦绣华城四室两厅', communityName: '大华锦绣华城', communityId: 18, building: '15', unit: '2', floor: '18', roomNo: '1801', layoutRooms: 4, layoutHalls: 2, layoutBathrooms: 2, layoutBalconies: 2, buildingArea: 172, orientation: 'south_north', decoration: 'fine', elevator: 'yes', buildYear: 2015, totalPrice: 890, unitPrice: 51744, sourceChannel: 'beike', ownerName: '褚亮', ownerPhone: '13915151515', status: 'selling', verified: true, createdAt: '2026-08-12', tags: ['满五唯一', '学区房'], propertyType: '住宅' },
  { id: 13, code: 'SJ013', title: '香楠小区一室一厅', communityName: '香楠小区', communityId: 13, building: '5', unit: '1', floor: '4', roomNo: '401', layoutRooms: 1, layoutHalls: 1, layoutBathrooms: 1, layoutBalconies: 0, buildingArea: 44, orientation: 'west', decoration: 'simple', elevator: 'no', buildYear: 1998, totalPrice: 138, unitPrice: 31363, sourceChannel: 'store', ownerName: '卫平', ownerPhone: '13916161616', status: 'sold', verified: true, createdAt: '2026-06-10', tags: ['低价急售'], propertyType: '住宅' },
  { id: 14, code: 'SJ014', title: '益丰新村三室一厅', communityName: '益丰新村', communityId: 16, building: '3', unit: '3', floor: '5', roomNo: '502', layoutRooms: 3, layoutHalls: 1, layoutBathrooms: 1, layoutBalconies: 1, buildingArea: 92, orientation: 'east', decoration: 'simple', elevator: 'no', buildYear: 2002, totalPrice: 298, unitPrice: 32391, sourceChannel: 'anjuke', ownerName: '蒋敏', ownerPhone: '13917171717', status: 'selling', verified: false, createdAt: '2026-08-18', tags: [], propertyType: '住宅' },
  { id: 15, code: 'SJ015', title: '碧云国际社区商铺', communityName: '碧云国际社区', communityId: 8, building: '1', unit: '1', floor: '1', roomNo: '102', layoutRooms: 0, layoutHalls: 1, layoutBathrooms: 1, layoutBalconies: 0, buildingArea: 120, orientation: 'south', decoration: 'rough', elevator: 'no', buildYear: 2013, totalPrice: 960, unitPrice: 80000, sourceChannel: 'agent', ownerName: '沈总', ownerPhone: '13918181818', status: 'selling', verified: true, createdAt: '2026-08-20', tags: ['商铺', '临街'], propertyType: '商铺' },
  { id: 16, code: 'SJ016', title: '张江汤臣豪园两室一厅', communityName: '张江汤臣豪园', communityId: 1, building: '15', unit: '2', floor: '7', roomNo: '702', layoutRooms: 2, layoutHalls: 1, layoutBathrooms: 1, layoutBalconies: 1, buildingArea: 74, orientation: 'south', decoration: 'fine', elevator: 'yes', buildYear: 2014, totalPrice: 398, unitPrice: 53783, sourceChannel: 'wechat', ownerName: '韩雪', ownerPhone: '13919191919', status: 'off_shelf', verified: true, createdAt: '2026-07-25', tags: ['满五唯一'], propertyType: '住宅' },
];

// ============================================================
//  MOCK DATA: 客源
// ============================================================
const CUSTOMERS = [
  { id: 1, name: '刘伟', phone: '13600000001', identity: 'rent_a', status: 'pending', source: '58', storeName: '张江店', employeeName: '李娜', remark: '预算3000-4000，张江地铁站附近', createdAt: '2026-08-01' },
  { id: 2, name: '陈丽', phone: '13600000002', identity: 'rent_a', status: 'following', source: 'beike', storeName: '张江店', employeeName: '王强', remark: '想看两室整租', createdAt: '2026-08-05' },
  { id: 3, name: '赵志强', phone: '13600000003', identity: 'buy', status: 'pending', source: 'douyin', storeName: '联洋店', employeeName: '陈静', remark: '预算400-500万，联洋附近学区房', createdAt: '2026-08-08' },
  { id: 4, name: '孙敏', phone: '13600000004', identity: 'rent_b', status: 'following', source: 'wechat', storeName: '张江店', employeeName: '刘洋', remark: '预算2000-3000，合租主卧', createdAt: '2026-08-10' },
  { id: 5, name: '周婷', phone: '13600000005', identity: 'rent_a', status: 'done', source: 'store', storeName: '浦东店', employeeName: '吴杰', remark: '已签约浦东世纪花园', createdAt: '2026-07-20' },
  { id: 6, name: '吴凯', phone: '13600000006', identity: 'buy', status: 'invalid', source: '58', storeName: '联洋店', employeeName: '陈静', remark: '已购其他区域', createdAt: '2026-07-15' },
  { id: 7, name: '郑瑶', phone: '13600000007', identity: 'rent_a', status: 'pending', source: 'anjuke', storeName: '张江店', employeeName: '李娜', remark: '预算4500-5500整租两室', createdAt: '2026-08-18' },
  { id: 8, name: '冯刚', phone: '13600000008', identity: 'both', status: 'following', source: 'agent', storeName: '浦东店', employeeName: '吴杰', remark: '可租可购，看性价比', createdAt: '2026-08-20' },
  { id: 9, name: '姜燕', phone: '13600000009', identity: 'rent_b', status: 'pending', source: 'wechat', storeName: '张江店', employeeName: '王强', remark: '预算1500-2000合租', createdAt: '2026-08-22' },
  { id: 10, name: '沈浩', phone: '13600000010', identity: 'rent_a', status: 'following', source: 'douyin', storeName: '联洋店', employeeName: '孙悦', remark: '预算5000-6000整租三室', createdAt: '2026-08-23' },
  { id: 11, name: '韩梅', phone: '13600000011', identity: 'buy', status: 'pending', source: 'beike', storeName: '张江店', employeeName: '刘洋', remark: '预算300-400万，张江学区房', createdAt: '2026-08-25' },
  { id: 12, name: '秦明', phone: '13600000012', identity: 'rent_a', status: 'pending', source: 'referral', storeName: '张江店', employeeName: '李娜', remark: '老客户介绍，预算4000-5000', createdAt: '2026-08-26' },
  { id: 13, name: '尤佳', phone: '13600000013', identity: 'rent_b', status: 'following', source: 'douyin', storeName: '联洋店', employeeName: '郑凯', remark: '预算1800-2500合租，近地铁', createdAt: '2026-08-27' },
  { id: 14, name: '许诺', phone: '13600000014', identity: 'buy', status: 'following', source: 'beike', storeName: '联洋店', employeeName: '陈静', remark: '预算600-800万，联洋四房改善', createdAt: '2026-08-25' },
  { id: 15, name: '何静怡', phone: '13600000015', identity: 'rent_a', status: 'pending', source: '58', storeName: '浦东店', employeeName: '吴杰', remark: '预算6500-7500整租三室，带宠物', createdAt: '2026-08-28' },
  { id: 16, name: '吕子乔', phone: '13600000016', identity: 'rent_b', status: 'following', source: 'wechat', storeName: '张江店', employeeName: '刘洋', remark: '预算1500合租次卧，短租3个月', createdAt: '2026-08-24' },
  { id: 17, name: '施诗', phone: '13600000017', identity: 'both', status: 'pending', source: 'agent', storeName: '浦东店', employeeName: '冯雪', remark: '先租后买，张江周边两房', createdAt: '2026-08-27' },
  { id: 18, name: '章小鱼', phone: '13600000018', identity: 'buy', status: 'following', source: 'douyin', storeName: '金桥店', employeeName: '卫东', remark: '预算280-320万，金桥学区两房', createdAt: '2026-08-20' },
  { id: 19, name: '华仔', phone: '13600000019', identity: 'rent_a', status: 'done', source: 'store', storeName: '张江店', employeeName: '王强', remark: '已签约香楠小区一室', createdAt: '2026-08-15' },
  { id: 20, name: '龙飘飘', phone: '13600000020', identity: 'rent_a', status: 'invalid', source: 'anjuke', storeName: '联洋店', employeeName: '孙悦', remark: '号码空号，无法联系', createdAt: '2026-08-10' },
];

// ============================================================
//  MOCK DATA: 储备房源/客源
// ============================================================
const RESERVE_PROPERTIES = [
  { id: 1, title: '张江地铁站三室两厅', communityName: '张江汤臣豪园', ownerName: '刘建国', ownerPhone: '13911111111', expectedPrice: 6500, status: 'reserved', diskType: 'house', source: '58', createdAt: '2026-08-01' },
  { id: 2, title: '联洋商圈两室一厅', communityName: '联洋年华', ownerName: '王芳', ownerPhone: '13922222222', expectedPrice: 4800, status: 'pending', diskType: 'house', source: 'agent', createdAt: '2026-08-05' },
  { id: 3, title: '花木地铁口商铺', communityName: '浦东世纪花园', ownerName: '陈伟', ownerPhone: '13933333333', expectedPrice: 12000, status: 'reserved', diskType: 'shop', source: 'referral', createdAt: '2026-08-08' },
  { id: 4, title: '张江科技园写字楼', communityName: '张江科技园', ownerName: '赵秀英', ownerPhone: '13944444444', expectedPrice: 15000, status: 'cancelled', diskType: 'office', source: 'beike', createdAt: '2026-07-20' },
  { id: 5, title: '碧云国际公寓', communityName: '碧云国际社区', ownerName: '孙丽', ownerPhone: '13955555555', expectedPrice: 8000, status: 'pending', diskType: 'apartment', source: 'wechat', createdAt: '2026-08-15' },
  { id: 6, title: '川杨新苑两室一厅', communityName: '川杨新苑', ownerName: '吴刚', ownerPhone: '13912121212', expectedPrice: 4300, status: 'reserved', diskType: 'house', source: '58', createdAt: '2026-08-18' },
  { id: 7, title: '大华锦绣华城三室两厅', communityName: '大华锦绣华城', ownerName: '褚亮', ownerPhone: '13915151515', expectedPrice: 7800, status: 'pending', diskType: 'house', source: 'beike', createdAt: '2026-08-20' },
  { id: 8, title: '香楠路临街商铺', communityName: '香楠小区', ownerName: '卫平', ownerPhone: '13916161616', expectedPrice: 9500, status: 'reserved', diskType: 'shop', source: 'store', createdAt: '2026-08-22' },
  { id: 9, title: '张江写字楼B座902', communityName: '张江科技园', ownerName: '蒋敏', ownerPhone: '13917171717', expectedPrice: 13500, status: 'pending', diskType: 'office', source: 'agent', createdAt: '2026-08-25' },
  { id: 10, title: '玉兰香苑一室一厅', communityName: '玉兰香苑', ownerName: '韩雪', ownerPhone: '13919191919', expectedPrice: 3200, status: 'cancelled', diskType: 'house', source: 'douyin', createdAt: '2026-08-10' },
];
const RESERVE_CLIENTS = [
  { id: 1, clientName: '刘伟', clientMobile: '13600000001', desiredLocation: '张江', demandType: 'rent', desiredLayout: '两室一厅', areaMin: 60, areaMax: 90, priceMin: 3000, priceMax: 4000, sourceChannel: '58', usage: '自住', urgency: 'normal', ownership: 'private', status: 'active', dataSource: 'online', salesmanName: '李娜', createdAt: '2026-08-01' },
  { id: 2, clientName: '赵志强', clientMobile: '13600000003', desiredLocation: '联洋', demandType: 'buy', desiredLayout: '三室一厅', areaMin: 80, areaMax: 120, priceMin: 400, priceMax: 500, sourceChannel: 'douyin', usage: '自住', urgency: 'urgent', ownership: 'private', status: 'active', dataSource: 'online', salesmanName: '陈静', createdAt: '2026-08-08' },
  { id: 3, clientName: '冯刚', clientMobile: '13600000008', desiredLocation: '浦东', demandType: 'rent_buy', desiredLayout: '三室两厅', areaMin: 90, areaMax: 130, priceMin: 5000, priceMax: 8000, sourceChannel: 'agent', usage: '家庭', urgency: 'normal', ownership: 'private', status: 'active', dataSource: 'agent', salesmanName: '吴杰', createdAt: '2026-08-20' },
];

// ============================================================
//  MOCK DATA: 黑名单
// ============================================================
const BLACKLIST = [
  { id: 1, name: '张某某', mobile: '13700000001', type: 'debt', reason: '欠缴3个月房租并失联', source: '张江店', status: 'active', storeId: 1, createdAt: '2026-06-15' },
  { id: 2, name: '李某某', mobile: '13700000002', type: 'damage', reason: '恶意损坏房屋设施，墙面打穿多处', source: '联洋店', status: 'active', storeId: 2, createdAt: '2026-07-01' },
  { id: 3, name: '王某某', mobile: '13700000003', type: 'noise', reason: '多次被邻居投诉噪音扰民，拒不整改', source: '浦东店', status: 'active', storeId: 3, createdAt: '2026-07-10' },
  { id: 4, name: '赵某某', mobile: '13700000004', type: 'fraud', reason: '伪造身份证和房产证进行诈骗', source: '张江店', status: 'active', storeId: 1, createdAt: '2026-07-20' },
  { id: 5, name: '陈某某', mobile: '13700000005', type: 'breach', reason: '签约后7天无故解约，拒绝支付违约金', source: '联洋店', status: 'inactive', storeId: 2, createdAt: '2026-06-01' },
  { id: 6, name: '林某某', mobile: '13700000006', type: 'debt', reason: '退租后欠缴水电燃气费共计1200元', source: '浦东店', status: 'active', storeId: 3, createdAt: '2026-07-25' },
  { id: 7, name: '黄某某', mobile: '13700000007', type: 'damage', reason: '退租时屋内家具家电丢失，拒绝赔偿', source: '张江店', status: 'active', storeId: 1, createdAt: '2026-08-02' },
  { id: 8, name: '徐某某', mobile: '13700000008', type: 'noise', reason: '深夜聚会扰民，物业多次警告无效', source: '金桥店', status: 'active', storeId: 4, createdAt: '2026-08-08' },
  { id: 9, name: '马某某', mobile: '13700000009', type: 'fraud', reason: '冒充房东对外转租，骗取押金', source: '联洋店', status: 'active', storeId: 2, createdAt: '2026-08-12' },
  { id: 10, name: '宋某某', mobile: '13700000010', type: 'other', reason: '多次辱骂物业及管家人员', source: '北蔡店', status: 'active', storeId: 5, createdAt: '2026-08-18' },
  { id: 11, name: '唐某某', mobile: '13700000011', type: 'breach', reason: '合同期内擅自转租他人，已提前解约', source: '浦东店', status: 'inactive', storeId: 3, createdAt: '2026-05-20' },
];

// ============================================================
//  MOCK DATA: 财务
// ============================================================
const BILLS = [
  { id: 1, title: '张江汤臣豪园802租金-刘洋', category: 'rent', amount: 6200, paidAmount: 6200, status: 'paid', tenantName: '刘洋', houseTitle: '张江汤臣豪园12-1-802', billDate: '2026-08-01', dueDate: '2026-08-10', createdAt: '2026-08-01 09:00:00' },
  { id: 2, title: '张江汤臣豪园501-A租金-陈静', category: 'rent', amount: 2800, paidAmount: 2800, status: 'paid', tenantName: '陈静', houseTitle: '张江汤臣豪园8-2-501A', billDate: '2026-08-01', dueDate: '2026-08-10', createdAt: '2026-08-01 09:00:00' },
  { id: 3, title: '张江汤臣豪园501-B租金-赵磊', category: 'rent', amount: 2200, paidAmount: 2200, status: 'paid', tenantName: '赵磊', houseTitle: '张江汤臣豪园8-2-501B', billDate: '2026-08-01', dueDate: '2026-08-10', createdAt: '2026-08-01 09:00:00' },
  { id: 4, title: '张江汤臣豪园501-C租金', category: 'rent', amount: 2000, paidAmount: 0, status: 'pending', tenantName: '钱峰', houseTitle: '张江汤臣豪园8-2-501C', billDate: '2026-08-01', dueDate: '2026-08-10', createdAt: '2026-08-01 09:00:00' },
  { id: 5, title: '张江家园302-A租金-孙悦', category: 'rent', amount: 2200, paidAmount: 2200, status: 'paid', tenantName: '孙悦', houseTitle: '张江家园5-1-302A', billDate: '2026-08-05', dueDate: '2026-08-15', createdAt: '2026-08-05 10:00:00' },
  { id: 6, title: '张江家园302-B租金-周涛', category: 'rent', amount: 1800, paidAmount: 0, status: 'overdue', tenantName: '周涛', houseTitle: '张江家园5-1-302B', billDate: '2026-08-05', dueDate: '2026-08-15', createdAt: '2026-08-05 10:00:00' },
  { id: 7, title: '城市经典花园1501物业费', category: 'property', amount: 360, paidAmount: 360, status: 'paid', tenantName: '吴杰', houseTitle: '城市经典花园3-2-1501', billDate: '2026-08-10', dueDate: '2026-08-20', createdAt: '2026-08-10 11:00:00' },
  { id: 8, title: '联洋年华601水费', category: 'water', amount: 85, paidAmount: 0, status: 'pending', tenantName: '吴杰', houseTitle: '联洋年华9-1-601', billDate: '2026-08-15', dueDate: '2026-08-25', createdAt: '2026-08-15 14:00:00' },
  { id: 9, title: '金桥新村401电费', category: 'electric', amount: 156, paidAmount: 156, status: 'paid', tenantName: '黄磊', houseTitle: '金桥新村15-2-401A', billDate: '2026-08-10', dueDate: '2026-08-20', createdAt: '2026-08-10 15:00:00' },
  { id: 10, title: '张江汤臣豪园802物业费', category: 'property', amount: 340, paidAmount: 0, status: 'pending', tenantName: '刘洋', houseTitle: '张江汤臣豪园12-1-802', billDate: '2026-08-20', dueDate: '2026-08-30', createdAt: '2026-08-20 16:00:00' },
  { id: 11, title: '海上国际花园1201燃气费', category: 'gas', amount: 68, paidAmount: 68, status: 'paid', tenantName: '周涛', houseTitle: '海上国际花园6-3-1201', billDate: '2026-08-10', dueDate: '2026-08-20', createdAt: '2026-08-10 09:30:00' },
  { id: 12, title: '浦东世纪花园901租金-刘洋', category: 'rent', amount: 7500, paidAmount: 7500, status: 'paid', tenantName: '刘洋', houseTitle: '浦东世纪花园2-1-901', billDate: '2026-08-01', dueDate: '2026-08-10', createdAt: '2026-08-01 08:00:00' },
  { id: 13, title: '香楠小区201租金', category: 'rent', amount: 3900, paidAmount: 3900, status: 'paid', tenantName: '潘月', houseTitle: '香楠小区3-1-201', billDate: '2026-08-15', dueDate: '2026-08-25', createdAt: '2026-08-15 09:00:00' },
  { id: 14, title: '川杨新苑704-A租金-罗琳', category: 'rent', amount: 1900, paidAmount: 1900, status: 'paid', tenantName: '罗琳', houseTitle: '川杨新苑11-2-704A', billDate: '2026-08-10', dueDate: '2026-08-20', createdAt: '2026-08-10 09:00:00' },
  { id: 15, title: '川杨新苑704-B租金-谢芳', category: 'rent', amount: 1600, paidAmount: 800, status: 'partial', tenantName: '谢芳', houseTitle: '川杨新苑11-2-704B', billDate: '2026-08-10', dueDate: '2026-08-20', createdAt: '2026-08-10 09:00:00' },
  { id: 16, title: '玉兰香苑502物业费', category: 'property', amount: 228, paidAmount: 0, status: 'pending', tenantName: '邓成', houseTitle: '玉兰香苑18-1-502', billDate: '2026-08-20', dueDate: '2026-08-30', createdAt: '2026-08-20 10:00:00' },
  { id: 17, title: '仁恒河滨城1101租金', category: 'rent', amount: 12000, paidAmount: 12000, status: 'paid', tenantName: '贺斌', houseTitle: '仁恒河滨城5-2-1101', billDate: '2026-08-01', dueDate: '2026-08-05', createdAt: '2026-08-01 09:00:00' },
  { id: 18, title: '益丰新村301-A电费', category: 'electric', amount: 210, paidAmount: 210, status: 'paid', tenantName: '唐娟', houseTitle: '益丰新村6-3-301A', billDate: '2026-08-12', dueDate: '2026-08-22', createdAt: '2026-08-12 11:00:00' },
  { id: 19, title: '大华锦绣华城1103-A租金-邓超', category: 'rent', amount: 2600, paidAmount: 0, status: 'overdue', tenantName: '邓超', houseTitle: '大华锦绣华城22-1-1103A', billDate: '2026-08-10', dueDate: '2026-08-20', createdAt: '2026-08-10 09:00:00' },
  { id: 20, title: '张江家园801-A租金-潘婷', category: 'rent', amount: 2300, paidAmount: 2300, status: 'paid', tenantName: '潘婷', houseTitle: '张江家园12-1-801A', billDate: '2026-08-05', dueDate: '2026-08-15', createdAt: '2026-08-05 09:00:00' },
  { id: 21, title: '玉兰香苑1201水费', category: 'water', amount: 46, paidAmount: 46, status: 'paid', tenantName: '鲁强', houseTitle: '玉兰香苑25-2-1201', billDate: '2026-08-18', dueDate: '2026-08-28', createdAt: '2026-08-18 14:00:00' },
  { id: 22, title: '香楠小区201电费', category: 'electric', amount: 132, paidAmount: 0, status: 'pending', tenantName: '潘月', houseTitle: '香楠小区3-1-201', billDate: '2026-08-22', dueDate: '2026-09-01', createdAt: '2026-08-22 15:00:00' },
];

const FLOWS = [
  { id: 1, title: '张江汤臣豪园802租金收入', type: 'income', amount: 6200, paymentType: 'bank', houseTitle: '张江汤臣豪园12-1-802', customerName: '刘洋', flowDate: '2026-08-01', createdAt: '2026-08-01 09:00:00' },
  { id: 2, title: '张江汤臣豪园501-A租金收入', type: 'income', amount: 2800, paymentType: 'wechat', houseTitle: '张江汤臣豪园8-2-501A', customerName: '陈静', flowDate: '2026-08-01', createdAt: '2026-08-01 09:30:00' },
  { id: 3, title: '支付房东刘建国房租', type: 'expense', amount: 4500, paymentType: 'bank', houseTitle: '张江汤臣豪园12-1-802', customerName: '刘建国', flowDate: '2026-08-05', createdAt: '2026-08-05 10:00:00' },
  { id: 4, title: '支付房东王芳房租', type: 'expense', amount: 3500, paymentType: 'bank', houseTitle: '张江家园5-1-302', customerName: '王芳', flowDate: '2026-08-05', createdAt: '2026-08-05 10:30:00' },
  { id: 5, title: '城市经典花园1501租金收入', type: 'income', amount: 8500, paymentType: 'bank', houseTitle: '城市经典花园3-2-1501', customerName: '吴杰', flowDate: '2026-08-01', createdAt: '2026-08-01 08:00:00' },
  { id: 6, title: '联洋年华601-A租金收入', type: 'income', amount: 3200, paymentType: 'alipay', houseTitle: '联洋年华9-1-601A', customerName: '钱峰', flowDate: '2026-08-01', createdAt: '2026-08-01 09:00:00' },
  { id: 7, title: '装修费-金桥新村401', type: 'expense', amount: 8500, paymentType: 'bank', houseTitle: '金桥新村15-2-401', flowDate: '2026-08-10', createdAt: '2026-08-10 14:00:00' },
  { id: 8, title: '物业费-张江汤臣豪园802', type: 'expense', amount: 340, paymentType: 'bank', houseTitle: '张江汤臣豪园12-1-802', flowDate: '2026-08-15', createdAt: '2026-08-15 11:00:00' },
  { id: 9, title: '碧云国际社区702租金收入', type: 'income', amount: 8000, paymentType: 'bank', houseTitle: '碧云国际社区9-1-702', customerName: '许晴', flowDate: '2026-08-01', createdAt: '2026-08-01 09:00:00' },
  { id: 10, title: '浦东世纪花园901租金收入', type: 'income', amount: 7500, paymentType: 'bank', houseTitle: '浦东世纪花园2-1-901', customerName: '刘洋', flowDate: '2026-08-01', createdAt: '2026-08-01 08:00:00' },
  { id: 11, title: '仁恒河滨城1101租金收入', type: 'income', amount: 12000, paymentType: 'bank', houseTitle: '仁恒河滨城5-2-1101', customerName: '贺斌', flowDate: '2026-08-01', createdAt: '2026-08-01 09:10:00' },
  { id: 12, title: '玉兰香苑502租金收入', type: 'income', amount: 5000, paymentType: 'wechat', houseTitle: '玉兰香苑18-1-502', customerName: '邓成', flowDate: '2026-08-10', createdAt: '2026-08-10 09:00:00' },
  { id: 13, title: '支付房东孙丽房租', type: 'expense', amount: 5500, paymentType: 'bank', houseTitle: '碧云国际社区9-1-702', customerName: '孙丽', flowDate: '2026-08-08', createdAt: '2026-08-08 10:00:00' },
  { id: 14, title: '香楠小区201租金收入', type: 'income', amount: 3900, paymentType: 'alipay', houseTitle: '香楠小区3-1-201', customerName: '潘月', flowDate: '2026-08-15', createdAt: '2026-08-15 09:20:00' },
  { id: 15, title: '维修费-川杨新苑704空调加氟', type: 'expense', amount: 380, paymentType: 'wechat', houseTitle: '川杨新苑11-2-704', flowDate: '2026-08-18', createdAt: '2026-08-18 16:00:00' },
  { id: 16, title: '张江家园801-A租金收入', type: 'income', amount: 2300, paymentType: 'bank', houseTitle: '张江家园12-1-801A', customerName: '潘婷', flowDate: '2026-08-05', createdAt: '2026-08-05 09:05:00' },
  { id: 17, title: '保洁费-大华锦绣华城1103', type: 'expense', amount: 260, paymentType: 'alipay', houseTitle: '大华锦绣华城22-1-1103', flowDate: '2026-08-20', createdAt: '2026-08-20 13:00:00' },
  { id: 18, title: '川杨新苑704-A租金收入', type: 'income', amount: 1900, paymentType: 'wechat', houseTitle: '川杨新苑11-2-704A', customerName: '罗琳', flowDate: '2026-08-10', createdAt: '2026-08-10 09:15:00' },
  { id: 19, title: '益丰新村301-A租金收入', type: 'income', amount: 1800, paymentType: 'bank', houseTitle: '益丰新村6-3-301A', customerName: '唐娟', flowDate: '2026-08-20', createdAt: '2026-08-20 09:00:00' },
  { id: 20, title: '中介费收入-售房SJ013', type: 'income', amount: 27600, paymentType: 'bank', houseTitle: '香楠小区5-1-401', customerName: '卫平', flowDate: '2026-08-22', createdAt: '2026-08-22 15:00:00' },
];

const PAYMENT_PLANS = [
  { id: 1, title: '张江汤臣豪园802租金', planType: 'income', amount: 6200, planDate: '2026-09-01', actualDate: null, status: 'pending', houseTitle: '张江汤臣豪园12-1-802', billingCategory: '租金', reason: null, totalPeriods: 12, totalAmount: 74400, auditStatus: null, createdAt: '2026-08-01' },
  { id: 2, title: '支付房东刘建国房租', planType: 'expense', amount: 4500, planDate: '2026-09-05', actualDate: null, status: 'pending', houseTitle: '张江汤臣豪园12-1-802', billingCategory: null, reason: '固定月付房租', totalPeriods: 12, totalAmount: 54000, auditStatus: 'approved', createdAt: '2026-08-01' },
  { id: 3, title: '张江汤臣豪园501-A租金', planType: 'income', amount: 2800, planDate: '2026-09-01', actualDate: null, status: 'pending', houseTitle: '张江汤臣豪园8-2-501A', billingCategory: '租金', reason: null, createdAt: '2026-08-01' },
  { id: 4, title: '装修费-金桥新村401', planType: 'expense', amount: 8500, planDate: '2026-09-10', actualDate: null, status: 'pending', houseTitle: '金桥新村15-2-401', billingCategory: null, reason: '次卧墙面翻新', auditStatus: 'pending', createdAt: '2026-08-10' },
  { id: 5, title: '城市经典花园1501租金', planType: 'income', amount: 8500, planDate: '2026-09-01', actualDate: '2026-08-28', status: 'completed', houseTitle: '城市经典花园3-2-1501', billingCategory: '租金', reason: null, createdAt: '2026-08-01' },
  { id: 6, title: '仁恒河滨城1101租金', planType: 'income', amount: 12000, planDate: '2026-09-01', actualDate: null, status: 'pending', houseTitle: '仁恒河滨城5-2-1101', billingCategory: '租金', reason: null, totalPeriods: 12, totalAmount: 144000, createdAt: '2026-08-01' },
  { id: 7, title: '支付房东孙丽房租', planType: 'expense', amount: 5500, planDate: '2026-09-08', actualDate: null, status: 'pending', houseTitle: '碧云国际社区9-1-702', billingCategory: null, reason: '固定月付房租', totalPeriods: 12, totalAmount: 66000, auditStatus: 'approved', createdAt: '2026-08-01' },
  { id: 8, title: '玉兰香苑502租金', planType: 'income', amount: 5000, planDate: '2026-09-10', actualDate: null, status: 'pending', houseTitle: '玉兰香苑18-1-502', billingCategory: '租金', reason: null, totalPeriods: 24, totalAmount: 120000, createdAt: '2026-08-10' },
  { id: 9, title: '益丰新村301-A租金', planType: 'income', amount: 1800, planDate: '2026-09-20', actualDate: null, status: 'pending', houseTitle: '益丰新村6-3-301A', billingCategory: '租金', reason: null, createdAt: '2026-08-20' },
  { id: 10, title: '空调更换-金桥新村401', planType: 'expense', amount: 4200, planDate: '2026-09-15', actualDate: null, status: 'pending', houseTitle: '金桥新村15-2-401', billingCategory: null, reason: '客厅空调老化更换', auditStatus: 'pending', createdAt: '2026-08-22' },
  { id: 11, title: '张江家园302-B租金', planType: 'income', amount: 1800, planDate: '2026-08-05', actualDate: null, status: 'overdue', houseTitle: '张江家园5-1-302B', billingCategory: '租金', reason: null, createdAt: '2026-07-20' },
];

const ARREARS = [
  { id: 1, name: '周涛', identity: 'rent_b', phone: '13900000005', amount: 3600, paidAmount: 0, remainAmount: 3600, status: 'overdue', createdAt: '2026-08-15' },
  { id: 2, name: '钱峰', identity: 'rent_a', phone: '13900000007', amount: 2000, paidAmount: 0, remainAmount: 2000, status: 'pending', createdAt: '2026-08-20' },
  { id: 3, name: '吴杰', identity: 'rent_a', phone: '13900000006', amount: 85, paidAmount: 0, remainAmount: 85, status: 'pending', createdAt: '2026-08-15' },
  { id: 4, name: '邓超', identity: 'rent_a', phone: '13900000019', amount: 2600, paidAmount: 0, remainAmount: 2600, status: 'overdue', createdAt: '2026-08-20' },
  { id: 5, name: '谢芳', identity: 'rent_b', phone: '13900000016', amount: 1600, paidAmount: 800, remainAmount: 800, status: 'partial', createdAt: '2026-08-20' },
  { id: 6, name: '刘伟', identity: 'rent_a', phone: '13600000001', amount: 340, paidAmount: 0, remainAmount: 340, status: 'pending', createdAt: '2026-08-22' },
];

const PAYOUTS = [
  { id: 1, batchNo: 'ZF202608001', accountName: '刘建国', bankCardNo: '6222****1234', bankName: '工商银行', cardType: '储蓄卡', payoutAmount: 4500, payableAmount: 4500, actualAmount: 4500, operateDate: '2026-08-05', status: 'paid', createdAt: '2026-08-05 10:00:00' },
  { id: 2, batchNo: 'ZF202608002', accountName: '王芳', bankCardNo: '6222****5678', bankName: '建设银行', cardType: '储蓄卡', payoutAmount: 3500, payableAmount: 3500, actualAmount: 3500, operateDate: '2026-08-05', status: 'paid', createdAt: '2026-08-05 10:30:00' },
  { id: 3, batchNo: 'ZF202608003', accountName: '张伟装修队', bankCardNo: '6222****9012', bankName: '农业银行', cardType: '储蓄卡', payoutAmount: 8500, payableAmount: 8500, actualAmount: 8500, operateDate: '2026-08-10', status: 'paid', createdAt: '2026-08-10 14:00:00' },
  { id: 4, batchNo: 'ZF202608004', accountName: '浦东物业公司', bankCardNo: '6222****3456', bankName: '中国银行', cardType: '储蓄卡', payoutAmount: 340, payableAmount: 340, actualAmount: 340, operateDate: '2026-08-15', status: 'paid', createdAt: '2026-08-15 11:00:00' },
  { id: 5, batchNo: 'ZF202609001', accountName: '刘建国', bankCardNo: '6222****1234', bankName: '工商银行', cardType: '储蓄卡', payoutAmount: 4500, payableAmount: 4500, actualAmount: 0, operateDate: '2026-09-05', status: 'pending', createdAt: '2026-09-01 10:00:00' },
  { id: 6, batchNo: 'ZF202609002', accountName: '孙丽', bankCardNo: '6222****2468', bankName: '招商银行', cardType: '储蓄卡', payoutAmount: 5500, payableAmount: 5500, actualAmount: 0, operateDate: '2026-09-08', status: 'pending', createdAt: '2026-09-01 10:05:00' },
  { id: 7, batchNo: 'ZF202608005', accountName: '上海电力公司', bankCardNo: '6222****1357', bankName: '工商银行', cardType: '对公账户', payoutAmount: 156, payableAmount: 156, actualAmount: 156, operateDate: '2026-08-18', status: 'paid', createdAt: '2026-08-18 09:30:00' },
  { id: 8, batchNo: 'ZF202608006', accountName: '恒信维修公司', bankCardNo: '6222****8642', bankName: '农业银行', cardType: '对公账户', payoutAmount: 380, payableAmount: 380, actualAmount: 380, operateDate: '2026-08-18', status: 'paid', createdAt: '2026-08-18 16:30:00' },
];

const INVOICES = [
  { id: 1, applySource: 'bill', buyerName: '刘洋', buyerTaxNo: null, amountWithoutTax: 5849.06, taxAmount: 350.94, amountWithTax: 6200, remark: '张江汤臣豪园802租金', issuer: '赵财务', status: 'issued', createdAt: '2026-08-10' },
  { id: 2, applySource: 'bill', buyerName: '陈静', buyerTaxNo: null, amountWithoutTax: 2641.51, taxAmount: 158.49, amountWithTax: 2800, remark: '张江汤臣豪园501-A租金', issuer: '赵财务', status: 'issued', createdAt: '2026-08-10' },
  { id: 3, applySource: 'manual', buyerName: '腾飞科技有限公司', buyerTaxNo: '9144XXXXXXXXXXXX', amountWithoutTax: 7547.17, taxAmount: 452.83, amountWithTax: 8000, remark: '公司租赁发票', issuer: null, status: 'pending', createdAt: '2026-08-20' },
  { id: 4, applySource: 'bill', buyerName: '贺斌', buyerTaxNo: null, amountWithoutTax: 11320.75, taxAmount: 679.25, amountWithTax: 12000, remark: '仁恒河滨城1101租金', issuer: '赵财务', status: 'issued', createdAt: '2026-08-05' },
  { id: 5, applySource: 'bill', buyerName: '邓成', buyerTaxNo: null, amountWithoutTax: 4716.98, taxAmount: 283.02, amountWithTax: 5000, remark: '玉兰香苑502租金', issuer: '赵财务', status: 'issued', createdAt: '2026-08-12' },
  { id: 6, applySource: 'manual', buyerName: '卫平', buyerTaxNo: null, amountWithoutTax: 26037.74, taxAmount: 1562.26, amountWithTax: 27600, remark: '售房中介费发票', issuer: null, status: 'pending', createdAt: '2026-08-23' },
  { id: 7, applySource: 'bill', buyerName: '刘洋', buyerTaxNo: null, amountWithoutTax: 7358.49, taxAmount: 441.51, amountWithTax: 7800, remark: '浦东世纪花园901租金+物业费', issuer: '赵财务', status: 'void', createdAt: '2026-08-08' },
];

// ============================================================
//  MOCK DATA: 报表数据
// ============================================================
const PROFITS = [
  { id: 1, period: '2026-03', income: 172400, cost: 79100, profit: 93300, margin: 54.1 },
  { id: 2, period: '2026-04', income: 178600, cost: 80200, profit: 98400, margin: 55.1 },
  { id: 3, period: '2026-05', income: 181900, cost: 81400, profit: 100500, margin: 55.3 },
  { id: 4, period: '2026-06', income: 186500, cost: 82300, profit: 104200, margin: 55.9 },
  { id: 5, period: '2026-07', income: 198200, cost: 85600, profit: 112600, margin: 56.8 },
  { id: 6, period: '2026-08', income: 216800, cost: 89200, profit: 127600, margin: 58.9 },
];
const INCOME_COSTS = [
  { id: 1, period: '2026-03', rentIncome: 138000, depositIncome: 24000, energyIncome: 7600, otherIncome: 2800, rentCost: 58000, energyCost: 7600, decorateCost: 6500, laborCost: 4200, otherCost: 800, totalIncome: 172400, totalCost: 79100 },
  { id: 2, period: '2026-04', rentIncome: 141000, depositIncome: 26000, energyIncome: 7900, otherIncome: 3700, rentCost: 59000, energyCost: 7900, decorateCost: 7200, laborCost: 4200, otherCost: 1900, totalIncome: 178600, totalCost: 80200 },
  { id: 3, period: '2026-05', rentIncome: 143500, depositIncome: 27000, energyIncome: 8200, otherIncome: 3200, rentCost: 60000, energyCost: 8200, decorateCost: 6800, laborCost: 4400, otherCost: 2000, totalIncome: 181900, totalCost: 81400 },
  { id: 4, period: '2026-06', rentIncome: 145000, depositIncome: 28000, energyIncome: 8500, otherIncome: 5000, rentCost: 62000, energyCost: 8500, decorateCost: 6000, laborCost: 4800, otherCost: 1000, totalIncome: 186500, totalCost: 82300 },
  { id: 5, period: '2026-07', rentIncome: 152000, depositIncome: 32000, energyIncome: 9200, otherIncome: 5000, rentCost: 64000, energyCost: 9200, decorateCost: 7000, laborCost: 4800, otherCost: 600, totalIncome: 198200, totalCost: 85600 },
  { id: 6, period: '2026-08', rentIncome: 168000, depositIncome: 35000, energyIncome: 9800, otherIncome: 4000, rentCost: 68000, energyCost: 9800, decorateCost: 5000, laborCost: 5400, otherCost: 1000, totalIncome: 216800, totalCost: 89200 },
];
const PERFORMANCES = [
  { id: 1, employeeName: '李娜', period: '2026-08', newHouseCount: 3, newCustomerCount: 8, showingCount: 25, dealCount: 4, totalPerformance: 98500, distributed: 49250, retained: 24625, transferred: 24625, commission: 9850 },
  { id: 2, employeeName: '王强', period: '2026-08', newHouseCount: 2, newCustomerCount: 6, showingCount: 18, dealCount: 3, totalPerformance: 75600, distributed: 37800, retained: 18900, transferred: 18900, commission: 7560 },
  { id: 3, employeeName: '刘洋', period: '2026-08', newHouseCount: 4, newCustomerCount: 10, showingCount: 30, dealCount: 5, totalPerformance: 120000, distributed: 60000, retained: 30000, transferred: 30000, commission: 12000 },
  { id: 4, employeeName: '陈静', period: '2026-08', newHouseCount: 1, newCustomerCount: 5, showingCount: 15, dealCount: 2, totalPerformance: 52000, distributed: 26000, retained: 13000, transferred: 13000, commission: 5200 },
  { id: 5, employeeName: '吴杰', period: '2026-08', newHouseCount: 2, newCustomerCount: 4, showingCount: 12, dealCount: 2, totalPerformance: 48000, distributed: 24000, retained: 12000, transferred: 12000, commission: 4800 },
  { id: 6, employeeName: '郑凯', period: '2026-08', newHouseCount: 2, newCustomerCount: 6, showingCount: 16, dealCount: 2, totalPerformance: 61500, distributed: 30750, retained: 15375, transferred: 15375, commission: 6150 },
  { id: 7, employeeName: '冯雪', period: '2026-08', newHouseCount: 1, newCustomerCount: 3, showingCount: 9, dealCount: 1, totalPerformance: 35800, distributed: 17900, retained: 8950, transferred: 8950, commission: 3580 },
  { id: 8, employeeName: '卫东', period: '2026-08', newHouseCount: 3, newCustomerCount: 7, showingCount: 14, dealCount: 2, totalPerformance: 57200, distributed: 28600, retained: 14300, transferred: 14300, commission: 5720 },
];
const ACCOUNTINGS = [
  { id: 1, period: '2026-03', revenue: 172400, receivable: 22000, payable: 12800, actualIncome: 146000, actualExpense: 79100, diff: 66900 },
  { id: 2, period: '2026-04', revenue: 178600, receivable: 24500, payable: 13900, actualIncome: 151000, actualExpense: 80200, diff: 70800 },
  { id: 3, period: '2026-05', revenue: 181900, receivable: 26000, payable: 15200, actualIncome: 155300, actualExpense: 81400, diff: 73900 },
  { id: 4, period: '2026-06', revenue: 186500, receivable: 28000, payable: 15000, actualIncome: 158500, actualExpense: 82300, diff: 76200 },
  { id: 5, period: '2026-07', revenue: 198200, receivable: 32000, payable: 18600, actualIncome: 166200, actualExpense: 85600, diff: 80600 },
  { id: 6, period: '2026-08', revenue: 216800, receivable: 35000, payable: 22000, actualIncome: 181800, actualExpense: 89200, diff: 92600 },
];
const PARTNERS = [
  { id: 1, name: '张伟', mobile: '13800000002', share: 30, invest: 500000, profit: 156000, dividend: 46800, status: 'active', remark: '张江店合伙人' },
  { id: 2, name: '李娜', mobile: '13800000003', share: 20, invest: 300000, profit: 156000, dividend: 31200, status: 'active', remark: '联洋店合伙人' },
  { id: 3, name: '王强', mobile: '13800000004', share: 15, invest: 200000, profit: 156000, dividend: 23400, status: 'active', remark: '浦东店合伙人' },
  { id: 4, name: '郑凯', mobile: '13800000016', share: 10, invest: 150000, profit: 156000, dividend: 15600, status: 'active', remark: '金桥店合伙人' },
  { id: 5, name: '卫东', mobile: '13800000019', share: 8, invest: 120000, profit: 156000, dividend: 12480, status: 'active', remark: '北蔡店合伙人' },
  { id: 6, name: '冯雪', mobile: '13800000017', share: 7, invest: 100000, profit: 156000, dividend: 10920, status: 'inactive', remark: '已退出，待结算' },
];
const RENT_INCREASES = [
  { id: 1, roomCode: 'ZJ001', year: 2026, month: 9, lastRent: 5800, currentRent: 6200, increaseAmount: 400, increaseRate: 6.9, status: 'approved' },
  { id: 2, roomCode: 'ZJ004', year: 2026, month: 9, lastRent: 8200, currentRent: 8500, increaseAmount: 300, increaseRate: 3.7, status: 'approved' },
  { id: 3, roomCode: 'ZJ006', year: 2026, month: 10, lastRent: 6800, currentRent: 7200, increaseAmount: 400, increaseRate: 5.9, status: 'pending' },
  { id: 4, roomCode: 'ZJ013', year: 2026, month: 9, lastRent: 3700, currentRent: 3900, increaseAmount: 200, increaseRate: 5.4, status: 'approved' },
  { id: 5, roomCode: 'ZJ017', year: 2026, month: 11, lastRent: 11500, currentRent: 12000, increaseAmount: 500, increaseRate: 4.3, status: 'pending' },
  { id: 6, roomCode: 'ZJ020', year: 2026, month: 9, lastRent: 5300, currentRent: 5600, increaseAmount: 300, increaseRate: 5.7, status: 'rejected' },
  { id: 7, roomCode: 'ZJ015', year: 2026, month: 10, lastRent: 4800, currentRent: 5000, increaseAmount: 200, increaseRate: 4.2, status: 'approved' },
];

// ============================================================
//  MOCK DATA: 系统配置 / 日志
// ============================================================
const SYSTEM_CONFIGS = [
  { id: 1, group: 'system', key: 'site_name', value: '优居ERP', description: '系统名称' },
  { id: 2, group: 'system', key: 'logo_url', value: '', description: '系统Logo' },
  { id: 3, group: 'system', key: 'enable_register', value: 'false', description: '是否开启注册' },
  { id: 4, group: 'biz', key: 'default_brokerage_rate', value: '50', description: '默认佣金比例(%)' },
  { id: 5, group: 'biz', key: 'overdue_days', value: '7', description: '账单逾期天数' },
  { id: 6, group: 'biz', key: 'freeze_days', value: '15', description: '空置预警天数' },
  { id: 7, group: 'finance', key: 'rent_account', value: '工商银行 6222XXXXXXXXXXX', description: '租金收款账户' },
  { id: 8, group: 'finance', key: 'deposit_account', value: '建设银行 6222XXXXXXXXXXX', description: '押金收款账户' },
  { id: 9, group: 'finance', key: 'tax_rate', value: '6', description: '开票税率(%)' },
  { id: 10, group: 'notice', key: 'sms_enabled', value: 'true', description: '短信通知' },
  { id: 11, group: 'notice', key: 'sms_template_rent', value: '尊敬的{name}，您的房租{amount}元已生成，请及时缴纳', description: '房租催缴短信模板' },
];
const LOGS = [
  { id: 1, time: '2026-08-28 09:15:23', module: '房屋管理', action: '新增出租房源', operator: '超级管理员', ip: '192.168.1.100', detail: '新增张江汤臣豪园12-1-802出租房源' },
  { id: 2, time: '2026-08-28 10:20:45', module: '客户管理', action: '新增客源', operator: '李娜', ip: '192.168.1.101', detail: '新增客户刘伟' },
  { id: 3, time: '2026-08-28 11:00:12', module: '财务管理', action: '收款确认', operator: '赵财务', ip: '192.168.1.102', detail: '确认张江汤臣豪园802租金6200元' },
  { id: 4, time: '2026-08-28 11:30:00', module: '系统管理', action: '登录系统', operator: '超级管理员', ip: '192.168.1.100', detail: '登录成功' },
  { id: 5, time: '2026-08-27 14:22:33', module: '房屋管理', action: '编辑出租房源', operator: '王强', ip: '192.168.1.101', detail: '编辑张江家园5-1-302租金信息' },
  { id: 6, time: '2026-08-27 15:10:18', module: '财务管理', action: '新增账单', operator: '赵财务', ip: '192.168.1.102', detail: '新增金桥新村15-2-401电费账单' },
  { id: 7, time: '2026-08-27 16:00:05', module: '系统管理', action: '角色管理', operator: '超级管理员', ip: '192.168.1.100', detail: '编辑业务员角色权限' },
  { id: 8, time: '2026-08-26 09:30:00', module: '房屋管理', action: '新增出售房源', operator: '陈静', ip: '192.168.1.103', detail: '新增联洋年华两室一厅出售房源' },
  { id: 9, time: '2026-08-26 10:45:12', module: '财务管理', action: '代付审核', operator: '赵财务', ip: '192.168.1.102', detail: '审核支付房东刘建国房租代付申请' },
  { id: 10, time: '2026-08-26 14:00:30', module: '客户管理', action: '客源跟进', operator: '刘洋', ip: '192.168.1.101', detail: '跟进客户孙敏' },
  { id: 11, time: '2026-08-30 09:12:45', module: '财务管理', action: '收款确认', operator: '赵财务', ip: '192.168.1.102', detail: '确认仁恒河滨城1101租金12000元' },
  { id: 12, time: '2026-08-30 10:35:20', module: '房屋管理', action: '新增出租房源', operator: '李娜', ip: '192.168.1.101', detail: '新增香楠小区7-2-603出租房源' },
  { id: 13, time: '2026-08-29 15:22:10', module: '房屋管理', action: '退租办理', operator: '王强', ip: '192.168.1.101', detail: '川杨新苑20-2-1502办理退租' },
  { id: 14, time: '2026-08-29 16:08:47', module: '系统管理', action: '字典管理', operator: '超级管理员', ip: '192.168.1.100', detail: '新增黑名单类型字典项' },
  { id: 15, time: '2026-08-28 14:40:33', module: '财务管理', action: '发票开具', operator: '赵财务', ip: '192.168.1.102', detail: '开具玉兰香苑502租金发票5000元' },
  { id: 16, time: '2026-08-31 08:55:01', module: '系统管理', action: '登录系统', operator: '张伟', ip: '192.168.1.104', detail: '登录成功' },
  { id: 17, time: '2026-08-31 11:18:29', module: '房屋管理', action: '编辑出售房源', operator: '陈静', ip: '192.168.1.103', detail: '调整仁恒河滨城三室两厅总价1180万' },
  { id: 18, time: '2026-08-31 14:26:55', module: '客户管理', action: '新增黑名单', operator: '吴杰', ip: '192.168.1.105', detail: '新增黑名单人员徐某某' },
  { id: 19, time: '2026-08-31 16:44:12', module: '财务管理', action: '代付审核', operator: '赵财务', ip: '192.168.1.102', detail: '审核支付孙丽房租代付申请' },
  { id: 20, time: '2026-08-31 17:30:08', module: '房屋管理', action: '新增储备房源', operator: '卫东', ip: '192.168.1.106', detail: '新增香楠路临街商铺储备房源' },
];

// ============================================================
//  MOCK DATA: 储备客源 (extra)
// ============================================================
const EXTRA_RESERVE_CLIENTS = [
  { id: 1, name: '李小明', phone: '13611111111', budget: 3500, intention: '整租两室', status: 'active', source: '58', employeeName: '李娜', createdAt: '2026-08-01' },
  { id: 2, name: '王小红', phone: '13611111112', budget: 2500, intention: '合租主卧', status: 'active', source: 'beike', employeeName: '王强', createdAt: '2026-08-05' },
  { id: 3, name: '张大伟', phone: '13611111113', budget: 5000, intention: '整租三室', status: 'contacted', source: 'douyin', employeeName: '陈静', createdAt: '2026-08-10' },
  { id: 4, name: '赵雪', phone: '13611111114', budget: 2000, intention: '合租次卧', status: 'active', source: 'referral', employeeName: '刘洋', createdAt: '2026-08-15' },
  { id: 5, name: '刘阳', phone: '13611111115', budget: 8000, intention: '整租三室两厅', status: 'contacted', source: 'agent', employeeName: '孙悦', createdAt: '2026-08-20' },
  { id: 6, name: '施诗', phone: '13611111116', budget: 4200, intention: '整租两室', status: 'active', source: 'wechat', employeeName: '刘洋', createdAt: '2026-08-22' },
  { id: 7, name: '贺斌', phone: '13611111117', budget: 12000, intention: '整租三室两厅（高端）', status: 'contacted', source: 'referral', employeeName: '郑凯', createdAt: '2026-08-23' },
  { id: 8, name: '鲁强', phone: '13611111118', budget: 5500, intention: '整租两室两厅', status: 'active', source: '58', employeeName: '冯雪', createdAt: '2026-08-24' },
  { id: 9, name: '崔健', phone: '13611111119', budget: 1600, intention: '合租小卧', status: 'inactive', source: 'douyin', employeeName: '卫东', createdAt: '2026-08-15' },
  { id: 10, name: '潘月', phone: '13611111120', budget: 3900, intention: '整租一室一厅', status: 'contacted', source: 'beike', employeeName: '李娜', createdAt: '2026-08-26' },
];

// ============================================================
//  ROUTES: 系统路由
// ============================================================
// System
app.get('/api/system/dicts', (req, res) => {
  const keyword = (req.query.keyword || '').toLowerCase();
  const data = DICTS.filter(d => !keyword || d.code.includes(keyword) || d.name.includes(keyword));
  res.json({ code: 0, data });
});
app.get('/api/system/dicts/:code/items', (req, res) => {
  const items = DICT_ITEMS.filter(d => d.dictCode === req.params.code);
  res.json({ code: 0, data: items });
});
app.post('/api/system/dicts', (req, res) => {
  const dict = { id: DICTS.length + 1, ...req.body, enabled: true };
  DICTS.push(dict);
  res.json({ code: 0, data: dict });
});
app.put('/api/system/dicts/:id', (req, res) => {
  const idx = DICTS.findIndex(d => d.id === parseInt(req.params.id));
  if (idx >= 0) Object.assign(DICTS[idx], req.body);
  res.json({ code: 0, data: DICTS[idx] });
});
app.delete('/api/system/dicts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = DICTS.findIndex(d => d.id === id);
  if (idx >= 0) DICTS.splice(idx, 1);
  res.json({ code: 0, data: null });
});
app.post('/api/system/dicts/items', (req, res) => {
  const item = { id: DICT_ITEMS.length + 1, ...req.body };
  DICT_ITEMS.push(item);
  res.json({ code: 0, data: item });
});
app.put('/api/system/dicts/items/:id', (req, res) => {
  const idx = DICT_ITEMS.findIndex(d => d.id === parseInt(req.params.id));
  if (idx >= 0) Object.assign(DICT_ITEMS[idx], req.body);
  res.json({ code: 0, data: DICT_ITEMS[idx] });
});
app.delete('/api/system/dicts/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = DICT_ITEMS.findIndex(d => d.id === id);
  if (idx >= 0) DICT_ITEMS.splice(idx, 1);
  res.json({ code: 0, data: null });
});
app.get('/api/system/employees', (req, res) => {
  const keyword = (req.query.keyword || '').toLowerCase();
  const data = EMPLOYEES.filter(e => !keyword || e.name.includes(keyword) || e.mobile.includes(keyword));
  res.json({ code: 0, data });
});
app.post('/api/system/employees', (req, res) => {
  const emp = { id: EMPLOYEES.length + 1, ...req.body, entryDate: new Date().toISOString().slice(0, 10) };
  EMPLOYEES.push(emp);
  res.json({ code: 0, data: emp });
});
app.put('/api/system/employees/:id', (req, res) => {
  const idx = EMPLOYEES.findIndex(e => e.id === parseInt(req.params.id));
  if (idx >= 0) Object.assign(EMPLOYEES[idx], req.body);
  res.json({ code: 0, data: EMPLOYEES[idx] });
});
app.delete('/api/system/employees/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = EMPLOYEES.findIndex(e => e.id === id);
  if (idx >= 0) EMPLOYEES.splice(idx, 1);
  res.json({ code: 0, data: null });
});
app.get('/api/system/roles', (req, res) => {
  res.json({ code: 0, data: ROLES });
});
app.post('/api/system/roles', (req, res) => {
  const role = { id: ROLES.length + 1, ...req.body, isBuiltin: false, permissions: [] };
  ROLES.push(role);
  res.json({ code: 0, data: role });
});
app.put('/api/system/roles/:id', (req, res) => {
  const idx = ROLES.findIndex(r => r.id === parseInt(req.params.id));
  if (idx >= 0) Object.assign(ROLES[idx], req.body);
  res.json({ code: 0, data: ROLES[idx] });
});
app.delete('/api/system/roles/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = ROLES.findIndex(r => r.id === id);
  if (idx >= 0) ROLES.splice(idx, 1);
  res.json({ code: 0, data: null });
});
app.get('/api/system/permissions/tree', (req, res) => {
  res.json({ code: 0, data: PERM_TREE });
});
app.get('/api/system/stores', (req, res) => {
  res.json({ code: 0, data: STORES });
});
app.get('/api/system/cities', (req, res) => {
  res.json({ code: 0, data: CITIES });
});
app.get('/api/system/departments', (req, res) => {
  res.json({ code: 0, data: DEPARTMENTS });
});
app.get('/api/system/positions', (req, res) => {
  res.json({ code: 0, data: POSITIONS });
});

// ============================================================
//  ROUTES: 房屋路由
// ============================================================
// 出租房源
app.get('/api/house/rental-sets', (req, res) => {
  let data = [...RENTAL_SETS];
  const { keyword, status, bizType } = req.query;
  if (keyword) data = data.filter(s => s.code.includes(keyword) || (s.communityName || '').includes(keyword) || s.address.includes(keyword));
  if (status) data = data.filter(s => s.status === status);
  if (bizType) data = data.filter(s => s.bizType === bizType);
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/house/rental-sets', (req, res) => {
  const set = { id: RENTAL_SETS.length + 1, code: 'ZJ' + String(RENTAL_SETS.length + 1).padStart(3, '0'), ...req.body, rooms: [], createdAt: new Date().toISOString() };
  RENTAL_SETS.push(set);
  res.json({ code: 0, data: set });
});
app.get('/api/house/rental-sets/:id', (req, res) => {
  const set = RENTAL_SETS.find(s => s.id === parseInt(req.params.id));
  if (!set) return res.json({ code: 404, message: '房源不存在' });
  res.json({ code: 0, data: set });
});
app.put('/api/house/rental-sets/:id', (req, res) => {
  const idx = RENTAL_SETS.findIndex(s => s.id === parseInt(req.params.id));
  if (idx < 0) return res.json({ code: 404, message: '房源不存在' });
  const { rooms, ...rest } = req.body || {};
  const next = { ...RENTAL_SETS[idx], ...rest };
  if (Array.isArray(rooms)) next.rooms = rooms;
  RENTAL_SETS[idx] = next;
  res.json({ code: 0, data: next });
});
// 退租管理
app.get('/api/house/checkouts', (req, res) => {
  let data = [...CHECKOUTS];
  const { keyword, status, startDate, endDate, page, pageSize } = req.query;
  if (keyword) data = data.filter(c => c.contractCode.includes(keyword) || (c.tenantName || '').includes(keyword));
  if (status) data = data.filter(c => c.status === status);
  if (startDate) data = data.filter(c => c.checkoutDate && c.checkoutDate >= startDate);
  if (endDate) data = data.filter(c => c.checkoutDate && c.checkoutDate <= endDate);
  const p = parseInt(page) || 1, ps = parseInt(pageSize) || 20;
  const start = (p - 1) * ps;
  res.json({ code: 0, data: { list: data.slice(start, start + ps), total: data.length } });
});
app.post('/api/house/checkouts', (req, res) => {
  const { houseInfo, tenantName, checkoutDate, reason, settlementAmount } = req.body || {};
  const now = new Date();
  const code = 'CK-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + String(CHECKOUTS.length + 1).padStart(3, '0');
  const record = {
    id: CHECKOUTS.length + 1,
    contractCode: code,
    tenantName: tenantName || '',
    houseInfo: houseInfo || '',
    checkoutDate: checkoutDate || now.toISOString().slice(0, 10),
    settlementAmount: settlementAmount || 0,
    reason: reason || '',
    status: 'pending',
    remark: '',
    createdAt: now.toISOString(),
  };
  CHECKOUTS.push(record);
  res.json({ code: 0, data: record });
});
app.post('/api/house/checkouts/:id/confirm', (req, res) => {
  const idx = CHECKOUTS.findIndex(c => c.id === parseInt(req.params.id));
  if (idx < 0) return res.json({ code: 404, message: '退租记录不存在' });
  if (CHECKOUTS[idx].status !== 'pending') return res.json({ code: 400, message: '当前状态不可确认' });
  CHECKOUTS[idx].status = 'confirmed';
  res.json({ code: 0, data: CHECKOUTS[idx] });
});
// 完成清算：confirmed → completed；押金未处置（仍存在 pending 押金）时拦截
app.post('/api/house/checkouts/:id/complete', (req, res) => {
  const idx = CHECKOUTS.findIndex(c => c.id === parseInt(req.params.id));
  if (idx < 0) return res.json({ code: 404, message: '退租记录不存在' });
  const c = CHECKOUTS[idx];
  if (c.status !== 'confirmed') return res.json({ code: 400, message: '仅已确认状态的退租可完成清算' });
  const house = c.houseInfo || '';
  const tenant = c.tenantName || '';
  const pendingDeposits = DEPOSITS.filter(d => d.status === 'pending' && d.houseInfo === house && d.tenantName === tenant);
  if (pendingDeposits.length) {
    return res.json({ code: 400, message: `该房源仍有 ${pendingDeposits.length} 笔押金未处置（${pendingDeposits.map(d => d.contractCode).join('、')}），请先在押金管理中完成退还或扣留` });
  }
  c.status = 'completed';
  res.json({ code: 0, data: c });
});
// 押金管理
app.get('/api/house/deposits', (req, res) => {
  let data = [...DEPOSITS];
  const { keyword, status, startDate, endDate, page = 1, pageSize = 20 } = req.query;
  if (keyword) data = data.filter(d => d.contractCode.includes(keyword) || (d.tenantName || '').includes(keyword) || (d.houseInfo || '').includes(keyword));
  if (status) data = data.filter(d => d.status === status);
  if (startDate) data = data.filter(d => d.depositDate >= startDate);
  if (endDate) data = data.filter(d => d.depositDate <= endDate);
  const p = parseInt(page), ps = parseInt(pageSize);
  const list = data.slice((p - 1) * ps, p * ps);
  res.json({ code: 0, data: { list, total: data.length } });
});
app.post('/api/house/deposits/:id/refund', (req, res) => {
  const idx = DEPOSITS.findIndex(d => d.id === parseInt(req.params.id));
  if (idx < 0) return res.json({ code: 404, message: '押金记录不存在' });
  if (DEPOSITS[idx].status !== 'pending') return res.json({ code: 400, message: '当前状态不可退还' });
  DEPOSITS[idx].status = 'refunded';
  DEPOSITS[idx].refundDate = new Date().toISOString().slice(0, 10);
  res.json({ code: 0, data: DEPOSITS[idx] });
});
app.post('/api/house/deposits/:id/deduct', (req, res) => {
  const idx = DEPOSITS.findIndex(d => d.id === parseInt(req.params.id));
  if (idx < 0) return res.json({ code: 404, message: '押金记录不存在' });
  if (DEPOSITS[idx].status !== 'pending') return res.json({ code: 400, message: '当前状态不可扣留' });
  DEPOSITS[idx].status = 'deducted';
  DEPOSITS[idx].deductReason = (req.body && req.body.reason) || '租客违约/房屋损坏';
  res.json({ code: 0, data: DEPOSITS[idx] });
});
// 出售房源
app.get('/api/house/sale-properties', (req, res) => {
  let data = [...SALE_PROPERTIES];
  const { keyword, status } = req.query;
  if (keyword) data = data.filter(s => s.title.includes(keyword) || s.communityName.includes(keyword));
  if (status) data = data.filter(s => s.status === status);
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/house/sale-properties', (req, res) => {
  const sp = { id: SALE_PROPERTIES.length + 1, code: 'SJ' + String(SALE_PROPERTIES.length + 1).padStart(3, '0'), ...req.body, createdAt: new Date().toISOString() };
  SALE_PROPERTIES.push(sp);
  res.json({ code: 0, data: sp });
});
app.put('/api/house/sale-properties/:id', (req, res) => {
  const idx = SALE_PROPERTIES.findIndex(s => s.id === parseInt(req.params.id));
  if (idx >= 0) Object.assign(SALE_PROPERTIES[idx], req.body);
  res.json({ code: 0, data: SALE_PROPERTIES[idx] });
});
// 客源
app.get('/api/house/customers', (req, res) => {
  let data = [...CUSTOMERS];
  const { keyword, identity } = req.query;
  if (keyword) data = data.filter(c => c.name.includes(keyword) || c.phone.includes(keyword));
  if (identity) data = data.filter(c => c.identity === identity);
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/house/customers', (req, res) => {
  const c = { id: CUSTOMERS.length + 1, ...req.body, createdAt: new Date().toISOString().slice(0, 10) };
  CUSTOMERS.push(c);
  res.json({ code: 0, data: c });
});
// 小区
app.get('/api/community', (req, res) => {
  let data = [...COMMUNITIES];
  const { keyword } = req.query;
  if (keyword) data = data.filter(c => c.name.includes(keyword) || c.district?.includes(keyword) || c.area?.includes(keyword) || c.address?.includes(keyword));
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/community', (req, res) => {
  const c = { id: COMMUNITIES.length + 1, ...req.body, roomCount: 0, createdAt: new Date().toISOString() };
  COMMUNITIES.push(c);
  res.json({ code: 0, data: c });
});
// 黑名单
app.get('/api/house/blacklist', (req, res) => {
  let data = [...BLACKLIST];
  const { keyword, type, status } = req.query;
  if (keyword) data = data.filter(b => b.name.includes(keyword) || (b.mobile || '').includes(keyword));
  if (type) data = data.filter(b => b.type === type);
  if (status) data = data.filter(b => b.status === status);
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/house/blacklist', (req, res) => {
  const b = { id: BLACKLIST.length + 1, ...req.body, storeId: 1, createdAt: new Date().toISOString() };
  BLACKLIST.push(b);
  res.json({ code: 0, data: b });
});
app.put('/api/house/blacklist/:id', (req, res) => {
  const idx = BLACKLIST.findIndex(b => b.id === parseInt(req.params.id));
  if (idx >= 0) Object.assign(BLACKLIST[idx], req.body);
  res.json({ code: 0, data: BLACKLIST[idx] });
});
app.delete('/api/house/blacklist/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = BLACKLIST.findIndex(b => b.id === id);
  if (idx >= 0) BLACKLIST.splice(idx, 1);
  res.json({ code: 0, data: null });
});
app.get('/api/house/blacklist/check', (req, res) => {
  const { mobile, idCard, name } = req.query;
  const found = BLACKLIST.filter(b => (mobile && b.mobile === mobile) || (name && b.name === name));
  res.json({ code: 0, data: found });
});
// 储备房源
app.get('/api/house/reserve-properties', (req, res) => {
  let data = [...RESERVE_PROPERTIES];
  const { keyword, status } = req.query;
  if (keyword) data = data.filter(r => r.title.includes(keyword) || r.ownerName.includes(keyword));
  if (status) data = data.filter(r => r.status === status);
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/house/reserve-properties', (req, res) => {
  const r = { id: RESERVE_PROPERTIES.length + 1, ...req.body, createdAt: new Date().toISOString() };
  RESERVE_PROPERTIES.push(r);
  res.json({ code: 0, data: r });
});
app.put('/api/house/reserve-properties/:id', (req, res) => {
  const idx = RESERVE_PROPERTIES.findIndex(r => r.id === parseInt(req.params.id));
  if (idx >= 0) Object.assign(RESERVE_PROPERTIES[idx], req.body);
  res.json({ code: 0, data: RESERVE_PROPERTIES[idx] });
});
// 储备客源 (extra version)
app.get('/api/house/reserve-clients', (req, res) => {
  let data = [...EXTRA_RESERVE_CLIENTS];
  const { keyword, demandType, status } = req.query;
  if (keyword) data = data.filter(c => c.name.includes(keyword) || c.phone.includes(keyword));
  if (status) data = data.filter(c => c.status === status);
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/house/reserve-clients', (req, res) => {
  const c = { id: EXTRA_RESERVE_CLIENTS.length + 1, ...req.body, createdAt: new Date().toISOString() };
  EXTRA_RESERVE_CLIENTS.push(c);
  res.json({ code: 0, data: c });
});
app.put('/api/house/reserve-clients/:id', (req, res) => {
  const idx = EXTRA_RESERVE_CLIENTS.findIndex(c => c.id === parseInt(req.params.id));
  if (idx >= 0) Object.assign(EXTRA_RESERVE_CLIENTS[idx], req.body);
  res.json({ code: 0, data: EXTRA_RESERVE_CLIENTS[idx] });
});

// ============================================================
//  ROUTES: 财务路由
// ============================================================
app.get('/api/finance/bills', (req, res) => {
  let data = [...BILLS];
  const { keyword, status } = req.query;
  if (keyword) data = data.filter(b => b.title.includes(keyword) || (b.tenantName || '').includes(keyword));
  if (status) data = data.filter(b => b.status === status);
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/finance/bills', (req, res) => {
  const b = { id: BILLS.length + 1, ...req.body, createdAt: new Date().toISOString() };
  BILLS.push(b);
  res.json({ code: 0, data: b });
});
app.get('/api/finance/flows', (req, res) => {
  let data = [...FLOWS];
  const { keyword, type } = req.query;
  if (keyword) data = data.filter(f => f.title.includes(keyword));
  if (type) data = data.filter(f => f.type === type);
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/finance/flows', (req, res) => {
  const f = { id: FLOWS.length + 1, ...req.body, createdAt: new Date().toISOString() };
  FLOWS.push(f);
  res.json({ code: 0, data: f });
});
app.get('/api/finance/plans', (req, res) => {
  let data = [...PAYMENT_PLANS];
  const { keyword, planType, status } = req.query;
  if (keyword) data = data.filter(p => p.title.includes(keyword));
  if (planType) data = data.filter(p => p.planType === planType);
  if (status) data = data.filter(p => p.status === status);
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/finance/plans', (req, res) => {
  const p = { id: PAYMENT_PLANS.length + 1, ...req.body, createdAt: new Date().toISOString() };
  PAYMENT_PLANS.push(p);
  res.json({ code: 0, data: p });
});
app.get('/api/finance/arrears', (req, res) => {
  let data = [...ARREARS];
  const { keyword, status } = req.query;
  if (keyword) data = data.filter(a => a.name.includes(keyword));
  if (status) data = data.filter(a => a.status === status);
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/finance/arrears', (req, res) => {
  const a = { id: ARREARS.length + 1, ...req.body, createdAt: new Date().toISOString() };
  ARREARS.push(a);
  res.json({ code: 0, data: a });
});
app.get('/api/finance/payouts', (req, res) => {
  let data = [...PAYOUTS];
  const { keyword, status } = req.query;
  if (keyword) data = data.filter(p => p.accountName.includes(keyword) || (p.batchNo || '').includes(keyword));
  if (status) data = data.filter(p => p.status === status);
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/finance/payouts', (req, res) => {
  const p = { id: PAYOUTS.length + 1, ...req.body, batchNo: 'ZF' + new Date().toISOString().slice(0, 10).replace(/-/g, ''), createdAt: new Date().toISOString() };
  PAYOUTS.push(p);
  res.json({ code: 0, data: p });
});
app.get('/api/finance/invoices', (req, res) => {
  let data = [...INVOICES];
  const { keyword, status } = req.query;
  if (keyword) data = data.filter(v => v.buyerName.includes(keyword));
  if (status) data = data.filter(v => v.status === status);
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/finance/invoices', (req, res) => {
  const v = { id: INVOICES.length + 1, ...req.body, createdAt: new Date().toISOString() };
  INVOICES.push(v);
  res.json({ code: 0, data: v });
});
app.put('/api/finance/invoices/:id', (req, res) => {
  const idx = INVOICES.findIndex(v => v.id === parseInt(req.params.id));
  if (idx >= 0) Object.assign(INVOICES[idx], req.body);
  res.json({ code: 0, data: INVOICES[idx] });
});
// 报表
app.get('/api/finance/rent-increases', (req, res) => {
  let data = [...RENT_INCREASES];
  const { year, month, keyword } = req.query;
  if (year) data = data.filter(r => r.year === parseInt(year));
  if (month) data = data.filter(r => r.month === parseInt(month));
  if (keyword) data = data.filter(r => r.roomCode.includes(keyword));
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/finance/rent-increases', (req, res) => {
  const r = { id: RENT_INCREASES.length + 1, ...req.body };
  RENT_INCREASES.push(r);
  res.json({ code: 0, data: r });
});
app.get('/api/finance/profits', (req, res) => {
  let data = [...PROFITS];
  const { period } = req.query;
  if (period) data = data.filter(p => p.period === period);
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.get('/api/finance/profits/summary', (req, res) => {
  const latest = PROFITS[PROFITS.length - 1];
  res.json({ code: 0, data: { income: latest.income, cost: latest.cost, profit: latest.profit, margin: latest.margin + '%' } });
});
app.post('/api/finance/profits', (req, res) => {
  const p = { id: PROFITS.length + 1, ...req.body };
  PROFITS.push(p);
  res.json({ code: 0, data: p });
});
app.get('/api/finance/partners', (req, res) => {
  let data = [...PARTNERS];
  const { keyword } = req.query;
  if (keyword) data = data.filter(p => p.name.includes(keyword));
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/finance/partners', (req, res) => {
  const p = { id: PARTNERS.length + 1, ...req.body };
  PARTNERS.push(p);
  res.json({ code: 0, data: p });
});
app.put('/api/finance/partners/:id', (req, res) => {
  const idx = PARTNERS.findIndex(p => p.id === parseInt(req.params.id));
  if (idx >= 0) Object.assign(PARTNERS[idx], req.body);
  res.json({ code: 0, data: PARTNERS[idx] });
});
app.get('/api/finance/income-costs', (req, res) => {
  let data = [...INCOME_COSTS];
  const { period } = req.query;
  if (period) data = data.filter(ic => ic.period === period);
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/finance/income-costs', (req, res) => {
  const ic = { id: INCOME_COSTS.length + 1, ...req.body };
  INCOME_COSTS.push(ic);
  res.json({ code: 0, data: ic });
});
app.get('/api/finance/performances', (req, res) => {
  let data = [...PERFORMANCES];
  const { period, keyword } = req.query;
  if (keyword) data = data.filter(p => p.employeeName.includes(keyword));
  if (period) data = data.filter(p => p.period === period);
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/finance/performances', (req, res) => {
  const p = { id: PERFORMANCES.length + 1, ...req.body };
  PERFORMANCES.push(p);
  res.json({ code: 0, data: p });
});
app.get('/api/finance/accountings', (req, res) => {
  let data = [...ACCOUNTINGS];
  const { period } = req.query;
  if (period) data = data.filter(a => a.period === period);
  res.json({ code: 0, data: { list: data, total: data.length } });
});
app.post('/api/finance/accountings', (req, res) => {
  const a = { id: ACCOUNTINGS.length + 1, ...req.body };
  ACCOUNTINGS.push(a);
  res.json({ code: 0, data: a });
});

// ============================================================
//  ROUTES: 系统配置 & 日志
// ============================================================
app.get('/api/system/configs', (req, res) => {
  res.json({ code: 0, data: SYSTEM_CONFIGS });
});
app.post('/api/system/configs/batch', (req, res) => {
  if (req.body.configs) {
    req.body.configs.forEach(c => {
      const exist = SYSTEM_CONFIGS.find(sc => sc.key === c.key);
      if (exist) Object.assign(exist, c);
    });
  }
  res.json({ code: 0, data: null, message: '保存成功' });
});
app.get('/api/system/logs', (req, res) => {
  let data = [...LOGS];
  const { keyword, module } = req.query;
  if (keyword) data = data.filter(l => l.detail.includes(keyword) || l.operator.includes(keyword));
  if (module) data = data.filter(l => l.module === module);
  res.json({ code: 0, data: { list: data, total: data.length } });
});

// ============================================================
//  Catch-all: unmatched API routes
// ============================================================
app.all('/api/*', authMiddleware, (req, res) => {
  res.status(404).json({ code: 404, message: '未知接口: ' + req.path });
});

// ============================================================
//  Static frontend (production build) — 单进程架构
//  vite dev server(5173) 不稳定时，直接用 3000 端口访问完整前端
// ============================================================
const path = require('path');
const fs = require('fs');
const WEB_DIST = path.join(__dirname, '..', 'web', 'dist');
if (fs.existsSync(path.join(WEB_DIST, 'index.html'))) {
  app.use(express.static(WEB_DIST));
  // SPA fallback: 非 /api 路径统一回 index.html（前端路由）
  app.get('*', (req, res) => {
    res.sendFile(path.join(WEB_DIST, 'index.html'));
  });
  console.log(`Frontend static served from ${WEB_DIST}`);
} else {
  console.log('web/dist not found — API-only mode (run vite build to enable static frontend)');
}

const PORT = 3000;
// 绑定 '::' 实现双栈：Windows 上 IPv6 通配符默认同时接受 IPv4-mapped 连接，
// 保证 localhost(可能解析为 ::1) 与 127.0.0.1 都可达
app.listen(PORT, '::', () => {
  console.log(`Mock server running on http://localhost:${PORT}/api (dual-stack)`);
  console.log('Available accounts (password: 123456):');
  Object.keys(USERS).forEach((k) => console.log(`  ${k} - ${USERS[k].name}`));
});