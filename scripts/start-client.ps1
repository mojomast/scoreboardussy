[CmdletBinding()]
param(
  [string]$Port = "5173",
  [string]$Ip = "0.0.0.0"
)

Write-Host "Starting client with host: $Ip and port: $Port" -ForegroundColor Cyan

# Always pass explicit host/port flags to Vite so it binds correctly
$root = Split-Path -Parent $PSScriptRoot
npm --prefix "$root\client" run dev -- --host $Ip --port $Port
