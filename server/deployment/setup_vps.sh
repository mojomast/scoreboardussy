#!/bin/bash

# Setup script for Improvscoreboard application using Docker Compose
# Requirements:
# - Ubuntu 22.04 or newer
# - Root privileges
# - Internet connection
# - Git repository already cloned

# Exit on error
set -e

echo "==> Updating system packages..."
apt-get update && apt-get upgrade -y

echo "==> Installing essential packages..."
apt-get install -y \
    build-essential \
    git \
    curl \
    wget \
    ca-certificates \
    lsb-release \
    apt-transport-https \
    gnupg2

echo "==> Installing Docker..."
# Create directory for Docker GPG key
mkdir -p /etc/apt/keyrings

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to Apt sources
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | tee /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

echo "==> Configuring application files..."

# Create nginx.conf
cat > nginx.conf << 'EOL'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://client:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        rewrite ^/api(/.*)$ $1 break;
        proxy_pass http://server:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket connections
    location /socket.io {
        proxy_pass http://server:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

# Create docker-compose.override.yml
cat > docker-compose.override.yml << 'EOL'
version: '3.8'

services:
  # Modify MongoDB image to use a CPU-compatible version
  mongodb:
    image: mongo:4.4.18

  # Add Nginx reverse proxy
  nginx:
    image: nginx:latest
    container_name: nginx-proxy
    restart: always
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - client
      - server
    networks:
      - app-network
EOL

# Create client environment file
mkdir -p client
cat > client/.env << 'EOL'
VITE_API_URL=/api
EOL

echo "==> Configuring firewall..."
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp  # SSH
ufw allow 80/tcp  # HTTP (Nginx)
ufw allow 443/tcp # HTTPS (for future use)
echo "y" | ufw enable

echo "==> Starting application..."
docker compose down || true
docker compose up -d

echo "==> Setup complete!"
echo "The Improvscoreboard application is now running"
echo ""
echo "Access the application at: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "Default admin credentials:"
echo "- Username: admin"
echo "- Password: admin123"
echo ""
echo "Useful commands:"
echo "- View logs: docker compose logs -f"
echo "- Restart application: docker compose restart"
echo "- Stop application: docker compose down"
