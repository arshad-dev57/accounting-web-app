#Requires -Version 5.1
<#
.SYNOPSIS
  Production build for Bisonstechs Next.js (standalone) on-prem.

.DESCRIPTION
  Loads .env.onprem, runs next build with API_URL baked into rewrites.
  Copies .next/static and public into .next/standalone (required for standalone).

.PARAMETER WebRoot
  Path to accounting-web-app. Defaults to three levels above this script.

.PARAMETER EnvFile
  Env file to load before build (default: .env.onprem in WebRoot).
#>
[CmdletBinding()]
param(
  [string]$WebRoot = '',
  [string]$EnvFile = ''
)

$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Import-DotEnvFile([string]$Path) {
  if (-not (Test-Path $Path)) {
    throw "Env file not found: $Path`nCopy .env.onprem.example to .env.onprem and configure it."
  }
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $eq = $line.IndexOf('=')
    if ($eq -lt 1) { return }
    $name = $line.Substring(0, $eq).Trim()
    $value = $line.Substring($eq + 1).Trim()
    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    Write-Host "  env: $name" -ForegroundColor DarkGray
  }
}

if (-not $WebRoot) {
  $WebRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
}

if (-not $EnvFile) {
  $EnvFile = Join-Path $WebRoot '.env.onprem'
}

Write-Host 'Bisonstechs — Next.js production build (standalone)' -ForegroundColor Green
Write-Host "Web root: $WebRoot"

if (-not (Test-Path (Join-Path $WebRoot 'package.json'))) {
  throw "package.json not found in $WebRoot"
}

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
  throw 'Node.js is not installed. Install Node.js 20 LTS from https://nodejs.org/'
}

Write-Step "Loading $EnvFile"
Import-DotEnvFile $EnvFile

if (-not $env:API_URL) {
  throw 'API_URL is not set in .env.onprem. Use API_URL=http://127.0.0.1:5000 for on-prem.'
}

Write-Host "API_URL (build-time rewrites): $($env:API_URL)" -ForegroundColor Yellow
Write-Host "COOKIE_SECURE: $($env:COOKIE_SECURE)" -ForegroundColor Yellow

Push-Location $WebRoot
try {
  Write-Step 'Installing dependencies (includes devDependencies for build)'
  npm ci
  if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }

  Write-Step 'next build (standalone)'
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "next build failed" }

  $standalone = Join-Path $WebRoot '.next\standalone'
  $staticSrc = Join-Path $WebRoot '.next\static'
  $staticDst = Join-Path $standalone '.next\static'
  $publicSrc = Join-Path $WebRoot 'public'
  $publicDst = Join-Path $standalone 'public'

  if (-not (Test-Path (Join-Path $standalone 'server.js'))) {
    throw 'Standalone output missing. Ensure next.config.ts has output: standalone'
  }

  Write-Step 'Copying .next/static into standalone'
  if (Test-Path $staticDst) { Remove-Item $staticDst -Recurse -Force }
  Copy-Item $staticSrc $staticDst -Recurse -Force

  Write-Step 'Copying public into standalone'
  if (Test-Path $publicDst) { Remove-Item $publicDst -Recurse -Force }
  Copy-Item $publicSrc $publicDst -Recurse -Force

  Write-Step 'Writing standalone runtime .env from .env.onprem'
  Copy-Item $EnvFile (Join-Path $standalone '.env') -Force

} finally {
  Pop-Location
}

Write-Host @"

Build complete.

Next: package for client delivery
  powershell -ExecutionPolicy Bypass -File deploy\on-prem\windows\package-standalone.ps1

Standalone runtime: .next\standalone\
"@ -ForegroundColor Green
