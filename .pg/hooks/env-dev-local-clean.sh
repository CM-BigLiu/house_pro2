#!/usr/bin/env bash
# environment clean_env action: dev-local 环境回收
# 对应 project.yaml: environments.dev-local.clean_env
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

# ---- 环境回收：停掉本 stage 启动的前后端（幂等）----
# PostgreSQL 常驻, 不在此处停止.
pg_stop_bg "$PID_DIR/backend.pid" "Backend" 10 2>&1 || true
pg_stop_bg "$PID_DIR/frontend.pid" "Frontend" 10 2>&1 || true
pkill -f "nest start" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

START=$(date +%s)
DURATION=$(($(date +%s) - START))
pg_exit --status=pass --duration=$DURATION --metadata="env=dev-local cleaned"
