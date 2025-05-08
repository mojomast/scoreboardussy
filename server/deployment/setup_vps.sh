#!/bin/bash

# Improvscoreboard VPS Setup Script
# This script sets up a new Ubuntu 22.04 LTS VPS for the Improvscoreboard application

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print step message
print_step() {
  echo -e "${YELLOW}==>${NC} $1"
}

# Print success message
print_success() {
  echo -e "${GREEN}==>${NC} $1"
}

# Print error message
print_error() {
  echo -e "${RED}==>${NC} $1"
}

# Check if running as root
if [ "$(id -u)" != "0" ]; then
   print_error "This script must be run as root" 
   exit 1
fi

# Update system
print_step "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
print_step "Installing essential packages..."
apt install -y build-essential git curl wget gnupg2 ca-certificates lsb-release apt-transport-https

# Install Node.js
print_step "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
npm install -g pm2

# Install MongoDB
print_step "Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl enable mongod
systemctl start mongod

# Install Nginx
print_step "Installing Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# Install Certbot for SSL
print_step "Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Configure firewall
print_step "Configuring firewall..."
apt install -y ufw
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 27017/tcp  # MongoDB (consider restricting this in production)
ufw --force enable

# Create application user
print_step "Creating application user..."
useradd -m -s /bin/bash deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/ || echo "No authorized_keys file found, please add SSH keys manually"
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Create application directories
print_step "Creating application directories..."
mkdir -p /var/www/improvscoreboard/client
mkdir -p /var/www/improvscoreboard/server
chown -R deploy:deploy /var/www/improvscoreboard

# Create backup directory
print_step "Creating backup directory..."
mkdir -p /var/backups/mongodb/improvscoreboard
chown -R deploy:deploy /var/backups/mongodb

# Setup MongoDB backup cron job
print_step "Setting up MongoDB backup cron job..."
cat > /etc/cron.daily/mongodb-backup << EOF
#!/bin/bash
/var/www/improvscoreboard/deployment/backup.sh
EOF
chmod +x /etc/cron.daily/mongodb-backup

# Setup log rotation
print_step "Setting up log rotation..."
cat > /etc/logrotate.d/improvscoreboard << EOF
/var/www/improvscoreboard/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 \`cat /var/run/nginx.pid\`
    endscript
}
EOF

# Print summary
print_success "VPS setup completed successfully!"
print_success "Next steps:"
echo "1. Add your domain to Nginx configuration"
echo "2. Obtain SSL certificate with: certbot --nginx -d your-domain.com"
echo "3. Deploy your application using the deploy.sh script"
echo "4. Set up environment variables in /var/www/improvscoreboard/server/.env"