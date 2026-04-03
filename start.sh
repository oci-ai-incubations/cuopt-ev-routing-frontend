#!/bin/bash

# cuOPT Frontend Startup Script
# ==============================

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║          cuOPT Frontend - Startup Script                         ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Check if OCI config exists
if [ ! -f ~/.oci/config ]; then
    echo "❌ ERROR: OCI config file not found at ~/.oci/config"
    echo ""
    echo "Please configure OCI CLI first:"
    echo "  oci setup config"
    echo ""
    exit 1
fi

echo "✅ OCI config found"

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
echo "🚀 Starting cuOPT Frontend..."
echo ""
echo "   Frontend:  http://localhost:5173"
echo "   Server:    http://localhost:3001"
echo ""
echo "   cuOPT API: https://cuopt-2-cuopt.137-131-27-21.nip.io"
echo "   GenAI:     https://inference.generativeai.us-phoenix-1.oci.oraclecloud.com"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start both frontend and server
npm run start
