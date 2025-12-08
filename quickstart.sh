#!/bin/bash

# Livelo Promotion Tracker - Quick Start Script

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║     LIVELO PROMOTION TRACKER - QUICK START SETUP          ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --cache /tmp/npm-cache
    echo ""
fi

# Check if config.json has been updated
if grep -q "+5511999999999" config.json; then
    echo "⚠️  WARNING: Please update your phone number in config.json"
    echo ""
    echo "   Edit config.json and replace +5511999999999 with your actual number"
    echo "   Format: +55 11 99999-9999 (with country code)"
    echo ""
    read -p "   Press Enter after updating config.json, or Ctrl+C to exit..."
    echo ""
fi

echo "🚀 Starting Livelo Promotion Tracker..."
echo ""
echo "📱 IMPORTANT: You will need to scan a QR code with your phone"
echo "   1. Open WhatsApp on your phone"
echo "   2. Go to Settings → Linked Devices"
echo "   3. Tap 'Link a Device'"
echo "   4. Scan the QR code that appears below"
echo ""
read -p "Press Enter to continue..."
echo ""

# Start the application
npm start -- --run-now
