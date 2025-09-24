# PowerShell script to generate app icons for both Android and iOS
# Requires ImageMagick to be installed
# Works on Windows, macOS, and Linux

# Source icon (using the existing icon.png as base)
$SOURCE_ICON = "assets\images\icon.png"

# Android icon directories and sizes
$ANDROID_ICON_SIZES = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

# iOS icon sizes (for AppIcon.appiconset)
$IOS_ICON_SIZES = @{
    "AppIcon-20@2x.png" = 40
    "AppIcon-20@3x.png" = 60
    "AppIcon-29@2x.png" = 58
    "AppIcon-29@3x.png" = 87
    "AppIcon-40@2x.png" = 80
    "AppIcon-40@3x.png" = 120
    "AppIcon-60@2x.png" = 120
    "AppIcon-60@3x.png" = 180
    "AppIcon-76@2x.png" = 152
    "AppIcon-83.5@2x.png" = 167
    "AppIcon-1024.png" = 1024
}

# Function to find ImageMagick
function Find-ImageMagick {
    $IMAGEMAGICK_CMD = $null
    
    Write-Host "Searching for ImageMagick..." -ForegroundColor Cyan
    
    # Check for magick command (ImageMagick 7+)
    try {
        $magickPath = Get-Command "magick" -ErrorAction SilentlyContinue
        if ($magickPath) {
            $IMAGEMAGICK_CMD = "magick"
            Write-Host "Found ImageMagick: magick" -ForegroundColor Green
            return $IMAGEMAGICK_CMD
        }
    } catch {}
    
    # Check for convert command (ImageMagick 6)
    try {
        $convertPath = Get-Command "convert" -ErrorAction SilentlyContinue
        if ($convertPath) {
            $IMAGEMAGICK_CMD = "convert"
            Write-Host "Found ImageMagick: convert" -ForegroundColor Green
            return $IMAGEMAGICK_CMD
        }
    } catch {}
    
    # Try to run the commands directly to see if they exist
    try {
        $null = & magick --version 2>$null
        $IMAGEMAGICK_CMD = "magick"
        Write-Host "Found ImageMagick: magick (direct execution)" -ForegroundColor Green
        return $IMAGEMAGICK_CMD
    } catch {}
    
    try {
        $null = & convert --version 2>$null
        $IMAGEMAGICK_CMD = "convert"
        Write-Host "Found ImageMagick: convert (direct execution)" -ForegroundColor Green
        return $IMAGEMAGICK_CMD
    } catch {}
    
    # Check common Windows installation paths
    $programDirs = @("C:\Program Files", "C:\Program Files (x86)")
    
    foreach ($dir in $programDirs) {
        if (Test-Path $dir) {
            Write-Host "Checking directory: $dir" -ForegroundColor Gray
            
            # Look for ImageMagick directories
            $magickDirs = Get-ChildItem -Path $dir -Name "ImageMagick-*" -ErrorAction SilentlyContinue
            foreach ($magickDir in $magickDirs) {
                $fullPath = Join-Path $dir $magickDir
                Write-Host "Found ImageMagick directory: $fullPath" -ForegroundColor Gray
                
                $magickExe = Join-Path $fullPath "magick.exe"
                $convertExe = Join-Path $fullPath "convert.exe"
                
                if (Test-Path $magickExe) {
                    $IMAGEMAGICK_CMD = $magickExe
                    Write-Host "Found ImageMagick: $magickExe" -ForegroundColor Green
                    return $IMAGEMAGICK_CMD
                }
                
                if (Test-Path $convertExe) {
                    $IMAGEMAGICK_CMD = $convertExe
                    Write-Host "Found ImageMagick: $convertExe" -ForegroundColor Green
                    return $IMAGEMAGICK_CMD
                }
            }
        }
    }
    
    return $null
}

# Check if ImageMagick is installed
$IMAGEMAGICK_CMD = Find-ImageMagick

if (-not $IMAGEMAGICK_CMD) {
    Write-Host "Error: ImageMagick is not installed or not found in PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install ImageMagick:" -ForegroundColor Yellow
    Write-Host "On Windows: choco install imagemagick" -ForegroundColor White
    Write-Host "On macOS: brew install imagemagick" -ForegroundColor White
    Write-Host "On Ubuntu: sudo apt-get install imagemagick" -ForegroundColor White
    Write-Host ""
    Write-Host "After installation, make sure to restart your terminal." -ForegroundColor Yellow
    Read-Host "Press Enter to continue"
    exit 1
}

