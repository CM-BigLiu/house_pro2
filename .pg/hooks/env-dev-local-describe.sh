#!/usr/bin/env bash
# environment describe_env action: dev-local 只读探测
# 对应 project.yaml: environments.dev-local.describe_env
# 产出 env-description.yaml 给 pg-propose / pg-fix-issue / pg-regression 作为输入
set -uo pipefail  # 注意: 不加 -e, 由 hook-helpers.sh trap ERR 控制
SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export PG_SKILLS_PATH="${PG_SKILLS_PATH:-$SELF_DIR}"
source "$PG_SKILLS_PATH/src/runtime/lib/hook-helpers.sh"
trap 'pg_fail_on_error $? $LINENO' ERR

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$HOOK_DIR/lib/common.sh" ]]; then
    source "$HOOK_DIR/lib/common.sh"
    pg_resolve_paths
fi

# ---- 只读探测（不启动、不停止任何服务）----
PORT_BACKEND=3000
PORT_PG=5432

probe_port() {
    local p="$1"
    if command -v powershell.exe >/dev/null 2>&1; then
        powershell.exe -NoProfile -Command "Test-NetConnection -ComputerName localhost -Port $p -InformationLevel Quiet -WarningAction SilentlyContinue" 2>/dev/null | tr -d '\r' | grep -qi true && return 0 || return 1
    else
        (exec 3<>/dev/tcp/127.0.0.1/$p) 2>/dev/null && { exec 3>&-; return 0; } || return 1
    fi
}

BACKEND_UP=no; PG_UP=no
probe_port $PORT_BACKEND && BACKEND_UP=yes
probe_port $PORT_PG && PG_UP=yes

cat <<EOF
# env-description (dev-local) — generated $(date -Iseconds)
environment: dev-local
os: windows (Git Bash)
node: $(node --version 2>/dev/null || echo unknown)
postgres_5432_running: $PG_UP
backend_3000_running: $BACKEND_UP
frontend_5173_running: $(probe_port 5173 && echo yes || echo no)
notes: >
  PostgreSQL 为本机常驻服务, pipeline 不接管启停.
  backend(3000) 与 mock-server(3000) 互斥占用同一端口.
EOF

START=$(date +%s)
DURATION=$(($(date +%s) - START))
pg_exit --status=pass --duration=$DURATION --metadata="env=dev-local probe=read-only"
