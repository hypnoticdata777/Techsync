param(
    [switch]$SetupNeonEnv,
    [switch]$UseNeon,
    [switch]$SkipDockerDb,
    [switch]$ResetDemo,
    [switch]$NoMigrate,
    [switch]$NoSeed,
    [switch]$BackendOnly,
    [switch]$ClientOnly,
    [int]$ApiPort = 8000,
    [int]$ClientPort = 19006
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ServerDir = Join-Path $RepoRoot "server"
$ClientDir = Join-Path $RepoRoot "client"
$RuntimeDir = Join-Path $RepoRoot ".local-dev"
$LocalEnvFile = Join-Path $RepoRoot ".local-demo.env"
$NeonEnvFile = Join-Path $RepoRoot ".local-neon.env"
$EnvFile = if ($UseNeon) { $NeonEnvFile } else { $LocalEnvFile }
$ComposeFile = Join-Path $RepoRoot "docker-compose.local.yml"
$BackendPidFile = Join-Path $RuntimeDir "backend.pid"
$ClientPidFile = Join-Path $RuntimeDir "client.pid"
$BackendLog = Join-Path $RuntimeDir "backend.log"
$BackendErr = Join-Path $RuntimeDir "backend.err.log"
$ClientLog = Join-Path $RuntimeDir "client.log"
$ClientErr = Join-Path $RuntimeDir "client.err.log"
$LocalDatabaseUrl = "postgresql://techsync:techsync_local_only@127.0.0.1:55432/techsync_local"

function Write-Step($Message) {
    Write-Host "[techsync-local] $Message" -ForegroundColor Cyan
}

function Write-Warn($Message) {
    Write-Host "[techsync-local] $Message" -ForegroundColor Yellow
}

function Read-LocalEnvFile($Path) {
    if (!(Test-Path $Path)) {
        if ($UseNeon) {
            throw "Missing $Path. Copy the Neon DIRECT URL, then run: powershell -ExecutionPolicy Bypass -File .\scripts\local_dev.ps1 -SetupNeonEnv"
        }
        throw "Missing $Path. Run the launcher again so it can create the local demo env file."
    }

    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if (!$line -or $line.StartsWith("#")) {
            return
        }
        $parts = $line.Split("=", 2)
        if ($parts.Count -ne 2) {
            return
        }
        $name = $parts[0].Trim()
        $value = $parts[1].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

function Write-EnvFile($Path, $DatabaseUrl) {
    $envText = @"
APP_ENV=development
DATABASE_URL=$DatabaseUrl
JWT_SECRET_KEY=local-role-ux-proof-only-change-me
TECHSYNC_DEMO_PASSWORD=DemoPass123!
EXPO_PUBLIC_API_BASE_URL=http://localhost:$ApiPort
"@
    Set-Content -Path $Path -Value $envText
}

function Ensure-LocalDemoEnv {
    Write-EnvFile $LocalEnvFile $LocalDatabaseUrl
    Write-Step "Using local Docker Postgres env: $LocalEnvFile"
}

function Save-NeonEnvFromClipboard {
    $databaseUrl = (Get-Clipboard).Trim()
    if (!$databaseUrl.StartsWith("postgresql://")) {
        throw "Clipboard does not look like a Postgres URL. In Neon, copy the DIRECT connection string with password visible, then rerun -SetupNeonEnv."
    }
    if ($databaseUrl.Contains("-pooler")) {
        throw "Clipboard has the pooled URL. For local migrations/seeding, copy the DIRECT/non-pooler Neon URL instead."
    }

    Write-EnvFile $NeonEnvFile $databaseUrl
    Write-Step "Saved optional Neon env file: $NeonEnvFile"
    Write-Step "You can now run against Neon with: powershell -ExecutionPolicy Bypass -File .\scripts\local_dev.ps1 -UseNeon -ResetDemo"
}

function Test-CommandAvailable($Name) {
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Start-LocalPostgres {
    if ($UseNeon -or $SkipDockerDb -or $ClientOnly) {
        return
    }
    if (!(Test-Path $ComposeFile)) {
        throw "Missing $ComposeFile. Cannot start local demo database."
    }
    if (!(Test-CommandAvailable "docker")) {
        throw "Docker is required for no-secret local demo mode. Start Docker Desktop, then rerun Start-TechSync-Demo.cmd. To test against Neon instead, run -SetupNeonEnv once and then -UseNeon."
    }

    Write-Step "Starting local Postgres on 127.0.0.1:55432"
    & docker compose -f $ComposeFile up -d db
    if ($LASTEXITCODE -ne 0) {
        throw "Docker could not start the local Postgres database. Check Docker Desktop and port 55432."
    }

    $deadline = (Get-Date).AddSeconds(90)
    while ((Get-Date) -lt $deadline) {
        & docker compose -f $ComposeFile exec -T db pg_isready -U techsync -d techsync_local | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Step "Local Postgres ready"
            return
        }
        Start-Sleep -Seconds 2
    }

    throw "Local Postgres did not become ready. Check Docker Desktop and .local-dev logs."
}

function Test-PortFree($Port, $Name) {
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($connection) {
        throw "$Name port $Port is already in use by process $($connection.OwningProcess). Run .\scripts\local_stop.ps1 or choose another port."
    }
}

function Wait-ForUrl($Url, $Name, $Seconds = 60) {
    $deadline = (Get-Date).AddSeconds($Seconds)
    while ((Get-Date) -lt $deadline) {
        try {
            Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 3 | Out-Null
            Write-Step "$Name ready: $Url"
            return
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    Write-Warn "$Name did not answer within $Seconds seconds. Check logs in $RuntimeDir."
}

if ($SetupNeonEnv) {
    Save-NeonEnvFromClipboard
    exit 0
}

if ($BackendOnly -and $ClientOnly) {
    throw "Choose either -BackendOnly or -ClientOnly, not both."
}

New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null
if (!$UseNeon) {
    Ensure-LocalDemoEnv
}
Read-LocalEnvFile $EnvFile
$env:EXPO_PUBLIC_API_BASE_URL = "http://localhost:$ApiPort"

$python = Join-Path $ServerDir "venv\Scripts\python.exe"
if (!$ClientOnly -and !(Test-Path $python)) {
    throw "Missing server venv Python at $python. Create/install server venv first."
}
if (!$BackendOnly -and !(Test-Path (Join-Path $ClientDir "node_modules"))) {
    throw "Missing client node_modules. Run npm.cmd ci in $ClientDir first."
}

if (!$ClientOnly) {
    Test-PortFree $ApiPort "Backend"
}
if (!$BackendOnly) {
    Test-PortFree $ClientPort "Client"
}

Start-LocalPostgres

if (!$ClientOnly -and !$NoMigrate) {
    Write-Step "Applying Alembic migrations"
    Push-Location $ServerDir
    & $python -m alembic upgrade head
    Pop-Location
}

if (!$ClientOnly -and !$NoSeed) {
    $seedArgs = @("..\scripts\seed_demo_data.py", "seed")
    if ($ResetDemo) {
        $seedArgs += "--reset-existing"
    }
    Write-Step "Preparing synthetic demo data"
    Push-Location $ServerDir
    & $python @seedArgs
    Pop-Location
}

if (!$ClientOnly) {
    Write-Step "Starting backend on http://127.0.0.1:$ApiPort"
    $backend = Start-Process `
        -FilePath $python `
        -ArgumentList @("-m", "uvicorn", "main:app", "--reload", "--host", "127.0.0.1", "--port", "$ApiPort") `
        -WorkingDirectory $ServerDir `
        -RedirectStandardOutput $BackendLog `
        -RedirectStandardError $BackendErr `
        -PassThru `
        -WindowStyle Hidden
    Set-Content -Path $BackendPidFile -Value $backend.Id
}

if (!$BackendOnly) {
    Write-Step "Starting Expo web on http://localhost:$ClientPort"
    $client = Start-Process `
        -FilePath "cmd.exe" `
        -ArgumentList @("/c", "npm.cmd start -- --web --port $ClientPort") `
        -WorkingDirectory $ClientDir `
        -RedirectStandardOutput $ClientLog `
        -RedirectStandardError $ClientErr `
        -PassThru `
        -WindowStyle Hidden
    Set-Content -Path $ClientPidFile -Value $client.Id
}

if (!$ClientOnly) {
    Wait-ForUrl "http://127.0.0.1:$ApiPort/docs" "Backend"
}
if (!$BackendOnly) {
    Wait-ForUrl "http://localhost:$ClientPort" "Expo web" 90
    Start-Process "http://localhost:$ClientPort"
}

Write-Step "Local app is running."
Write-Host ""
Write-Host "Open app:       http://localhost:$ClientPort"
Write-Host "API docs:       http://127.0.0.1:$ApiPort/docs"
Write-Host "Logs folder:    $RuntimeDir"
Write-Host "Demo password:  $env:TECHSYNC_DEMO_PASSWORD"
$databaseMode = if ($UseNeon) { "Neon optional mode" } else { "local Docker Postgres" }
Write-Host "Database mode:  $databaseMode"
Write-Host ""
Write-Host "Stop later with:"
Write-Host "  .\Stop-TechSync-Demo.cmd"
