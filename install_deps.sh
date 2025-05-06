#!/bin/bash
# Check if npm is installed
command -v npm >/dev/null 2>&1 || { echo >&2 "Error: npm is not installed or not in PATH. Please install Node.js (which includes npm) from https://nodejs.org/ and ensure it's added to your PATH."; exit 1; }

echo "Installing root dependencies..."
npm install

echo "Installing client dependencies..."
(cd client && npm install)

echo "Installing server dependencies..."
(cd server && npm install)

echo "Dependency installation complete."
