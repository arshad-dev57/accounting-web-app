#Requires -Version 5.1
<#
.SYNOPSIS
  Install Bisonstechs Next.js web app as a PM2-managed Windows production process.

.PARAMETER RuntimeRoot
  Folder containing standalone server.js (.next/standalone or packaged package/).
  Defaults to deploy/on-prem/windows/package, or script directory when run from package.

.PARAMETER SkipStartup
  Skip pm2-windows-startup registration (testing only).
#>
[CmdletBinding()]
param(
  [string]$RuntimeRoot = '',
  [switch]$SkipStartup
)

$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

if (-not $RuntimeRoot) {
  if (Test-Path (Join-Path $PSScriptRoot 'server.js')) {
    $RuntimeRoot = $PSScriptRoot
  } elseif (Test-Path (Join-Path $PSScriptRoot 'package\server.js')) {
    $RuntimeRoot = Join-Path $PSScriptRoot 'package'
  } else {
    $webRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
    $standalone = Join-Path $webRoot '.next\standalone'
    if (Test-Path (Join-Path $standalone 'server.js')) {
      $RuntimeRoot = $standalone
    } else {
      $RuntimeRoot = Join-Path $PSScriptRoot 'package'
    }
  }
}

$RuntimeRoot = (Resolve-Path $RuntimeRoot).Path
$EcosystemFile = Join-Path $PSScriptRoot 'ecosystem.web.config.cjs'

# When installed from packaged folder, ecosystem lives next to server.js
if (Test-Path (Join-Path $RuntimeRoot 'ecosystem.web.config.cjs')) {
  $EcosystemFile = Join-Path $RuntimeRoot 'ecosystem.web.config.cjs'
}

$LogsDir = Join-Path (Split-Path $EcosystemFile -Parent) 'logs'
if (-not (Test-Path $LogsDir)) {
  New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
}

Write-Host 'Bisonstechs — Web Windows Service Install' -ForegroundColor Green
Write-Host "Runtime root: $RuntimeRoot"

if (-not (Test-Path (Join-Path $RuntimeRoot 'server.js'))) {
  throw "server.js not found in $RuntimeRoot — run build-production.ps1 or use packaged folder"
}

if (-not (Test-Path (Join-Path $RuntimeRoot '.env'))) {
  throw @"
.env not found in $RuntimeRoot
Copy .env.example to .env and set APP_URL / NEXT_PUBLIC_APP_URL to this server's LAN IP.
"@
}

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
  throw 'Node.js is not installed. Install Node.js 20 LTS from https://nodejs.org/'
}

Write-Step 'Installing PM2 and pm2-windows-startup (global)'
npm install -g pm2 pm2-windows-startup
if ($LASTEXITCODE -ne 0) { throw 'Failed to install pm2 globally' }

$env:BISONSTECHS_WEB_RUNTIME = $RuntimeRoot

Write-Step 'Starting web app with PM2'
pm2 delete bisonstechs-web 2>$null
pm2 start $EcosystemFile --update-env
if ($LASTEXITCODE -ne 0) { throw 'pm2 start failed' }

pm2 save
if ($LASTEXITCODE -ne 0) { throw 'pm2 save failed' }

if (-not $SkipStartup) {
  Write-Step 'Registering PM2 Windows startup (requires Administrator)'
  $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
  )
  if (-not $isAdmin) {
    Write-Warning @"
Not running as Administrator — PM2 will NOT auto-start on Windows reboot.
Re-run in elevated PowerShell: pm2-startup install && pm2 save
"@
  } else {
    pm2-startup install
    if ($LASTEXITCODE -ne 0) { throw 'pm2-startup install failed' }
    pm2 save
  }
}

Write-Step 'Done'
pm2 status

$port = '3000'
$envFile = Join-Path $RuntimeRoot '.env'
if (Test-Path $envFile) {
  $portLine = Get-Content $envFile | Where-Object { $_ -match '^\s*PORT\s*=' } | Select-Object -First 1
  if ($portLine) {
    $port = ($portLine -split '=', 2)[1].Trim().Trim('"')
  }
}

Write-Host @"

Web app is running under PM2 (process: bisonstechs-web).

Server test:
  curl http://127.0.0.1:$port/

LAN test (replace with this machine's IPv4):
  http://192.168.x.x:$port/

Firewall (Administrator PowerShell, Private network):
  New-NetFirewallRule -DisplayName "Bisonstechs Web" -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow -Profile Private

Control:
  pm2 status
  pm2 logs bisonstechs-web
  pm2 restart bisonstechs-web

Logs: deploy\on-prem\windows\logs\web-out.log and web-error.log
"@ -ForegroundColor Green
