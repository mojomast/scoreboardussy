#!/bin/bash
echo "Building client and server for production..."
npm run build

echo "Build complete. Output directories:"
echo "  Client: client/dist"
echo "  Server: server/dist"
