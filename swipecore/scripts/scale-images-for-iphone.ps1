# iPhone Image Scaler - PowerShell Version
# Scales images to accommodate different iPhone screen sizes

param(
    [Parameter(Mandatory=$true)]
    [string]$InputFolder,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFolder = "scaled-images"
)

# iPhone screen configurations
$iPhoneConfigs = @{
    "3.5" = @{
        Name = "iPhone 4/4S"
        Suffix = "@1x"
        Width = 640
        Height = 920
    }
    "4" = @{
        Name = "iPhone 5/5S/5C/SE"
        Suffix = "@2x"
        Width = 640
        Height = 1136
    }
    "4.7" = @{
        Name = "iPhone 6/6S/7/8/SE2/SE3"
        Suffix = "@2x"
        Width = 750
        Height = 1334
    }
    "5.5" = @{
        Name = "iPhone 6/6S/7/8 Plus"
        Suffix = "@3x"
        Width = 1242
        Height = 2208
    }
    "6.1" = @{
        Name = "iPhone 12/13/14/15"
        Suffix = "@3x"
        Width = 1170
        Height = 2532
    }
    "6.3" = @{
        Name = "iPhone 15 Plus"
        Suffix = "@3x"
        Width = 1290
        Height = 2796
    }
    "6.5" = @{
        Name = "iPhone 12/13/14/15 Pro Max"
        Suffix = "@3x"
        Width = 1242
        Height = 2688
    }
    "6.9" = @{
        Name = "iPhone 16 Pro Max"
        Suffix = "@3x"
        Width = 1320
        Height = 2868
    }
}

# Supported image formats
$SupportedFormats = @(".jpg", ".jpeg", ".png", ".webp", ".tiff", ".bmp")

function Show-Usage {
    Write-Host @"
📱 iPhone Image Scaler - PowerShell Version

Usage: .\scale-images-for-iphone.ps1 -InputFolder <path> [-OutputFolder <path>]

Parameters:
  -InputFolder    Path to folder containing images to scale
  -OutputFolder   Path to output folder (optional, defaults to 'scaled-images')

Examples:
  .\scale-images-for-iphone.ps1 -InputFolder ".\images"
  .\scale-images-for-iphone.ps1 -InputFolder ".\images" -OutputFolder ".\output"
  .\scale-images-for-iphone.ps1 -InputFolder "C:\My Images" -OutputFolder ".\iPhone Images"

Supported formats: JPG, PNG, WebP, TIFF, BMP

Note: This script requires ImageMagick to be installed and available in PATH.
Download from: https://imagemagick.org/script/download.php#windows
"@
}

function Test-ImageMagick {
    try {
        $null = Get-Command magick -ErrorAction Stop
        return $true
    }
    catch {
        Write-Host "❌ ImageMagick not found. Please install ImageMagick and ensure it's in your PATH." -ForegroundColor Red
        Write-Host "Download from: https://imagemagick.org/script/download.php#windows" -ForegroundColor Yellow
        return $false
    }
}

function Get-ImageFiles {
    param([string]$Folder)
    
    if (-not (Test-Path $Folder)) {
        throw "Input folder does not exist: $Folder"
    }
    
    $files = Get-ChildItem -Path $Folder -File
    $imageFiles = $files | Where-Object { 
        $SupportedFormats -contains $_.Extension.ToLower() 
    }
    
    return $imageFiles
}

function New-OutputDirectories {
    param([string]$OutputFolder)
    
    # Create main output directory
    if (-not (Test-Path $OutputFolder)) {
        New-Item -ItemType Directory -Path $OutputFolder -Force | Out-Null
    }
    
    # Create subdirectories for each iPhone size
    foreach ($size in $iPhoneConfigs.Keys) {
        $sizeDir = Join-Path $OutputFolder $size
        if (-not (Test-Path $sizeDir)) {
            New-Item -ItemType Directory -Path $sizeDir -Force | Out-Null
        }
    }
}

