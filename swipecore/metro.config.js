const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add support for environment variables
config.resolver.platforms = ["ios", "android"];

// Configure module resolution
config.resolver.alias = {
  "@": "./src",
  "@env": "./src/config/env.ts",
};

module.exports = config;
