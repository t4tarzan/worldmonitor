#!/bin/bash

echo "🚀 WorldMonitor Onboarding - Localhost Setup"
echo "=============================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed!"
    echo ""
else
    echo "✅ Dependencies already installed"
    echo ""
fi

# Check if the new dependencies are installed
if [ ! -d "node_modules/@stripe/stripe-js" ]; then
    echo "📦 Installing new onboarding dependencies..."
    npm install
    echo "✅ New dependencies installed!"
    echo ""
fi

echo "🔧 Starting development server..."
echo ""
echo "📍 Landing page: http://localhost:5173/landing.html"
echo "📍 Dashboard: http://localhost:5173/"
echo ""
echo "🎯 Click 'Get My Monitor' on the landing page to test onboarding!"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
