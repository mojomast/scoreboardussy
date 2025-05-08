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

# Install Docker
print_step "Installing Docker..."
apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Install Docker Compose
print_step "Installing Docker Compose..."
mkdir -p ~/.docker/cli-plugins/
curl -SL https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose
chmod +x ~/.docker/cli-plugins/docker-compose

# Setup MongoDB with Docker
print_step "Setting up MongoDB with Docker..."
mkdir -p /var/data/mongodb
mkdir -p /var/docker/mongodb

# Create Docker Compose file for MongoDB
cat > /var/docker/mongodb/docker-compose.yml << EOF
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: mongodb
    restart: always
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      - /var/data/mongodb:/data/db
    networks:
      - mongo-network

networks:
  mongo-network:
    driver: bridge
EOF

# Start MongoDB container
cd /var/docker/mongodb
docker compose up -d

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
ufw allow 27017/tcp  # MongoDB (only needed if accessing from other servers)
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

# Create Docker Compose file for the application
print_step "Creating Docker Compose file for the application..."
mkdir -p /var/docker/improvscoreboard
cat > /var/docker/improvscoreboard/docker-compose.yml << EOF
version: '3.8'

services:
  app:
    image: node:18
    container_name: improvscoreboard
    restart: always
    working_dir: /app
    volumes:
      - /var/www/improvscoreboard/server:/app
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - MONGODB_URI=mongodb://admin:password@mongodb:27017/improvscoreboard?authSource=admin
    networks:
      - app-network
      - mongo-network
    command: "npm start"
    depends_on:
      - mongodb

networks:
  app-network:
    driver: bridge
  mongo-network:
    external: true
EOF

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
echo "5. Start the application with: cd /var/docker/improvscoreboard && docker compose up -d"
echo "6. MongoDB is running in Docker with username 'admin' and password 'password'"
echo "   Change these credentials in production!"