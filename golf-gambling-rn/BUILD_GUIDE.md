# Build Guide - Golf Gambling App

This guide explains how to build and distribute the app APK for testing on other devices.

## Quick Start

### Build APK (Cloud - Easiest)
```bash
npm run build:apk
```
This builds on Expo's servers and gives you a download link when done (5-15 minutes).

### Build APK (Local - Faster)
```bash
npm run build:apk:local
```
Builds on your machine (2-5 minutes, requires Android SDK setup).

**⚠️ Note:** Local builds only work on macOS/Linux. Windows users must use cloud builds or set up WSL2.

---

## All Available Build Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run build:apk` | Cloud build for testing | **Most common** - Share with testers |
| `npm run build:apk:local` | Local build for testing | Faster builds, requires setup |
| `npm run build:production` | Production build | For Google Play Store |
| `npm run build:all` | Build Android + iOS | Build both platforms |
| `npm run build:status` | Check build status | See all your builds |
| `npm run build:cancel` | Cancel running build | Stop a build in progress |

---

## Step-by-Step: Building a New Version

### 1. Update Version Number

Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.2",        // Change this (e.g., 1.0.0 -> 1.0.1)
    "android": {
      "versionCode": 2         // Increment this (e.g., 1 -> 2)
    }
  }
}
```

**Version Naming:**
- `1.0.0` -> `1.0.1` - Bug fixes
- `1.0.0` -> `1.1.0` - New features
- `1.0.0` -> `2.0.0` - Major changes

### 2. Commit Your Changes (Optional but Recommended)

```bash
git add .
git commit -m "v1.0.1: Added light mode and players functionality"
```

### 3. Build the APK

```bash
npm run build:apk
```

### 4. Wait for Completion

You'll see:
```
✔ Build completed!
https://expo.dev/artifacts/eas/abc123.apk
```

### 5. Download and Share

- Click the link to download the APK
- Share the link with testers
- Or download and transfer via USB/Google Drive/Email

---

## Installing APK on Android Devices

### Method 1: Direct Link
1. Send the Expo build link to the device
2. Open link on the device
3. Download and install

### Method 2: Transfer File
1. Download APK to your computer
2. Transfer to device via:
   - USB cable
   - Google Drive
   - Email
   - Bluetooth
3. On device, go to **Settings → Security → Install Unknown Apps**
4. Enable for your browser/file manager
5. Open the APK file and install

---

## First-Time Setup (One-Time Only)

If you haven't set up EAS yet:

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

That's it! You're ready to build.

---

## Build Profiles Explained

### Preview (Default for Testing)
- **Profile:** `preview`
- **Output:** APK file
- **Distribution:** Internal testing
- **Size:** ~50-100 MB
- **Use:** Share with friends, testers, other devices

### Production (For App Stores)
- **Profile:** `production`
- **Output:** AAB (App Bundle)
- **Distribution:** Google Play Store
- **Size:** Optimized
- **Use:** Official app store releases

---

## Troubleshooting

### "Unsupported platform" Error (Windows Users)
**Error:** `macOS or Linux is required to build apps for Android`

**Solution:** Use cloud build instead:
```bash
npm run build:apk
```

Local builds (`npm run build:apk:local`) only work on macOS/Linux.

**Alternative:** Set up WSL2 on Windows (advanced):
1. Install WSL2: `wsl --install`
2. Install Ubuntu from Microsoft Store
3. Set up Node.js and Android SDK in WSL2
4. Run builds from WSL2 terminal

### Build Failed
```bash
# Check the error in build logs
npm run build:status

# Try again
npm run build:apk
```

### "Install Unknown Apps" Not Showing
1. Go to **Settings**
2. Search for "Install unknown apps"
3. Enable for your file manager/browser

### APK Won't Install
- Make sure version code is higher than installed version
- Or uninstall old version first

### Build Taking Too Long
- Cloud builds: 5-15 minutes is normal
- Try local build instead: `npm run build:apk:local`

---

## Tips

### 💡 Quick Testing Workflow
```bash
# Make changes to code
# Test locally first
npm run android

# When ready to share
npm run build:apk
```

### 💡 Keep Track of Versions
Create a `CHANGELOG.md`:
```markdown
## Version 1.0.2 - 2026-01-16
- Added light mode
- Implemented players page
- Fixed player card borders

## Version 1.0.1 - 2026-01-15
- Initial release
```

### 💡 Automated Version Bump
Add to `package.json`:
```json
"scripts": {
  "version:patch": "npm version patch",
  "version:minor": "npm version minor",
  "version:major": "npm version major"
}
```

Then:
```bash
npm run version:patch  # 1.0.0 -> 1.0.1
npm run version:minor  # 1.0.0 -> 1.1.0
npm run version:major  # 1.0.0 -> 2.0.0
```

---

## Build History

Keep track of your builds at:
https://expo.dev/accounts/[your-account]/projects/golf-gambling-rn/builds

---

## Need Help?

- Expo Docs: https://docs.expo.dev/build/introduction/
- EAS Build: https://docs.expo.dev/build/setup/

---

**Happy Building! 🎯⛳**
