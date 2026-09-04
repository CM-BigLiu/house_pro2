> - **environment 选择**：dev → dev-local，int → dev-local

## 1. dev.backend:test - dev 测试先行

<!-- on_conditions_eval:
     stage=dev (常驻, 无 on_conditions)
     track=backend (常驻, 无 on_conditions)
-->

- [ ] 1.1 为 `AuthService` 编写单元测试：`login` 返回双令牌（access + refresh）；`refresh` 校验 token_type + DB 账态；`logout` 置 revoked；覆盖 V-backend-1~4 的后端断言（refresh 落库 / hash 存储 / 停用联动吊销 / token_type 区分）

## 2. dev.backend:dev - 实现开发

<!-- on_conditions_eval:
     stage=dev (常驻, 无 on_conditions)
     track=backend (常驻, 无 on_conditions)
-->

- [ ] 2.1 新增 `refresh-token.entity.ts`（RefreshToken entity：userId/tokenHash/status/expiresAt/revokedAt）
- [ ] 2.2 `AuthModule` 注册 `TypeOrmModule.forFeature([RefreshToken])` + JWT 双 secret（access/refresh 独立密钥 + 独立 expiresIn）
- [ ] 2.3 `AuthService.login` 改为签发 access（token_type=access, 2h）+ refresh（token_type=refresh, 7d），refresh 落库 sha256 hash
- [ ] 2.4 新增 `AuthService.refresh`：校验 token_type=refresh + DB 账态（active 且未过期）→ 签发新 access
- [ ] 2.6 `AuthController` 新增 `POST /auth/refresh`、`POST /auth/logout`（`@Public()` + 独立校验）
- [ ] 2.7 `JwtAuthGuard` 增加 `token_type === 'access'` 校验，拒绝 refresh token 误当 access 使用

## 3. dev.backend:review - 静态代码审查

<!-- on_conditions_eval:
     stage=dev (常驻, 无 on_conditions)
     track=backend (常驻, 无 on_conditions)
-->

- [ ] 3.1 review agent 读 design.md + tasks.md + .pg/code-review/code-review.yaml 细则
- [ ] 3.2 review agent 对 git diff feat/pg/auth-token-refresh 做静态审查
- [ ] 3.3 review agent 输出 review_score + p0_failures 到本 section 对应的 review 报告（路径由 dispatch 注入）
- [ ] 3.4 score < pass_threshold → escalate 至 fix-review；score ≥ pass_threshold → completed → 进入 verify

## 4. dev.backend:verify - dev 集成验证

<!-- on_conditions_eval:
     stage=dev (常驻, 无 on_conditions)
     track=backend (常驻, 无 on_conditions)
-->

- [ ] 4.1 执行 lint（runner 通过 modules 注入命令）
- [ ] 4.2 执行测试（runner 通过 modules 注入命令）
- [ ] 4.3 启动服务（如需）
- [ ] 4.4 验证 V-backend-N：来自 design.md（N 由 design.md 决定，非章节号）

  **Evidence 要求**（verify agent 在验证报告中产出，gate agent 据此评审）：
  - 每个 V-* 必须有对应的原始输出（curl 响应 / 命令行输出 / 日志片段）
  - SKIP 的 V-* 必须注明豁免理由
  - 测试结果（Tests run: N, Failures: 0, Errors: 0）必须有日志摘要

## 5. dev.backend:gate - dev 门控审查

<!-- on_conditions_eval:
     stage=dev (常驻, 无 on_conditions)
     track=backend (常驻, 无 on_conditions)
-->

- 无

## 6. dev.frontend:test - dev 测试先行

<!-- on_conditions_eval:
     stage=dev (常驻, 无 on_conditions)
     track=frontend (常驻, 无 on_conditions)
-->

- [ ] 6.1 为前端登录态 store + axios 拦截器编写测试：login 存双令牌；401 → 单飞 refresh → 重放原请求成功；V-frontend-1

## 7. dev.frontend:dev - 实现开发

<!-- on_conditions_eval:
     stage=dev (常驻, 无 on_conditions)
     track=frontend (常驻, 无 on_conditions)
-->

- [ ] 7.1 `code/web/src/api/auth.ts`：login/refresh/logout 调用改造（双令牌返回结构）
- [ ] 7.2 `code/web/src/stores/auth.ts`：access + refresh 双令牌持久化 + 登出清理
- [ ] 7.3 axios 拦截器：access 401 → 单飞 refresh → 重放原请求；refresh 失败 → 清登录态跳登录页

