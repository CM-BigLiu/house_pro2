# Windows Bash 解析防护（pg-skills on Windows）

Generated: 2026-09-04
适用: house_pro2 @ Windows + Git Bash + opencode

## 问题

pg-skills 的 Python 运行时（`pg-run-hook.py` 等）用 `["bash", "-c", cmd]` 调 hook 脚本。
Windows CreateProcess 的可执行文件搜索顺序为：**应用目录 → System32 → PATH**。
`C:\Windows\System32\bash.exe` 是 WSL 转发器，永远先于 PATH 中的 Git Bash 被命中，
导致 hook 在 WSL 环境里执行（路径/权限/工具链全不对）。

## 影响面（v0.9.1 实测）

| 调用点 | 形式 | 是否受影响 |
|---|---|---|
| `pg-invoke-hook.py` → `pg-run-hook.py` | `["bash", "-c", cmd]` subprocess | 是（沙箱日志证实命中 wsl.exe） |
| `pg-run`（TUI） | `["bash", "-c", cmd]` | 是 |
| pg-build 编排器（bootstrap.py 返回 plan） | `bash <script>` 字符串，由 opencode 的 LLM bash 执行 | 取决于 opencode 终端 PATH |

## 项目层防护（已落地）

1. `.pg/hooks/lib/common.sh:check_port()` 已改为 Windows 分支（`netstat -an | grep LISTENING`），
   Linux 分支保持原样。
2. hook 脚本均以 `#!/usr/bin/env bash` 开头 + 通过 `$PG_SKILLS_PATH` source 运行时库，
   只要"由哪个 bash 执行"正确，内部逻辑即正确。

## 给 agent 的操作规约（在 Windows 上跑 pg CLI 时）

优先级从高到低，任一命中即用：

1. 若环境变量 `PG_BASH` 已设置 → 直接用 `$PG_BASH` 执行。
2. Git Bash 存在于常见路径时显式引用（避免裸 `bash`）：
   - `D:\02-application\Git\bin\bash.exe`（本机实际安装位）
   - `C:\Program Files\Git\bin\bash.exe`
   - `C:\Users\CMIT\.workbuddy\binaries\PortableGit\versions\1.2.0\usr\bin\bash.exe`（WorkBuddy 沙箱内）
3. 兜底：`where.exe bash` 查看解析顺序，确认第一条**不是** `C:\Windows\System32\bash.exe` 再用裸 `bash`。

### 示例：Windows 上跑 hook 冒烟

```bash
GIT_BASH="D:/02-application/Git/bin/bash.exe"
"$GIT_BASH" .pg/hooks/role-mock-start.sh   # 而不是 bash .pg/hooks/...
```

### 示例：python CLI 入口

```bash
# python3 入口本身没问题（python3.exe 在 PATH），问题只在它内部 spawn bash 的环节。
# 若 pg-invoke-hook.py 输出 {"ok": false, "error": "exit=1"} 且 log 里只有
# "=== pg-run-hook ... ===" + "exit: FAILED"，九成是 WSL bash 转发器命中。
# 临时绕过：设置环境变量 PG_BASH 并给 python 进程一个干净的 Windows PATH。
```

## 上游修复建议（可提 PR 给 pin-gou/pg-skills）

`pg-run-hook.py` / `pg-run` 的 subprocess 调用改为：

```python
import os, shutil

def _resolve_bash():
    # 1. 显式覆盖
    env_bash = os.environ.get("PG_BASH")
    if env_bash and os.path.isfile(env_bash):
        return env_bash
    # 2. Windows 上绕过 System32 WSL 转发器
    if os.name == "nt":
        for cand in (
            shutil.which("bash", path=os.environ.get("PATH", "").replace("\\", "/")),
            r"C:\Program Files\Git\bin\bash.exe",
        ):
            ...
    return "bash"
```

即：Windows 下优先显式定位 Git Bash，找不到才回退裸 `bash`。
