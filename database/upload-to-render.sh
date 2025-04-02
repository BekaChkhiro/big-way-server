#!/bin/bash

# Database connection details
DB_HOST="dpg-cvmhjfogjchc73d3qhag-a"
DB_PORT="5432"
DB_NAME="big_way_main"
DB_USER="big_way_main_user"
DB_PASSWORD="EV1I0ber4F9YewNwz6ojKN2FSQrZuoqq"

# Path to the SQL dump file
DUMP_FILE="./full-dump.sql"

# Check if the dump file exists
if [ ! -f "$DUMP_FILE" ]; then
    echo "Error: SQL dump file not found at $DUMP_FILE"
    exit 1
fi

echo "Attempting to connect to Render.com database..."
echo "Host: $DB_HOST"
echo "Database: $DB_NAME"
echo "User: $DB_USER"

# Try to upload the SQL dump using psql
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DUMP_FILE" -v sslmode=require

# Check the exit status
if [ $? -eq 0 ]; then
    echo "Database upload completed successfully!"
else
    echo "Error uploading database. Please check the connection details and try again."
    echo "If you're having connection issues, try these alternatives:"
    echo "1. Use pgAdmin to connect to the database"
    echo "2. Upload the SQL file through Render.com's dashboard"
    echo "3. Deploy your application to Render.com and run the import script from there"
fi
