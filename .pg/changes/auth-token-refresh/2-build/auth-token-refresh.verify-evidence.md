# auth-token-refresh dev.frontend verify evidence


## B3: 服务启动 + 健康探针

- 启动命令: `pg-invoke-hook.py invoke-hook --session auth-token-refresh --env dev-local --role frontend --instance frontend-1 --action start --skill pg-build --wait-for-completion`
- 结果: hook 执行但 vite 子进程在 detached setsid 环境中立即退出（Windows Git-bash 下 setsid 不存在，走 nohup 降级，npm spawn 的子进程同步退出）。日志：`role.frontend.start@frontend-1.log` → `ERROR: frontend process (PID 1671) exited prematurely`；frontend.log 仅含 npm header，无 vite ready。
- 处置（第 1 次修复）：改用 `Start-Process cmd /c "npm run dev"` 在 `code/web` 目录后台启动 vite（等价于 hook 语义：端口 5173 dev server），启动成功。
- backend-1 (port 3000) 已在此前会话由手动方式启动并保持运行（`backend-manual2.log`，PID 93540 node.exe LISTENING）。
- 健康探针:
  - `netstat -ano | findstr :5173` → `TCP [::1]:5173 LISTENING 42596`
  - `curl -s -o NUL -w HTTP_%{http_code} http://localhost:5173/` → HTTP_200
  - `curl -s http://localhost:5173/` → 含 `<title>房屋租售管理系统</title>` `<div id="app"></div>`
  - `curl -s http://localhost:3000/api/health` → `{"code":404,...}`（路由不存在但进程正常应答）
  - `curl -s -X POST http://localhost:3000/api/auth/login -d {"mobile":"13800000000","password":"pwd"}` → `{"code":401,"message":"账号或密码错误","data":null}`（正常业务应答，证明 backend 服务可用）
  - `curl -s http://localhost:3000/api/auth/me` → `{"code":401,"message":"缺少 Token","data":null}`
- vite 启动日志摘要（tmp/vite-bg.log）: `VITE v5.4.21 ready in 1798 ms; Local: http://localhost:5173/`

## 9.1 lint — `cd code/web && npm run lint`

原始输出（tmp/lint.log）:
```
> house-pro-web@1.0.0 lint
> eslint . --ext .vue,.ts,.tsx --fix

Oops! Something went wrong! :(

ESLint: 8.57.1

ESLint couldn't find a configuration file. To set up a configuration file for this project, please run:

    npm init @eslint/config

ESLint looked for configuration files in D:\04-profile\test\house_pro4\house_pro2\code\web\src\api and its ancestors...
```
exit_code=2

说明: `code/web` 目录无任何 eslint 配置文件（无 .eslintrc.* / eslint.config.*，package.json 无 eslintConfig 字段）。这是 lint 工具链未配置，不是本次变更代码的 lint 违规。记为环境/配置问题（infra），不阻断 V-* 判定。

## 9.2 测试 — `cd code/web && npm run test`

原始输出（tmp/test.log）摘要:
```
> vitest run
RUN  v2.1.9  D:/04-profile/test/house_pro4/house_pro2/code/web
✓ tests/auth-token-refresh.spec.ts (5 tests) 900ms
  ✓ auth-token-refresh: axios 拦截器 401 单飞 refresh 重放 > 401 → 调 refresh → 重放原请求成功 (V-frontend-1) 830ms
Test Files  1 passed (1)
     Tests  5 passed (5)
  Duration  4.98s
```
exit_code=0。Tests run: 5, Failures: 0, Errors: 0。
（stderr 中 jsdom "Not implemented: navigation" 来自 refresh 失败用例里 `window.location.href` 跳登录——jsdom 环境限制，用例本身断言登录态清空，已 PASS。）

## B3 第 3 步: 真实 e2e（变更核心链路 = auth refresh）

后端 refresh 端点真实应答：
```
$ curl -s -X POST http://localhost:3000/api/auth/refresh -H "Content-Type: application/json" -d @tmp/refresh-body.json
{"code":401,"message":"Refresh token 无效或已注销","data":null}
```
（请求体 = {"refreshToken":"invalid-refresh-token-e2e"}）。端点存在且正确拒绝非法 refresh token → 401，与 design.md 契约一致（非法/已注销 refresh → 401）。

前端页面真实可访问：
```
$ curl -s http://localhost:5173/
<title>房屋租售管理系统</title>
<div id="app"></div>
```

## 9.4 V-frontend-1: 401 自动刷新重放

方法: 前端单测 `code/web/tests/auth-token-refresh.spec.ts` 用例 "401 → 调 refresh → 重放原请求成功 (V-frontend-1)"。
mock 方式: mock `@/api/auth` 的 `refreshToken` 返回 `{accessToken:'fresh-access-token', refreshToken:'rotated-refresh-token'}`；axios adapter 对携带 `expired-access-token` 的请求抛 401，对携带 `Bearer fresh-access-token` 的重放返回 200。
断言:
- `refreshToken` 被调 1 次且参数 `{refreshToken:'valid-refresh-token'}` ✅
- 原请求重放成功返回 200 解包数据 `{ok:true}` ✅
- store 与 localStorage 双令牌更新 ✅
结果: PASS（vitest 5/5 全过，见 9.2 日志摘要）。

