@echo off
echo Starting server in PRODUCTION mode...

REM Check if build exists
if not exist "server\dist\server.js" (
  echo ERROR: Production build not found in server\dist.
  echo Please run 'build.bat' first.
  pause
  exit /b 1
)

echo Setting NODE_ENV=production
set NODE_ENV=production

echo Launching node server/dist/server.js
REM The server will log the address it's listening on.
node server\dist\server.js

REM Server process runs here. Press Ctrl+C to stop.
pause
