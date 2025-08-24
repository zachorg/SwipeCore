# PowerShell script to rebuild iOS project with simplified configuration
Write-Host "🔧 Rebuilding iOS project with simplified configuration..." -ForegroundColor Green

# Change to project root
Set-Location $PSScriptRoot/..

# Clean and sync Capacitor
Write-Host "📱 Cleaning Capacitor..." -ForegroundColor Yellow
npx cap clean ios

Write-Host "🔄 Syncing Capacitor..." -ForegroundColor Yellow
npx cap sync ios

# Change to iOS directory
Set-Location "ios/App"

# Clean CocoaPods
if (Test-Path "Pods") {
    Write-Host "🧹 Cleaning CocoaPods..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "Pods"
}

if (Test-Path "Podfile.lock") {
    Remove-Item "Podfile.lock"
}

# Clean Xcode build artifacts
if (Test-Path "build") {
    Write-Host "🧹 Cleaning Xcode build..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "build"
}

# Reinstall CocoaPods
Write-Host "📦 Installing CocoaPods..." -ForegroundColor Yellow
try {
    pod install
    Write-Host "✅ CocoaPods installed successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  pod command not available, please run 'pod install' manually" -ForegroundColor Yellow
}

Write-Host "✅ iOS project rebuilt with simplified configuration!" -ForegroundColor Green
Write-Host "📱 Now open App.xcworkspace in Xcode and build the project" -ForegroundColor Cyan
Write-Host "💡 The UIApplicationMain crash should be resolved" -ForegroundColor Green

# Return to original directory
Set-Location "../.."
