#!/bin/bash

# Android build script for SwipeApp
# Usage: ./scripts/build-android.sh [--release]

set -e

echo "🤖 Building Android app..."

# Check if Android platform exists
if [ ! -d "android" ]; then
    echo "📱 Adding Android platform..."
    npx cap add android
fi

# Build the web app
echo "🔨 Building web app..."
npm run build

# Sync to native platform
echo "🔄 Syncing to Android..."
npx cap sync android

# Build based on mode
if [ "$1" = "--release" ]; then
    echo "🚀 Building release APK..."
    cd android
    ./gradlew assembleRelease
    echo "✅ Release APK built: android/app/build/outputs/apk/release/app-release.apk"
else
    echo "🛠️  Building debug APK..."
    cd android
    ./gradlew assembleDebug
    echo "✅ Debug APK built: android/app/build/outputs/apk/debug/app-debug.apk"
fi

echo "🎉 Android build complete!"