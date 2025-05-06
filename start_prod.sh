#!/bin/bash
echo "Starting server in PRODUCTION mode..."

# Check if build exists
if [ ! -f "server/dist/server.js" ]; then
  echo "ERROR: Production build not found in server/dist."
  echo "Please run './build.sh' first."
  exit 1
fi

echo "Setting NODE_ENV=production"
export NODE_ENV=production

echo "Launching node server/dist/server.js"
# The server will log the address it's listening on.
node server/dist/server.js

# Server process runs here. Press Ctrl+C to stop.
