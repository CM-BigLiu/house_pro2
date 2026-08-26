#!/usr/bin/env bash
# PostgreSQL 备份脚本（house_pro2）
# 用法：
#   1. 在项目根目录 .env 或当前环境变量中配置 DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE
#   2. chmod +x scripts/backup.sh
#   3. ./scripts/backup.sh
# 推荐配合 crontab 每日执行：0 2 * * * /path/to/scripts/backup.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_DIR}/backups"
KEEP_DAYS=${BACKUP_KEEP_DAYS:-7}

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USERNAME="${DB_USERNAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_DATABASE="${DB_DATABASE:-house_pro}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_DATABASE}_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

export PGPASSWORD="$DB_PASSWORD"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始备份 ${DB_DATABASE} ..."

pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USERNAME" \
  -d "$DB_DATABASE" \
  --clean \
  --if-exists \
  --create \
  --no-owner \
  --no-privileges \
  > "$BACKUP_FILE"

gzip "$BACKUP_FILE"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份完成：${BACKUP_FILE}.gz"

# 清理旧备份
DELETED=$(find "$BACKUP_DIR" -maxdepth 1 -name "${DB_DATABASE}_*.sql.gz" -type f -mtime +$KEEP_DAYS -print -delete | wc -l)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 清理 ${DELETED} 份超过 ${KEEP_DAYS} 天的旧备份"
