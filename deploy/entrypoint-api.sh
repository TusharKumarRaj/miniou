#!/bin/sh
set -e

cd /app/packages/database
pnpm db:migrate

cd /app/apps/api
exec node dist/index.js