## 8. dev.frontend:review - 静态代码审查

<!-- on_conditions_eval:
     stage=dev (常驻, 无 on_conditions)
     track=frontend (常驻, 无 on_conditions)
-->

- [ ] 8.1 review agent 读 design.md + tasks.md + .pg/code-review/code-review.yaml 细则
- [ ] 8.2 review agent 对 git diff feat/pg/auth-token-refresh 做静态审查
- [ ] 8.3 review agent 输出 review_score + p0_failures 到本 section 对应的 review 报告（路径由 dispatch 注入）
- [ ] 8.4 score < pass_threshold → escalate 至 fix-review；score ≥ pass_threshold → completed → 进入 verify

## 9. dev.frontend:verify - dev 集成验证

<!-- on_conditions_eval:
     stage=dev (常驻, 无 on_conditions)
     track=frontend (常驻, 无 on_conditions)
-->

- [ ] 9.1 执行 lint（runner 通过 modules 注入命令）
- [ ] 9.2 执行测试（runner 通过 modules 注入命令）
- [ ] 9.3 启动服务（如需）
- [ ] 9.4 验证 V-frontend-N：来自 design.md（N 由 design.md 决定，非章节号）

  **Evidence 要求**（verify agent 在验证报告中产出，gate agent 据此评审）：
  - 每个 V-* 必须有对应的原始输出（curl 响应 / 命令行输出 / 日志片段）
  - SKIP 的 V-* 必须注明豁免理由
  - 测试结果（Tests run: N, Failures: 0, Errors: 0）必须有日志摘要

## 10. dev.frontend:gate - dev 门控审查

<!-- on_conditions_eval:
     stage=dev (常驻, 无 on_conditions)
     track=frontend (常驻, 无 on_conditions)
-->

- 无

## 11. int.backend:test - int 测试先行

<!-- on_conditions_eval:
     stage=int (常驻, 无 on_conditions)
     track=backend (常驻, 无 on_conditions)
-->

- [ ] 11.1 编写 int 测试：登录→刷新→登出全链路后端集成测试（真实 DB refresh_token 表读写），覆盖 V-backend-1~4

## 12. int.backend:dev - 实现开发

<!-- on_conditions_eval:
     stage=int (常驻, 无 on_conditions)
     track=backend (常驻, 无 on_conditions)
-->

- [ ] 12.1 int 阶段无新增实现（dev 已完成双令牌 + 刷新 + 登出）；联调时确认 refresh_token 表在 dev-local 真实 PostgreSQL 上正确建表并可读写
## 13. int.backend:review - 静态代码审查

<!-- on_conditions_eval:
     stage=int (常驻, 无 on_conditions)
     track=backend (常驻, 无 on_conditions)
-->

- [ ] 13.1 review agent 读 design.md + tasks.md + .pg/code-review/code-review.yaml 细则
- [ ] 13.2 review agent 对 git diff feat/pg/auth-token-refresh 做静态审查
- [ ] 13.3 review agent 输出 review_score + p0_failures 到本 section 对应的 review 报告（路径由 dispatch 注入）
- [ ] 13.4 score < pass_threshold → escalate 至 fix-review；score ≥ pass_threshold → completed → 进入 verify

## 14. int.backend:verify - int 集成验证

<!-- on_conditions_eval:
     stage=int (常驻, 无 on_conditions)
     track=backend (常驻, 无 on_conditions)
-->

- [ ] 14.1 执行 lint（runner 通过 modules 注入命令）
- [ ] 14.2 执行测试（runner 通过 modules 注入命令）
- [ ] 14.3 启动服务（如需）
- [ ] 14.4 验证 V-backend-N：来自 design.md（N 由 design.md 决定，非章节号）

  **Evidence 要求**（verify agent 在验证报告中产出，gate agent 据此评审）：
  - 每个 V-* 必须有对应的原始输出（curl 响应 / 命令行输出 / 日志片段）
  - SKIP 的 V-* 必须注明豁免理由
  - 测试结果（Tests run: N, Failures: 0, Errors: 0）必须有日志摘要

## 15. int.backend:gate - int 门控审查

<!-- on_conditions_eval:
     stage=int (常驻, 无 on_conditions)
     track=backend (常驻, 无 on_conditions)
-->

- 无

## 16. int.frontend:test - int 测试先行

