#!/bin/sh
set -eu

echo "Starting miniou API..."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

echo "Running database migrations..."
cd /app/packages/database
pnpm exec drizzle-kit migrate

echo "Starting HTTP server..."
cd /app
exec pnpm --filter @repo/api start
