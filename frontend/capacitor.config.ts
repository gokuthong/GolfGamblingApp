import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.golfgambletracker.app",
  appName: "Golf Gamble Tracker",
  webDir: "dist",
  server: {
    // Hybrid approach: load from Firebase Hosting for instant updates
    // Falls back to local bundle when offline (via service worker)
    url: "https://golfgamblingapp.web.app",
    cleartext: false,
    allowNavigation: [
      "golfgamblingapp.web.app",
      "golfgamblingapp.firebaseapp.com",
      "*.googleapis.com",
      "*.firebaseio.com",
    ],
  },
  android: {
    backgroundColor: "#0A0A0A",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#0A0A0A",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Network: {
      // No special config needed
    },
    Haptics: {
      // No special config needed
    },
  },
};

export default config;
