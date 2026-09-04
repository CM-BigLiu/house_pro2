#!/usr/bin/env bash
# role lifecycle action: backend (NestJS server) stop
# 对应 project.yaml: environments.dev-local.roles.backend.actions.stop
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

# 幂等停止：优先 PID 文件，兜底 pkill 匹配
pg_stop_bg "$PID_DIR/backend.pid" "Backend" 10 2>&1 || true
pkill -f "nest start" 2>/dev/null || true

START=$(date +%s)
DURATION=$(($(date +%s) - START))
pg_exit --status=pass --duration=$DURATION \
        --metadata="role=\"${PG_ROLE:-}\" instance=\"${PG_INSTANCE_NAME:-}\""
