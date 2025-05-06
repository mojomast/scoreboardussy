#!/bin/bash
# Check if npm is installed
command -v npm >/dev/null 2>&1 || { echo >&2 "Error: npm is not installed or not in PATH. Please install Node.js (which includes npm) from https://nodejs.org/ and ensure it's added to your PATH."; exit 1; }

echo "Starting development servers for client and server..."
echo "Access Control Panel: http://localhost:5173/control"
echo "Access Scoreboard Display: http://localhost:5173/"
npm run dev
