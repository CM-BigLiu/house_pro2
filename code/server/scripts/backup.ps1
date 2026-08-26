# PostgreSQL 备份脚本（house_pro2）- Windows PowerShell 版
# 用法：
#   1. 在项目根目录 .env 或当前环境变量中配置 DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE
#   2. .\scripts\backup.ps1
# 推荐配合 Windows 任务计划程序每日执行

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectDir = Split-Path -Parent $ScriptDir
$BackupDir = Join-Path $ProjectDir 'backups'
$KeepDays = if ($env:BACKUP_KEEP_DAYS) { [int]$env:BACKUP_KEEP_DAYS } else { 7 }

$DbHost = if ($env:DB_HOST) { $env:DB_HOST } else { 'localhost' }
$DbPort = if ($env:DB_PORT) { $env:DB_PORT } else { '5432' }
$DbUsername = if ($env:DB_USERNAME) { $env:DB_USERNAME } else { 'postgres' }
$DbPassword = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { 'postgres' }
$DbDatabase = if ($env:DB_DATABASE) { $env:DB_DATABASE } else { 'house_pro' }

$Timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$BackupFile = Join-Path $BackupDir "${DbDatabase}_${Timestamp}.sql"

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

$env:PGPASSWORD = $DbPassword

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] 开始备份 ${DbDatabase} ..."

pg_dump `
  -h $DbHost `
  -p $DbPort `
  -U $DbUsername `
  -d $DbDatabase `
  --clean `
  --if-exists `
  --create `
  --no-owner `
  --no-privileges `
  > "$BackupFile"

Compress-Archive -Path $BackupFile -DestinationPath "${BackupFile}.zip" -Force
Remove-Item -Path $BackupFile -Force

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] 备份完成：${BackupFile}.zip"

# 清理旧备份
$Cutoff = (Get-Date).AddDays(-$KeepDays)
$Deleted = Get-ChildItem -Path $BackupDir -Filter "${DbDatabase}_*.sql.zip" -File |
  Where-Object { $_.LastWriteTime -lt $Cutoff } |
  Remove-Item -Force -PassThru |
  Measure-Object |
  Select-Object -ExpandProperty Count

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] 清理 ${Deleted} 份超过 ${KeepDays} 天的旧备份"
