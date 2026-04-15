# GolfGamblingApp — Claude Code Instructions

## Architecture (NEW — Capacitor/Web)
- Framework: React 19 + Vite 8 + TypeScript
- UI: MUI (Material UI) v9 — Material Design 3
- Auth: Firebase Authentication (email/password)
- Database: Cloud Firestore (online) + localStorage (offline/guest)
- State: Zustand 5
- Routing: React Router v7
- Mobile: Capacitor 8 (Android — WebView wrapping the web app)
- Hosting: Firebase Hosting (web build)
- Firebase project: golfgamblingapp
- Offline: Service worker (network-first, cache fallback)

## OBSOLETE — `golf-gambling-rn/` directory
- **DO NOT read, modify, or reference files in `golf-gambling-rn/`.** It is the old Expo/React Native codebase, fully replaced by `frontend/`. Kept only as a historical archive.
- All active development happens in `frontend/`.
- If you need to understand how a feature works, read the `frontend/` version, not the old RN version.

## Key Paths (NEW — frontend/)
- App source: `frontend/src/`
- App entry: `frontend/src/main.tsx` → `frontend/src/App.tsx`
- Router: `frontend/src/router.tsx`
- Firebase config: `frontend/src/services/firebase/config.ts`
- Data layer: `frontend/src/services/DataService.ts`
- Firestore ops: `frontend/src/services/firebase/firestore.ts`
- Local storage ops: `frontend/src/services/storage/LocalStorageService.ts`
- Sync service: `frontend/src/services/sync/SyncService.ts`
- Connectivity: `frontend/src/services/connectivity/ConnectivityManager.ts`
- Pages: `frontend/src/pages/`
- Components: `frontend/src/components/`
- Theme: `frontend/src/theme/` (colors, typography, spacing, MUI theme)
- Capacitor config: `frontend/capacitor.config.ts`
- Android project: `frontend/android/`
- Service worker: `frontend/public/sw.js`

## Development (NEW)
- `cd frontend && npm run dev` — starts Vite dev server (http://localhost:5173)
- `npm run build` or `npm run build:web` — production web build → dist/
- `npm run deploy:web` — builds and deploys to Firebase Hosting
- `npm run cap:build` — builds web + syncs to Capacitor Android
- `npm run cap:open` — opens Android Studio
- `npm run cap:run` — runs on connected Android device/emulator
- `npm run cap:sync` — syncs web assets to Android project

## Development (LEGACY)
- `cd golf-gambling-rn && npm run web` — starts Expo web dev server
- `npm run build:apk` — EAS cloud build (Android preview)
- Tests: `npx tsx <path-to-test-file>`

## Data Layer (Dual-Write Pattern)
- **Always use `dataService`** for all data operations — it routes to Firestore (authenticated) or AsyncStorage (guest/offline).
- Only use `localStorageService` directly for: `createGuestProfile`, `upgradeGuestToUser`, `migrateExistingUsers`, `initializeSuperAdmin`, `clearAllUsers`.
- DataService mode set in `App.tsx` on auth state change: `dataService.setMode('online', uid)` / `dataService.setMode('offline')`.
- **Writes (online)**: Local first (instant), then Firestore. On failure, entity marked dirty for later sync.
- **Reads (online)**: Local-first by default. Falls back to Firestore if local returns null. Multi-user queries use Firestore-first.
- **Deletes**: Local first, then Firestore. On failure, queued for sync.
- **Sync**: `SyncService` pushes dirty entities + pending deletes on reconnect. Dirty state persisted in localStorage.
- **Hole/score writes**: Mark parent game as dirty, not individual holes/scores.

## Game Rules
- Max 5 completed games in history (oldest deleted first, active games exempt)
- 14-day auto-deletion from `completedAt` (or `createdAt` fallback)
- Both enforced on app startup via `deleteGamesOlderThan(userId, 14)` and `enforceGameLimit(userId, 5)`

## Code Conventions
- Use `dataService` for data ops — never import Firestore/LocalStorage services directly in screens
- All screen headers: `headerShown: false` (use custom headers)
- Always handle storage errors with try/catch
- One-time migration: local-to-Firestore on first login (`migrateLocalDataToFirestore` + `seedLocalCacheFromFirestore`)

## Deployment & Testing
- Build + deploy: `cd frontend && npm run deploy:web`
- **Testing URL**: Always test against https://golfgamblingapp.web.app (the live Firebase Hosting site) — never localhost
- Deploy first, then test on the live URL
- APK build: `cd frontend && npm run cap:build` then open Android Studio via `npm run cap:open`
- Test both online and offline modes
- Bug fixes require a regression test reproducing the exact scenario

## Test Account
- Email: kp.tey@outlook.com
- Password: Teeoff75
- IMPORTANT: Do NOT delete or modify existing games, courses, or player data on this account

## Do NOT
- Edit `.env` files or expose API keys
- Use `localStorageService` directly in screens (use `dataService`)
- Skip tests for "small" changes
- Update `TESTING_CHECKLIST.md` (deprecated)
