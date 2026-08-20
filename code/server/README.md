> 后端代码骨架已生成，核心模块结构如下。请在 `code/server` 目录执行 `npm install` 后启动。

## 快速启动

```bash
cd code/server
cp .env.example .env
docker compose up -d
npm install
npm run start:dev
```

启动后访问：
- API 文档：`http://localhost:3000/api/docs`
- 登录：`POST /api/auth/login` `{ "mobile": "super_admin", "password": "123456" }`

## 项目结构

```
code/server/
├── src/
│   ├── main.ts                  # 入口
│   ├── app.module.ts            # 根模块
│   ├── config/                  # 数据库/数据源配置
│   ├── common/                  # 装饰器、Guard、异常过滤器、数据范围工具
│   ├── modules/
│   │   ├── auth/                # JWT 登录
│   │   ├── system/              # 角色、权限、字典、员工、店面
│   │   ├── house/               # 小区、售房、租房、储备、客源、客户
│   │   ├── finance/             # 账单、流水、开票、代付、计划、欠款
│   │   └── dashboard/           # 首页看板聚合数据
│   └── database/seeds/          # 默认角色/字典/演示账号种子
├── docker-compose.yml
├── .env.example
└── package.json
```

## 主要接口

| 接口 | 说明 |
|---|---|
| POST /api/auth/login | 登录 |
| GET /api/auth/me | 当前用户 |
| GET /api/auth/menus | 动态菜单 |
| GET /api/system/dicts | 字典列表 |
| GET /api/system/dicts/:code/items | 字典项 |
| GET /api/system/employees | 员工分页 |
| GET /api/system/roles | 角色列表 |
| GET /api/system/permissions/tree | 权限树 |
| GET /api/house/communities | 小区列表 |
| GET /api/house/sale-properties | 售房房源 |
| GET /api/house/rental-sets | 租房套 |
| GET /api/house/reserves/properties | 储备房源 |
| GET /api/house/reserves/clients | 储备客源 |
| GET /api/house/customers | 客户 |
| GET /api/finance/bills | 账单 |
| GET /api/finance/flows | 流水账 |
| GET /api/finance/invoices | 开票 |
| GET /api/finance/payouts | 代付 |
| GET /api/finance/plans | 收支计划 |
| GET /api/finance/arrears | 欠款 |
| GET /api/dashboard/overview | 看板概览 |
| GET /api/dashboard/warnings | 财务预警 |
| GET /api/dashboard/rankings | 业绩排行 |
| GET /api/dashboard/todos | 待办 |

## 默认账号

| 账号 | 密码 | 角色 |
|---|---|---|
| super_admin | 123456 | 超级管理员 |
| store_manager | 123456 | 店长 |
| salesman | 123456 | 业务员 |

## 后续完善建议

1. 补全 MyBatis-Plus / TypeORM 复杂查询与分页。
2. 引入 Redis 缓存权限与字典。
3. 财务权责发生制摊销、业绩分配算法。
4. 操作日志、黑名单、审批流。
5. 导入导出、文件上传、图片存储。
6. WebSocket 待办实时推送。
