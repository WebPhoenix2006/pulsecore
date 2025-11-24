#!/bin/bash
# Database Restore Script for PulseCore

if [ -z "$1" ]; then
    echo "Usage: ./restore-db.sh <backup-file.sql.gz>"
    echo "Example: ./restore-db.sh /home/ubuntu/backups/pulsecore_20241124_030000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "WARNING: This will overwrite the current database!"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo "Stopping backend services..."
docker-compose stop backend celery_worker celery_beat

echo "Restoring database..."
gunzip -c "$BACKUP_FILE" | docker-compose exec -T db psql -U postgres pulsecore

if [ $? -eq 0 ]; then
    echo "Database restored successfully!"
    echo "Starting services..."
    docker-compose up -d
else
    echo "Restore failed!"
    echo "Starting services anyway..."
    docker-compose up -d
    exit 1
fi
