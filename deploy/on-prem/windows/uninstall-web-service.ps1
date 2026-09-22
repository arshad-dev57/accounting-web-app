#Requires -Version 5.1
<#
.SYNOPSIS
  Stop and remove Bisonstechs web app from PM2 (Windows on-prem).
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

Write-Host 'Bisonstechs — Web Windows Service Uninstall' -ForegroundColor Yellow

$pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2) {
  Write-Host 'PM2 is not installed — nothing to remove.' -ForegroundColor Gray
  exit 0
}

pm2 delete bisonstechs-web 2>$null
pm2 save

Write-Host 'Web app removed from PM2. .env and package files were not deleted.' -ForegroundColor Green
