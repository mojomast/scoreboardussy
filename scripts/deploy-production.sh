#!/bin/bash
# Production deployment script for scoreboard.ussyco.de
# Run this script after setting up the server environment

set -euo pipefail

# Configuration
APP_DIR="/home/mojo/projects/scoreboardussy/scoreboardussy"
SERVER_DIR="$APP_DIR/server"
CLIENT_DIR="$APP_DIR/client"
LOG_DIR="/var/log/scoreboard"
BACKUP_DIR="/var/backups/scoreboard"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

# Check if running as correct user
if [ "$(whoami)" != "mojo" ]; then
    error "This script must be run as user 'mojo'"
fi

# Check prerequisites
log "Checking prerequisites..."
command -v node >/dev/null 2>& || error "Node.js not found"
command -v npm >/dev/null 2>& || error "npm not found"
command -v caddy >/dev/null 2>& || warn "Caddy not found - install with: sudo apt install caddy"
command -v psql >/dev/null 2>& || warn "PostgreSQL client not found"

# Create necessary directories
log "Creating directories..."
sudo mkdir -p "$LOG_DIR" "$BACKUP_DIR"
sudo chown mojo:mojo "$LOG_DIR" "$BACKUP_DIR"

# Install server dependencies
log "Installing server dependencies..."
cd "$SERVER_DIR"
npm ci --production

# Generate Prisma client
log "Generating Prisma client..."
npx prisma generate

# Run database migrations (if any)
log "Running database migrations..."
npx prisma migrate deploy || warn "Migration failed or no migrations to apply"

# Build server
log "Building server..."
npm run build

# Install client dependencies
log "Installing client dependencies..."
cd "$CLIENT_DIR"
npm ci

# Build client
log "Building client for production..."
npm run build

# Create .env file if it doesn't exist
if [ ! -f "$SERVER_DIR/.env" ]; then
    log "Creating server/.env from example..."
    cp "$SERVER_DIR/.env.example" "$SERVER_DIR/.env"
    warn "Please edit $SERVER_DIR/.env and set JWT_SECRET to a secure random string!"
    warn "Run: openssl rand -base64 32"
fi

# Setup systemd services
log "Setting up systemd services..."
if [ -f "$SERVER_DIR/systemd/scoreboard@.service" ]; then
    sudo cp "$SERVER_DIR/systemd/scoreboard@.service" /etc/systemd/system/
    sudo systemctl daemon-reload
    log "Systemd service template installed"
fi

# Setup Caddy
if [ -f "$APP_DIR/Caddyfile.production" ]; then
    log "Setting up Caddy..."
    sudo cp "$APP_DIR/Caddyfile.production" /etc/caddy/Caddyfile
    sudo systemctl reload caddy || warn "Failed to reload Caddy"
fi

# Setup logrotate
log "Setting up log rotation..."
sudo tee /etc/logrotate.d/scoreboard > /dev/null <<EOF
$LOG_DIR/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 mojo mojo
    sharedscripts
    postrotate
        systemctl reload scoreboard@1 scoreboard@2 scoreboard@3
    endscript
}
EOF

# Start services
log "Starting services..."
sudo systemctl enable scoreboard@1 scoreboard@2 scoreboard@3
sudo systemctl start scoreboard@1
sleep 2
sudo systemctl start scoreboard@2
sleep 2
sudo systemctl start scoreboard@3

# Health check
log "Performing health check..."
sleep 3
if curl -s http://localhost:3001/health | grep -q '"status":"ok"'; then
    log "✅ Health check passed!"
else
    warn "Health check failed - check logs with: sudo journalctl -u scoreboard@1"
fi

log ""
log "🎉 Deployment complete!"
log ""
log "Your scoreboard should be available at:"
log "  https://scoreboard.ussyco.de"
log ""
log "Useful commands:"
log "  View logs:     sudo journalctl -u scoreboard@1 -f"
log "  Restart:       sudo systemctl restart scoreboard@1"
log "  Status:        sudo systemctl status scoreboard@1"
log "  Health check:  curl http://localhost:3001/health"
log ""
log "To enable all 3 instances behind Caddy load balancer:"
log "  sudo systemctl start scoreboard@2 scoreboard@3"
