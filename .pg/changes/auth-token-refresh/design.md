# auth-token-refresh 设计

## 架构概览

```
现状（单 JWT）:
┌────────────────────────────────────────────────────────────┐
│ 前端 (code/web)                                            │
│   登录 → 存 accessToken (7d) → 每次请求带 Bearer            │
│   401 → 跳登录页 (无静默续期)                                │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│ 后端 (code/server)                                          │
│   AuthController.login ──> AuthService.login ──> JwtService │
│       单 token, payload 含 employeeId/mobile/roles/perms     │
│   JwtAuthGuard: 仅 verify 签名 + 过期, 无 token_type 区分    │
│   (sys_employee 表, 无 refresh_token 表)                     │
└────────────────────────────────────────────────────────────┘

目标（双令牌 + refresh token 持久化）:
┌────────────────────────────────────────────────────────────┐
│ 前端 (code/web)                                            │
│   login -> 存 {accessToken(2h), refreshToken(7d)}           │
│   axios 拦截器: 401 -> 单飞 refresh -> 重放原请求 -> 登出    │
│   登出 -> POST /auth/logout                                  │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│ 后端 (code/server)                                          │
│   AuthService.login -> 签发 access + refresh, refresh 落库  │
│     (存 sha256 hash, 状态 active, 绝对过期 7d)               │
│   AuthService.refresh -> 校验 token_type=refresh + DB 账态   │
│     -> 签发新 access (可选轮换 refresh)                      │
│   AuthService.logout -> 置 refresh token revoked             │
│   JwtAuthGuard -> 校验 token_type=access, 拒绝 refresh 误用  │
│   refresh_token 表 (TypeORM entity)                          │
└────────────────────────────────────────────────────────────┘
```

## API 设计

### POST /auth/login（响应结构变更，向后兼容）

### POST /auth/login - Request Body
```json
{
  "mobile": "13800000000",
  "password": "******"
}
```

### POST /auth/login - Response Body (200/201)
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "张三",
      "mobile": "138****0000",
      "avatar": "https://..."
    }
  }
}
```

### POST /auth/login - Response Body (4xx 失败)
```json
{
  "code": 401,
  "message": "账号或密码错误",
  "data": null
}
```

| 状态码 | 触发条件 | 错误码 |
|--------|----------|--------|
| 200/201 | 登录成功 | 0 |
| 401 | 账号不存在或密码错误 | 401 |

### POST /auth/refresh

### POST /auth/refresh - Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/refresh - Response Body (200/201)
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/refresh - Response Body (4xx 失败)
```json
{
  "code": 401,
  "message": "Refresh token 无效或已注销",
  "data": null
}
```

| 状态码 | 触发条件 | 错误码 |
|--------|----------|--------|
| 200/201 | 刷新成功 | 0 |
| 401 | refresh token 无效 / 过期 / 已注销 | 401 |

### POST /auth/logout

### POST /auth/logout - Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/logout - Response Body (200/201)
```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

### POST /auth/logout - Response Body (4xx 失败)
```json
{
  "code": 401,
  "message": "Refresh token 无效",
  "data": null
}
```

| 状态码 | 触发条件 | 错误码 |
|--------|----------|--------|
| 200/201 | 登出成功 | 0 |
| 401 | refresh token 无效 | 401 |

## 数据模型

新增 `refresh_token` 表（TypeORM entity，开发环境 `synchronize=true` 自动创建）：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | number | PK, auto-increment | 主键 |
| userId | number | not null, indexed | 关联 `sys_employee.id` |
| tokenHash | varchar(64) | unique, not null | refresh token 的 sha256 hex |
| status | varchar(20) | default 'active' | active / revoked |
| expiresAt | timestamptz | not null | 绝对过期时间（7d，不随刷新滚动） |
| createdAt | timestamptz | default now | 创建时间 |
| revokedAt | timestamptz | nullable | 吊销时间 |

## 组件设计

### 后端改动组件

| 组件 | 路径 | 改动 |
|------|------|------|
| `RefreshToken` entity | `code/server/src/modules/auth/entities/refresh-token.entity.ts` | 新增 |
| `AuthService` | `code/server/src/modules/auth/auth.service.ts` | `login` 双令牌签发 + refresh 落库；新增 `refresh` / `logout` / `revokeUserTokens` |
| `AuthController` | `code/server/src/modules/auth/auth.controller.ts` | 新增 `POST /auth/refresh`、`POST /auth/logout` |
| `AuthModule` | `code/server/src/modules/auth/auth.module.ts` | `TypeOrmModule.forFeature([RefreshToken])` + JWT 双 secret 配置 |
| `JwtAuthGuard` | `code/server/src/common/guards/jwt-auth.guard.ts` | 校验 payload `token_type === 'access'`，拒绝 refresh token 误用 |
| crypto util | `code/server/src/common/utils/crypto.util.ts` | 复用已有 sha256 能力 |

### 前端改动组件

| 组件 | 路径 | 改动 |
|------|------|------|
| auth store / api | `code/web/src/api/auth.ts` + `code/web/src/stores/auth.ts` | access + refresh 双令牌存储；login/refresh/logout 调用 |
| axios 拦截器 | `code/web/src/utils/request.ts`（或同级 request 封装） | 401 → 单飞 refresh → 重放 → 失败清登录态跳登录 |

## 关键约束与契约

