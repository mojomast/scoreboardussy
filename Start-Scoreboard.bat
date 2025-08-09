@echo off
setlocal ENABLEDELAYEDEXPANSION

REM One-click launcher for Improv Scoreboard (Windows)

where docker >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker is not installed or not in PATH.
  echo Please install Docker Desktop for Windows, then run this script again.
  echo https://www.docker.com/products/docker-desktop/
  pause
  exit /b 1
)

REM Prefer modern "docker compose"; fallback to legacy docker-compose
for /f "tokens=*" %%i in ('docker compose version 2^>nul') do set HAS_COMPOSE=1
if defined HAS_COMPOSE (
  set COMPOSE_CMD=docker compose
) else (
  where docker-compose >nul 2>&1
  if errorlevel 1 (
    echo [ERROR] docker compose plugin or docker-compose not found.
    echo Please ensure Docker Desktop is up-to-date and includes the Compose plugin.
    pause
    exit /b 1
  ) else (
    set COMPOSE_CMD=docker-compose
  )
)

echo [INFO] Building and starting container...
%COMPOSE_CMD% up -d --build
if errorlevel 1 (
  echo [ERROR] Failed to start the container.
  pause
  exit /b 1
)

REM Give the server a moment to start
ping -n 5 127.0.0.1 >nul

REM Try to open the browser to localhost
start http://localhost:3001/
start http://localhost:3001/#/control

echo.
echo =============================================================
echo Improv Scoreboard is starting.
echo - Local:          http://localhost:3001/
echo - Control Panel:  http://localhost:3001/#/control

echo To access from other devices on your network, open: 
echo   http://^<your-ip^>:3001/           (Display)
echo   http://^<your-ip^>:3001/#/control  (Control)
echo.
echo To find your IP, run: ipconfig ^| findstr IPv4

echo Press any key to close this window.
pause >nul
exit /b 0
