#!/bin/bash
# Deploy scoreboardussy to VPS using existing reverse proxy

echo "🚀 Deploying scoreboardussy..."

# Stop existing containers
docker-compose -f docker-compose.vps.yml down

# Rebuild and start
docker-compose -f docker-compose.vps.yml up -d --build

# Show logs
echo ""
echo "✅ Deployment complete!"
echo "📊 Viewing logs (Ctrl+C to exit):"
docker-compose -f docker-compose.vps.yml logs -f web
