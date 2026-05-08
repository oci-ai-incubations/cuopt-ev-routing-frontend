#!/bin/bash

# cuOPT Frontend - Local dev startup script
# ============================================================================
# This script just starts the Vite dev server. The legacy Express backend was
# retired in phase 5 of the auth-integration epic; backend lives in the
# cuopt-ev-routing-backend repo (FastAPI) and the auth service in
# accelerator-pack-auth-service.
#
# Vite's proxy expects:
#   - accelerator-pack-auth-service on http://localhost:8080  (override via VITE_AUTH_HOST)
#   - cuopt-ev-routing-backend     on http://localhost:8081  (override via VITE_CUOPT_BACKEND_URL)
#
# Run those two services in separate terminals first, then start this one.

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║          cuOPT Frontend - Dev Startup                            ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed"
    exit 1
fi

echo "✅ Node.js: $(node -v)"

# Change to project directory
cd "$(dirname "$0")"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "🚀 Starting cuOPT Frontend (Vite dev server)..."
echo ""
echo "   Frontend:                http://localhost:5173"
echo "   Expects /auth proxied to ${VITE_AUTH_HOST:-http://localhost:8080}"
echo "   Expects /api  proxied to ${VITE_CUOPT_BACKEND_URL:-http://localhost:8081}"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev
