[CmdletBinding()]
param(
  [string]$Port = "3001",
  [string]$Ip = ""
)

function Get-LanIPv4 {
  # Try method 1: Get-NetIPAddress (fast path)
  try {
    $candidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
      Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254*' -and $_.ValidLifetime -ne ([TimeSpan]::Zero) -and $_.InterfaceOperationalStatus -eq 'Up' }
    $pick = $candidates | Sort-Object -Property InterfaceMetric | Select-Object -First 1 -ExpandProperty IPAddress
    if ($pick) { return $pick }
  } catch {}
  
  # Try method 2: pick interface with default gateway
  try {
    $cfg = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1
    if ($cfg -and $cfg.IPv4Address -and $cfg.IPv4Address.IPAddress) {
      return $cfg.IPv4Address.IPAddress
    }
  } catch {}
  
  # Try method 3: parse ipconfig output
  try {
    $lines = ipconfig | Out-String
    $m = [regex]::Match($lines, 'IPv4 Address[ .]*: *(\d+\.\d+\.\d+\.\d+)')
    if ($m.Success) { return $m.Groups[1].Value }
  } catch {}
  
  return $null
}

if ([string]::IsNullOrWhiteSpace($Ip)) {
  $Ip = Get-LanIPv4
}

if (-not $Ip) {
  Write-Error "Could not detect LAN IPv4 address. Pass -Ip x.x.x.x explicitly or check your network."
  exit 1
}

Write-Host "Starting server on LAN IP: $Ip with port $Port" -ForegroundColor Cyan

# Required feature flags
$env:ENABLE_REALTIME_MATCHES = "true"
$env:ENABLE_MATCH_TIMERS = "true"

# CORS + QR base URL
$env:PUBLIC_URL = "http://${Ip}:${Port}"
# Allow Vite dev origin over LAN (client dev port 5173 by default)
$env:ORIGIN = "http://${Ip}:5173"

Write-Host "ENV ENABLE_REALTIME_MATCHES=$($env:ENABLE_REALTIME_MATCHES)" -ForegroundColor DarkGray
Write-Host "ENV ENABLE_MATCH_TIMERS=$($env:ENABLE_MATCH_TIMERS)" -ForegroundColor DarkGray
Write-Host "ENV PUBLIC_URL=$($env:PUBLIC_URL)" -ForegroundColor DarkGray
Write-Host "ENV ORIGIN=$($env:ORIGIN)" -ForegroundColor DarkGray

# Quick port pre-check (optional)
try { Test-NetConnection -ComputerName $Ip -Port $Port | Out-Null } catch {}

# Resolve repo root and run server (dev)
$root = Split-Path -Parent $PSScriptRoot
npm --prefix "$root\server" run dev
