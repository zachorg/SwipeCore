# App Icon Generation

This directory contains scripts to generate app icons for both Android and iOS platforms from a single source image.

## Prerequisites

### Option 1: Node.js (Recommended)

- Node.js installed
- Sharp package (will be installed automatically with `npm install`)

### Option 2: ImageMagick

- ImageMagick installed on your system
- Available on Windows, macOS, and Linux

## Usage

### Method 1: Node.js Script (Cross-platform)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the icon generation script:
   ```bash
   npm run generate-icons
   ```

### Method 2: PowerShell Script (Windows)

1. Ensure ImageMagick is installed:

   ```powershell
   choco install imagemagick
   ```

2. Run the PowerShell script:

   ```bash
   npm run generate-icons-powershell
   ```

   Or directly:

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/generate-app-icons.ps1
   ```

## Source Image Requirements

- Place your source icon as `assets/images/icon.png`
- Recommended size: 1024x1024 pixels or larger
- Format: PNG (recommended) or JPG
- The image should be square for best results

## Generated Icons

### Android Icons

The script generates icons in the following directories:

- `android/app/src/main/res/mipmap-mdpi/` (48x48)
- `android/app/src/main/res/mipmap-hdpi/` (72x72)
- `android/app/src/main/res/mipmap-xhdpi/` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/` (192x192)

For each density, it creates:

- `ic_launcher.png` - Standard launcher icon
- `ic_launcher_round.png` - Round launcher icon
- `ic_launcher_foreground.png` - Foreground for adaptive icons

### iOS Icons

The script generates icons in:

- `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Including all required sizes:

- iPhone: 20@2x, 20@3x, 29@2x, 29@3x, 40@2x, 40@3x, 60@2x, 60@3x
- iPad: 76@2x, 83.5@2x
- App Store: 1024x1024

Plus a `Contents.json` file for Xcode.

## After Generation

1. **Android**: Clean and rebuild your Android project
2. **iOS**: Clean and rebuild your iOS project
3. Test on both platforms to ensure icons display correctly

## Troubleshooting

### Node.js Script Issues

- Ensure `sharp` package is installed: `npm install sharp`
- Check that the source image exists at `assets/images/icon.png`

### PowerShell Script Issues

- Verify ImageMagick is installed and accessible
- Check PowerShell execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Ensure the source image path is correct

### Icon Quality Issues

- Use a high-resolution source image (1024x1024 or larger)
- Ensure the source image is square
- Use PNG format for better quality
