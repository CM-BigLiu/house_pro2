# 房屋租售管理系统

本目录包含完整的可运行系统骨架：后端 REST API + 前端 SPA + 数据库配置。

## 目录结构

```
code/
  server/   NestJS + TypeORM + PostgreSQL 后端
  web/      Vue 3 + Vite + Element Plus 前端
```

## 快速启动

### 1. 启动数据库

```bash
cd code/server
docker compose up -d
```

### 2. 启动后端

```bash
cd code/server
cp .env.example .env
npm install
npm run migration:run
npm run seed
npm run start:dev
```

后端默认运行在 `http://localhost:3000`，Swagger 文档：`http://localhost:3000/api/docs`。

### 3. 启动前端

```bash
cd code/web
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`。

## 默认账号

| 账号 | 密码 | 角色 |
|---|---|---|
| super_admin | 123456 | 超级管理员 |
| store_manager | 123456 | 店长 |
| salesman | 123456 | 业务员 |

## 覆盖范围

- 23 个页面路由
- RBAC 三元权限模型（角色 + 数据范围 + 权限点）
- 字典驱动表单选项
- 统一 4 步房源录入向导
- 深色侧边栏 + 玻璃顶栏高保真 UI

## 验证清单

1. 登录后侧边栏显示首页、房屋管理、财务管理、系统管理。
2. 切换角色（super_admin / salesman）菜单与按钮动态显隐。
3. 租房/售房/储备/客源/客户/小区页面可查询、新增。
4. 统一房源录入向导 4 步可切换。
5. 财务 12 页面可打开并展示列表。
6. 角色/权限/字典/人员页面可查看/编辑。
7. 首页看板展示 KPI、预警、排行榜、图表、待办。