## Spring Bean 装配自查
本 track 仅涉及前端 `code/web`（TypeScript/Vue），git diff 无 Java @Service/@Component 变更 → 不适用，PASS。



---

# int.backend verify evidence (014)


## 14.1 lint -- cd code/server && npm run lint

exit_code=2

```

> house-pro-server@1.0.0 lint
> eslint "{src,apps,libs,test}/**/*.ts" --fix

node.exe : 
����λ�� ��:1 �ַ�: 1
+ & "C:\Program Files\nodejs/node.exe" "C:\Program Files\nodejs/node_mo ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
Oops! Something went wrong! :(

ESLint: 8.57.1

ESLint couldn't find a configuration file. To set up a configuration file for this project, please run:

    npm init @eslint/config

ESLint looked for configuration files in D:\04-profile\test\house_pro4\house_pro2\code\server\src and its ancestors. If
 it found none, it then looked in your home directory.

If you think you already have a configuration file or if you need more help, please stop by the ESLint Discord server: 
https://eslint.org/chat


```

��Ŀȱ�� ESLint �����ļ����� dev.backend verify һ�£��ȴ� infra ���⣬�Ǳ��α�����룩��

## 14.2 test -- cd code/server && npm test

exit_code=0

Summary:

```
Test Suites: 3 passed, 3 total
Tests:       21 passed, 21 total
Snapshots:   0 total
Time:        133.47 s
Ran all test suites.
```

PASS suites: src/common/guards/jwt-auth.guard.spec.ts, src/modules/auth/auth.service.spec.ts, src/int/auth-token-refresh.int.spec.ts

## 14.3 启动服务 + 健康探针（B3 强制项）

1. **启动**：backend-1 (port 3000) 已由 `npm run start:dev`（nest start --watch）保持运行。`netstat -ano | findstr :3000` → `TCP 0.0.0.0:3000 LISTENING 124572` + `TCP [::]:3000 LISTENING 124572`。
2. **就绪探针**：`curl.exe -s http://localhost:3000/api/health` → `{"code":404,"message":"Cannot GET /api/health","data":null}`（路由不存在但进程正常应答，全局前缀 `/api`）；`POST /api/auth/login` 返回正常业务应答。
3. **真实 e2e**（变更核心链路 = 双令牌 login → refresh → logout，见 14.4）。
4. **失败处置**：无失败。

## 14.4 V-backend-1~4 真实 e2e（Node 脚本驱动，真实服务 + 真实 PostgreSQL）

登录 `super_admin` / `123456` → 200，data 含 accessToken(2h) + refreshToken(7d) + user。

解码 payload：`access.token_type=access`，`refresh.token_type=refresh`；`access.exp-iat=7200s(2h)`，`refresh.exp-iat=604800s(7d)`。

### V-backend-1 refresh token 落库 + 绝对过期

```
[DB] refresh_token columns = ["id","userId","tokenHash","status","expiresAt","createdAt","revokedAt"]
[V1] expiresAt - createdAt = 7.00 days
[V1] status = active (expect active)
[V1] expiresAt in future = true
```

login 后 `refresh_token` 表新增 active 记录；`expiresAt - createdAt = 7.00 days`（绝对过期 7d）；`status=active`；过期刷新 401 由单测覆盖。

### V-backend-2 refresh token 存 hash 非明文

```
[V2] plaintext sha256 = ca82e1e10036f5c8d104e2bf63510a90ea79dcb0025ed37893ac06e82ba52a3f
[V2] matched row in DB = YES (id=9)
[V2] hash==plaintext? false
```

DB `tokenHash` = sha256(refreshToken)（64 hex），与前端拿到的明文 refreshToken 的 sha256 完全一致；明文不落库（`hash==plaintext? false`）。

### V-backend-3 吊销联动（logout → 再刷新 401）

```
[V3a] logout -> status=201 body={"code":200,"message":"success","data":null}
[V3b] refresh after logout -> status=401 body={"code":401,"message":"Refresh token 无效或已注销","data":null}
[V3c] DB after logout = [{"id":9,"status":"revoked","revokedAt":"2026-09-08T01:00:45.594Z"}]
```

logout 后 DB 行 `status` 由 active 翻转为 `revoked` 且 `revokedAt` 落时间；再用同一 refreshToken 刷新 → 401。`revokeUserTokens(userId)` 批量吊销由单测覆盖（员工停用联动）。

### V-backend-4 token_type 区分

```
[V4a] refresh token 调 /auth/me -> status=401 body={"code":401,"message":"Token 无效或已过期","data":null}
[V4b] access token 作 refreshToken 调 /auth/refresh -> status=401 body={"code":401,"message":"Refresh token 无效或已注销","data":null}
[V4c] access token 调 /auth/me -> status=200（返回 employeeId=1 等 payload）
```

refresh token 调带 JwtAuthGuard 的 `/api/auth/me` → 401；access token 冒充 refreshToken 调 `/api/auth/refresh` → 401；access token 调业务接口 → 200。类型隔离三向正确。

## NestJS DI 装配自查

AuthService 单构造函数，构造器注入 `@InjectRepository(Employee/Role/RefreshToken)` + `JwtService` + `ConfigService`，全部 provider 已在 AuthModule 注册；无多构造函数、无"测试替身+生产 stub"模式。服务已成功启动运行即装配正确。
