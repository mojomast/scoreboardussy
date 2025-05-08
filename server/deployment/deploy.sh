#!/bin/bash

# Improvscoreboard Deployment Script
# This script deploys the Improvscoreboard application to a production server

# Exit on error
set -e

# Configuration
APP_NAME="improvscoreboard"
DEPLOY_USER="deploy"
DEPLOY_HOST="your-server-ip"
DEPLOY_PATH="/var/www/$APP_NAME"
DOCKER_PATH="/var/docker/$APP_NAME"
REPO_URL="https://github.com/yourusername/improvscoreboard.git"
BRANCH="main"

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

# Check if SSH key is available
if [ ! -f ~/.ssh/id_rsa ]; then
  print_error "SSH key not found. Please generate an SSH key and add it to the server."
  exit 1
fi

# Build the application locally
print_step "Building client application..."
cd ../..
cd client
npm ci
npm run build
print_success "Client build completed"

print_step "Building server application..."
cd ../server
npm ci
npm run build
print_success "Server build completed"

# Create production .env file
print_step "Creating production .env file..."
cp .env.example .env.production
# You would typically edit this file with production values
print_success "Production .env file created"

# Deploy to server
print_step "Deploying to server..."

# Create deployment directory if it doesn't exist
ssh $DEPLOY_USER@$DEPLOY_HOST "mkdir -p $DEPLOY_PATH"

# Copy client build
print_step "Copying client build..."
scp -r ../client/dist $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/client/

# Copy server build
print_step "Copying server build..."
scp -r ./dist $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/server/
scp -r ./node_modules $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/server/
scp .env.production $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/server/.env

# Copy deployment files
print_step "Copying deployment files..."
scp -r ./deployment $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/

# Setup Nginx
print_step "Setting up Nginx..."
ssh $DEPLOY_USER@$DEPLOY_HOST "sudo cp $DEPLOY_PATH/deployment/nginx.conf /etc/nginx/sites-available/$APP_NAME"
ssh $DEPLOY_USER@$DEPLOY_HOST "sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/"
ssh $DEPLOY_USER@$DEPLOY_HOST "sudo nginx -t && sudo systemctl reload nginx"

# Setup Docker
print_step "Setting up Docker containers..."
ssh $DEPLOY_USER@$DEPLOY_HOST "sudo docker compose -f $DOCKER_PATH/docker-compose.yml down || true"
ssh $DEPLOY_USER@$DEPLOY_HOST "sudo docker compose -f $DOCKER_PATH/docker-compose.yml up -d"

# Check container status
print_step "Checking container status..."
ssh $DEPLOY_USER@$DEPLOY_HOST "sudo docker ps | grep $APP_NAME"

print_success "Deployment completed successfully!"
print_success "Your application is now running at https://your-domain.com"
print_success "MongoDB is running in Docker and accessible at mongodb://admin:password@localhost:27017"