function Resize-Image {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [hashtable]$Config
    )
    
    try {
        # Get image dimensions using ImageMagick
        $identifyOutput = & magick identify -format "%wx%h" $InputPath 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to identify image dimensions"
        }
        
        $originalDimensions = $identifyOutput -split 'x'
        $originalWidth = [int]$originalDimensions[0]
        $originalHeight = [int]$originalDimensions[1]
        
        # Calculate scale factor based on original image vs target resolution
        $scaleX = $Config.Width / $originalWidth
        $scaleY = $Config.Height / $originalHeight
        $scale = [Math]::Min($scaleX, $scaleY) # Use the smaller scale to fit within bounds
        
        # Calculate new dimensions
        $newWidth = [Math]::Round($originalWidth * $scale)
        $newHeight = [Math]::Round($originalHeight * $scale)
        
        # Resize image using ImageMagick
        & magick $InputPath -resize "${newWidth}x${newHeight}>" -quality 90 $OutputPath 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            $fileName = Split-Path $InputPath -Leaf
            Write-Host "✓ Scaled $fileName to $($Config.Name) ($newWidth x $newHeight) [scale: $($scale.ToString('F3'))]" -ForegroundColor Green
        } else {
            throw "ImageMagick resize failed"
        }
    }
    catch {
        $fileName = Split-Path $InputPath -Leaf
        Write-Host "✗ Error scaling $fileName : $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Show-Summary {
    param([array]$ImageFiles, [string]$OutputFolder)
    
    Write-Host "`n🎉 Image scaling completed!" -ForegroundColor Green
    Write-Host "`n📱 Generated images for iPhone sizes:" -ForegroundColor Cyan
    
    foreach ($size in $iPhoneConfigs.Keys) {
        $config = $iPhoneConfigs[$size]
        Write-Host "  $size`" ($($config.Name)): $($config.Width)x$($config.Height) $($config.Suffix)" -ForegroundColor White
    }
    
    Write-Host "`n📁 Output structure:" -ForegroundColor Cyan
    Write-Host "  $OutputFolder\" -ForegroundColor White
    
    foreach ($size in $iPhoneConfigs.Keys) {
        Write-Host "  ├── $size`"\" -ForegroundColor White
        if ($ImageFiles.Count -gt 0) {
            $baseName = [System.IO.Path]::GetFileNameWithoutExtension($ImageFiles[0].Name)
            Write-Host "  │   ├── ${baseName}@1x.jpg" -ForegroundColor Gray
            Write-Host "  │   ├── ${baseName}@2x.jpg" -ForegroundColor Gray
            Write-Host "  │   └── ${baseName}@3x.jpg" -ForegroundColor Gray
        }
    }
}

# Main execution
try {
    # Check if ImageMagick is available
    if (-not (Test-ImageMagick)) {
        exit 1
    }
    
    # Get image files
    $imageFiles = Get-ImageFiles -Folder $InputFolder
    
    if ($imageFiles.Count -eq 0) {
        Write-Host "No supported image files found in the input folder." -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host "Found $($imageFiles.Count) image(s) to process..." -ForegroundColor Cyan
    
    # Create output directories
    New-OutputDirectories -OutputFolder $OutputFolder
    
    # Process each image for each iPhone size
    foreach ($imageFile in $imageFiles) {
        $inputPath = $imageFile.FullName
        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($imageFile.Name)
        
        foreach ($size in $iPhoneConfigs.Keys) {
            $config = $iPhoneConfigs[$size]
            $outputFileName = "${baseName}$($config.Suffix).jpg"
            $outputPath = Join-Path $OutputFolder $size $outputFileName
            
            Resize-Image -InputPath $inputPath -OutputPath $outputPath -Config $config
        }
    }
    
    # Show summary
    Show-Summary -ImageFiles $imageFiles -OutputFolder $OutputFolder
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
