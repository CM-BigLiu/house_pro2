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
