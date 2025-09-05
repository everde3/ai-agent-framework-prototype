#!/bin/bash

echo "🚀 Starting AI Agent Framework Development Environment..."
echo "🔧 Building shared packages first..."
pnpm build --filter="@repo/shared-*"

echo "🌐 Starting API server..."
pnpm --filter @repo/api dev &
API_PID=$!

# Wait a bit for the API to start
sleep 3

echo "🎨 Starting web application..."
pnpm --filter @repo/web dev &
WEB_PID=$!

echo ""
echo "✅ Development servers started!"
echo "📊 API Health: http://localhost:3001/health"  
echo "🌐 Web App: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    kill $API_PID 2>/dev/null
    kill $WEB_PID 2>/dev/null
    wait
    echo "✅ All servers stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for background processes
wait