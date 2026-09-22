#Requires -Version 5.1
<#
.SYNOPSIS
  Start, stop, restart, or inspect the Bisonstechs web PM2 process.

.PARAMETER Action
  start | stop | restart | status | logs
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('start', 'stop', 'restart', 'status', 'logs')]
  [string]$Action,

  [string]$RuntimeRoot = ''
)

$ErrorActionPreference = 'Stop'
$AppName = 'bisonstechs-web'

$pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2) {
  throw 'PM2 is not installed. Run install-web-service.ps1 first.'
}

$EcosystemFile = Join-Path $PSScriptRoot 'ecosystem.web.config.cjs'
if (Test-Path (Join-Path $PSScriptRoot 'ecosystem.web.config.cjs')) {
  $EcosystemFile = Join-Path $PSScriptRoot 'ecosystem.web.config.cjs'
}

if ($RuntimeRoot) {
  $env:BISONSTECHS_WEB_RUNTIME = (Resolve-Path $RuntimeRoot).Path
} elseif (Test-Path (Join-Path $PSScriptRoot 'server.js')) {
  $env:BISONSTECHS_WEB_RUNTIME = $PSScriptRoot
} elseif (Test-Path (Join-Path $PSScriptRoot 'package\server.js')) {
  $env:BISONSTECHS_WEB_RUNTIME = Join-Path $PSScriptRoot 'package'
}

switch ($Action) {
  'start' {
    pm2 start $EcosystemFile --update-env
  }
  'stop' {
    pm2 stop $AppName
  }
  'restart' {
    pm2 restart $AppName --update-env
  }
  'status' {
    pm2 status $AppName
    pm2 info $AppName
  }
  'logs' {
    pm2 logs $AppName --lines 100
  }
}

if ($LASTEXITCODE -ne 0 -and $Action -ne 'logs') {
  throw "pm2 $Action failed with exit code $LASTEXITCODE"
}
