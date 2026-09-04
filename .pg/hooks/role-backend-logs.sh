#!/usr/bin/env bash
# role lifecycle action: backend logs
# 对应 project.yaml: environments.dev-local.roles.backend.actions.logs
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

LINES="${1:-100}"
# 去掉 args 模板外壳（{lines:100} 形式）
case "$LINES" in
    "{lines:"*) LINES="${LINES#\{lines:}"; LINES="${LINES%\}}" ;;
esac

if [[ -f "$LOG_DIR/backend.log" ]]; then
    tail -n "$LINES" "$LOG_DIR/backend.log"
else
    echo "no backend log at $LOG_DIR/backend.log"
fi

START=$(date +%s)
DURATION=$(($(date +%s) - START))
pg_exit --status=pass --duration=$DURATION \
        --metadata="role=\"${PG_ROLE:-}\" instance=\"${PG_INSTANCE_NAME:-}\""
