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

- 租售房源、客源、房管房、成交、财务核算与系统管理页面
- RBAC 三元权限模型（角色 + 数据范围 + 权限点）
- 字典驱动表单选项
- 统一 4 步房源录入向导
- 深色侧边栏 + 玻璃顶栏高保真 UI

## 验证清单

1. 登录后侧边栏显示首页、房屋管理、财务管理、系统管理。
2. 切换角色（super_admin / salesman）菜单与按钮动态显隐。
3. 租房/售房/客户/小区页面可查询、新增；房管房管理提供房管管理与实际租客管理两个页签。
4. 统一房源录入向导 4 步可切换。
5. 财务成交管理展示合同快照；租房月租与售房总价分开汇总，不作为实收流水。
6. 角色/权限/字典/人员页面可查看/编辑。
7. 首页看板展示 KPI、预警、排行榜、图表、待办。

## 客户与成交工作流（2026-09-27）

客户分类依次为全部客户、租房客户、买房客户及各状态分类。约看先选择有权限的租房或售房，签约必须关联该客户的未签约约看。签约后自动生成成交合同快照并同步客户、房态；租房解约提交退租审批，审批通过后释放房源，押金清算仍走原流程。售房解约保留合同历史并恢复原房态，不自动退款。

成交记录按负责人、分组和门店数据范围过滤。新增操作权限为 `house:customer:appointment`、`house:customer:sign`、`house:customer:terminate`，成交菜单权限为 `finance:deal`。

账单、流水账、涨价统计、代付管理的前端页面、接口和写入服务已退休，旧接口返回 404。历史账单与流水保留为只读归档供现有房管支付时间、财务核算查询使用，不清空数据库。迁移 `1790467208000` 会迁移历史租房签约快照并清理旧权限；运行迁移后设置 `DB_SYNCHRONIZE=false`，再启动正式 NestJS 后端。迁移前备份文件：`D:/06-tempFile/house-pro4-db-backups-20260927/house_pro.before-customer-deals-20260927.dump`。

`mock-server` 仅提供兼容的空成交列表，不支持新的约看、签约与解约工作流；这些功能请使用 `code/server`。

保留报表继续使用 `finance:export`，父节点已从旧账单迁到财务模块；补充迁移 `1790467209000` 保持该共享权限及原默认授权，不恢复四个已退休模块。

租房托管使用迁移 `1790467210000` 新增的 `is_managed`，历史房源默认未托管。首次跟进下的“托管”保存当前房源并使其进入房管房及租客列表；“取消托管”只移除关联，保留租房档案。房东与收房资料、首次跟进、带看时间及托管列表仅原录入人（`creatorId`）和 `super_admin` / `company_admin` 可见；全公司、门店或分组数据范围不会扩大此权限。管理员角色写入登录令牌的 `roleCodes`，升级后已有会话重新登录即可生效。托管、权限控制与相关数据库查询使用正式 `code/server` 后端，旧 mock-server 不支持此流程。
