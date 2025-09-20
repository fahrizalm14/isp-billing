#!/bin/sh

# Start WireGuard client
echo "🟢 Starting WireGuard..."
wg-quick up /app/wg0.conf

# Run Next.js development server
echo "🚀 Starting Next.js..."
npm run dev
