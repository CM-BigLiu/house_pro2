Object.assign(window.PROTOTYPE_PAGES, {
  bill: {
    id: 'bill', title: '账单', group: '财务管理',
    description: '应收应付账单全生命周期管理',
    note: '流程演示：签约自动生成应收/应付账单 → 收付款 → 平账；退房自动生成冲红账单。',
    actions: [{ label: '导出汇总', icon: 'file-spreadsheet' }, { label: '新增账单', icon: 'plus', variant: 'btn-primary', permission: 'bill:update' }],
    tabs: [{ label: '工作台' }, { label: '账单' }],
    typeTabs: [{ label: '汇总' }, { label: '明细' }],
    statusTabs: [{ label: '全部', count: 128 }, { label: '应收', count: 68 }, { label: '应付', count: 60 }, { label: '待收', count: 32 }, { label: '待付', count: 28 }, { label: '逾期', count: 12 }, { label: '已收', count: 26 }, { label: '已付', count: 22 }, { label: '待平账', count: 8 }],
    filters: [
      { label: '店面', type: 'select', options: ['全部', '张江店', '浦东店'] }, { label: '业务类型', type: 'select', options: ['租房', '售房', '储备'] },
      { label: '账单来源', type: 'select', options: ['房东账单', '租客账单', '其他费用'] }, { label: '应收付开始', type: 'date' }, { label: '应收付结束', type: 'date', value: '2026-08-31' },
      { label: '收付款人', placeholder: '姓名/手机号' }, { label: '管家', type: 'select', options: ['全部', '王晓明', '李芳'] }, { label: '房源编号', placeholder: 'F202608001' }
    ],
    layout: 'table',
    columns: [
      { label: '店面', key: 'store' }, { label: '区域', key: 'district' }, { label: '业务类型', key: 'biz' }, { label: '物业地址', key: 'house' },
      { label: '账单来源', key: 'source' }, { label: '收付款人', key: 'payer' }, { label: '应收付日', key: 'due' }, { label: '缴费次数', key: 'times' },
      { label: '账单周期', key: 'period' }, { label: '逾期费用', key: 'overdue' }, { label: '应收付金额', key: 'amount' }, { label: '实收付金额', key: 'paid' },
      { label: '收付状态', key: 'status' }, { label: '业务员', key: 'salesman' }, { label: '管家', key: 'keeper' }, { label: '房源编号', key: 'code' }, { label: '操作', key: 'operations' }
    ],
    rows: [
      { store: '张江店', district: '浦东', biz: '租房', house: '汤臣豪园3-301', source: '租客账单', payer: '王小明', due: '2026-08-31', times: '第6次', period: '08-01~08-31', overdue: '¥0', amount: '¥6,800', paid: '¥0', status: '待收', salesman: '李芳', keeper: '王晓明', code: 'F202608001', operations: [{ label: '查看' }, { label: '修改', permission: 'bill:update' }, { label: '删除', permission: 'bill:update' }, { label: '催收' }] },
      { store: '浦东店', district: '浦东', biz: '租房', house: '天赋领墅2-601', source: '房东账单', payer: '李先生', due: '2026-08-05', times: '第12次', period: '08-01~08-31', overdue: '¥120', amount: '¥5,000', paid: '¥5,000', status: '逾期', salesman: '赵强', keeper: '王晓明', code: 'F202608012', operations: [{ label: '查看' }, { label: '添加催收过程', permission: 'bill:collect' }, { label: '更多' }] },
      { store: '联洋店', district: '浦东', biz: '售房', house: '仁恒河滨城15-2301', source: '其他费用', payer: '王女士', due: '2026-08-20', times: '第1次', period: '一次性', overdue: '¥0', amount: '¥16,800', paid: '¥16,800', status: '已收', salesman: '刘思思', keeper: '—', code: 'S202608006', operations: [{ label: '查看' }, { label: '冲红', permission: 'bill:update' }] }
    ],
    tabPanels: [
      { html: `
        <div class="dashboard-section">
          <div class="section-header"><div class="section-title"><i data-lucide="gauge"></i> 账单工作台</div><span class="text-muted">本月应收付概览</span></div>
          <div class="kpi-grid">
            <div class="kpi-card blue"><div class="kpi-label">本月应收</div><div class="kpi-value">86.4<span class="kpi-unit">万</span></div></div>
            <div class="kpi-card green"><div class="kpi-label">本月实收</div><div class="kpi-value">75.6<span class="kpi-unit">万</span></div></div>
            <div class="kpi-card yellow"><div class="kpi-label">本月应付</div><div class="kpi-value">32.1<span class="kpi-unit">万</span></div></div>
            <div class="kpi-card pink"><div class="kpi-label">逾期账单</div><div class="kpi-value">12<span class="kpi-unit">笔</span></div></div>
            <div class="kpi-card purple"><div class="kpi-label">待平账</div><div class="kpi-value">8<span class="kpi-unit">笔</span></div></div>
          </div>
          <div class="prototype-note" style="margin-top:14px"><i data-lucide="info"></i><span>签约自动生成应收/应付账单；退房自动生成冲红账单。切换「账单」Tab 查看明细列表。</span></div>
        </div>` },
      null
    ],
    pagination: { total: 128, from: 1, to: 3, current: 1 }
  },

  flow: {
    id: 'flow', title: '流水账', group: '财务管理',
    description: '账单、未出纳财务、平账流水与冲红流水台账',
    actions: [{ label: '记账', icon: 'plus', variant: 'btn-primary', permission: 'flow:create' }, { label: '使用帮助', icon: 'circle-help' }, { label: '批量导入', icon: 'upload' }, { label: '更新日志', icon: 'history' }, { label: '导出汇总', icon: 'download' }],
    tabs: [{ label: '账单', count: 86 }, { label: '未出纳财务', count: 12 }, { label: '流水账', count: 62 }, { label: '冲红流水', count: 4 }],
    typeTabs: [{ label: '汇总' }, { label: '明细' }],
    statusTabs: [{ label: '全部', count: 128 }, { label: '应收', count: 68 }, { label: '应付', count: 60 }, { label: '待收', count: 32 }, { label: '待付', count: 28 }, { label: '逾期', count: 12 }, { label: '已收', count: 26 }, { label: '已付', count: 22 }, { label: '待平账', count: 8 }],
    filters: [
      { label: '店面', type: 'select', options: ['全部', '张江店', '浦东店'] }, { label: '业务类型', type: 'select', options: ['租房', '售房', '储备'] },
      { label: '账单来源', type: 'select', options: ['房东账单', '租客账单', '其他费用'] }, { label: '应收付开始', type: 'date' }, { label: '应收付结束', type: 'date', value: '2026-08-31' }, { label: '综合查询', placeholder: '地址/房源编号/收付款人' },
      { label: '收付款人', placeholder: '姓名/手机号' }, { label: '管家', type: 'select', options: ['全部', '王晓明', '李芳'] }, { label: '房源编号', placeholder: 'F202608001' }
    ],
    layout: 'table',
    columns: [
      { label: '店面', key: 'store' }, { label: '区域', key: 'district' }, { label: '业务类型', key: 'biz' }, { label: '物业地址', key: 'house' },
      { label: '账单来源', key: 'source' }, { label: '收付款人', key: 'payer' }, { label: '应收付日', key: 'due' }, { label: '缴费次数', key: 'times' },
      { label: '账单周期', key: 'period' }, { label: '逾期费用', key: 'overdue' }, { label: '应收付金额', key: 'amount' }, { label: '实收付金额', key: 'paid' },
      { label: '收付状态', key: 'status' }, { label: '业务员', key: 'salesman' }, { label: '管家', key: 'keeper' }, { label: '房源编号', key: 'code' }, { label: '操作', key: 'operations' }
    ],
    rows: [
      { store: '张江店', district: '浦东', biz: '租房', house: '汤臣豪园3-301', source: '租客账单', payer: '王小明', due: '2026-08-31', times: '第6次', period: '08-01~08-31', overdue: '¥0', amount: '¥6,800', paid: '-¥6,800', status: '待平账：-6,800', salesman: '李芳', keeper: '王晓明', code: 'F202608001', operations: [{ label: '查看' }, { label: '出纳确认', permission: 'flow:create' }] },
      { store: '浦东店', district: '浦东', biz: '租房', house: '天赋领墅2-601', source: '房东账单', payer: '李先生', due: '2026-08-05', times: '第12次', period: '08-01~08-31', overdue: '¥120', amount: '¥5,000', paid: '¥5,000', status: '已平账', salesman: '赵强', keeper: '王晓明', code: 'F202608012', operations: [{ label: '查看' }, { label: '打印' }] },
      { store: '联洋店', district: '浦东', biz: '售房', house: '仁恒河滨城15-2301', source: '其他费用', payer: '王女士', due: '2026-08-20', times: '第1次', period: '一次性', overdue: '¥0', amount: '-¥16,800', paid: '¥0', status: '已冲红', salesman: '刘思思', keeper: '—', code: 'S202608006', operations: [{ label: '查看' }, { label: '关联原单' }] }
    ],
    tabPanels: [
      null,
      { note: null, rows: [
        { store: '张江店', district: '浦东', biz: '租房', house: '汤臣豪园3-301', source: '租客账单', payer: '王小明', due: '2026-08-17', times: '第6次', period: '08-01~08-31', overdue: '¥0', amount: '¥6,800', paid: '¥0', status: '今日待出纳', salesman: '李芳', keeper: '王晓明', code: 'F202608001', operations: [{ label: '查看' }, { label: '出纳确认', permission: 'flow:create' }] },
        { store: '浦东店', district: '浦东', biz: '租房', house: '天赋领墅2-601', source: '房东账单', payer: '李先生', due: '2026-08-05', times: '第12次', period: '08-01~08-31', overdue: '¥0', amount: '¥5,000', paid: '¥0', status: '未出纳', salesman: '赵强', keeper: '王晓明', code: 'F202608012', operations: [{ label: '查看' }, { label: '出纳确认', permission: 'flow:create' }] },
        { store: '联洋店', district: '浦东', biz: '售房', house: '仁恒河滨城15-2301', source: '其他费用', payer: '王女士', due: '2026-08-20', times: '第1次', period: '一次性', overdue: '¥0', amount: '¥16,800', paid: '¥0', status: '终审待审', salesman: '刘思思', keeper: '—', code: 'S202608006', operations: [{ label: '查看' }, { label: '终审' }] }
      ], summary: [{ label: '今日待出纳', value: '5' }, { label: '未出纳', value: '12' }, { label: '终审待审', value: '3' }], pagination: { total: 12, from: 1, to: 3, current: 1 } },
      { rows: [
        { store: '张江店', district: '浦东', biz: '租房', house: '汤臣豪园3-301', source: '租客账单', payer: '王小明', due: '2026-08-31', times: '第6次', period: '08-01~08-31', overdue: '¥0', amount: '¥6,800', paid: '¥6,800', status: '已平账', salesman: '李芳', keeper: '王晓明', code: 'F202608001', operations: [{ label: '查看' }, { label: '打印' }] },
        { store: '浦东店', district: '浦东', biz: '租房', house: '天赋领墅2-601', source: '房东账单', payer: '李先生', due: '2026-08-05', times: '第12次', period: '08-01~08-31', overdue: '¥120', amount: '¥5,000', paid: '¥5,000', status: '已平账', salesman: '赵强', keeper: '王晓明', code: 'F202608012', operations: [{ label: '查看' }, { label: '打印' }] },
        { store: '联洋店', district: '浦东', biz: '售房', house: '仁恒河滨城15-2301', source: '其他费用', payer: '王女士', due: '2026-08-20', times: '第1次', period: '一次性', overdue: '¥0', amount: '¥16,800', paid: '¥16,800', status: '已平账', salesman: '刘思思', keeper: '—', code: 'S202608006', operations: [{ label: '查看' }, { label: '打印' }] }
      ], pagination: { total: 62, from: 1, to: 3, current: 1 } },
      { rows: [
        { store: '联洋店', district: '浦东', biz: '售房', house: '仁恒河滨城15-2301', source: '其他费用', payer: '王女士', due: '2026-08-20', times: '第1次', period: '一次性', overdue: '¥0', amount: '-¥16,800', paid: '¥0', status: '已冲红', salesman: '刘思思', keeper: '—', code: 'S202608006', operations: [{ label: '查看' }, { label: '关联原单' }] },
        { store: '张江店', district: '浦东', biz: '租房', house: '汤臣豪园3-301', source: '租客账单', payer: '王小明', due: '2026-07-31', times: '第5次', period: '07-01~07-31', overdue: '¥0', amount: '-¥6,800', paid: '¥0', status: '已冲红', salesman: '李芳', keeper: '王晓明', code: 'F202608001', operations: [{ label: '查看' }, { label: '关联原单' }] }
      ], pagination: { total: 4, from: 1, to: 2, current: 1 } }
    ],
    pagination: { total: 86, from: 1, to: 3, current: 1 }
  },

  'rent-increase': {
    id: 'rent-increase', title: '涨价统计', group: '财务管理',
    description: '租客合同涨价幅度统计，涨价金额 = 实收金额 - 原价金额',
    actions: [{ label: '导出', icon: 'download' }],
    filters: [
      { label: '综合搜索', placeholder: '地址/租客/房源编号' }, { label: '所属门店', type: 'select', options: ['全部', '张江店', '浦东店'] },
      { label: '应收开始', type: 'date' }, { label: '应收结束', type: 'date', value: '2026-08-31' }, { label: '业务类型', type: 'select', options: ['租房', '储备'] },
      { label: '缴费方式', type: 'select', options: ['月付', '季付', '年付'] }, { label: '收款状态', type: 'select', options: ['全部', '已收', '待收', '逾期'] }
    ],
    layout: 'table',
    columns: [
      { label: '店面', key: 'store' }, { label: '区域', key: 'district' }, { label: '业务类型', key: 'biz' }, { label: '租客姓名/电话', key: 'customer' },
      { label: '缴费方式', key: 'payment' }, { label: '基础定价', key: 'base' }, { label: '收款状态', key: 'status' }, { label: '明细科目', key: 'subject' },
      { label: '应收日期', key: 'due' }, { label: '缴费次数', key: 'times' }, { label: '账单周期', key: 'period' }, { label: '实收金额', key: 'paid' },
      { label: '应收金额', key: 'receivable' }, { label: '原价金额', key: 'original' }, { label: '涨价金额', key: 'increase' }, { label: '房源编号', key: 'code' }, { label: '物业地址', key: 'house' }
    ],
    rows: [
      { store: '张江店', district: '浦东', biz: '租房', customer: '王小明 138****1234', payment: '季付', base: '¥6,500', status: '已收', subject: '房租', due: '2026-08-31', times: '第6次', period: '08-01~08-31', paid: '¥6,800', receivable: '¥6,800', original: '¥6,500', increase: '+¥300', code: 'F202608001', house: '汤臣豪园3-301' },
      { store: '浦东店', district: '浦东', biz: '租房', customer: '周女士 136****3355', payment: '月付', base: '¥2,000', status: '已收', subject: '房租', due: '2026-08-15', times: '第9次', period: '08-01~08-31', paid: '¥2,200', receivable: '¥2,200', original: '¥2,000', increase: '+¥200', code: 'F202608018', house: '天赋领墅2-601' },
      { store: '联洋店', district: '浦东', biz: '租房', customer: '吴先生 137****9911', payment: '年付', base: '¥8,000', status: '待收', subject: '房租', due: '2026-09-01', times: '第2次', period: '09-01~次年08-31', paid: '¥0', receivable: '¥84,000', original: '¥96,000', increase: '-¥12,000', code: 'F202609002', house: '星光佳园5-702' }
    ],
    summary: [{ label: '房间数量', value: '326' }, { label: '总实收金额', value: '¥2,186,400' }, { label: '总涨价金额', value: '+¥86,300' }],
    pagination: { total: 326, from: 1, to: 3, current: 1 }
  },

  profit: {
    id: 'profit', title: '公寓利润', group: '财务管理',
    description: '权责发生制下的公寓利润核算',
    note: '计入公寓利润的数据按分摊起止周期统计，不包含预收账款、预付账款、其他应收款、其他应支款。',
    actions: [{ label: '偏好设置', icon: 'settings-2' }, { label: '使用帮助', icon: 'circle-help' }, { label: '操作日志', icon: 'history' }, { label: '导出报表', icon: 'download' }],
    tabs: [{ label: '主要账目表' }, { label: '预收预付表' }, { label: '其他收付表' }, { label: '系统外挂入' }, { label: '公寓利润表' }],
    filters: [
      { label: '统计开始', type: 'date' }, { label: '统计结束', type: 'date', value: '2026-08-31' }, { label: '业务类型', type: 'select', options: ['租房', '合租', '集中'] },
      { label: '区域', type: 'select', options: ['全部', '浦东', '闵行'] }, { label: '门牌号', placeholder: '门牌号' }
    ],
    layout: 'table',
    columns: [
      { label: '房源编号', key: 'code' }, { label: '业务类型', key: 'biz' }, { label: '区域', key: 'district' }, { label: '店面', key: 'store' }, { label: '物业地址', key: 'house' }, { label: '管家', key: 'keeper' }, { label: '性质', key: 'nature' },
      { label: '一级科目', key: 'subject1' }, { label: '二级科目', key: 'subject2' }, { label: '流水原因', key: 'reason' }, { label: '备注', key: 'remark' }, { label: '登记时间', key: 'createdAt' },
      { label: '分摊起止', key: 'range' }, { label: '流水金额', key: 'amount' }, { label: '计算天数', key: 'days' }, { label: '本周期入账金额', key: 'currentAmount' }, { label: '操作', key: 'operations' }
    ],
    rows: [
      { code: 'F202608001', biz: '租房', district: '浦东', store: '张江店', house: '汤臣豪园3-301', keeper: '王晓明', nature: '包租', subject1: '收入', subject2: '租金', reason: '租客房租', remark: '8月', createdAt: '2026-08-01', range: '08-01~08-31', amount: '¥6,800', days: 31, currentAmount: '¥6,800', operations: [{ label: '查看' }] },
      { code: 'F202608012', biz: '租房', district: '浦东', store: '浦东店', house: '天赋领墅2-601', keeper: '王晓明', nature: '包租', subject1: '成本', subject2: '房东租金', reason: '房东房租', remark: '8月', createdAt: '2026-08-01', range: '08-01~08-31', amount: '¥5,000', days: 31, currentAmount: '¥5,000', operations: [{ label: '查看' }] },
      { code: 'F202608018', biz: '租房', district: '浦东', store: '浦东店', house: '天赋领墅2-601', keeper: '王晓明', nature: '包租', subject1: '成本', subject2: '装修摊销', reason: '房间翻新', remark: '6个月摊销', createdAt: '2026-06-01', range: '06-01~11-30', amount: '¥18,000', days: 183, currentAmount: '¥3,000', operations: [{ label: '查看' }] }
    ],
    tabPanels: [
      null,
      { rows: [
        { code: 'F202608001', biz: '租房', district: '浦东', store: '张江店', house: '汤臣豪园3-301', keeper: '王晓明', nature: '包租', subject1: '资产', subject2: '预收账款', reason: '租客预付9月房租', remark: '预收', createdAt: '2026-08-10', range: '09-01~09-30', amount: '¥6,800', days: 30, currentAmount: '¥0', operations: [{ label: '查看' }] },
        { code: 'F202608012', biz: '租房', district: '浦东', store: '浦东店', house: '天赋领墅2-601', keeper: '王晓明', nature: '包租', subject1: '负债', subject2: '预付账款', reason: '预付房东9月房租', remark: '预付', createdAt: '2026-08-05', range: '09-01~09-30', amount: '¥5,000', days: 30, currentAmount: '¥0', operations: [{ label: '查看' }] }
      ], pagination: { total: 58, from: 1, to: 2, current: 1 } },
      { rows: [
        { code: 'F202608001', biz: '租房', district: '浦东', store: '张江店', house: '汤臣豪园3-301', keeper: '王晓明', nature: '包租', subject1: '收入', subject2: '其他应收款', reason: '水电押金代收', remark: '不计利润', createdAt: '2026-08-03', range: '—', amount: '¥300', days: '—', currentAmount: '¥0', operations: [{ label: '查看' }] },
        { code: 'F202608018', biz: '租房', district: '浦东', store: '浦东店', house: '天赋领墅2-601', keeper: '王晓明', nature: '包租', subject1: '成本', subject2: '其他应支款', reason: '维修垫付款', remark: '不计利润', createdAt: '2026-08-06', range: '—', amount: '¥480', days: '—', currentAmount: '¥0', operations: [{ label: '查看' }] }
      ], pagination: { total: 34, from: 1, to: 2, current: 1 } },
      { rows: [
        { code: 'XG0011', biz: '售房', district: '浦东', store: '张江店', house: '系统外挂入房源', keeper: '李芳', nature: '挂入', subject1: '收入', subject2: '中介服务费', reason: '系统外成交补录', remark: '手工挂入', createdAt: '2026-08-12', range: '08-01~08-31', amount: '¥16,800', days: 31, currentAmount: '¥16,800', operations: [{ label: '查看' }, { label: '审核' }] }
      ], pagination: { total: 12, from: 1, to: 1, current: 1 } },
      { rows: [
        { code: '汇总', biz: '全部', district: '全部', store: '全公司', house: '—', keeper: '—', nature: '—', subject1: '利润', subject2: '公寓利润', reason: '收入 - 成本（权责发生制）', remark: '2026-08', createdAt: '—', range: '08-01~08-31', amount: '¥205,164.98', days: 31, currentAmount: '¥205,164.98', operations: [{ label: '导出' }] },
        { code: '汇总', biz: '租房', district: '浦东', store: '张江店', house: '—', keeper: '—', nature: '—', subject1: '利润', subject2: '门店利润', reason: '门店口径', remark: '2026-08', createdAt: '—', range: '08-01~08-31', amount: '¥86,420.10', days: 31, currentAmount: '¥86,420.10', operations: [{ label: '导出' }] }
      ], pagination: { total: 2, from: 1, to: 2, current: 1 } }
    ],
    pagination: { total: 486, from: 1, to: 3, current: 1 }
  },

  partner: {
    id: 'partner', title: '合伙人', group: '财务管理',
    description: '合伙人分成与收益管理，结余 = 收入 - 支出',
    actions: [{ label: '偏好设置', icon: 'settings-2' }, { label: '导出', icon: 'download' }],
    tabs: [{ label: '合伙人收益' }, { label: '合伙人管理' }],
    filters: [
      { label: '统计月份开始', type: 'date', value: '2026-08-01' }, { label: '统计月份结束', type: 'date', value: '2026-08-31' },
      { label: '合伙人', type: 'select', options: ['全部', '陈合伙', '刘合伙'] }, { label: '物业地址', placeholder: '物业地址' }
    ],
    layout: 'table',
    columns: [
      { label: '房源编号', key: 'code' }, { label: '业务类型', key: 'biz' }, { label: '店面', key: 'store' }, { label: '物业地址', key: 'house' },
      { label: '合伙总比例', key: 'ratio' }, { label: '合伙人', key: 'partner' }, { label: '本人比例', key: 'ownRatio' }, { label: '收入', key: 'income' }, { label: '支出', key: 'expense' }, { label: '结余', key: 'balance' }
    ],
    rows: [
      { code: 'F202608001', biz: '租房', store: '张江店', house: '汤臣豪园3-301', ratio: '20%', partner: '陈合伙', ownRatio: '10%', income: '¥6,800', expense: '¥5,000', balance: '¥180' },
      { code: 'F202608012', biz: '租房', store: '浦东店', house: '天赋领墅2-601', ratio: '30%', partner: '刘合伙', ownRatio: '15%', income: '¥4,500', expense: '¥5,000', balance: '-¥75' },
      { code: 'S202608006', biz: '售房', store: '联洋店', house: '仁恒河滨城15-2301', ratio: '10%', partner: '陈合伙', ownRatio: '10%', income: '¥16,800', expense: '¥0', balance: '¥1,680' }
    ],
    pagination: { total: 68, from: 1, to: 3, current: 1 }
  },

  'income-cost': {
    id: 'income-cost', title: '收入成本', group: '财务管理',
    description: '权责发生制收入与成本确认，本日计租天数按赠送天数调整',
    actions: [{ label: '导出租房', icon: 'download' }, { label: '导出合同', icon: 'file-spreadsheet' }],
    tabs: [{ label: '租金收入' }, { label: '合同资产' }, { label: '租金成本' }, { label: '预计负债' }, { label: '装修摊销' }],
    filters: [
      { label: '统计方式', type: 'select', options: ['月度', '周期'] }, { label: '选择月份', type: 'date', value: '2026-08-01' }, { label: '物业地址', placeholder: '物业地址' },
      { label: '门牌号', placeholder: '门牌号' }, { label: '店面', type: 'select', options: ['全部', '张江店', '浦东店'] }, { label: '业务类型', type: 'select', options: ['租房', '合租', '集中'] },
      { label: '委托模式', type: 'select', options: ['包租', '整租', '合租'] }, { label: '房源编号', placeholder: '房源编号' }
    ],
    layout: 'table',
    columns: [
      { label: '店面', key: 'store' }, { label: '房源编号', key: 'code' }, { label: '房源', key: 'house' }, { label: '业务类型', key: 'biz' }, { label: '委托模式', key: 'mode' },
      { label: '租客', key: 'customer' }, { label: '合同性质', key: 'nature' }, { label: '开始日', key: 'start' }, { label: '结束日', key: 'end' }, { label: '退租日', key: 'leave' },
      { label: '赠送天数', key: 'freeDays' }, { label: '月租金', key: 'rent' }, { label: '月服务费', key: 'service' }, { label: '本应计租天数', key: 'shouldDays' },
      { label: '本月计租天数', key: 'days' }, { label: '上月计租天数', key: 'lastDays' }, { label: '天数差额', key: 'dayDiff' }, { label: '本月租金收入', key: 'income' },
      { label: '上月租金收入', key: 'lastIncome' }, { label: '租金差额', key: 'rentDiff' }, { label: '本月服务费收入', key: 'serviceIncome' },
      { label: '上月服务费收入', key: 'lastServiceIncome' }, { label: '服务费差额', key: 'serviceDiff' }
    ],
    rows: [
      { store: '张江店', code: 'F202608001', house: '汤臣豪园3-301', biz: '租房', mode: '包租', customer: '王小明', nature: '业主合同', start: '2025-09-01', end: '2027-08-16', leave: '—', freeDays: 0, rent: '¥6,800', service: '¥200', shouldDays: 31, days: 31, lastDays: 31, dayDiff: 0, income: '¥6,800', lastIncome: '¥6,800', rentDiff: '¥0', serviceIncome: '¥200', lastServiceIncome: '¥200', serviceDiff: '¥0' },
      { store: '浦东店', code: 'F202608012', house: '天赋领墅2-601', biz: '合租', mode: '包租', customer: '周女士', nature: '转租合同', start: '2025-08-16', end: '2027-03-12', leave: '—', freeDays: 5, rent: '¥2,000', service: '¥100', shouldDays: 31, days: 26, lastDays: 27, dayDiff: '-1', income: '¥1,677', lastIncome: '¥1,742', rentDiff: '-¥65', serviceIncome: '¥84', lastServiceIncome: '¥87', serviceDiff: '-¥3' }
    ],
    pagination: { total: 312, from: 1, to: 2, current: 1 }
  },

  performance: {
    id: 'performance', title: '业绩核算', group: '财务管理',
    description: '房源、出房、中介、员工多维度业绩分配',
    note: '计算演示：留存业绩 = 房源总业绩 - 已分配业绩 - 留存转移。',
    actions: [{ label: '功能说明', icon: 'circle-help' }, { label: '业绩偏好设置', icon: 'settings-2' }, { label: '列表自定义', icon: 'columns-3' }, { label: '导出报表', icon: 'download' }],
    tabs: [{ label: '房源业绩' }, { label: '单次出房业绩' }, { label: '中介拿房业绩' }, { label: '员工业绩' }],
    statusTabs: [{ label: '房源业绩' }, { label: '系统外房源业绩' }, { label: '留存变动' }],
    filters: [
      { label: '店面', type: 'select', options: ['全部', '张江店', '浦东店'] }, { label: '物业地址', placeholder: '物业地址' },
      { label: '搜索', placeholder: '门牌号/房源编号' }, { label: '选业务', type: 'select', options: ['全部', '租房', '售房'] }, { label: '开始日期', type: 'date' }, { label: '结束日期', type: 'date', value: '2026-08-31' }
    ],
    layout: 'table',
    columns: [
      { label: '房源编号', key: 'code' }, { label: '店面', key: 'store' }, { label: '物业地址', key: 'house' }, { label: '管家', key: 'keeper' }, { label: '收房业务员', key: 'receiver' },
      { label: '出租状态', key: 'status' }, { label: '房源总业绩', key: 'total' }, { label: '已分配业绩', key: 'allocated' }, { label: '留存转移', key: 'transfer' }, { label: '留存业绩', key: 'remain' },
      { label: '收租金', key: 'rentIn' }, { label: '租客其他付费', key: 'otherIn' }, { label: '前后租客差价', key: 'diff' }, { label: '付租金', key: 'rentOut' },
      { label: '免租金', key: 'freeRent' }, { label: '房东其他费', key: 'ownerFee' }, { label: '流水收支', key: 'cashflow' }
    ],
    rows: [
      { code: 'XG0011', store: '张江店 1组', house: '汤臣豪园3-301', keeper: '王晓明', receiver: '李芳', status: '已租', total: '¥38,000', allocated: '¥5,000', transfer: '¥0', remain: '¥33,000', rentIn: '¥81,600', otherIn: '¥1,200', diff: '¥3,600', rentOut: '¥60,000', freeRent: '¥0', ownerFee: '¥600', cashflow: '¥22,200' },
      { code: 'HT0030', store: '联洋店 1组', house: '仁恒河滨城15-2301', keeper: '刘思思', receiver: '赵强', status: '已售', total: '¥168,000', allocated: '¥38,000', transfer: '¥2,000', remain: '¥128,000', rentIn: '—', otherIn: '¥16,800', diff: '—', rentOut: '—', freeRent: '—', ownerFee: '¥0', cashflow: '¥16,800' },
      { code: 'HT00028', store: '浦东店 2组', house: '天赋领墅2-601', keeper: '王晓明', receiver: '赵强', status: '部分出租', total: '-¥6,000', allocated: '¥0', transfer: '¥0', remain: '-¥6,000', rentIn: '¥54,000', otherIn: '¥900', diff: '-¥6,000', rentOut: '¥60,000', freeRent: '¥10,000', ownerFee: '¥900', cashflow: '-¥15,100' }
    ],
    pagination: { total: 426, from: 1, to: 3, current: 1 }
  },

  accounting: {
    id: 'accounting', title: '财务核算', group: '财务管理',
    description: '月度收入成本汇总与毛利核算',
    note: '毛利率 =（租金收入 + 其他收入 - 租金成本 - 其他成本）/（租金收入 + 其他收入）× 100%。',
    actions: [{ label: '权责说明', icon: 'circle-help' }, { label: '导出报表', icon: 'download' }],
    tabs: [{ label: '收入成本' }, { label: '收入汇总' }, { label: '成本汇总' }],
    filters: [
      { label: '业务类型', type: 'select', options: ['全部', '租房', '售房'] }, { label: '区域', type: 'select', options: ['全部', '浦东', '闵行'] },
      { label: '物业地址', placeholder: '物业地址' }, { label: '统计月份', type: 'date', value: '2026-08-01' }
    ],
    layout: 'table',
    columns: [
      { label: '序号', key: 'index' }, { label: '月份', key: 'month' }, { label: '租金收入', key: 'rentIncome' }, { label: '其他收入', key: 'otherIncome' },
      { label: '租金成本', key: 'rentCost' }, { label: '其他成本', key: 'otherCost' }, { label: '毛利', key: 'profit' }, { label: '毛利率', key: 'rate' }, { label: '操作', key: 'operations' }
    ],
    rows: [
      { index: 1, month: '2026-08', rentIncome: '¥121,321.09', otherIncome: '¥239,449.69', rentCost: '¥153,032.54', otherCost: '¥2,573.26', profit: '¥205,164.98', rate: '56.97%', operations: [{ label: '查看明细' }] },
      { index: 2, month: '2026-07', rentIncome: '¥109,197.81', otherIncome: '¥133,877.74', rentCost: '¥128,982.10', otherCost: '¥2,401.18', profit: '¥111,692.27', rate: '46.04%', operations: [{ label: '查看明细' }] },
      { index: 3, month: '2026-06', rentIncome: '¥96,580.00', otherIncome: '¥118,200.00', rentCost: '¥102,300.00', otherCost: '¥1,900.00', profit: '¥110,580.00', rate: '51.67%', operations: [{ label: '查看明细' }] }
    ],
    pagination: { total: 24, from: 1, to: 3, current: 1 }
  },

  arrears: {
    id: 'arrears', title: '欠款统计', group: '财务管理',
    description: '他人欠公司、公司欠他人与分公司借款',
    actions: [{ label: '列表自定义', icon: 'columns-3' }, { label: '导出欠款', icon: 'download' }, { label: '应收账单收部分', icon: 'hand-coins', permission: 'bill:collect' }],
    tabs: [{ label: '他人欠公司' }, { label: '公司欠他人' }, { label: '分公司之间借款' }],
    filters: [
      { label: '欠费状态', type: 'select', options: ['未还', '已还完', '坏账'] }, { label: '统计月份', type: 'date', value: '2026-08-01' },
      { label: '欠款身份', type: 'select', options: ['全部', '租客', '房东', '股东', '供应商', '装修公司', '物业', '其他'] }, { label: '期限', type: 'select', options: ['逾期', '未逾期'] },
      { label: '店面', type: 'select', options: ['全部', '张江店', '浦东店'] }, { label: '房源编号', placeholder: '房源编号' }, { label: '门牌号', placeholder: '门牌号' },
      { label: '业务类型', type: 'select', options: ['租房', '售房', '储备'] }, { label: '还款期限', type: 'date' }, { label: '姓名', placeholder: '姓名' }, { label: '时间段', type: 'date' }
    ],
    layout: 'table',
    columns: [
      { label: '房源编号', key: 'code' }, { label: '店面', key: 'store' }, { label: '区域地址门牌', key: 'house' }, { label: '姓名', key: 'name' }, { label: '身份', key: 'identity' },
      { label: '电话', key: 'mobile' }, { label: '欠款时间', key: 'createdAt' }, { label: '欠款总额', key: 'total' }, { label: '剩余欠款', key: 'remain' }, { label: '还款期限', key: 'deadline' },
      { label: '欠款说明', key: 'reason' }, { label: '录入人', key: 'creator' }, { label: '还款状态', key: 'status' }, { label: '操作', key: 'operations' }
    ],
    rows: [
      { code: 'F202608001', store: '张江店', house: '浦东 汤臣豪园3-301', name: '王小明', identity: '租客', mobile: '138****1234', createdAt: '2026-08-01', total: '¥6,800', remain: '¥3,400', deadline: '2026-08-31', reason: '8月房租分期', creator: '李芳', status: '未还', operations: [{ label: '收部分', permission: 'bill:collect' }, { label: '详情' }] },
      { code: 'F202608012', store: '浦东店', house: '浦东 天赋领墅2-601', name: '李先生', identity: '房东', mobile: '136****5678', createdAt: '2026-07-01', total: '¥1,200', remain: '¥1,200', deadline: '2026-08-05', reason: '水电代付', creator: '赵强', status: '逾期', operations: [{ label: '详情' }, { label: '坏账标记' }] },
      { code: '—', store: '分公司', house: '上海分公司 → 苏州分公司', name: '苏州分公司', identity: '其他', mobile: '021****889', createdAt: '2026-06-15', total: '¥200,000', remain: '¥120,000', deadline: '2026-12-31', reason: '短期借款', creator: '财务部', status: '未逾期', operations: [{ label: '还款计划' }] }
    ],
    summary: [{ label: '未还欠款总额', value: '¥124,600' }],
    pagination: { total: 96, from: 1, to: 3, current: 1 }
  },

  plan: {
    id: 'plan', title: '收支计划', group: '财务管理',
    description: '计划类应收应付与执行跟踪',
    actions: [{ label: '导出计划', icon: 'download' }, { label: '添加计划', icon: 'plus', variant: 'btn-primary', permission: 'finance:update' }],
    tabs: [{ label: '添加计划' }, { label: '计划列表' }],
    filters: [
      { label: '月份', type: 'date', value: '2026-08-01' }, { label: '店面', type: 'select', options: ['全部', '张江店', '浦东店'] }, { label: '计划类型', type: 'select', options: ['全部', '应支', '应收'] }
    ],
    layout: 'table',
    columns: [
      { label: '店面', key: 'store' }, { label: '计划类型', key: 'type' }, { label: '款项种类', key: 'category' }, { label: '款项原因', key: 'reason' }, { label: '关联人', key: 'person' },
      { label: '合计期数', key: 'periods' }, { label: '缴费间隔', key: 'interval' }, { label: '计划总金额', key: 'total' }, { label: '已完成金额', key: 'finished' },
      { label: '审核', key: 'audit' }, { label: '备注', key: 'remark' }, { label: '录入人员', key: 'creator' }, { label: '操作', key: 'operations' }
    ],
    rows: [
      { store: '张江店', type: '支出', category: '物业费', reason: '物业管理费', person: '供应商（王林）', periods: 12, interval: '1月', total: '¥24,000', finished: '¥16,000', audit: '已审核【张店长 08-01】', remark: '全年物业', creator: '李芳', operations: [{ label: '查看' }, { label: '审核', permission: 'finance:update' }] },
      { store: '浦东店', type: '收入', category: '房租或押金类收入', reason: '首次签约房租', person: '租客（周先生）', periods: 1, interval: '按期数不规则缴费', total: '¥3,100', finished: '¥3,100', audit: '待审核', remark: '一次性', creator: '赵强', operations: [{ label: '查看' }, { label: '审核', permission: 'finance:update' }] },
      { store: '联洋店', type: '支出', category: '能源费用类支出', reason: '水电气费', person: '物业（联洋物业）', periods: 4, interval: '1季度', total: '¥8,400', finished: '¥4,200', audit: '已审核', remark: '公区分摊', creator: '刘思思', operations: [{ label: '查看' }] }
    ],
    pagination: { total: 78, from: 1, to: 3, current: 1 }
  },

  payout: {
    id: 'payout', title: '代付管理', group: '财务管理',
    description: '商务批量、文件批量与轻托管代付',
    actions: [{ label: '导出账单', icon: 'download' }, { label: '批量下载', icon: 'download' }, { label: '新增代付', icon: 'plus', variant: 'btn-primary', permission: 'finance:update' }],
    tabs: [{ label: '商务批量代付' }, { label: '文件批量代付' }, { label: '轻托管代付' }],
    filters: [
      { label: '店面', type: 'select', options: ['全部', '张江店'] }, { label: '物业地址', placeholder: '物业地址' }, { label: '转款姓名', placeholder: '姓名' },
      { label: '银行名称', placeholder: '银行' }, { label: '银行卡号', placeholder: '**** **** **** 1234' }, { label: '卡类型', type: 'select', options: ['对私', '对公'] },
      { label: '操作人', placeholder: '操作人' }, { label: '支付状态', type: 'select', options: ['已下载,未确认', '已确认', '已支付', '失败'] },
      { label: '操作日期', type: 'date' }, { label: '商户号', placeholder: '商户号' }
    ],
    layout: 'table',
    columns: [
      { label: '店面', key: 'store' }, { label: '物业地址', key: 'house' }, { label: '收款人', key: 'name' }, { label: '银行卡号', key: 'card' }, { label: '银行', key: 'bank' },
      { label: '代付金额', key: 'amount' }, { label: '服务费承担', key: 'feeOwner' }, { label: '应付金额', key: 'payable' }, { label: '服务费', key: 'fee' }, { label: '实付金额', key: 'paid' },
      { label: '卡类型', key: 'cardType' }, { label: '商户号', key: 'merchant' }, { label: '操作人', key: 'operator' }, { label: '操作日期', key: 'createdAt' }, { label: '状态', key: 'status' }
    ],
    rows: [
      { store: '张江店', house: '汤臣豪园3-301', name: '李先生', card: '**** **** **** 5678', bank: '招商银行', amount: '¥5,000', feeOwner: '公司', payable: '¥5,015', fee: '¥15', paid: '¥5,015', cardType: '对私', merchant: 'M20260801', operator: '张店长', createdAt: '2026-08-12', status: '已支付' },
      { store: '浦东店', house: '天赋领墅2-601', name: '装修供应商', card: '**** **** **** 9911', bank: '工商银行', amount: '¥18,000', feeOwner: '收款方', payable: '¥18,000', fee: '¥36', paid: '¥18,000', cardType: '对公', merchant: 'M20260802', operator: '财务部', createdAt: '2026-08-13', status: '已确认' },
      { store: '联洋店', house: '仁恒河滨城15-2301', name: '王女士', card: '**** **** **** 7788', bank: '建设银行', amount: '¥16,800', feeOwner: '公司', payable: '¥16,830', fee: '¥30', paid: '¥0', cardType: '对私', merchant: 'M20260803', operator: '张店长', createdAt: '2026-08-14', status: '已下载,未确认' }
    ],
    summary: [{ label: '总笔数', value: '3' }, { label: '总服务费', value: '¥81' }, { label: '总应付', value: '¥39,845' }, { label: '总实付', value: '¥23,015' }],
    pagination: { total: 68, from: 1, to: 3, current: 1 }
  },

  billing: {
    id: 'billing', title: '开票管理', group: '财务管理',
    description: '发票申请、开票主体、商品与冲红跟踪',
    note: '状态流转：申请 → 待处理 → 开票中 → 已开票 → 已冲红；审核拒绝为已驳回，服务异常为开票失败。',
    actions: [{ label: '导出', icon: 'download' }, { label: '申请开票', icon: 'plus', variant: 'btn-primary', permission: 'finance:update' }],
    tabs: [{ label: '开票记录' }, { label: '开票主体' }, { label: '开票商品' }],
    statusTabs: [{ label: '全部' }, { label: '待处理' }, { label: '开票中' }, { label: '已开票' }, { label: '已驳回' }, { label: '开票失败' }, { label: '已冲红' }],
    filters: [
      { label: '申请来源', type: 'select', options: ['租客发票申请', '房东发票申请', '公司主动申请'] },
      { label: '开票主体', type: 'select', options: ['上海优居科技有限公司', '上海公寓管理有限公司'] },
      { label: '购方名称', placeholder: '购方名称/纳税人识别号' }
    ],
    layout: 'table',
    columns: [
      { label: '状态', key: 'status' }, { label: '申请来源', key: 'source' }, { label: '购买方', key: 'buyer' }, { label: '纳税人识别号', key: 'taxNo' },
      { label: '价税合计', key: 'amount' }, { label: '备注', key: 'remark' }, { label: '开票主体', key: 'company' }, { label: '处理时间', key: 'handledAt' }, { label: '处理人', key: 'handler' }, { label: '操作', key: 'operations' }
    ],
    rows: [
      { status: '待处理', source: '租客发票申请', buyer: '王小明', taxNo: '310***********1234', amount: '¥6,800', remark: '房租', company: '上海优居科技有限公司', handledAt: '—', handler: '—', operations: [{ label: '处理', permission: 'finance:update' }, { label: '驳回', permission: 'finance:update' }] },
      { status: '开票中', source: '房东发票申请', buyer: '李先生', taxNo: '310***********5678', amount: '¥5,000', remark: '房东房租', company: '上海公寓管理有限公司', handledAt: '2026-08-15 10:20', handler: '张店长', operations: [{ label: '查看' }, { label: '同步状态' }] },
      { status: '已开票', source: '公司主动申请', buyer: '上海启航商贸有限公司', taxNo: '91310000MA1K31X4', amount: '¥16,800', remark: '服务费', company: '上海优居科技有限公司', handledAt: '2026-08-14 16:40', handler: '财务部', operations: [{ label: '查看' }, { label: '冲红', permission: 'finance:update' }] }
    ],
    summary: [{ label: '不含税金额', value: '¥27,008.81' }, { label: '税额', value: '¥1,591.19' }, { label: '价税合计', value: '¥28,600' }],
    pagination: { total: 46, from: 1, to: 3, current: 1 }
  }
});
