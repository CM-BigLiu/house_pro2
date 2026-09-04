# dev.backend verify evidence — auth-token-refresh

验证时间：2026-09-04（本机）
环境：dev-local（Windows，backend PID 93540，端口 3000，PostgreSQL 5432）

---

## 0. 运行时启动 + 健康探针

### 0.1 restart_all_instances hook 调用

```
$ python .pg/skills/src/runtime/bin/pg-invoke-hook.py invoke-hook --session auth-token-refresh --env dev-local --action restart_all_instances --skill pg-build
(no output, exit 0)
```

hook 日志（dev-local-logs/role.backend.start@backend-1.log）显示 bash hook 在 Windows 下
`pg_start_bg npm ...` 因子进程 PATH 缺 npm 失败（PG-E-0925）。此为 hook/Windows 环境兼容性问题，
非应用代码问题。处理方式：直接重启后端进程——先 `npm run build`（nest build 通过）重新编译 dist，
再 Stop-Process 旧进程 (PID 93452, 14:01 启动的 `node dist\main`) 并以新 dist 启动 (PID 93540)。

### 0.2 端口探针

```
$ netstat -ano | findstr ":3000" | findstr LISTENING
  TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    93540
$ curl -s -o NUL -w "%{http_code}" http://localhost:3000/
404            # 根路径无路由属正常（全局前缀 /api）
```

### 0.3 新代码生效确认（旧进程无 /auth/refresh，新进程有）

```
旧进程（重启前）: POST /api/auth/refresh -> 404 Cannot POST
新进程（重启后）: POST /api/auth/refresh -> 401 {"code":401,"message":"Refresh token 无效或已注销","data":null}
```

服务启动 + 探针 + 新端点可达：service_startup PASS。

---

## 4.1 lint

```
$ npm run lint
> eslint "{src,apps,libs,test}/**/*.ts" --fix
ESLint: 8.57.1
ESLint couldn't find a configuration file. ... please run: npm init @eslint/config
```

**FAIL（既存问题，与本次变更无关）**：项目缺少 ESLint 配置文件。002-dev.backend-dev-result.json
已记录同一问题（"lint 因项目缺少 ESLint 配置文件无法运行（既存问题，与本次改动无关）"）。
本次变更未引入任何 lint 配置改动。

## 4.2 单元测试

```
$ npm test
PASS src/common/guards/jwt-auth.guard.spec.ts (11.504 s)
PASS src/modules/auth/auth.service.spec.ts (16.841 s)
Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        20.938 s
```

Tests run: 15, Failures: 0, Errors: 0。

覆盖：
- auth.service.spec.ts 11 用例（V-backend-1 落库+绝对过期 / V-backend-2 hash 非明文 /
  V-backend-3 revokeUserTokens 联动吊销 / V-backend-4 access token 用于 refresh 401）
- jwt-auth.guard.spec.ts 4 用例（V-backend-4 refresh token 调业务接口 401）

唯一 console.warn：`[Encryption] FIELD_ENCRYPTION_KEY not set, using fallback key for
development only`（开发环境兜底密钥，既存行为，非本次变更引入）。

## 4.3 启动服务

见 0.x。backend-1 (localhost:3000) 已运行最新构建（PID 93540）。

## 4.4 V-backend-N 真实 e2e（运行中的服务 + 真实 PostgreSQL）

### Step 1: POST /api/auth/login（super_admin / 123456）

```
status: 201  code: 200
data.user: {"id":1,"name":"超级管理员","mobile":"super_admin","avatar":null}
data.accessToken payload:  { employeeId:1, token_type:'access', iat:2026-09-04T06:36:11Z, exp:2026-09-04T08:36:11Z, ttl=2h }
data.refreshToken payload: { employeeId:1, token_type:'refresh', iat:2026-09-04T06:36:11Z, exp:2026-09-11T06:36:11Z, ttl=7d }
```

### V-backend-1: refresh token 落库 + 绝对过期 —— PASS

