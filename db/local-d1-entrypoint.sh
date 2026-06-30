#!/bin/sh
set -eu

DB_PATH="${D1_DB_PATH:-/data/news-aggr-d1.sqlite}"

mkdir -p "$(dirname "$DB_PATH")"
sqlite3 "$DB_PATH" < /app/schema.sql

echo "Local D1 SQLite database is ready at $DB_PATH"
tail -f /dev/null
