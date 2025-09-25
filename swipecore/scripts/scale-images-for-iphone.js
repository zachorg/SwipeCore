#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// iPhone screen sizes and their corresponding image scaling factors
// Based on @1x, @2x, @3x scaling for different iPhone models
const IPHONE_CONFIGS = {
  3.5: {
    name: "iPhone 4/4S",
    suffix: "@1x",
    width: 640,
    height: 920,
  },
  4: {
    name: "iPhone 5/5S/5C/SE",
    suffix: "@2x",
    width: 640,
    height: 1096,
  },
  4.7: {
    name: "iPhone 6/6S/7/8/SE2/SE3",
    suffix: "@2x",
    width: 750,
    height: 1334,
  },
  5.5: {
    name: "iPhone 6/6S/7/8 Plus",
    suffix: "@3x",
    width: 1242,
    height: 2208,
  },
  6.1: {
    name: "iPhone 12/13/14/15",
    suffix: "@3x",
    width: 1125,
    height: 2436,
  },
  6.3: {
    name: "iPhone 15 Plus",
    suffix: "@3x",
    width: 1206,
    height: 2622,
  },
  6.5: {
    name: "iPhone 12/13/14/15 Pro Max",
    suffix: "@3x",
    width: 1242,
    height: 2688,
  },
  6.9: {
    name: "iPhone 16 Pro Max",
    suffix: "@3x",
    width: 1260,
    height: 2736,
  },
  13: {
    name: "iPad",
    suffix: "@3x",
    width: 2064,
    height: 2752,
  },
};

class ImageScaler {
  constructor(inputFolder, outputFolder) {
    this.inputFolder = inputFolder;
    this.outputFolder = outputFolder;
    this.supportedFormats = [".jpg", ".jpeg", ".png", ".webp", ".tiff", ".bmp"];
  }

  async createOutputDirectories() {
    // Create main output directory
    if (!fs.existsSync(this.outputFolder)) {
      fs.mkdirSync(this.outputFolder, { recursive: true });
    }

    // Create subdirectories for each iPhone size
    for (const size of Object.keys(IPHONE_CONFIGS)) {
      const sizeDir = path.join(this.outputFolder, size);
      if (!fs.existsSync(sizeDir)) {
        fs.mkdirSync(sizeDir, { recursive: true });
      }
    }
  }

  getImageFiles(folder) {
    const files = fs.readdirSync(folder);
    return files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return this.supportedFormats.includes(ext);
    });
  }

  async scaleImage(inputPath, outputPath, config) {
    try {
      const image = sharp(inputPath);

      await image
        .resize(config.width, config.height, {
          fit: "fill",
          withoutEnlargement: false,
        })
        .jpeg({ quality: 90 })
        .toFile(outputPath);

      console.log(
        `✓ Scaled ${path.basename(inputPath)} to ${config.name} (${Math.round(
          config.width
        )}x${config.height})`
      );
    } catch (error) {
      console.error(`✗ Error scaling ${inputPath}:`, error.message);
    }
  }

  async processFolder() {
    if (!fs.existsSync(this.inputFolder)) {
      throw new Error(`Input folder does not exist: ${this.inputFolder}`);
    }

    const imageFiles = this.getImageFiles(this.inputFolder);

    if (imageFiles.length === 0) {
      console.log("No supported image files found in the input folder.");
      return;
    }

    console.log(`Found ${imageFiles.length} image(s) to process...`);
    await this.createOutputDirectories();

    // Process each image for each iPhone size
    for (const imageFile of imageFiles) {
      const inputPath = path.join(this.inputFolder, imageFile);
      const baseName = path.parse(imageFile).name;
      const extension = ".jpg"; // Convert all to JPEG for consistency

      for (const [size, config] of Object.entries(IPHONE_CONFIGS)) {
        const outputFileName = `${baseName}${config.suffix}${extension}`;
        const outputPath = path.join(this.outputFolder, size, outputFileName);

        await this.scaleImage(inputPath, outputPath, config);
      }
    }

    console.log("\n🎉 Image scaling completed!");
    this.printSummary(imageFiles);
  }

  printSummary(imageFiles) {
    console.log("\n📱 Generated images for iPhone sizes:");
    for (const [size, config] of Object.entries(IPHONE_CONFIGS)) {
      console.log(
        `  ${size} (${config.name}): ${config.width}x${config.height} ${config.suffix}`
      );
    }

    console.log(`\n📁 Output structure:`);
    console.log(`  ${this.outputFolder}/`);
    for (const size of Object.keys(IPHONE_CONFIGS)) {
      console.log(`  ├── ${size}/`);
      console.log(
        `  │   ├── ${path.parse(imageFiles[0] || "example").name}@1x.jpg`
      );
      console.log(
        `  │   ├── ${path.parse(imageFiles[0] || "example").name}@2x.jpg`
      );
      console.log(
        `  │   └── ${path.parse(imageFiles[0] || "example").name}@3x.jpg`
      );
    }
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
📱 iPhone Image Scaler

Usage: node scale-images-for-iphone.js <input-folder> [output-folder]

Arguments:
  input-folder    Path to folder containing images to scale
  output-folder   Path to output folder (optional, defaults to 'scaled-images')

Examples:
  node scale-images-for-iphone.js ./images
  node scale-images-for-iphone.js ./images ./output
  node scale-images-for-iphone.js "C:/My Images" "./iPhone Images"

Supported formats: JPG, PNG, WebP, TIFF, BMP
`);
    process.exit(1);
  }

  const inputFolder = args[0];
  const outputFolder = args[1] || "scaled-images";

  try {
    const scaler = new ImageScaler(inputFolder, outputFolder);
    await scaler.processFolder();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { ImageScaler, IPHONE_CONFIGS };
