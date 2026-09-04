#!/usr/bin/env bash
# environment prepare_env action: dev-local 环境准备
# 对应 project.yaml: environments.dev-local.prepare_env
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

# ---- 环境准备：校验 PostgreSQL 常驻 + 依赖完整 ----
# PostgreSQL (5432) 为本机常驻服务, 此处只探测不启停.
PORT_PG=5432

probe_port() {
    local p="$1"
    if command -v powershell.exe >/dev/null 2>&1; then
        powershell.exe -NoProfile -Command "Test-NetConnection -ComputerName localhost -Port $p -InformationLevel Quiet -WarningAction SilentlyContinue" 2>/dev/null | tr -d '\r' | grep -qi true && return 0 || return 1
    else
        (exec 3<>/dev/tcp/127.0.0.1/$p) 2>/dev/null && { exec 3>&-; return 0; } || return 1
    fi
}

if ! probe_port $PORT_PG; then
    pg_fail --category=dependency_not_ready --code=PG-E-1020 \
        --message="PostgreSQL 5432 未运行 (dev-local 前置依赖)" \
        --hint="启动本机 PostgreSQL 服务后再重试" \
        --agent-recoverable=true
fi

# 依赖完整性（node_modules 缺失时安装）
if [[ ! -d code/server/node_modules ]] || [[ ! -d code/web/node_modules ]]; then
    echo "node_modules 缺失, 安装依赖..."
    (cd code/server && npm install) && (cd code/web && npm install) || \
        pg_fail --category=dependency_not_ready --code=PG-E-1021 \
            --message="npm install 失败" \
            --hint="检查网络/registry 后重试" \
            --agent-recoverable=true
fi

START=$(date +%s)
DURATION=$(($(date +%s) - START))
pg_exit --status=pass --duration=$DURATION --metadata="env=dev-local postgres=ready"
