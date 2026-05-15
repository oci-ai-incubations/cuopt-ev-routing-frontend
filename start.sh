#!/bin/bash
#
# Local dev startup for the Vite server. Expects two sibling services
# already running:
#   - accelerator-pack-auth-service on $VITE_AUTH_HOST (default :8080)
#   - cuopt-ev-routing-backend on $VITE_CUOPT_BACKEND_URL (default :8081)

set -euo pipefail

if ! command -v node > /dev/null; then
    echo "ERROR: Node.js is not installed" >&2
    exit 1
fi

echo "Node.js: $(node -v)"

cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Starting cuOPT Frontend (Vite dev server) on http://localhost:5173"
echo "  /auth proxied to ${VITE_AUTH_HOST:-http://localhost:8080}"
echo "  /api  proxied to ${VITE_CUOPT_BACKEND_URL:-http://localhost:8081}"

npm run dev
