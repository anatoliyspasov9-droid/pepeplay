#!/bin/bash

echo "🚀 Starting PEPE Play Application..."
echo ""

# Check if .env is configured
if ! grep -q "your_" .env; then
  echo "✅ Environment variables configured"
else
  echo "⚠️  WARNING: Please configure your .env file first!"
  echo "   Required: SUPABASE_SERVICE_ROLE_KEY and OXAPAY_MERCHANT_API_KEY"
  echo ""
fi

# Start backend
echo "📡 Starting backend server..."
node server.js &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 2

# Start frontend
echo "🎨 Starting frontend..."
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
