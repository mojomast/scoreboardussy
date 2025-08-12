[CmdletBinding()]
param(
  [string]$Port = "3001",
  [switch]$Rebuild,
  [string]$Ip = ""
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

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ([string]::IsNullOrWhiteSpace($Ip)) {
  $ip = Get-LanIPv4
} else {
  $ip = $Ip
}
if (-not $ip) {
  Write-Error "Could not detect LAN IPv4 address. Pass -Ip x.x.x.x or ensure network connectivity."
  exit 1
}

# Ensure production build exists (or rebuild on demand)
$serverBuild = Join-Path $root 'server\dist\server.js'
$clientBuildDir = Join-Path $root 'client\dist'
if ($Rebuild -or -not (Test-Path $serverBuild) -or -not (Test-Path $clientBuildDir)) {
  Write-Host "Building server and client for production..." -ForegroundColor Cyan
  npm run build
  if ($LASTEXITCODE -ne 0) { Write-Error "Build failed"; exit 1 }
}

# Environment for production serving
$env:NODE_ENV = 'production'
$env:PUBLIC_URL = "http://${ip}:$Port"
# Also allow localhost origin for same-machine access
$env:ORIGIN = "http://localhost:$Port"

Write-Host "Starting production server at http://${ip}:$Port" -ForegroundColor Green
Write-Host "Server will serve client from client/dist and be accessible on LAN." -ForegroundColor DarkGray

# Launch server in a new PowerShell window to keep it running
$serverCmd = "powershell -NoExit -Command `"`$env:NODE_ENV='production'; `$env:PUBLIC_URL='http://${ip}:$Port'; `$env:ORIGIN='http://localhost:$Port'; node 'server\\dist\\server.js'`""
Start-Process -FilePath powershell -ArgumentList "-NoExit","-Command", "`$env:NODE_ENV='production'; `$env:PUBLIC_URL='http://${ip}:$Port'; `$env:ORIGIN='http://localhost:$Port'; node 'server\dist\server.js'"

# Give the server a moment, then launch the client in the default browser
Start-Sleep -Seconds 2
Start-Process "http://${ip}:$Port/#/control"

Write-Host "Logs are in the new window. Client opened at http://${ip}:$Port/#/control. Display: http://${ip}:$Port/#/display" -ForegroundColor Yellow

