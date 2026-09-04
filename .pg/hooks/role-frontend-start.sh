#!/usr/bin/env bash
# role lifecycle action: frontend (web vite dev) start
# 对应 project.yaml: environments.{dev-local,dev-mock}.roles.frontend.actions.start
set -uo pipefail  # 注意: 不加 -e, 由 hook-helpers.sh trap ERR 控制
SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export PG_SKILLS_PATH="${PG_SKILLS_PATH:-$SELF_DIR}"
source "$PG_SKILLS_PATH/src/runtime/lib/hook-helpers.sh"
trap 'pg_fail_on_error $? $LINENO' ERR

# === 路径派生 (per-skill 路由, 由 pg_resolve_paths 决定) ===
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$HOOK_DIR/lib/common.sh" ]]; then
    source "$HOOK_DIR/lib/common.sh"
    pg_resolve_paths
fi

mkdir -p "$LOG_DIR" "$PID_DIR"

PORT=5173

# 启动 vite dev server（后台，日志/PID 由框架管理）
if ! pid=$(pg_start_bg "$LOG_DIR/frontend.log" "$PID_DIR/frontend.pid" \
        -- \
        npm --prefix code/web run dev); then
    pg_fail --category=service_start_failure --code=PG-E-0920 \
        --message="启动 vite frontend 失败" \
        --hint="查看 $LOG_DIR/frontend.log" \
        --agent-recoverable=true
fi

# 端口就绪检查（后台服务启动后）
if ! wait_for_port_with_monitor $PORT "$PG_ROLE" 60 \
        "$PID_DIR/frontend.pid" "$LOG_DIR/frontend.log"; then
    pg_fail --category=service_start_timeout --code=PG-E-0925 \
        --message="frontend 端口 $PORT 60s 内未就绪" \
        --hint="查看 $LOG_DIR/frontend.log；确认 5173 未被占用" \
        --agent-recoverable=true
fi

START=$(date +%s)
DURATION=$(($(date +%s) - START))
pg_exit --status=pass --duration=$DURATION \
        --metadata="role=\"${PG_ROLE:-}\" instance=\"${PG_INSTANCE_NAME:-}\" port=$PORT"
