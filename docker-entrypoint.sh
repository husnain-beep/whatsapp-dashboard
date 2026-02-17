#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting application..."
npx concurrently \
  "npx next start -H 0.0.0.0 -p ${PORT:-3000}" \
  "npx tsx src/workers/message-sender.worker.ts"
