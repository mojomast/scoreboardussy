#!/bin/bash
# Quick start script for Improv Scoreboard with Design System

echo "🎭 Starting Improv Scoreboard..."
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the scoreboardussy root directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "server/node_modules" ] || [ ! -d "client/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd server && npm install && cd ..
    cd client && npm install && cd ..
fi

# Start server in background
echo "🚀 Starting server..."
cd server
npm run dev &
cd ..

# Wait a bit for server to start
sleep 3

# Start client
echo "🎨 Starting client..."
cd client
npm run dev