DB 查询（pg 驱动直连 house_pro）：

```
SELECT id, "userId", "tokenHash", status, "expiresAt", "createdAt", "revokedAt"
FROM refresh_token WHERE "userId"=1 ORDER BY id DESC LIMIT 1

{
  "id": 2,
  "userId": 1,
  "tokenHash": "708d4875975432462fea2b63941fc9a9f89b0e1210949c40774b35ae8ef1a4db",
  "status": "active",
  "expiresAt": "2026-09-11T06:44:19.804Z",
  "createdAt": "2026-09-04T06:44:19.806Z",
  "revokedAt": null
}
expiresAt - createdAt = 6.999999976851852 days   # = 7d 绝对过期 ✓
status = active ✓
```

过期 token 刷新 401：由单测 `auth.service.spec.ts`「过期 refresh token 刷新返回 401」覆盖
（mock expiresAt 过去时间 → UnauthorizedException），15/15 PASS。

### V-backend-2: refresh token 存 hash 非明文 —— PASS

```
node: crypto.createHash('sha256').update(refreshToken).digest('hex')
sha256(refreshToken): 708d4875...8ef1a4db
DB tokenHash:         708d4875...8ef1a4db
match: true ✓  hash_length: 64 ✓  hash !== plaintext ✓
```

落库为 sha256 hex（64 字符），明文 refreshToken 不落库。

### V-backend-3: 停用/吊销联动 —— PASS

```
POST /api/auth/logout {refreshToken} -> 201 code:200
（logout 内部置 status=revoked；revokeUserTokens 同一 revoke 路径，单测覆盖批量吊销）

POST /api/auth/refresh {refreshToken} (吊销后) -> 401 {"code":401,"message":"Refresh token 无效或已注销"}

DB row after logout: {"id":2,"status":"revoked","revokedAt":"2026-09-04T06:44:19.908Z"}
```

吊销后刷新失败 ✓；员工停用联动（revokeUserTokens(userId) 批量吊销）由单测
「revokeUserTokens 后 refresh 401」覆盖（15/15 PASS）。

### V-backend-4: token_type 区分 —— PASS

```
4a) GET /api/system/employees  Authorization: Bearer <refreshToken>
    -> 401 {"code":401,"message":"Token 无效或已过期"}        # JwtAuthGuard 拒绝 refresh ✓
4b) POST /api/auth/refresh  {refreshToken: <accessToken>}
    -> 401 {"code":401,"message":"Refresh token 无效或已注销"}  # refresh 拒绝 access ✓
4c) GET /api/system/employees  Authorization: Bearer <accessToken>
    -> 200 code:200                                            # access 正常访问 ✓
```

类型隔离正确。

## NestJS DI 装配自查（对应 dispatch 的 Spring Bean 装配自查，本项目为 NestJS/TS）

本次 diff 新增/修改的可注入类：AuthService（修改）。
- 构造函数数量：1（无多构造函数歧义）✓
- 构造器注入：`@InjectRepository(Employee/Role/RefreshToken)` + `JwtService` + `ConfigService`，
  全部参数类型已在 AuthModule 注册（`TypeOrmModule.forFeature([..., RefreshToken])`、
  `JwtModule.registerAsync`、ConfigModule 全局）✓
- 无"测试替身 + 生产 stub"模式（review 阶段 grep TODO|FIXME|stub|placeholder 无命中）✓

服务实际启动成功（Nest 应用引导无 DI 错误，见 0.x）——若有装配问题进程会启动即崩。

## 结论

- 4.1 lint：FAIL（既存：项目无 ESLint 配置，与本次变更无关）
- 4.2 test：PASS（15/15）
- 4.3 服务启动：PASS（PID 93540，端口 3000，新端点生效）
- 4.4 V-backend-1/2/3/4：全部 PASS（真实服务 + 真实 DB 端到端验证）

无代码 bug。lint 失败为项目既存配置缺失，不构成本次变更的 escalate 理由
（dev 阶段 result 已同样记录并接受）。
