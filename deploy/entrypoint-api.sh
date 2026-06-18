#!/bin/sh
set -eu

echo "Starting miniou API..."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

if [ -z "${JWT_SECRET:-}" ]; then
  echo "ERROR: JWT_SECRET is not set"
  exit 1
fi

if [ -z "${CORSAIR_KEK:-}" ]; then
  echo "ERROR: CORSAIR_KEK is not set"
  exit 1
fi

echo "Running database migrations..."
cd /app/packages/database
./node_modules/.bin/drizzle-kit migrate

echo "Starting HTTP server on port ${PORT:-8000}..."
cd /app/apps/api
exec node dist/index.js
