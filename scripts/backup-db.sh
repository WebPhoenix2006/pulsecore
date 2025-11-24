#!/bin/bash
# Database Backup Script for PulseCore

BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pulsecore_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting database backup..."

# Backup database
docker-compose exec -T db pg_dump -U postgres pulsecore > $BACKUP_FILE

if [ $? -eq 0 ]; then
    # Compress backup
    gzip $BACKUP_FILE
    echo "Backup completed successfully: ${BACKUP_FILE}.gz"

    # Keep only last 7 days of backups
    find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
    echo "Old backups cleaned up (keeping last 7 days)"

    # Display backup size
    ls -lh "${BACKUP_FILE}.gz"
else
    echo "Backup failed!"
    exit 1
fi
