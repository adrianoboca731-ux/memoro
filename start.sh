#!/bin/sh
# Render start script for Next.js standalone
set -e

echo "Copying static assets..."

# Copy .next/static to standalone/.next/static
cp -r .next/static .next/standalone/.next/static

# Copy public to standalone/public (if exists)
if [ -d "public" ]; then
  cp -r public .next/standalone/public
fi

echo "Starting server on 0.0.0.0:$PORT..."
HOSTNAME=0.0.0.0 NODE_ENV=production PORT=${PORT:-10000} node .next/standalone/server.js
