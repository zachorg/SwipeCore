#!/usr/bin/env node

/**
 * Cross-platform app icon generator for Android and iOS
 * Uses sharp for image processing (no external dependencies required)
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Configuration
const SOURCE_ICON = path.join(__dirname, "..", "assets", "images", "icon.png");

// Android icon sizes
const ANDROID_ICON_SIZES = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

// iOS icon sizes
const IOS_ICON_SIZES = {
  "AppIcon-20@2x.png": 40,
  "AppIcon-20@3x.png": 60,
  "AppIcon-29@2x.png": 58,
  "AppIcon-29@3x.png": 87,
  "AppIcon-40@2x.png": 80,
  "AppIcon-40@3x.png": 120,
  "AppIcon-60@2x.png": 120,
  "AppIcon-60@3x.png": 180,
  "AppIcon-76@2x.png": 152,
  "AppIcon-83.5@2x.png": 167,
  "AppIcon-1024.png": 1024,
};

// iOS Contents.json template
const IOS_CONTENTS_JSON = {
  images: [
    {
      filename: "AppIcon-20@2x.png",
      idiom: "iphone",
      scale: "2x",
      size: "20x20",
    },
    {
      filename: "AppIcon-20@3x.png",
      idiom: "iphone",
      scale: "3x",
      size: "20x20",
    },
    {
      filename: "AppIcon-29@2x.png",
      idiom: "iphone",
      scale: "2x",
      size: "29x29",
    },
    {
      filename: "AppIcon-29@3x.png",
      idiom: "iphone",
      scale: "3x",
      size: "29x29",
    },
    {
      filename: "AppIcon-40@2x.png",
      idiom: "iphone",
      scale: "2x",
      size: "40x40",
    },
    {
      filename: "AppIcon-40@3x.png",
      idiom: "iphone",
      scale: "3x",
      size: "40x40",
    },
    {
      filename: "AppIcon-60@2x.png",
      idiom: "iphone",
      scale: "2x",
      size: "60x60",
    },
    {
      filename: "AppIcon-60@3x.png",
      idiom: "iphone",
      scale: "3x",
      size: "60x60",
    },
    {
      filename: "AppIcon-76@2x.png",
      idiom: "ipad",
      scale: "2x",
      size: "76x76",
    },
    {
      filename: "AppIcon-83.5@2x.png",
      idiom: "ipad",
      scale: "2x",
      size: "83.5x83.5",
    },
    {
      filename: "AppIcon-1024.png",
      idiom: "ios-marketing",
      scale: "1x",
      size: "1024x1024",
    },
  ],
  info: {
    author: "xcode",
    version: 1,
  },
};

async function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

async function generateAndroidIcons() {
  console.log("Generating Android app icons...\n");

  for (const [dir, size] of Object.entries(ANDROID_ICON_SIZES)) {
    const targetDir = path.join(
      __dirname,
      "..",
      "android",
      "app",
      "src",
      "main",
      "res",
      dir
    );
    await ensureDirectoryExists(targetDir);

    try {
      // Generate standard launcher icon
      await sharp(SOURCE_ICON)
        .resize(size, size)
        .png()
        .toFile(path.join(targetDir, "ic_launcher.png"));
      console.log(`  ✓ Generated ${dir}/ic_launcher.png (${size}x${size})`);

      // Generate round launcher icon
      await sharp(SOURCE_ICON)
        .resize(size, size)
        .png()
        .toFile(path.join(targetDir, "ic_launcher_round.png"));
      console.log(
        `  ✓ Generated ${dir}/ic_launcher_round.png (${size}x${size})`
      );

      // Generate foreground icon for adaptive icons
      await sharp(SOURCE_ICON)
        .resize(size, size)
        .png()
        .toFile(path.join(targetDir, "ic_launcher_foreground.png"));
      console.log(
        `  ✓ Generated ${dir}/ic_launcher_foreground.png (${size}x${size})`
      );
    } catch (error) {
      console.error(`  ✗ Failed to generate icons for ${dir}:`, error.message);
    }
  }
}

async function generateIOSIcons() {
  console.log("\nGenerating iOS app icons...\n");

  const iosTargetDir = path.join(
    __dirname,
    "..",
    "ios",
    "App",
    "App",
    "Assets.xcassets",
    "AppIcon.appiconset"
  );
  await ensureDirectoryExists(iosTargetDir);

  for (const [filename, size] of Object.entries(IOS_ICON_SIZES)) {
    try {
      await sharp(SOURCE_ICON)
        .resize(size, size)
        .png()
        .toFile(path.join(iosTargetDir, filename));
      console.log(`  ✓ Generated ${filename} (${size}x${size})`);
    } catch (error) {
      console.error(`  ✗ Failed to generate ${filename}:`, error.message);
    }
  }

  // Generate Contents.json
  try {
    fs.writeFileSync(
      path.join(iosTargetDir, "Contents.json"),
      JSON.stringify(IOS_CONTENTS_JSON, null, 2)
    );
    console.log(`  ✓ Generated Contents.json`);
  } catch (error) {
    console.error(`  ✗ Failed to generate Contents.json:`, error.message);
  }
}

async function main() {
  console.log("App Icon Generator for Android and iOS\n");

  // Check if source icon exists
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error(`Error: Source icon not found at ${SOURCE_ICON}`);
    console.error(
      "Please ensure you have an icon.png file in the assets/images directory."
    );
    process.exit(1);
  }

  console.log(`Source icon found: ${SOURCE_ICON}\n`);

  try {
    await generateAndroidIcons();
    await generateIOSIcons();

    console.log("\n✅ App icons generated successfully!\n");
    console.log("Android icons placed in:");
    console.log("  android/app/src/main/res/mipmap-*/ directories\n");
    console.log("iOS icons placed in:");
    console.log("  ios/App/App/Assets.xcassets/AppIcon.appiconset/\n");
    console.log("Next steps:");
    console.log("1. Clean and rebuild your Android project to see the changes");
    console.log("2. Clean and rebuild your iOS project to see the changes");
    console.log("3. Test on both platforms to ensure icons display correctly");
  } catch (error) {
    console.error("Error generating icons:", error.message);
    process.exit(1);
  }
}

// Check if sharp is available
try {
  require.resolve("sharp");
  main();
} catch (error) {
  console.error("Error: Sharp package is not installed.");
  console.error("Please install it by running: npm install sharp");
  console.error("Or use yarn: yarn add sharp");
  process.exit(1);
}
