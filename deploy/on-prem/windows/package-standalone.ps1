#Requires -Version 5.1
<#
.SYNOPSIS
  Package Next.js standalone output for client delivery (no source repo).

.DESCRIPTION
  Creates deploy/on-prem/windows/package/ containing only runtime files:
    server.js, node_modules, .next, public, .env, PM2 config, install scripts

  Does NOT include app source, .git, tests, or dev tooling.

.PARAMETER WebRoot
  Path to accounting-web-app.

.PARAMETER OutputDir
  Output folder (default: deploy/on-prem/windows/package).
#>
[CmdletBinding()]
param(
  [string]$WebRoot = '',
  [string]$OutputDir = ''
)

$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

if (-not $WebRoot) {
  $WebRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
}

if (-not $OutputDir) {
  $OutputDir = Join-Path $PSScriptRoot 'package'
}

$standaloneSrc = Join-Path $WebRoot '.next\standalone'

Write-Host 'Bisonstechs — Package standalone web runtime' -ForegroundColor Green

if (-not (Test-Path (Join-Path $standaloneSrc 'server.js'))) {
  throw "Standalone build not found. Run build-production.ps1 first."
}

Write-Step "Cleaning $OutputDir"
if (Test-Path $OutputDir) {
  Remove-Item $OutputDir -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

Write-Step 'Copying standalone runtime'
Copy-Item (Join-Path $standaloneSrc '*') $OutputDir -Recurse -Force

Write-Step 'Copying PM2 ecosystem and service scripts'
Copy-Item (Join-Path $PSScriptRoot 'ecosystem.web.config.cjs') (Join-Path $OutputDir 'ecosystem.web.config.cjs') -Force
Copy-Item (Join-Path $PSScriptRoot 'install-web-service.ps1') $OutputDir -Force
Copy-Item (Join-Path $PSScriptRoot 'uninstall-web-service.ps1') $OutputDir -Force
Copy-Item (Join-Path $PSScriptRoot 'service-control-web.ps1') $OutputDir -Force

$logsDir = Join-Path $OutputDir 'logs'
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

if (-not (Test-Path (Join-Path $OutputDir '.env'))) {
  Copy-Item (Join-Path $WebRoot '.env.onprem.example') (Join-Path $OutputDir '.env.example') -Force
  Write-Warning '.env not in standalone — client must copy .env.example to .env and configure.'
} else {
  Copy-Item (Join-Path $WebRoot '.env.onprem.example') (Join-Path $OutputDir '.env.example') -Force
}

Write-Host @"

Package ready: $OutputDir

Deliver this folder to the client (zip/USB). It does NOT include source code or .git.

On client server:
  1. Copy folder to e.g. C:\Bisonstechs\web\
  2. Ensure .env exists (from .env.example)
  3. Run install-web-service.ps1 as Administrator
"@ -ForegroundColor Green
