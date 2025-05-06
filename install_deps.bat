@echo off

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% equ 0 (
    echo npm found.
    goto :NpmFound
)

echo Error: npm command not found.

REM Check if winget is available
where winget >nul 2>nul
if %errorlevel% neq 0 (
    echo winget command not found. Cannot attempt automatic installation.
    goto :ShowManualInstallError
)

REM Prompt user to install via winget
set /p "choice=Attempt to install Node.js (includes npm) using winget? [y/N] "
if /i "%choice:~0,1%" neq "y" (
    echo Skipping installation attempt.
    goto :ShowManualInstallError
)

echo Attempting installation via winget (this may require administrator privileges)... 
winget install Microsoft.NodeJS --accept-source-agreements --accept-package-agreements
if %errorlevel% neq 0 (
    echo winget installation failed. Please install Node.js/npm manually from https://nodejs.org/ and ensure it's in your PATH.
    pause
    goto :eof
)

echo winget installation command finished. Verifying npm...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Installation via winget completed, but npm still not found in PATH. Please check for errors or ensure PATH is updated (you might need to restart this terminal).
    pause
    goto :eof
)

echo npm installed successfully via winget.

:NpmFound
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
goto :eof

:ShowManualInstallError
echo Please install Node.js (which includes npm) from https://nodejs.org/ and ensure it's added to your PATH.
pause
goto :eof
