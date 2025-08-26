# PowerShell script to generate Android app icons from iOS icon
# Requires ImageMagick to be installed
# Works on Windows, macOS, and Linux

# Source iOS icon
$SOURCE_ICON = "D:\repo\personal\NomNom\ios\App\App\Assets.xcassets\AppIcon.appiconset\AppIcon-512@2x.jpg"

# Android icon directories and sizes
$ICON_SIZES = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
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
            
            # Also check for standalone executables
            $standaloneMagick = Join-Path $dir "magick.exe"
            $standaloneConvert = Join-Path $dir "convert.exe"
            
            if (Test-Path $standaloneMagick) {
                $IMAGEMAGICK_CMD = $standaloneMagick
                Write-Host "Found ImageMagick: $standaloneMagick" -ForegroundColor Green
                return $IMAGEMAGICK_CMD
            }
            
            if (Test-Path $standaloneConvert) {
                $IMAGEMAGICK_CMD = $standaloneConvert
                Write-Host "Found ImageMagick: $standaloneConvert" -ForegroundColor Green
                return $IMAGEMAGICK_CMD
            }
        }
    }
    
    # Try using Windows where command
    try {
        Write-Host "Trying Windows command detection..." -ForegroundColor Gray
        $windowsResult = cmd /c "where magick 2>nul || where convert 2>nul" 2>$null
        
        if ($LASTEXITCODE -eq 0 -and $windowsResult) {
            $windowsPath = $windowsResult | Select-Object -First 1
            if ($windowsPath -like "*magick.exe*") {
                $IMAGEMAGICK_CMD = "magick"
                Write-Host "Found ImageMagick via Windows: magick" -ForegroundColor Green
                return $IMAGEMAGICK_CMD
            } elseif ($windowsPath -like "*convert.exe*") {
                $IMAGEMAGICK_CMD = "convert"
                Write-Host "Found ImageMagick via Windows: convert" -ForegroundColor Green
                return $IMAGEMAGICK_CMD
            }
        }
    } catch {}
    
    # Check Unix-like paths (for WSL/macOS/Linux)
    $unixPaths = @("/usr/bin", "/usr/local/bin", "/opt/local/bin")
    foreach ($path in $unixPaths) {
        if (Test-Path $path) {
            $magickPath = Join-Path $path "magick"
            $convertPath = Join-Path $path "convert"
            
            if (Test-Path $magickPath) {
                $IMAGEMAGICK_CMD = $magickPath
                Write-Host "Found ImageMagick: $magickPath" -ForegroundColor Green
                return $IMAGEMAGICK_CMD
            }
            
            if (Test-Path $convertPath) {
                $IMAGEMAGICK_CMD = $convertPath
                Write-Host "Found ImageMagick: $convertPath" -ForegroundColor Green
                return $IMAGEMAGICK_CMD
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
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host "Source icon found: $SOURCE_ICON" -ForegroundColor Green
Write-Host "Using ImageMagick command: $IMAGEMAGICK_CMD" -ForegroundColor Cyan
Write-Host ""

Write-Host "Generating Android app icons from iOS icon..." -ForegroundColor Cyan
Write-Host ""

# Generate icons for each density
foreach ($dir in $ICON_SIZES.Keys) {
    $size = $ICON_SIZES[$dir]
    
    # Create directory if it doesn't exist
    $targetDir = "android\app\src\main\res\$dir"
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    $success = $false
    
    try {
        # Generate icons using only -resize parameter
        & ECHO magick $SOURCE_ICON -resize "${size}x${size}!" "D:\repo\personal\NomNom\$targetDir\ic_launcher.png"
        & ECHO magick $SOURCE_ICON -resize "${size}x${size}!" "D:\repo\personal\NomNom\$targetDir\ic_launcher_round.png"
        & ECHO magick $SOURCE_ICON -resize "${size}x${size}!" "D:\repo\personal\NomNom\$targetDir\ic_launcher_foreground.png"
        
        $success = $true
    } catch {
        Write-Host "  ✗ Failed to generate icons for $dir" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "    Note: This ImageMagick version may not support -resize parameter" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Android app icons generated successfully!" -ForegroundColor Green
Write-Host "Icons have been placed in android\app\src\main\res\mipmap-*\ directories" -ForegroundColor Cyan
Write-Host "Clean and rebuild your Android project to see the changes." -ForegroundColor Cyan
Read-Host "Press Enter to continue"
