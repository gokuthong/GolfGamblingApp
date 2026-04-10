const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase JS SDK uses .cjs files for React Native compatibility
config.resolver.sourceExts.push('cjs');

// Expo SDK 53 enables package.json "exports" resolution by default,
// which breaks Firebase JS SDK auth module resolution.
// Disable it to use traditional resolution paths that Firebase expects.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
