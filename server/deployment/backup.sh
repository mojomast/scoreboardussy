#!/bin/bash

# Improvscoreboard MongoDB Backup Script
# This script creates a backup of the MongoDB database and rotates old backups

# Exit on error
set -e

# Configuration
DB_NAME="improvscoreboard"
BACKUP_DIR="/var/backups/mongodb/$DB_NAME"
BACKUP_COUNT=7  # Number of backups to keep

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

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Generate timestamp for backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/$DB_NAME-$TIMESTAMP.gz"

# Create backup
print_step "Creating MongoDB backup for $DB_NAME..."
mongodump --db $DB_NAME --gzip --archive=$BACKUP_FILE

# Check if backup was successful
if [ $? -eq 0 ]; then
  print_success "Backup created successfully: $BACKUP_FILE"
else
  print_error "Backup failed!"
  exit 1
fi

# Rotate old backups
print_step "Rotating old backups..."
ls -tp $BACKUP_DIR/*.gz | grep -v '/$' | tail -n +$((BACKUP_COUNT+1)) | xargs -I {} rm -- {}

# Count remaining backups
BACKUP_FILES=$(ls -1 $BACKUP_DIR/*.gz 2>/dev/null | wc -l)
print_success "Backup rotation completed. $BACKUP_FILES backups available."

# Test restoration (optional)
if [ "$1" == "--test-restore" ]; then
  print_step "Testing backup restoration..."
  TEST_DB="${DB_NAME}_test_restore"
  
  # Drop test database if it exists
  mongo --eval "db.dropDatabase()" $TEST_DB
  
  # Restore to test database
  mongorestore --gzip --archive=$BACKUP_FILE --nsFrom="$DB_NAME.*" --nsTo="$TEST_DB.*"
  
  # Check if restore was successful
  if [ $? -eq 0 ]; then
    print_success "Test restoration successful!"
    
    # Drop test database
    mongo --eval "db.dropDatabase()" $TEST_DB
  else
    print_error "Test restoration failed!"
  fi
fi

print_success "Backup process completed successfully!"