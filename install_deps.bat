@echo off

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: npm is not installed or not in PATH.
    echo Please install Node.js (which includes npm) from https://nodejs.org/ and ensure it's added to your PATH.
    pause
    goto :eof
)

echo Installing root dependencies...
npm install

echo Installing client dependencies...
cd client
npm install
cd ..

echo Installing server dependencies...
cd server
npm install
cd ..

echo Dependency installation complete.
pause
