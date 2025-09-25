# iPhone Image Scaler

A script to automatically scale images for different iPhone screen sizes, creating optimized versions for all iPhone models from the original iPhone 4 to the latest iPhone 16 Pro Max.

## Features

- 🎯 **Comprehensive iPhone Support**: Covers all iPhone sizes from 3.5" to 6.9"
- 📱 **Proper Scaling**: Uses @1x, @2x, and @3x scaling factors
- 🖼️ **Multiple Formats**: Supports JPG, PNG, WebP, TIFF, and BMP
- 📁 **Batch Processing**: Processes entire folders of images
- 🎨 **Smart Resizing**: Maintains aspect ratios while fitting screen dimensions
- 📊 **Organized Output**: Creates structured folders for each iPhone size

## Supported iPhone Sizes

| Screen Size | Models                     | Scale | Dimensions | Suffix |
| ----------- | -------------------------- | ----- | ---------- | ------ |
| 3.5"        | iPhone 4/4S                | @1x   | 320×480    | @1x    |
| 4"          | iPhone 5/5S/5C/SE          | @2x   | 640×1136   | @2x    |
| 4.7"        | iPhone 6/6S/7/8/SE2/SE3    | @2x   | 750×1334   | @2x    |
| 5.5"        | iPhone 6/6S/7/8 Plus       | @3x   | 1242×2208  | @3x    |
| 5.4"        | iPhone 12/13 mini          | @3x   | 1080×2340  | @3x    |
| 6.1"        | iPhone 12/13/14/15         | @3x   | 1170×2532  | @3x    |
| 6.3"        | iPhone 15 Plus             | @3x   | 1290×2796  | @3x    |
| 6.7"        | iPhone 12/13/14/15 Pro Max | @3x   | 1284×2778  | @3x    |
| 6.9"        | iPhone 16 Pro Max          | @3x   | 1320×2868  | @3x    |

## Installation

### Option 1: Node.js Version (Recommended)

1. Navigate to the scripts directory:

   ```bash
   cd swipecore/scripts
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Option 2: PowerShell Version

Install ImageMagick:

- Download from: https://imagemagick.org/script/download.php#windows
- Ensure it's added to your system PATH

## Usage

### Node.js Version

```bash
# Basic usage
node scale-images-for-iphone.js ./images

# Specify custom output folder
node scale-images-for-iphone.js ./images ./output

# Using npm script
npm run scale ./images
```

### PowerShell Version

```powershell
# Basic usage
.\scale-images-for-iphone.ps1 -InputFolder ".\images"

# Specify custom output folder
.\scale-images-for-iphone.ps1 -InputFolder ".\images" -OutputFolder ".\output"
```

## Output Structure

The script creates an organized folder structure:

```
scaled-images/
├── 3.5"/
│   ├── image1@1x.jpg
│   ├── image2@1x.jpg
│   └── ...
├── 4"/
│   ├── image1@2x.jpg
│   ├── image2@2x.jpg
│   └── ...
├── 4.7"/
│   ├── image1@2x.jpg
│   ├── image2@2x.jpg
│   └── ...
└── ... (other iPhone sizes)
```

## How It Works

1. **Input Processing**: Scans the input folder for supported image formats
2. **Dimension Calculation**: Calculates optimal dimensions for each iPhone size while maintaining aspect ratio
3. **Smart Scaling**: Uses the appropriate scale factor (@1x, @2x, @3x) for each iPhone model
4. **Quality Optimization**: Outputs JPEG images with 90% quality for optimal file size/quality balance
5. **Organized Output**: Creates separate folders for each iPhone size with properly named files

## Scaling Logic

- **Aspect Ratio Preservation**: Images maintain their original aspect ratio
- **Screen Fitting**: Images are scaled to fit within the target screen dimensions
- **Scale Factors**: Uses Apple's standard @1x, @2x, @3x scaling system
- **Quality**: High-quality JPEG output (90% quality) for optimal mobile performance

## Examples

### Process a single folder:

```bash
node scale-images-for-iphone.js ./my-images
```

### Process with custom output:

```bash
node scale-images-for-iphone.js "C:/My Photos" "./iPhone Images"
```

### PowerShell with custom output:

```powershell
.\scale-images-for-iphone.ps1 -InputFolder "C:\My Photos" -OutputFolder ".\iPhone Images"
```

## Supported Image Formats

- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **WebP** (.webp)
- **TIFF** (.tiff)
- **BMP** (.bmp)

## Requirements

### Node.js Version

- Node.js 14+
- Sharp library (installed via npm)

### PowerShell Version

- PowerShell 5.1+
- ImageMagick (installed and in PATH)

## Troubleshooting

### Common Issues

1. **"Sharp not found"**: Run `npm install` in the scripts directory
2. **"ImageMagick not found"**: Install ImageMagick and add to PATH
3. **Permission errors**: Ensure write permissions for output directory
4. **Large files**: The script handles large images automatically

### Performance Tips

- Process images in batches for large collections
- Use SSD storage for better performance
- Close other image editing software while running

## License

MIT License - Feel free to modify and distribute as needed.
