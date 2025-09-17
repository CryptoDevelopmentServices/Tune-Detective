#!/bin/bash
set -e

echo "🚀 Starting Tune Detective frontend container..."

OS=$(uname -s)
case "$OS" in
  Darwin*)
    echo "🖥 Detected macOS host → enabling iOS build support"
    # CocoaPods already installed in Dockerfile
    ;;
  Linux*)
    echo "🐧 Detected Linux host → Android builds only"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    echo "🪟 Detected Windows host → Android builds only"
    ;;
  *)
    echo "⚠️ Unknown OS: $OS, defaulting to Android only"
    ;;
esac

echo "📦 Installing dependencies..."
npm install

echo "📡 Starting Expo..."
exec npx expo start --tunnel
