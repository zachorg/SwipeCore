#!/bin/bash

# iOS build script for SwipeApp
# Usage: ./scripts/build-ios.sh [--release]
# Note: Requires macOS with Xcode installed

set -e

echo "🍎 Building iOS app..."

# Check if running on macOS
if [ "$(uname)" != "Darwin" ]; then
    echo "❌ iOS builds require macOS"
    exit 1
fi

# Check if iOS platform exists
if [ ! -d "ios" ]; then
    echo "📱 Adding iOS platform..."
    npx cap add ios
fi

# Build the web app
echo "🔨 Building web app..."
npm run build

# Sync to native platform
echo "🔄 Syncing to iOS..."
npx cap sync ios

# Build based on mode
if [ "$1" = "--release" ]; then
    echo "🚀 Building release IPA..."
    cd ios/App
    xcodebuild -workspace App.xcworkspace \
               -scheme App \
               -configuration Release \
               -archivePath App.xcarchive \
               archive
    
    xcodebuild -exportArchive \
               -archivePath App.xcarchive \
               -exportPath ./build \
               -exportOptionsPlist ../../scripts/ExportOptions.plist
    
    echo "✅ Release IPA built: ios/App/build/App.ipa"
else
    echo "🛠️  Opening in Xcode for debugging..."
    npx cap open ios
fi

echo "🎉 iOS build complete!"