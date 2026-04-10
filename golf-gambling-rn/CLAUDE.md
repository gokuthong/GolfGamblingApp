# Claude Development Guide - Golf Gambling App

This file contains important instructions and guidelines for Claude (or any AI assistant) working on this project.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Testing Requirements](#testing-requirements)
3. [Code Standards](#code-standards)
4. [Common Tasks](#common-tasks)
5. [Important Files](#important-files)

---

## Project Overview

**App Name:** Golf Gambling Tracker
**Framework:** React Native (Expo)
**Storage:** Firestore (authenticated users) / Local AsyncStorage (guests/offline)
**Key Features:**
- Cloud-synced data via Firestore for authenticated users
- **Offline resilience**: Dual-write pattern ensures zero data loss when connectivity drops mid-game
- DataService router pattern with local-first writes + Firestore sync
- Automatic dirty-entity tracking and sync-on-reconnect
- 5-game history limit
- 14-day auto-deletion of old games
- Score tracking with multipliers
- Player and course management

---

## Testing Requirements

### MANDATORY: Write function-level tests for every code change

Every time you implement a new feature, fix a bug, or modify existing logic, you **MUST** write comprehensive function-level tests.

### Test location
- Place tests in `src/utils/__tests__/` (or colocated `__tests__/` directories next to the code being tested)
- Name test files `<feature>.test.ts`
- Tests must be runnable with `npx tsx <path-to-test-file>`

### What to test
- **New features:** Extract the core logic into a pure, testable function. Write tests covering:
  - The happy path with realistic data
  - Edge cases (empty inputs, single items, maximum values)
  - Boundary conditions
  - Multiple scenarios with varying player counts, hole counts, etc.
- **Bug fixes:** Write a regression test that reproduces the exact bug scenario, then verify the fix makes it pass
- **Modified features:** Update existing tests to reflect new behavior, add new cases for the changed logic

### Test quality standards
- Each test file should have **many test suites/cases** — aim for comprehensive coverage, not just one or two smoke tests
- Test with varying input sizes (2 players, 3 players, 5 players, etc.)
- Test with and without optional parameters (e.g. handicaps)
- Test that invalid/missing data is handled gracefully
- All tests must pass before considering work complete

### What NOT to do
- Do NOT update `TESTING_CHECKLIST.md` — it is deprecated
- Do NOT write manual testing checklists
- Do NOT skip writing tests because "it's just a small change"

---

## Code Standards

### Storage Patterns
- Use `dataService` for all data operations (routes to Firestore for authenticated users, AsyncStorage for guests)
- Import from `../../services/DataService` (or `../services/DataService` from utils)
- Only use `localStorageService` directly for local-only operations: `createGuestProfile`, `upgradeGuestToUser`, `migrateExistingUsers`, `initializeSuperAdmin`, `clearAllUsers`
- DataService mode is set in `App.tsx` on auth state change: `dataService.setMode('online', uid)` or `dataService.setMode('offline')`
- One-time migration from local to Firestore runs automatically on first login (`migrateLocalDataToFirestore`)
- One-time reverse cache seeding from Firestore to local runs on first login (`seedLocalCacheFromFirestore`)
- Always handle storage errors with try/catch
- Run cleanup on app startup: `deleteGamesOlderThan(userId, 14)`
- Enforce game limit: `enforceGameLimit(userId, 5)`

### Offline Resilience (Dual-Write Pattern)
- **Writes** (online mode): Always write to local storage first (instant success), then attempt Firestore. On failure/offline, entity marked "dirty" for later sync.
- **Reads** (online mode): Local-first by default (since local is always written first). If local returns null/empty, falls back to Firestore. Multi-user queries (`getAllRegisteredPlayers`, `searchUsers`, `getAllUsers`, `getPendingUsers`, `getUserStats`, `getNextUserNumber`) use Firestore-first. `getPlayersForGame` merges both sources.
- **Deletes**: Delete locally first, then attempt Firestore. On failure, queue for later sync.
- **Sync on reconnect**: `SyncService` listens for connectivity changes and pushes all dirty entities + pending deletes to Firestore.
- **Dirty tracking**: Stored in AsyncStorage (`@sync:dirtyEntities`, `@sync:pendingDeletes`). Survives app kills.
- **Hole/score writes**: Mark the parent **game** as dirty (not individual holes/scores). Full game pushed to Firestore on sync.
- **ConnectivityManager** (`src/services/connectivity/`): Wraps `expo-network`, provides `isOnline` and listener callbacks.
- **SyncService** (`src/services/sync/`): Manages dirty set, pending deletes, and sync-on-reconnect logic.

### Navigation
- All headers should be hidden: `headerShown: false`
- Use custom headers in screens if needed
- Ensure status bar is never blocked

### Game Limit Rules
- Maximum 5 completed games in history
- Oldest games deleted first when limit exceeded
- Active/ongoing games don't count toward limit
- Enforcement happens on:
  - App startup
  - Game completion
  - Manual trigger (if added)

### Auto-Deletion Rules
- Games older than 14 days are automatically deleted
- Calculated from `completedAt` date, or `createdAt` as fallback
- Runs on app startup
- Works for both authenticated and offline users

---

## Common Tasks

### Adding a New Screen
1. Create screen component in `src/screens/[category]/`
2. Add to appropriate navigator in `src/navigation/`
3. Set `headerShown: false` in screen options
4. Use `dataService` for all data operations (import from `../../services/DataService`)
5. Write tests for any non-trivial logic in the screen
6. Test navigation to/from the new screen

### Modifying Data Models
1. Update TypeScript interfaces in `src/types/`
2. Add methods to both `LocalStorageService` and `FirestoreService`
3. Add delegate method to `DataService`
4. Add migration logic if changing existing data structure
5. Write tests for the new/modified data methods
6. Test with existing data to ensure backward compatibility

### Adding a New Feature
1. Implement the feature
2. Use `dataService` for any data operations
3. If adding new data methods, add to both LocalStorageService and FirestoreService, then delegate in DataService
4. Ensure it works in both online and offline modes
5. **Write comprehensive function-level tests** (see Testing Requirements)
6. Run tests and verify all pass
7. Update this CLAUDE.md if it introduces new patterns

### Fixing a Bug
1. Fix the bug
2. **Write a regression test** that reproduces the bug scenario
3. Verify the test passes with the fix
4. Test related functionality to ensure no side effects

---

## Important Files

### Core Services
- `src/services/DataService.ts` - Main data access router (dual-write: local-first + Firestore sync)
- `src/services/firebase/firestore.ts` - Firestore operations (online/authenticated users)
- `src/services/storage/LocalStorageService.ts` - AsyncStorage operations (offline/guest users)
- `src/services/connectivity/ConnectivityManager.ts` - Network state detection (expo-network)
- `src/services/sync/SyncService.ts` - Dirty tracking and sync-on-reconnect
- `src/services/dataMigration.ts` - One-time local-to-Firestore migration + reverse cache seeding
- `src/services/storage/storageUtils.ts` - Helper functions
- `src/services/firebase/auth.ts` - Authentication

### Navigation
- `src/navigation/AppNavigator.tsx` - Main app navigation
- `src/navigation/AuthNavigator.tsx` - Login/register navigation

### Key Screens
- `src/screens/auth/LoginScreen.tsx` - Includes "Use Offline" button
- `src/screens/history/GameHistoryScreen.tsx` - 5-game limit enforcement
- `src/screens/game/ScoringScreen.tsx` - Main scoring interface
- `src/screens/game/GameSetupScreen.tsx` - Game creation

### App Entry
- `App.tsx` - Initializes ConnectivityManager + SyncService, sets DataService mode on auth change, runs migration + cache seeding, triggers sync, runs cleanup on startup

### Tests
- `src/utils/__tests__/` - Function-level tests (run with `npx tsx <file>`)

### Documentation
- `README.md` - Project overview
- `BUILD_GUIDE.md` - Build instructions

---

## Checklist for Every Code Change

Before considering your work complete:

- [ ] Code changes implemented
- [ ] No console errors or warnings
- [ ] Works in offline mode (airplane mode test)
- [ ] **Function-level tests written** for all new/changed logic
- [ ] **All tests pass** (`npx tsx <test-file>`)
- [ ] Verified no regression in existing functionality

---

**Last Updated:** February 25, 2026
**Maintained By:** Claude / Development Team
