param(
  [string]$Version = "0.0.0-local"
)

$ErrorActionPreference = "Stop"

Write-Host "[1/6] Cleaning staging directories..."
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent (Split-Path -Parent $scriptDir)
$stage = Join-Path $root "release\windows\stage"
$artifacts = Join-Path $root "release\windows\artifacts"
if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
if (Test-Path $artifacts) { Remove-Item -Recurse -Force $artifacts }
New-Item -ItemType Directory -Force -Path $stage, $artifacts | Out-Null

Write-Host "[2/6] Installing deps and building client/server..."
# Build client
pushd (Join-Path $root "client")
if (Test-Path package-lock.json) { npm ci } else { npm i }
npm run build
popd
# Build server
pushd (Join-Path $root "server")
if (Test-Path package-lock.json) { npm ci } else { npm i }
npm run build
# Package server to single exe (bundles Node runtime)
npx pkg dist/server.js --targets node18-win-x64 --output build/ImprovScoreboard.exe
popd

Write-Host "[3/6] Staging app files..."
# Layout expected by server's production static serving logic
# server.exe at stage/server/ImprovScoreboard.exe, client build at stage/client/dist
New-Item -ItemType Directory -Force -Path (Join-Path $stage "server"), (Join-Path $stage "client\dist"), (Join-Path $stage "server\data") | Out-Null
Copy-Item (Join-Path $root "server\build\ImprovScoreboard.exe") (Join-Path $stage "server\ImprovScoreboard.exe")
Copy-Item -Recurse -Force (Join-Path $root "client\dist\*") (Join-Path $stage "client\dist\")
# Include a default empty data store directory (persisted at runtime next to exe)

Write-Host "[4/6] Writing version file..."
Set-Content -Path (Join-Path $stage "VERSION.txt") -Value $Version

Write-Host "[5/6] Compiling installer with Inno Setup..."
$issPath = Join-Path $root "installer\windows\ImprovScoreboard.iss"
# Detect ISCC
$iscc = (Get-Command iscc -ErrorAction SilentlyContinue)
if (-not $iscc) {
  Write-Warning "Inno Setup Compiler (iscc) not found in PATH. Install Inno Setup 6 and re-run. https://jrsoftware.org/isinfo.php"
  Write-Host "You can still zip the staged folder as a portable release."
} else {
  & iscc /DMyAppVersion=$Version /DStageDir="$stage" /O"$artifacts" "$issPath"
  Write-Host "Installer built to: $artifacts"
}

Write-Host "[6/6] Creating portable zip..."
$zipPath = Join-Path $artifacts ("ImprovScoreboard_Portable_" + $Version + ".zip")
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($stage, $zipPath)

Write-Host "Done. Artifacts in $artifacts"