# Check if source icon exists
if (-not (Test-Path $SOURCE_ICON)) {
    Write-Host "Error: Source icon not found at $SOURCE_ICON" -ForegroundColor Red
    Write-Host "Please ensure you have an icon.png file in the assets/images directory." -ForegroundColor Yellow
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host "Source icon found: $SOURCE_ICON" -ForegroundColor Green
Write-Host "Using ImageMagick command: $IMAGEMAGICK_CMD" -ForegroundColor Cyan
Write-Host ""

# Generate Android icons
Write-Host "Generating Android app icons..." -ForegroundColor Cyan
Write-Host ""

foreach ($dir in $ANDROID_ICON_SIZES.Keys) {
    $size = $ANDROID_ICON_SIZES[$dir]
    
    # Create directory if it doesn't exist
    $targetDir = "android\app\src\main\res\$dir"
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        Write-Host "Created directory: $targetDir" -ForegroundColor Gray
    }
    
    try {
        # Generate standard launcher icon
        & $IMAGEMAGICK_CMD $SOURCE_ICON -resize "${size}x${size}!" "$targetDir\ic_launcher.png"
        Write-Host "  ✓ Generated $targetDir\ic_launcher.png (${size}x${size})" -ForegroundColor Green
        
        # Generate round launcher icon
        & $IMAGEMAGICK_CMD $SOURCE_ICON -resize "${size}x${size}!" "$targetDir\ic_launcher_round.png"
        Write-Host "  ✓ Generated $targetDir\ic_launcher_round.png (${size}x${size})" -ForegroundColor Green
        
        # Generate foreground icon for adaptive icons
        & $IMAGEMAGICK_CMD $SOURCE_ICON -resize "${size}x${size}!" "$targetDir\ic_launcher_foreground.png"
        Write-Host "  ✓ Generated $targetDir\ic_launcher_foreground.png (${size}x${size})" -ForegroundColor Green
        
    } catch {
        Write-Host "  ✗ Failed to generate icons for $dir" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Generating iOS app icons..." -ForegroundColor Cyan
Write-Host ""

# Create iOS AppIcon.appiconset directory
$iosTargetDir = "ios\App\App\Assets.xcassets\AppIcon.appiconset"
if (-not (Test-Path $iosTargetDir)) {
    New-Item -ItemType Directory -Path $iosTargetDir -Force | Out-Null
    Write-Host "Created directory: $iosTargetDir" -ForegroundColor Gray
}

# Generate iOS icons
foreach ($filename in $IOS_ICON_SIZES.Keys) {
    $size = $IOS_ICON_SIZES[$filename]
    
    try {
        & $IMAGEMAGICK_CMD $SOURCE_ICON -resize "${size}x${size}!" "$iosTargetDir\$filename"
        Write-Host "  ✓ Generated $iosTargetDir\$filename (${size}x${size})" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed to generate $filename" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Create Contents.json for iOS AppIcon.appiconset
$contentsJson = @"
{
  "images" : [
    {
      "filename" : "AppIcon-20@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "20x20"
    },
    {
      "filename" : "AppIcon-20@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "20x20"
    },
    {
      "filename" : "AppIcon-29@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "29x29"
    },
    {
      "filename" : "AppIcon-29@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "29x29"
    },
    {
      "filename" : "AppIcon-40@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "40x40"
    },
    {
      "filename" : "AppIcon-40@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "40x40"
    },
    {
      "filename" : "AppIcon-60@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "60x60"
    },
    {
      "filename" : "AppIcon-60@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "60x60"
    },
    {
      "filename" : "AppIcon-76@2x.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "76x76"
    },
    {
      "filename" : "AppIcon-83.5@2x.png",
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "83.5x83.5"
    },
    {
      "filename" : "AppIcon-1024.png",
      "idiom" : "ios-marketing",
      "scale" : "1x",
      "size" : "1024x1024"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
"@

$contentsJson | Out-File -FilePath "$iosTargetDir\Contents.json" -Encoding UTF8
Write-Host "  ✓ Generated $iosTargetDir\Contents.json" -ForegroundColor Green

Write-Host ""
Write-Host "App icons generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Android icons placed in:" -ForegroundColor Cyan
Write-Host "  android\app\src\main\res\mipmap-*\ directories" -ForegroundColor White
Write-Host ""
Write-Host "iOS icons placed in:" -ForegroundColor Cyan
Write-Host "  ios\App\App\Assets.xcassets\AppIcon.appiconset\" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Clean and rebuild your Android project to see the changes" -ForegroundColor White
Write-Host "2. Clean and rebuild your iOS project to see the changes" -ForegroundColor White
Write-Host "3. Test on both platforms to ensure icons display correctly" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue"
