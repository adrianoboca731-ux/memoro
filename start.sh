#!/bin/sh
# Render start script for Next.js standalone
# Copies static assets to the standalone directory

echo "Copying static assets..."

# Copy .next/static to standalone/.next/static
cp -r .next/static .next/standalone/.next/static

# Copy public to standalone/public (if exists)
if [ -d "public" ]; then
  cp -r public .next/standalone/public
fi

echo "Starting server..."
NODE_ENV=production node .next/standalone/server.js
