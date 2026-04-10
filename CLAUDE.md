# GolfGamblingApp — Claude Code Instructions

## Architecture
- Framework: React Native (Expo ~53) + TypeScript
- UI: React Native Paper (Material Design 3)
- Auth: Firebase Authentication (email/password)
- Database: Cloud Firestore (online) + AsyncStorage (offline/guest)
- State: Zustand
- Navigation: React Navigation (native-stack + bottom-tabs)
- Hosting: Firebase Hosting (web build)
- Firebase project: golfgamblingapp
- EAS project: 63e528a0-5cde-4168-9494-b87590455411

## Key Paths
- App source: `golf-gambling-rn/src/`
- App entry: `golf-gambling-rn/App.tsx`
- Firebase config: `golf-gambling-rn/src/services/firebase/config.ts`
- Data layer: `golf-gambling-rn/src/services/DataService.ts`
- Firestore ops: `golf-gambling-rn/src/services/firebase/firestore.ts`
- Local storage ops: `golf-gambling-rn/src/services/storage/LocalStorageService.ts`
- Sync service: `golf-gambling-rn/src/services/sync/SyncService.ts`
- Connectivity: `golf-gambling-rn/src/services/connectivity/ConnectivityManager.ts`
- Navigation: `golf-gambling-rn/src/navigation/`
- Tests: `golf-gambling-rn/src/utils/__tests__/`

## Development
- `cd golf-gambling-rn && npm run web` — starts Expo web dev server
- `npm run start` — starts Expo dev server (all platforms)
- `npm run build:web` — builds web bundle + patches font cache
- `npm run deploy:web` — builds and deploys to Firebase Hosting
- `npm run build:apk` — EAS cloud build (Android preview)
- Tests: `npx tsx <path-to-test-file>`

## Data Layer (Dual-Write Pattern)
- **Always use `dataService`** for all data operations — it routes to Firestore (authenticated) or AsyncStorage (guest/offline).
- Only use `localStorageService` directly for: `createGuestProfile`, `upgradeGuestToUser`, `migrateExistingUsers`, `initializeSuperAdmin`, `clearAllUsers`.
- DataService mode set in `App.tsx` on auth state change: `dataService.setMode('online', uid)` / `dataService.setMode('offline')`.
- **Writes (online)**: Local first (instant), then Firestore. On failure, entity marked dirty for later sync.
- **Reads (online)**: Local-first by default. Falls back to Firestore if local returns null. Multi-user queries use Firestore-first.
- **Deletes**: Local first, then Firestore. On failure, queued for sync.
- **Sync**: `SyncService` pushes dirty entities + pending deletes on reconnect. Dirty state persisted in AsyncStorage.
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

## Testing
- Write function-level tests for every code change in `src/utils/__tests__/<feature>.test.ts`
- Run with `npx tsx <test-file>` — all must pass before work is complete
- Test both online and offline modes
- Bug fixes require a regression test reproducing the exact scenario

## Do NOT
- Edit `.env` files or expose API keys
- Use `localStorageService` directly in screens (use `dataService`)
- Skip tests for "small" changes
- Update `TESTING_CHECKLIST.md` (deprecated)