<!-- on_conditions_eval:
     stage=int (常驻, 无 on_conditions)
     track=frontend (常驻, 无 on_conditions)
-->

- [ ] 16.1 编写 int 测试：前端拦截器在真实 mock/后端下的刷新重放集成测试（V-frontend-1）

## 17. int.frontend:dev - 实现开发

<!-- on_conditions_eval:
     stage=int (常驻, 无 on_conditions)
     track=frontend (常驻, 无 on_conditions)
-->

- [ ] 17.1 int 阶段无新增实现（dev 已完成）；联调验证前端拦截器与后端 refresh 契约一致

## 18. int.frontend:review - 静态代码审查

<!-- on_conditions_eval:
     stage=int (常驻, 无 on_conditions)
     track=frontend (常驻, 无 on_conditions)
-->

- [ ] 18.1 review agent 读 design.md + tasks.md + .pg/code-review/code-review.yaml 细则
- [ ] 18.2 review agent 对 git diff feat/pg/auth-token-refresh 做静态审查
- [ ] 18.3 review agent 输出 review_score + p0_failures 到本 section 对应的 review 报告（路径由 dispatch 注入）
- [ ] 18.4 score < pass_threshold → escalate 至 fix-review；score ≥ pass_threshold → completed → 进入 verify

## 19. int.frontend:verify - int 集成验证

<!-- on_conditions_eval:
     stage=int (常驻, 无 on_conditions)
     track=frontend (常驻, 无 on_conditions)
-->

- [ ] 19.1 执行 lint（runner 通过 modules 注入命令）
- [ ] 19.2 执行测试（runner 通过 modules 注入命令）
- [ ] 19.3 启动服务（如需）
- [ ] 19.4 验证 V-frontend-N：来自 design.md（N 由 design.md 决定，非章节号）

  **Evidence 要求**（verify agent 在验证报告中产出，gate agent 据此评审）：
  - 每个 V-* 必须有对应的原始输出（curl 响应 / 命令行输出 / 日志片段）
  - SKIP 的 V-* 必须注明豁免理由
  - 测试结果（Tests run: N, Failures: 0, Errors: 0）必须有日志摘要

## 20. int.frontend:gate - int 门控审查

<!-- on_conditions_eval:
     stage=int (常驻, 无 on_conditions)
     track=frontend (常驻, 无 on_conditions)
-->

- 无

## 21. int.fullstack:scenario-execute - 真机场景执行

<!-- on_conditions_eval:
     stage=int (常驻, 无 on_conditions)
     track=fullstack (常驻, 无 on_conditions)
-->

#### 步骤组 1：scenario-fullstack.yaml 读取

- [ ] 21.1 确认 `.pg/changes/auth-token-refresh/scenario-fullstack.yaml` 存在且每个 Scenario 含 6 段（scenario_id / critical / given / when / then / evidence；and 可选）
- [ ] 21.2 校验 scenario_id 全局唯一、critical 字段为 bool

#### 步骤组 2：执行

- [ ] 21.3 按 scenario_id 排序：先 critical=true，后 critical=false
- [ ] 21.4 串行执行每个 Scenario 的 given → when → then → and（cleanup）
- [ ] 21.5 按 when[].type 分派执行方式：
  - type=api（默认）：使用 curl 等 HTTP 工具执行 API 请求
  - type=browser：加载 `pg-browser-testing-with-devtools` SKILL，使用 Chrome DevTools MCP 工具执行浏览器交互
- [ ] 21.6 产出结构化 JSON 证据到 `2-build/<report_seq>-<scenario_id>-evidence.json`（<report_seq> 与本 phase 主报告共享同一 seq，由 dispatch_file 注入；加 seq 前缀避免多次 execute 派遣覆盖同 scenario 的历史 evidence）
- [ ] 21.7 browser 场景截图存到 `2-build/<report_seq>-<scenario_id>-screenshot.png`
- [ ] 21.8 critical=true FAIL → 立即停止后续 Scenario，全部标记 SKIPPED → record(scenario-execute, "escalate")
- [ ] 21.9 全部通过 / scenario-execute agent 写盘报告到 `2-build/<seq>-scenario-execute.md`

## 22. final-gate - 最终门控审查

<!-- on_conditions_eval:
     stage=final (常驻, 无 on_conditions)
-->

- [ ] 22.1 收集所有 stage 的 Gate Assessment
- [ ] 22.2 检查跨 stage 依赖项
- [ ] 22.3 输出 Final Gate Assessment
