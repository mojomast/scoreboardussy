#!/bin/bash

# Improvscoreboard Monitoring Script
# This script checks the health of the Improvscoreboard application

# Exit on error
set -e

# Configuration
APP_NAME="improvscoreboard"
APP_URL="https://your-domain.com"
API_ENDPOINT="/api/state"
SLACK_WEBHOOK_URL="" # Optional: Add your Slack webhook URL here
EMAIL_RECIPIENT="" # Optional: Add your email address here

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

# Send notification
send_notification() {
  local message="$1"
  local status="$2" # success, warning, error
  
  # Send to Slack if webhook URL is provided
  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    local color="good"
    if [ "$status" == "warning" ]; then
      color="warning"
    elif [ "$status" == "error" ]; then
      color="danger"
    fi
    
    curl -s -X POST -H 'Content-type: application/json' --data "{
      \"attachments\": [
        {
          \"color\": \"$color\",
          \"title\": \"$APP_NAME Monitoring\",
          \"text\": \"$message\",
          \"ts\": $(date +%s)
        }
      ]
    }" $SLACK_WEBHOOK_URL
  fi
  
  # Send email if recipient is provided
  if [ -n "$EMAIL_RECIPIENT" ]; then
    echo "$message" | mail -s "[$APP_NAME] $status: Monitoring Alert" $EMAIL_RECIPIENT
  fi
}

# Check if the application is running
check_app_running() {
  print_step "Checking if application is running..."
  
  # Check if PM2 is running the application
  if pm2 list | grep -q "$APP_NAME"; then
    print_success "Application is running in PM2"
    return 0
  else
    print_error "Application is not running in PM2"
    send_notification "Application is not running in PM2" "error"
    return 1
  fi
}

# Check if the application is responding
check_app_responding() {
  print_step "Checking if application is responding..."
  
  # Check if the application is responding to HTTP requests
  local response=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL)
  
  if [ "$response" == "200" ]; then
    print_success "Application is responding with HTTP 200"
    return 0
  else
    print_error "Application is not responding correctly (HTTP $response)"
    send_notification "Application is not responding correctly (HTTP $response)" "error"
    return 1
  fi
}

# Check if the API is working
check_api_working() {
  print_step "Checking if API is working..."
  
  # Check if the API is responding
  local response=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL$API_ENDPOINT)
  
  if [ "$response" == "200" ]; then
    print_success "API is responding with HTTP 200"
    return 0
  else
    print_error "API is not responding correctly (HTTP $response)"
    send_notification "API is not responding correctly (HTTP $response)" "error"
    return 1
  fi
}

# Check MongoDB Docker container status
check_mongodb_status() {
  print_step "Checking MongoDB Docker container status..."
  
  # Check if MongoDB container is running
  if docker ps | grep -q "mongodb"; then
    print_success "MongoDB container is running"
    return 0
  else
    print_error "MongoDB container is not running"
    send_notification "MongoDB container is not running" "error"
    return 1
  fi
}

# Check disk space
check_disk_space() {
  print_step "Checking disk space..."
  
  # Check if disk space is below 90%
  local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
  
  if [ "$disk_usage" -lt 90 ]; then
    print_success "Disk space is OK ($disk_usage%)"
    return 0
  else
    print_error "Disk space is critical ($disk_usage%)"
    send_notification "Disk space is critical ($disk_usage%)" "error"
    return 1
  fi
}

# Check Docker status
check_docker_status() {
  print_step "Checking Docker status..."
  
  # Check if Docker is running
  if systemctl is-active --quiet docker; then
    print_success "Docker is running"
    return 0
  else
    print_error "Docker is not running"
    send_notification "Docker is not running" "error"
    return 1
  fi
}

# Check MongoDB data volume
check_mongodb_volume() {
  print_step "Checking MongoDB data volume..."
  
  # Check if MongoDB data volume exists and has data
  if [ -d "/var/data/mongodb" ] && [ "$(ls -A /var/data/mongodb)" ]; then
    print_success "MongoDB data volume is OK"
    return 0
  else
    print_error "MongoDB data volume is empty or missing"
    send_notification "MongoDB data volume is empty or missing" "error"
    return 1
  fi
}

# Check memory usage
check_memory_usage() {
  print_step "Checking memory usage..."
  
  # Check if memory usage is below 90%
  local memory_usage=$(free | awk '/Mem:/ {print int($3/$2 * 100)}')
  
  if [ "$memory_usage" -lt 90 ]; then
    print_success "Memory usage is OK ($memory_usage%)"
    return 0
  else
    print_error "Memory usage is critical ($memory_usage%)"
    send_notification "Memory usage is critical ($memory_usage%)" "error"
    return 1
  fi
}

# Check CPU load
check_cpu_load() {
  print_step "Checking CPU load..."
  
  # Check if CPU load is below 90%
  local cpu_load=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
  
  if [ "$(echo "$cpu_load < 90" | bc)" -eq 1 ]; then
    print_success "CPU load is OK ($cpu_load%)"
    return 0
  else
    print_error "CPU load is critical ($cpu_load%)"
    send_notification "CPU load is critical ($cpu_load%)" "error"
    return 1
  fi
}

# Run all checks
run_checks() {
  local errors=0
  
  check_app_running || ((errors++))
  check_app_responding || ((errors++))
  check_api_working || ((errors++))
  check_docker_status || ((errors++))
  check_mongodb_status || ((errors++))
  check_mongodb_volume || ((errors++))
  check_disk_space || ((errors++))
  check_memory_usage || ((errors++))
  check_cpu_load || ((errors++))
  
  if [ "$errors" -eq 0 ]; then
    print_success "All checks passed!"
    return 0
  else
    print_error "$errors checks failed!"
    return 1
  fi
}

# Main function
main() {
  print_step "Starting monitoring checks for $APP_NAME..."
  run_checks
  print_step "Monitoring checks completed."
}

# Run main function
main