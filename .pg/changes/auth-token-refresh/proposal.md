# auth-token-refresh
**关联 issue**：无
**变更类型**：feature

## 背景
当前登录鉴权链路是「单 JWT」模式：`AuthService.login` 用 `JwtService.sign` 签发一个 `7d` 有效期的访问令牌（`code/server/src/modules/auth/auth.service.ts`），前端拿到后存入本地并作为唯一凭证。这套机制存在三个安全与体验缺口：

1. **无刷新机制**：访问令牌一旦过期（默认 7d），用户只能重新登录，无法静默续期；若为了延长登录态把 `JWT_EXPIRES_IN` 调大，又拉长了令牌泄露后的攻击窗口。
2. **无登出/吊销机制**：`JwtAuthGuard` 只做签名与过期校验（`code/server/src/common/guards/jwt-auth.guard.ts`），没有服务端登出或令牌撤销能力。用户「退出登录」仅清除前端本地存储，服务端已签发的旧令牌在剩余有效期内仍可用；员工被停用（`sys_employee.status` 变更）或密码重置后，旧令牌依旧有效。
3. **令牌泄露不可控**：一旦 access token 泄露，在到期前无法主动使其失效。

## 目标
1. 引入 **refresh token** 刷新循环：`login` 同时返回短时效 access token（默认 2h）与长时效 refresh token（默认 7d），前端通过 `POST /auth/refresh` 静默续期
2. 新增 **服务端登出 / 吊销**：`POST /auth/logout` 使当前 refresh token 失效；提供刷新令牌持久化与吊销能力，access token 通过可配置策略（黑名单 / 版本号）在刷新边界内失效
3. 员工状态变化联动：员工被停用或密码变更后，其历史 refresh token 应可被批次吊销，缩短泄露窗口
4. 复用现有 JWT 基础设施（`@nestjs/jwt` + `JwtAuthGuard`），不引入破坏性 API 变更

## 范围
### 包含
- 后端新增 `refresh_token` 表（TypeORM entity，`synchronize=true` 开发环境自动建表），持久化 refresh token 与账态（active / revoked / expired）
- 后端 `AuthService`：`login` 返回 `{ accessToken, refreshToken, user }`；新增 `refresh` / `logout` 方法
- 后端 `AuthController`：新增 `POST /auth/refresh`、`POST /auth/logout` 端点（`@Public()` 区间 + 独立校验）
- 后端 `JwtAuthGuard` / `JWT` 校验逻辑：access token 与 refresh token 用不同 secret 或不同 `token_type` 声明区分，防止 refresh token 被误当 access token 使用
- 后端配置项：`JWT_ACCESS_EXPIRES_IN`（默认 2h）、`JWT_REFRESH_EXPIRES_IN`（默认 7d）、`JWT_REFRESH_SECRET`（默认独立密钥）
- 前端 `code/web`：登录态管理改为 access + refresh 双令牌；axios 拦截器在 access token 401 时自动 refresh 并重放原请求；登出时调用 `/auth/logout`

### 不包含
- OAuth / 第三方登录 / SSO 集成
- 多设备会话管理 UI（在线设备列表、踢人）
- refresh token 轮换（rotation）后旧 token 复用检测（refresh token reuse detection）
- access token 黑名单的 Redis 化存储（本变更用 DB 持久化 + 可选内存缓存）
- `sys_employee` 密码重置流程本身（仅提供吊销接口供未来复用）

## 方案概述
采用双令牌（access + refresh）+ 服务端 refresh token 持久化方案。`login` 签发 access token（短时效，`token_type=access`）与 refresh token（长时效，`token_type=refresh`），refresh token 落库 `refresh_token` 表（存 hash 而非明文）。前端 access token 失效后，用 refresh token 调 `POST /auth/refresh`；服务端校验 refresh token 签名、`token_type`、并比对 DB 中账态（active 且未过期），通过则轮换签发新 access token（可选轮换 refresh token）。`logout` 将当前 refresh token 置为 revoked；员工停用/改密时可按用户维度吊销其全部 refresh token。`JwtAuthGuard` 增加 `token_type` 校验，拒绝 refresh token 当 access token 使用。

## 风险和注意事项
1. **refresh token 明文泄露**——refresh token 落库若存明文则数据库泄露直接导致账户劫持；本变更存 sha256 hash，仅签发当下返回明文（V-backend-2 验证存储为 hash）
2. **refresh token 被当 access token 使用**——若不区分 token 类型，攻击者可用 refresh token 直接访问业务接口；本变更在 JWT payload 加 `token_type` 并在 guard 校验（V-backend-4 验证），且 access/refresh 用独立 secret
3. **并发刷新竞态**——多请求同时 401 触发并发 refresh 可能重复签发 / 误吊销；前端拦截器需做单飞（in-flight 合并）处理（V-frontend-2 验证）
4. **员工停用后旧令牌仍有效**——若不联动吊销，停用员工在 access token 有效期内仍可访问；本变更提供按用户吊销 refresh token 的接口，access token 残余窗口受短时效（2h）约束（V-backend-3 验证）
5. **刷新循环被无限续期**——若 refresh 也轮换且不设绝对过期上限，可能永久在线；本变更 refresh token 设固定 7d 绝对过期，不随刷新滚动（V-backend-1 验证）

## 未做
- refresh token 轮换后的旧 token 复用检测（reuse detection）——留待后续安全加固迭代
- 在线设备管理 UI 与踢人
- access token 黑名单的 Redis 化
