@echo off
setlocal

REM Stop and remove the container
for /f "tokens=*" %%i in ('docker compose version 2^>nul') do set HAS_COMPOSE=1
if defined HAS_COMPOSE (
  set COMPOSE_CMD=docker compose
) else (
  set COMPOSE_CMD=docker-compose
)

%COMPOSE_CMD% down
if errorlevel 1 (
  echo [WARN] docker compose down failed or compose not available.
)

echo Done.
pause
