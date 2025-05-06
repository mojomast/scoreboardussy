@echo off
REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: npm is not installed or not in PATH.
    echo Please install Node.js (which includes npm) from https://nodejs.org/ and ensure it's added to your PATH.
    pause
    goto :eof
)
echo Starting development servers for client and server...
echo Access Control Panel: http://localhost:5173/control
echo Access Scoreboard Display: http://localhost:5173/
npm run dev
