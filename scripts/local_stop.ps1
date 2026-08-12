param(
    [switch]$AlsoPorts,
    [switch]$AlsoDatabase,
    [int[]]$Ports = @(8000, 19006)
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$RuntimeDir = Join-Path $RepoRoot ".local-dev"
$ComposeFile = Join-Path $RepoRoot "docker-compose.local.yml"
$PidFiles = @(
    Join-Path $RuntimeDir "backend.pid"
    Join-Path $RuntimeDir "client.pid"
)

function Stop-PidFile($Path) {
    if (!(Test-Path $Path)) {
        return
    }

    $pidText = (Get-Content $Path -Raw).Trim()
    if (!$pidText) {
        Remove-Item $Path -Force
        return
    }

    $targetPid = [int]$pidText
    $process = Get-Process -Id $targetPid -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "[techsync-local] Stopping process $targetPid ($($process.ProcessName))" -ForegroundColor Cyan
        Stop-Process -Id $targetPid -Force
    }
    Remove-Item $Path -Force
}

$PidFiles | ForEach-Object { Stop-PidFile $_ }

if ($AlsoPorts) {
    foreach ($port in $Ports) {
        Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess -Unique |
            ForEach-Object {
                $process = Get-Process -Id $_ -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "[techsync-local] Stopping process on port ${port}: $_ ($($process.ProcessName))" -ForegroundColor Yellow
                    Stop-Process -Id $_ -Force
                }
            }
    }
}

if ($AlsoDatabase) {
    if ((Get-Command docker -ErrorAction SilentlyContinue) -and (Test-Path $ComposeFile)) {
        Write-Host "[techsync-local] Stopping local Postgres container" -ForegroundColor Cyan
        & docker compose -f $ComposeFile stop db | Out-Null
    }
}

Write-Host "[techsync-local] Stop command complete." -ForegroundColor Cyan
