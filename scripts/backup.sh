#!/bin/bash
set -e

# Set environment variables
export PGHOST=${PGHOST:-localhost}
export PGPORT=${PGPORT:-5432}
export PGDATABASE=${PGDATABASE:-alignzo}
export PGUSER=${PGUSER:-postgres}
export PGPASSWORD=${PGPASSWORD:-password}

# Set backup directory
BACKUP_DIR="/backups"
DATE=$(date +%Y-%m-%d-%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/$PGDATABASE-$DATE.sql"

# Create backup
pg_dump -Fc > "$BACKUP_FILE"

# Optional: Upload to S3
# aws s3 cp "$BACKUP_FILE" "s3://your-bucket-name/backups/"

echo "Backup created successfully: $BACKUP_FILE"
