[CmdletBinding()]
param(
  [string]$Port = "3001",
  [switch]$Rebuild
)

$ErrorActionPreference = "Stop"

function New-Dir($p) { if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p | Out-Null } }

# Resolve repo root
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# 1) Build server and client
if ($Rebuild) {
  Write-Host "Rebuilding server and client..." -ForegroundColor Cyan
  npm run build
} else {
  if (-not (Test-Path "server/dist/server.js") -or -not (Test-Path "client/dist")) {
    Write-Host "Running full build (server + client)..." -ForegroundColor Cyan
    npm run build
  }
}

# 2) Package server into a standalone Windows EXE
Write-Host "Packaging Windows EXE (server)..." -ForegroundColor Cyan
npm --prefix server run package:win

# 3) Bundle client assets next to the EXE so static serving works
$buildDir = Join-Path $root 'build'
$clientOut = Join-Path $buildDir 'client\\dist'
New-Dir (Join-Path $buildDir 'client')

Write-Host "Copying client/dist to $clientOut" -ForegroundColor Cyan
robocopy "client\\dist" "$clientOut" /MIR | Out-Null

# 4) Create a LAN-aware launcher that sets PUBLIC_URL and opens Control UI
$launcher = @'
[CmdletBinding()]
param(
  [string]$Port = "3001",
  [string]$Ip = "",
  [switch]$NoBrowser
)

function Get-LanIPv4 {
  try {
    $candidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
      Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254*' -and $_.InterfaceOperationalStatus -eq 'Up' }
    $pick = $candidates | Sort-Object -Property InterfaceMetric | Select-Object -First 1 -ExpandProperty IPAddress
    if ($pick) { return $pick }
  } catch {}
  try {
    $cfg = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1
    if ($cfg -and $cfg.IPv4Address -and $cfg.IPv4Address.IPAddress) { return $cfg.IPv4Address.IPAddress }
  } catch {}
  try {
    $lines = ipconfig | Out-String
    $m = [regex]::Match($lines, 'IPv4 Address[ .]*: *(\d+\.\d+\.\d+\.\d+)')
    if ($m.Success) { return $m.Groups[1].Value }
  } catch {}
  return $null
}

$exeDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $exeDir

if ([string]::IsNullOrWhiteSpace($Ip)) { $ip = Get-LanIPv4 } else { $ip = $Ip }
if (-not $ip) { Write-Error "Could not detect LAN IPv4 address. Pass -Ip x.x.x.x"; exit 1 }

$env:NODE_ENV = 'production'
$env:PUBLIC_URL = "http://${ip}:$Port"
$env:ORIGIN = "http://localhost:$Port"

Write-Host "Starting ImprovScoreboard at http://${ip}:$Port" -ForegroundColor Green
Start-Process -FilePath (Join-Path $exeDir 'ImprovScoreboard.exe') -ArgumentList @() -WorkingDirectory $exeDir

Start-Sleep -Seconds 2
if (-not $NoBrowser) {
  Start-Process "http://${ip}:$Port/#/control"
}
'@

$launcherPath = Join-Path $buildDir 'Start-Scoreboard.ps1'
$launcher | Out-File -FilePath $launcherPath -Encoding UTF8 -Force

Write-Host "Standalone build complete." -ForegroundColor Green
Write-Host "- EXE: $buildDir/ImprovScoreboard.exe" -ForegroundColor DarkGray
Write-Host "- Client assets: $clientOut" -ForegroundColor DarkGray
Write-Host "- Launcher: $launcherPath" -ForegroundColor DarkGray

