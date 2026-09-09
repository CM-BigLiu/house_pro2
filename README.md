# 房屋租售管理系统（house_pro）

面向房屋租售一体化运营的 ERP 管理平台，覆盖**房源全生命周期、客源全生命周期、财务全链路、系统配置中心**四大领域。本仓库包含产品文档、高保真原型与可运行的全栈代码实现。

- 后端：NestJS + TypeORM + PostgreSQL
- 前端：Vue 3 + Vite + Element Plus
- 原型：纯静态 HTML/CSS/JS，无需构建

## 仓库结构

```
├── 01-产品文档/          # 产品需求文档（3 份分模块文档 + 整合版 PRD）
├── 02-验收与检查报告/    # 验收标准、冒烟/功能/复测/符合性检查报告
├── 03-测试与账号/        # 测试账号与 Mock 数据说明
├── 04-项目说明/          # 项目说明
├── 05-需求与修改记录/    # 修改需求记录
├── 06-修复建议/          # 各轮修复建议
├── 原型/                 # 高保真静态原型（浏览器直接打开）
├── UI/                   # 优居 ERP 高保真 UI（基于原型，Node 静态服务）
└── code/                 # 可运行系统
    ├── server/           # NestJS + TypeORM + PostgreSQL 后端
    ├── web/              # Vue 3 + Vite + Element Plus 前端
    └── mock-server/      # Express Mock API（与真实后端同端口二选一）
```

## 核心模块

| 一级菜单 | 包含功能 |
|---|---|
| 首页 | 工作台看板（KPI、预警、排行榜、待办） |
| 房屋管理 | 租房、售房、储备房源、储备客源、客户、小区管理 |
| 财务管理 | 账单、流水账、涨价统计、公寓利润、合伙人、收入成本、业绩核算、财务核算、欠款统计、收支计划、代付管理、开票管理（12 个子模块） |
| 系统管理 | 角色管理、权限管理、字典管理、人员管理 |

设计要点：RBAC 三元权限模型（角色 + 数据范围 + 权限点），数据范围支持「我的 / 本组 / 本店 / 全部 / 指定店面」；业务枚举全部走字典配置；敏感字段列表脱敏、授权编辑回原值；合同/短信等模板化；设置变更写操作日志。

## 快速开始

### 可运行系统（code/）

```bash
# 1. 数据库（PostgreSQL，Docker）
cd code/server && docker compose up -d

# 2. 后端：http://localhost:3000（Swagger: /api/docs）
cp .env.example .env
npm install
npm run migration:run
npm run seed
npm run start:dev

# 3. 前端：http://localhost:5173
cd code/web
npm install
npm run dev
```

更详细的说明见 [code/README.md](code/README.md)。无数据库时可用 Mock 后端替代：`cd code/mock-server && node server.js`（占用同一 3000 端口，勿与真实后端同时启动）。

### 原型预览

- `原型/`：纯静态页面，浏览器直接打开 `原型/index.html` 即可。
- `UI/`：高保真 UI 迭代版，`cd UI && npm run dev` 后访问 `http://localhost:7100`。

## 测试账号

默认密码均为 `123456`。

| 账号 | 角色 | 数据范围 |
|---|---|---|
| `super_admin` | 超级管理员 | 全部 |
| `boss` | 公司管理员 | 公司 |
| `store_manager` | 店长 | 门店 |
| `finance` | 财务负责人 | 公司 |
| `housekeeper` | 管家 | 组 |
| `salesman` / `agent01` | 业务员 / 经纪人 | 个人 |
| `readonly` | 只读角色 | 仅查看 |

完整账号、数据范围与 Mock 数据说明见 [03-测试与账号/测试账号与Mock数据说明.md](03-测试与账号/测试账号与Mock数据说明.md)。

## 测试与验收状态

前后端均带自动化测试：

```bash
cd code/server && npm test && npm run test:e2e   # Jest 单元/集成 + E2E
cd code/web && npm test                            # 前端单元测试（Vitest）
```

验收标准与历次测试报告见 `02-验收与检查报告/`（入口：`验收.md`）。截至 2026-09-09 最新一轮：租房、黑名单、小区、售房主流程及账单/流水等已通过 Chrome 真实点击复测；财务结算、退租退款、完整审批链、批量导入导出等尚未验收，**项目整体未判定验收通过**，详见《售房及剩余模块功能测试报告-20260909.md》与《Chrome点击测试与修复复测报告-20260909.md》。

## 文档阅读顺序

1. `01-产品文档/产品文档-最终.md` —— 整合版 PRD（建议从这份读起）
2. `02-验收与检查报告/验收.md` —— 按模块的验收标准
3. `01-产品文档/01/02/03-产品文档.md` —— 分模块原始调研文档
4. `02-验收与检查报告/` 其余报告 —— 各轮测试与复测记录（按日期阅读）
