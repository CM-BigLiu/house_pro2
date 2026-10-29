# 房屋租售系统本地服务启动脚本（PostgreSQL + 后端 + 前端）
# 幂等：已在运行的服器不会重复启动。
# 由“启动”文件夹快捷方式在用户登录时调用，也可手动执行。

$ErrorActionPreference = 'Continue'

$Root = 'e:\zhongcheng'
$ServerDir = Join-Path $Root 'code\server'
$WebDir = Join-Path $Root 'code\web'
$PgData = 'E:\tools\pgsql\data'
$PgCtl = 'E:\tools\pgsql\bin\pg_ctl.exe'

$LogDir = Join-Path $env:TEMP 'house_pro'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$LogFile = Join-Path $LogDir 'start-services.log'

function Write-Log([string]$Message) {
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message" | Add-Content -Path $LogFile -Encoding utf8
}

function Test-Port([int]$Port) {
  return [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
}

function Wait-Port([int]$Port, [int]$TimeoutSeconds) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-Port $Port) { return $true }
    Start-Sleep -Seconds 2
  }
  return $false
}

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { $node = 'e:\tools\nodejs\node.exe' }

Write-Log '==== start-services begin ===='

# 1. PostgreSQL
if (Test-Port 5432) {
  Write-Log 'PostgreSQL already running (5432), skipped'
} else {
  $pidFile = Join-Path $PgData 'postmaster.pid'
  if (Test-Path $pidFile) {
    $first = Get-Content $pidFile -TotalCount 1
    $alive = $false
    if ($first -match '^\d+$') { $alive = [bool](Get-Process -Id ([int]$first) -ErrorAction SilentlyContinue) }
    if (-not $alive) {
      Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
      Write-Log "removed stale postmaster.pid ($first)"
    }
  }
  # 注意：不要对 pg_ctl 做输出重定向（>、|、*>）。postgres 子进程会继承句柄，
  # 导致 PowerShell 永不返回；也不能用 -Wait。用 Start-Process 分离启动后轮询端口。
  Start-Process -FilePath $PgCtl -ArgumentList @('-D', $PgData, '-l', 'E:\tools\pgsql\pg.log', 'start') -WindowStyle Hidden
  Write-Log "PostgreSQL started, listening=$(Wait-Port 5432 30)"
}

# 2. 后端（3000）
if (Test-Port 3000) {
  Write-Log 'Backend already running (3000), skipped'
} else {
  Start-Process -FilePath $node -ArgumentList 'dist/main' -WorkingDirectory $ServerDir `
    -RedirectStandardOutput (Join-Path $LogDir 'backend.log') `
    -RedirectStandardError (Join-Path $LogDir 'backend.err.log') `
    -WindowStyle Hidden
  Write-Log "Backend started, listening=$(Wait-Port 3000 120)"
}

# 3. 前端（5173）
if (Test-Port 5173) {
  Write-Log 'Frontend already running (5173), skipped'
} else {
  Start-Process -FilePath $node -ArgumentList 'node_modules/vite/bin/vite.js' -WorkingDirectory $WebDir `
    -RedirectStandardOutput (Join-Path $LogDir 'frontend.log') `
    -RedirectStandardError (Join-Path $LogDir 'frontend.err.log') `
    -WindowStyle Hidden
  Write-Log "Frontend started, listening=$(Wait-Port 5173 60)"
}

Write-Log '==== start-services end ===='