### 前置条件
- `@nestjs/jwt` 已安装（`auth.module.ts` 已 `JwtModule.registerAsync`），无需新增依赖
- `TypeOrmModule.forFeature` 已用于 `Employee/Role/Permission`，新增 `RefreshToken` 加入即可
- 开发环境 `synchronize=true`，`refresh_token` 表无需手写迁移（生产需迁移，本变更仅覆盖 dev-local）

### 影响面
- 表/索引/字段：新增 `refresh_token` 表（含 `tokenHash` 唯一索引、`userId` 索引）
- service/controller 方法签名：
  - `AuthService.login` 返回结构从 `{ token, user }` 变为 `{ accessToken, refreshToken, user }`（**破坏性**，前端同步改）
  - `AuthService` 新增 `refresh` / `logout` / `revokeUserTokens` 方法
  - `AuthController` 新增 2 端点
  - `JwtAuthGuard` 增加 `token_type` 校验（向后兼容：旧 token 无 `token_type` 声明如何处理需明确）
- 是否破坏任何对外 API：`POST /auth/login` 响应 `data.token` 改为 `data.accessToken` + 新增 `data.refreshToken`（对旧前端是破坏性，需同仓同步发布）

### 性能契约
- refresh token 查询走 `tokenHash` 唯一索引，O(1)
- 刷新流程单次签名 + 单次 UPDATE，无 N+1
- 前端 refresh 单飞（in-flight 合并），避免并发 401 触发重复刷新

### 错误码与编号段
- 沿用 `UnauthorizedException`（HTTP 401），不新增自定义错误码；`refresh` / `logout` 失败统一 401

### 环境限制与验证策略

| 功能契约 (V-*) | dev-local 可验证 | 验证方式 | 不可验证部分的处理 |
|---------------|:---:|------|------|
| V-backend-1 refresh token 落库 + 绝对过期 | ✅ | 单元测试 + scenario | n/a |
| V-backend-2 refresh token 存 hash 非明文 | ✅ | 单元测试 | n/a |
| V-backend-3 员工停用联动吊销 | ✅ | 单元测试 + scenario | n/a |
| V-backend-4 token_type 区分，refresh 不能当 access | ✅ | 单元测试 + scenario | n/a |
| V-frontend-1 401 自动刷新重放 | ✅ | 单元测试（前端拦截器）+ scenario | 真实网络中断场景留待 manual |
| V-fullstack-1 登录→刷新→登出全链路 | ✅ | scenario | n/a |

### 可观测性
- 关键日志点：`AuthService.refresh` 成功 / 失败 INFO / WARN（含 userId、是否命中 revoked / expired）；`logout` INFO
- 关键指标：refresh token 签发散、吊销数（可后续接 Counter，本变更仅日志）
- RequestId 追踪：沿用现有 `TransformInterceptor` / `AuditInterceptor`，无额外埋点

## Verification Criteria

### dev backend Verification Criteria
| ID | 验证项 | 前置/数据准备 | 方法 | 预期结果 |
|-----|--------|---------------|------|---------|
| V-backend-1 | refresh token 落库 + 绝对过期 | 有可登录员工（sys_employee 有记录） | 单元测试调 `login` → 断言 `refresh_token` 表新增 active 记录且 expiresAt = 签发时间 + 7d；过期 token 刷新返回 401 | 落库成功，过期时间正确，过期后刷新 401 |
| V-backend-2 | refresh token 存 hash 非明文 | 同上 | 单元测试调 `login`，断言 `refresh_token.tokenHash` 为 sha256（64 hex），且不等于返回给前端的明文 refreshToken | 落库为 hash，明文不落库 |
| V-backend-3 | 员工停用联动吊销 | 有员工记录 | 单元测试 `revokeUserTokens(userId)` 后，该用户历史 refresh token 刷新返回 401 | 停用/吊销后刷新失败 |
| V-backend-4 | token_type 区分 | 已签发 access + refresh token | 用 refresh token 调带 `JwtAuthGuard` 的业务接口 → 401；用 access token 调 `refresh` → 401 | 类型隔离正确 |

### dev frontend Verification Criteria
| ID | 验证项 | 前置/数据准备 | 方法 | 预期结果 |
|-----|--------|---------------|------|---------|
| V-frontend-1 | 401 自动刷新重放 | mock auth api + 过期 access token | 前端单测：拦截器捕获 401 → 调 refresh → 重放原请求成功 | 原请求重放成功返回 200 |

### int fullstack Verification Criteria
| ID | 验证项 | 前置/数据准备 | 方法 | 预期结果 |
|-----|--------|---------------|------|---------|
| V-fullstack-1 | 登录→刷新→登出全链路 | dev-local：house-local-db + house-backend + house-frontend 可达 | scenario 跑用户旅程：登录得双令牌 → 用 refresh 换新 access → 登出 → refresh 返回 401 | 全链路无报错，登出后刷新失败 |

## 变更类型判定

| track | 是否影响 | 理由 |
|-------|---------|------|
| backend | ✅ | AuthService/Controller/Guard 改动 + 新增 refresh_token entity |
| frontend | ✅ | 登录态双令牌 + axios 拦截器刷新重放 |
| fullstack | ✅ | 登录→刷新→登出跨前后端联调，需 scenario 验证 |

**affected_tracks**：`backend`, `frontend`, `fullstack`

**scenario track 启用决策**：`fullstack=true`
- 跨 role 协作验证？是（前端拦截器 refresh 重放 ↔ 后端 refresh token 校验 + 落库 + 吊销）
- 新 API 端点？是（`POST /auth/refresh`、`POST /auth/logout`）
- 跨模块联调？是（前端 axios ↔ 后端 AuthService ↔ refresh_token 表）
