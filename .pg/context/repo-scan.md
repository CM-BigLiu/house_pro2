# house_pro2 仓库扫描报告

Generated: 2026-09-04T09:20:00+08:00
Scanner: pg-init-project v0.3 (by WorkBuddy)

## 技术栈

- 主构建工具: code/ 下三个独立 npm 包（package-lock.json，npm CLI，无 workspace）
- 语言: mixed（typescript / javascript）
- 多模块: 是（非 workspace 的平铺多包：server / web / mock-server）

## 模块清单

| Module id | 根目录（相对） | 语言 | 构建命令 | 测试命令 | 备注 |
|---|---|---|---|---|---|
| server | code/server | typescript | cd code/server && npm run build | cd code/server && npm test | NestJS + TypeORM + PostgreSQL |
| web | code/web | typescript | cd code/web && npm run build | 无（未配置 test script） | Vue 3 + Vite + Element Plus，build 含 vue-tsc --noEmit 类型检查 |
| mock-server | code/mock-server | shell | 无需构建 | 无 | Express mock（纯 JS），仅 start，无 build/lint/test |

## 构建/测试入口命令

### server（NestJS）

```bash
cd code/server
npm install
npm run build          # nest build
npm run start:dev      # 开发启动（watch）
npm test               # jest 单测
npm run test:e2e       # jest e2e（test/jest-e2e.json）
npm run lint           # eslint --fix
```

### web（Vue 3 + Vite）

```bash
cd code/web
npm install
npm run dev            # vite dev server（端口 5173，proxy /api → localhost:3000）
npm run build          # vue-tsc --noEmit && vite build
npm run lint           # eslint --fix
```

### mock-server（Express）

```bash
cd code/mock-server
npm install
node server.js         # 监听 3000 端口（dual-stack），提供 /api mock
```

## 服务端口（项目当前约定）

| 服务 | 端口 | 来源 |
|------|------|------|
| server (NestJS HTTP) | 3000 | code/server/.env `PORT=3000` + main.ts `process.env.PORT \|\| 3000` |
| web (vite dev) | 5173 | code/web/vite.config.ts server.port |
| mock-server | 3000 | code/mock-server/server.js `const PORT = 3000` |
| PostgreSQL | 5432 | code/server/.env `DB_PORT=5432` |

⚠️ 注意：mock-server 与 NestJS server 同占 3000 端口，二者互斥运行（mock 模式 vs 真后端模式）。
在 environments 中分为两个环境：dev-mock（mock-server，前端独立联调）与 dev-local（NestJS server + PostgreSQL）。

## 测试文件扫描

- 无 `*.spec.ts` / `*.test.ts` 文件（grep 无命中）；server 的 jest 配置存在但当前仓库无测试用例。
- server `test` script 有效（jest 可跑，0 个用例）。

## TBD 字段（需人工复核）

- `environments.dev-local.describe_env`：未确认 PostgreSQL 是否常驻（本机服务）— 当前按"常驻服务，不接管启停"处理
- server 启动依赖 `.env`（DB 连接）— dev-local 环境的 prepare_env 不含 DB 启动，假定 DB 已在本机运行
- 是否启用 security review profile（opt-in）：项目含 JWT/加密/脱敏等鉴权场景，建议启用（见终态汇报）
- web 无测试命令 — track 中 test 步骤将由 build（含类型检查）替代承担质量门禁

## Windows 适配记录（2026-09-04 实测）

1. **WSL bash 转发器问题**：Windows CreateProcess 搜索顺序使 `["bash", "-c", ...]` 命中
   `C:\Windows\System32\bash.exe`（WSL）。已在项目内做最小修复（详见 `.pg/context/windows-bash-note.md`）：
   - `.pg/skills/src/runtime/lib/pg-run-hook.py`：新增 `_resolve_bash()`（PG_BASH 显式覆盖 → 常见 Git Bash 路径 → 裸 bash 兜底），3 处调用点替换
   - `.pg/skills/src/runtime/bin/pg-run`：同上，1 处调用点替换
   - `.pg/skills/src/runtime/bin/pg-invoke-hook.py`：新增 `_resolve_python3()`（PG_PYTHON → python3 → python → sys.executable），4 处调用点替换
   - ⚠️ 这些改动位于 subtree 内，`git subtree pull` 升级 pg-skills 时会产生冲突，需重放（改动均有注释标记）
2. **check_port Windows 分支**：`.pg/hooks/lib/common.sh` 的 `check_port()` 已加 MINGW/MSYS 分支
   （`netstat -an | grep LISTENING`，Windows netstat 无 -tuln 选项）。此文件是项目副本，升级不受影响。
3. **冒烟验证记录**（全部通过）：
   - logs hook 只读：pass
   - mock start → 端口就绪 → HTTP 探活（401 JSON）→ stop → 端口释放：pass（直跑与 CLI 两条路径）
   - pg doctor：5 checks passed；pg-parse-config：pg-build / pg-regression / pg-fix-issue / pg-agent 全部 OK

