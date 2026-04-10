# Testing Checklist - Golf Gambling App

**Last Updated:** February 25, 2026
**Changes Tested:** Head-to-head holes won rewrite (match-play "up" notation, removed draws, leader-first ordering)

---

## Prerequisites
- Device or emulator ready to test
- Ability to toggle airplane mode (for offline testing)
- Fresh app install recommended for complete testing
- User 001 (KP) account for super admin testing

---

## Test Suite 1: Login Required (No Guest Access)

### 1.1 First Launch - Login Screen
- [ ] Fresh install app
- [ ] **CRITICAL:** Verify app shows login screen (NOT the main app)
- [ ] Verify "Sign In" form is displayed
- [ ] Verify "Create Account" button is visible
- [ ] Verify "Use Offline" button is NOT present
- [ ] Check status bar is not blocked by any headers

### 1.2 Unauthenticated Access Blocked
- [ ] Without signing in, verify there is no way to access any app tabs
- [ ] Verify the only options are Sign In, Create Account, or Forgot Password

---

## Test Suite 2: User Avatar Button

### 2.1 Avatar Button - Authenticated User
- [ ] Sign in with an approved user account
- [ ] Verify avatar shows user initials
- [ ] Verify avatar has gold border
- [ ] Tap avatar button
- [ ] Verify navigates to Settings screen

### 2.2 Avatar Button - Super Admin (User 001)
- [ ] Sign in with user 001 (KP)
- [ ] Verify avatar shows user initials
- [ ] Verify avatar has thick gold border (3px)
- [ ] Verify gold glow effect is visible
- [ ] Tap avatar button
- [ ] Verify navigates to Settings screen

---

## Test Suite 3: User Registration & Pending Approval

### 3.1 Registration Flow
- [ ] From login screen, tap "Create Account"
- [ ] Verify navigates to RegisterScreen
- [ ] Fill in registration form:
  - Email: testuser@example.com
  - Display Name: Test User
  - Password: TestPass123
  - Confirm Password: TestPass123
- [ ] Tap "Create Account"
- [ ] **CRITICAL:** Verify alert shows "Account Created" message
- [ ] Verify message mentions "pending approval"
- [ ] **CRITICAL:** Verify message says "You'll be able to sign in once your account is approved." (no guest mode mention)
- [ ] Tap "OK"
- [ ] **CRITICAL:** Verify user stays on auth screen (does NOT navigate away)

### 3.2 Verify Pending Status
- [ ] Try to sign in with newly created account
- [ ] Navigate to LoginScreen
- [ ] Enter email and password from registration
- [ ] Tap "Sign In"
- [ ] **CRITICAL:** Verify login is blocked
- [ ] Verify alert shows "Account Pending Approval"
- [ ] Verify stays on login screen after alert

---

## Test Suite 4: Admin Panel & Approval System

### 4.1 Access Admin Panel (Super Admin Only)
- [ ] Sign in with user 001 (KP) account
- [ ] Go to Settings tab
- [ ] **CRITICAL:** Verify "Admin Panel" section appears
- [ ] Verify section shows "Pending Approvals"
- [ ] If pending users exist, verify count badge shows number
- [ ] Verify count matches number of pending users
- [ ] Tap "Pending Approvals"
- [ ] Verify navigates to AdminPanelScreen

### 4.2 Admin Panel - View Pending Users
- [ ] On AdminPanelScreen, verify title shows "Pending User Approvals"
- [ ] Verify subtitle shows pending user count
- [ ] For each pending user, verify card shows:
  - Display name
  - Email address
  - User number (e.g., #002)
  - Signup date and time
  - "Approve" button
  - "Reject" button
- [ ] Pull to refresh
- [ ] Verify list updates

### 4.3 Approve User
- [ ] Select a pending user
- [ ] Tap "Approve" button
- [ ] Verify confirmation alert appears
- [ ] Tap "Approve" in alert
- [ ] **CRITICAL:** Verify success message shows
- [ ] Verify user disappears from pending list
- [ ] Verify pending count decreases
- [ ] Go back to Settings
- [ ] Verify badge count decreased

### 4.4 Reject User
- [ ] Create another test user to reject
- [ ] Sign in as admin (user 001)
- [ ] Go to Admin Panel
- [ ] Select the new pending user
- [ ] Tap "Reject" button
- [ ] Verify warning alert appears
- [ ] Tap "Reject" in alert
- [ ] **CRITICAL:** Verify user disappears from pending list
- [ ] Verify pending count decreases

### 4.5 Admin Panel - Non-Admin Users
- [ ] Sign in with a regular user (not 001)
- [ ] Go to Settings tab
- [ ] **CRITICAL:** Verify "Admin Panel" section does NOT appear
- [ ] Verify regular users cannot access admin features

---

## Test Suite 5: Approved User Login

### 5.1 Login After Approval
- [ ] Create a test user and get it approved by admin
- [ ] On login screen, enter approved user credentials
- [ ] Tap "Sign In"
- [ ] **CRITICAL:** Verify login succeeds
- [ ] **CRITICAL:** Verify automatically navigates to HomeScreen (auth state swap)
- [ ] Verify avatar shows user initials
- [ ] Verify avatar has gold border

### 5.2 Approved User Settings
- [ ] Sign in with approved user
- [ ] Go to Settings tab
- [ ] **CRITICAL:** Verify "Account" section is hidden
- [ ] Verify "Profile" section shows:
  - Display name
  - Email address
  - User number
- [ ] Verify "Sign Out" button is visible at bottom
- [ ] If not super admin, verify "Admin Panel" section is hidden

### 5.3 Rejected User Login
- [ ] Try to sign in with a rejected user account
- [ ] Enter credentials
- [ ] Tap "Sign In"
- [ ] **CRITICAL:** Verify login is blocked
- [ ] Verify alert shows "Account Not Approved"
- [ ] Verify message mentions contacting support
- [ ] Verify stays on login screen

### 5.4 Unapproved User Auto Sign-Out (App.tsx Gate)
- [ ] If a user's approval status changes to non-approved while signed in
- [ ] On next app launch, verify they are signed out automatically
- [ ] Verify login screen is shown

---

## Test Suite 6: Existing User Migration

### 6.1 Existing Users After Update
- [ ] If testing with existing users from before this update:
  - [ ] Verify all existing users remain logged in
  - [ ] Verify no data loss
  - [ ] Verify existing users have `approvalStatus: 'approved'`
  - [ ] Verify existing users have `role: 'user'`
  - [ ] Sign out and sign back in
  - [ ] Verify login still works

### 6.2 User 001 Super Admin Migration
- [ ] Sign in with user 001 (KP)
- [ ] **CRITICAL:** Verify role is set to 'super_admin'
- [ ] Verify Admin Panel appears in Settings
- [ ] Verify avatar has special gold glow
- [ ] Verify can access all admin features

---

## Test Suite 7: Add Player Modal Visibility

### 7.1 Add Player Modal Background
- [ ] Sign in with an approved account
- [ ] Navigate to Players tab
- [ ] Tap "Add New Player" button
- [ ] **CRITICAL:** Verify modal has a solid dark background (not nearly transparent)
- [ ] Verify modal title "Add New Player" is clearly visible
- [ ] Verify text input is clearly visible with proper contrast
- [ ] Verify "Cancel" and "Add Player" buttons are clearly visible
- [ ] Enter a player name and tap "Add Player"
- [ ] Verify player is added successfully

---

## Test Suite 2: Player Management

### 2.1 Create Players
- [ ] Go to Players tab
- [ ] Click "Add Player" or similar button
- [ ] Create Player 1: "Alice"
- [ ] Create Player 2: "Bob"
- [ ] Create Player 3: "Charlie"
- [ ] Create Player 4: "David"
- [ ] Verify all 4 players appear in the list
- [ ] Verify players persist after closing and reopening app (still in airplane mode)

### 2.2 Test Player Operations
- [ ] Try to delete a player
- [ ] Verify player is removed from list
- [ ] Re-add the player
- [ ] Verify player list updates correctly

---

## Test Suite 3: Course Management

### 3.1 Create a Custom Course
- [ ] Go to Courses tab
- [ ] Click "Create New Course"
- [ ] Name it "Test Course"
- [ ] Set up 18 holes with various pars (3, 4, 5)
- [ ] Save course
- [ ] Verify course appears in courses list
- [ ] Verify no header at top of screen

### 3.2 Test Course Operations
- [ ] Edit the course you just created
- [ ] Change a hole's par
- [ ] Save changes
- [ ] Verify changes are saved
- [ ] Navigate back to courses list
- [ ] Verify course still appears correctly

---

## Test Suite 4: Game Creation & Scoring (Game 1)

### 4.1 Create First Game
- [ ] Go to Home tab
- [ ] Click "New Game" or similar button
- [ ] Select all 4 players (Alice, Bob, Charlie, David)
- [ ] Select "Test Course" if desired (or use default)
- [ ] Click "Start Game"
- [ ] Verify navigation to scoring screen
- [ ] Verify no header blocking status bar

### 4.2 Score Hole 1
- [ ] For Alice: Set strokes to 4
- [ ] For Bob: Set strokes to 5
- [ ] For Charlie: Set strokes to 3
- [ ] For David: Set strokes to 6
- [ ] Try setting a multiplier (2x, 3x, or 4x) for one player
- [ ] Click "Next Hole" or similar
- [ ] Verify hole is marked as confirmed

### 4.3 Score Holes 2-9 (Quick)
- [ ] Score each hole with varied strokes (3-7 range)
- [ ] Alternate who has best/worst scores
- [ ] Use multipliers on at least 2 different holes
- [ ] Verify scoring updates correctly
- [ ] Verify no UI issues or blocked content

### 4.4 Score Holes 10-18 (Quick)
- [ ] Continue scoring remaining holes
- [ ] Vary the scores
- [ ] Test navigation between holes
- [ ] Verify all scores are saved properly

### 4.5 Complete Game 1
- [ ] Click "Finish Game" or similar button
- [ ] Verify game completion confirmation
- [ ] Navigate to Game Summary screen
- [ ] Verify correct winner is displayed
- [ ] Verify final scores are accurate
- [ ] Verify stroke totals are correct
- [ ] Go to History tab
- [ ] Verify Game 1 appears in history
- [ ] Verify game date is shown correctly

---

## Test Suite 5: Multiple Games & 5-Game Limit

### 5.1 Create Game 2
- [ ] Return to Home tab
- [ ] Create a new game with same 4 players
- [ ] Use default course or different course
- [ ] Score all 18 holes quickly (use similar scores to save time)
- [ ] Complete the game
- [ ] Go to History tab
- [ ] Verify 2 games now appear in history
- [ ] Verify both games show correct dates and winners

### 5.2 Create Game 3
- [ ] Create and complete Game 3 following same process
- [ ] Verify 3 games in history

### 5.3 Create Game 4
- [ ] Create and complete Game 4
- [ ] Verify 4 games in history

### 5.4 Create Game 5
- [ ] Create and complete Game 5
- [ ] Verify 5 games in history
- [ ] Note the date/time of Game 1 (oldest game)

### 5.5 Test 5-Game Limit
- [ ] Create and complete Game 6
- [ ] **CRITICAL:** Verify only 5 games appear in history
- [ ] Verify Game 1 (oldest) has been automatically deleted
- [ ] Verify Games 2-6 remain in history
- [ ] Verify newest game (Game 6) appears at top of list

---

## Test Suite 6: Game History & Operations

### 6.1 View Game Details
- [ ] In History tab, tap on a completed game
- [ ] Verify game summary displays correctly
- [ ] Verify all player scores are shown
- [ ] Verify winner is highlighted
- [ ] Verify stroke totals are accurate
- [ ] Go back to history

### 6.2 Edit Finished Game
- [ ] Tap on a game in history
- [ ] Select "Edit Scores" option (if available)
- [ ] Change a score on one hole
- [ ] Save changes
- [ ] Verify score changes are reflected in summary
- [ ] Verify winner may have changed if applicable

### 6.3 Delete Game
- [ ] In History tab, find delete button on a game card
- [ ] Delete one of the middle games (e.g., Game 3)
- [ ] Confirm deletion
- [ ] Verify game is removed from history
- [ ] Verify only 4 games remain (2, 4, 5, 6)
- [ ] Verify no errors or UI issues

### 6.4 Test Pull-to-Refresh
- [ ] In History tab, pull down to refresh
- [ ] Verify refresh indicator appears
- [ ] Verify games list updates correctly

---

## Test Suite 7: Active Games

### 7.1 Create Unfinished Game
- [ ] Go to Home tab
- [ ] Start a new game with 4 players
- [ ] Score only holes 1-9 (do NOT finish all 18 holes)
- [ ] Exit the scoring screen (go to Home or another tab)
- [ ] Verify game appears as "Active" or "Ongoing" on Home screen

### 7.2 Resume Active Game
- [ ] From Home tab, tap on the active game
- [ ] Verify scoring resumes at hole 10
- [ ] Verify all previous scores (holes 1-9) are preserved
- [ ] Score a few more holes
- [ ] Exit again without finishing
- [ ] Verify game still shows as active

### 7.3 Complete Active Game
- [ ] Resume the active game
- [ ] Complete all remaining holes
- [ ] Finish the game
- [ ] Verify game moves from "Active" to History
- [ ] Verify Home screen no longer shows it as active

---

## Test Suite 8: 14-Day Auto-Deletion

### 8.1 Simulate Old Games (Manual Test)
**Note:** This requires changing device date settings

- [ ] Close the app completely
- [ ] Go to device Settings → Date & Time
- [ ] Disable automatic date/time
- [ ] Set date to 15 days in the future (e.g., if today is Jan 30, set to Feb 14)
- [ ] Open the app
- [ ] Wait for app to initialize (cleanup runs on startup)
- [ ] Go to History tab
- [ ] **CRITICAL:** Verify all games are deleted (they're now "older than 14 days")
- [ ] Verify empty state shows "No games yet"
- [ ] Reset device date back to current date
- [ ] Close and reopen app

### 8.2 Verify Cleanup Doesn't Affect Recent Games
- [ ] Ensure device date is correct (current date)
- [ ] Create 2-3 new games and complete them
- [ ] Close and reopen app (this triggers cleanup)
- [ ] Verify recent games are NOT deleted
- [ ] Verify games still appear in history

---

## Test Suite 9: Data Persistence & App Lifecycle

### 9.1 Test Data Persistence
- [ ] With at least 3 completed games in history
- [ ] Force close the app (swipe away from app switcher)
- [ ] Reopen app
- [ ] Verify all games are still in history
- [ ] Verify all players are still in Players tab
- [ ] Verify all courses are still in Courses tab
- [ ] Verify no data loss

### 9.2 Test Airplane Mode Throughout
- [ ] Ensure airplane mode is still ON
- [ ] Perform random actions: create player, create course, score game
- [ ] Verify everything works without internet
- [ ] Close and reopen app
- [ ] Verify all data is preserved
- [ ] Turn airplane mode OFF

---

## Test Suite 10: Navigation & UI

### 10.1 Test All Tab Navigation
- [ ] Go to Home tab - verify no header at top
- [ ] Go to Courses tab - verify no header at top
- [ ] Go to Players tab - verify no header at top
- [ ] Go to History tab - verify no header at top
- [ ] Go to Settings tab - verify no header at top
- [ ] Verify status bar (time, battery) is fully visible on all screens

### 10.2 Test Deep Navigation
- [ ] From Home → New Game → Scoring → Finish → Summary
- [ ] Verify no headers at top of any screen
- [ ] Verify status bar always visible
- [ ] From Courses → Create Course → Save → Back
- [ ] Verify no headers throughout flow
- [ ] From History → Game Details → Back
- [ ] Verify no navigation issues

### 10.3 Test Settings Screen
- [ ] Go to Settings tab
- [ ] Toggle dark mode (if available)
- [ ] Verify theme changes correctly
- [ ] Verify no header at top
- [ ] Test any other settings options
- [ ] Verify changes persist after app restart

---

## Test Suite 11: Edge Cases & Error Handling

### 11.1 Empty States
- [ ] Delete all games from history
- [ ] Verify "No games yet" message displays correctly
- [ ] Delete all players
- [ ] Verify "No players" message displays
- [ ] Delete all courses
- [ ] Verify "No courses" message displays

### 11.2 Minimum Players
- [ ] Try to start a game with 0 players selected
- [ ] Verify error message appears
- [ ] Try to start a game with 1 player selected
- [ ] Verify error message appears (minimum 2 players)
- [ ] Select 2 players and start game
- [ ] Verify game starts successfully

### 11.3 Maximum Games (Edge Case)
- [ ] If you have 5 games in history
- [ ] Create 5 more games quickly
- [ ] Verify only most recent 5 remain at all times
- [ ] Verify no crashes or errors

---

## Test Suite 12: Regression Testing (Quick Check)

### 12.1 Basic Functionality
- [ ] Create a quick game with 2 players
- [ ] Score 3-4 holes
- [ ] Verify scoring works correctly
- [ ] Complete the game
- [ ] Verify it appears in history
- [ ] Delete the game
- [ ] Verify it's removed

### 12.2 Visual Inspection
- [ ] Review all screens for any UI issues
- [ ] Check for any text cutoff or overlap
- [ ] Verify all buttons are clickable
- [ ] Verify colors and styling look correct
- [ ] Verify no headers are blocking status bar anywhere

---

## Test Suite 13: Cleanup & Final Verification

### 13.1 Final State Check
- [ ] Verify exactly 5 games in history (or fewer)
- [ ] Verify all games are recent (within 14 days)
- [ ] Verify players list is intact
- [ ] Verify courses list is intact
- [ ] Verify app is still in offline mode (if testing offline)

### 13.2 Return to Online Mode (Optional)
- [ ] Close app
- [ ] Delete app data or uninstall app
- [ ] Reinstall app
- [ ] Open app
- [ ] Use normal login (with internet)
- [ ] Verify app works with Firebase authentication
- [ ] Verify all features work the same way

---

## ✅ Test Completion Summary

**Date Tested:** _________________
**Tester Name:** _________________
**Device/Emulator:** _________________
**Issues Found:** _________________

### Critical Bugs (Must Fix)
- [ ] None found
- [ ] List any critical issues:

### Minor Issues (Nice to Fix)
- [ ] None found
- [ ] List any minor issues:

### Feature Requests
- [ ] None
- [ ] List any ideas for improvements:

---

## Notes for Future Testing

- **NEW:** App requires login — no guest access, no offline mode
- **NEW:** Unapproved users are signed out at the App.tsx level
- **NEW:** Registration pending message no longer mentions guest mode
- **NEW:** Add-player modal has solid background instead of glass effect
- Test admin approval workflow with multiple pending users
- Verify user avatar button appears on HomeScreen
- Test that rejected users cannot login
- Test 5-game limit thoroughly - it's a key feature
- Test 14-day auto-deletion by changing device date
- Verify no headers block status bar on EVERY screen
- Test on both iOS and Android if possible
- Verify user 001 always becomes super admin after migration

---

## Quick Test Priority List

When time is limited, focus on these critical tests:

1. **Login Required** (Test Suite 1.1) - App should show login screen, not main app
2. **No Offline Button** (Test Suite 1.1) - "Use Offline" button must be gone
3. **Registration → Pending** (Test Suite 3.1) - User stays on auth screen after signup, no guest mode mention
4. **Pending Login Blocked** (Test Suite 3.2) - Cannot login while pending
5. **Admin Approval** (Test Suite 4.3) - Admin can approve users
6. **Approved Login Works** (Test Suite 5.1) - Can login after approval, auto-navigates to app
7. **Admin Panel Access** (Test Suite 4.1) - Only super admin sees it
8. **Add Player Modal** (Test Suite 7.1) - Modal has solid visible background

---

## Test Suite 15: Scoring & UI Improvements (Feb 2026)

### 15.1 Next / Complete Button Split
- [ ] Start a new game, navigate to hole 1
- [ ] Verify 3 buttons in footer: **Prev | Next | Complete**
- [ ] Press "Next" — verify it advances to hole 2 WITHOUT confirming hole 1
- [ ] Go back to hole 1 — verify no green background (hole not confirmed)
- [ ] Press "Complete" on hole 1 — verify it confirms hole 1 AND advances to hole 2
- [ ] Go back to hole 1 — verify green background appears (hole confirmed)
- [ ] On hole 18 (last hole), verify 3 buttons: **Prev | Complete | Finish Game**
- [ ] Press "Complete" on hole 18 — verify it confirms hole 18 (green background) without finishing the game
- [ ] Press "Finish Game" on hole 18 — verify it ends the game and navigates to Game Summary

### 15.2 Progress Indicator in Header
- [ ] Verify "x/18" progress indicator appears in the top-right of the header
- [ ] Verify it updates as you navigate between holes
- [ ] Verify the progress indicator is NOT in the bottom navigation bar

### 15.3 Current Standings Row
- [ ] Navigate through holes and check "Current Standings" card appears below "Hole Summary"
- [ ] Press "Next" (without Complete) on several holes — verify standings show 0.0 for all players
- [ ] Press "Complete" on a hole — verify standings update with cumulative points
- [ ] Complete multiple holes and verify standings accumulate correctly

### 15.4 Confirmed Hole Green Background
- [ ] Navigate to a non-confirmed hole — verify normal background color
- [ ] Complete a hole (press "Complete"), then go back to it — verify subtle green background
- [ ] Test in both dark mode and light mode
- [ ] Verify text and UI elements are still clearly readable over green background

### 15.5 Multiplier Buttons Squeezed
- [ ] Open scoring screen and check multiplier buttons (x2, x3, x4)
- [ ] Verify buttons are narrower, more centered, and closer together than before
- [ ] Verify buttons still function correctly (tap to activate, tap again to deactivate)
- [ ] Verify in both 3-player and 4-player (compact) layouts

### 15.6 Hole-by-Hole Points Table in Game Summary
- [ ] Finish a game and go to Game Summary screen
- [ ] Scroll down past the Scorecard section
- [ ] Verify "Hole-by-Hole Points" section appears
- [ ] Verify it shows a table with hole numbers and each player's points per hole
- [ ] Verify a "Total" row at the bottom matches the Final Standings totals
- [ ] Verify positive points are green, negative points are red

### 15.7 Blank Non-Confirmed Holes in Scorecard
- [ ] Start a game, "Complete" holes 1-5, then press "Finish Game" on last hole
- [ ] **OR:** Start a game, use only "Next" for some holes, "Complete" for others, then "Finish Game"
- [ ] Test back-9-first scenario: Navigate to hole 10, complete holes 10-18, then "Finish Game" without playing front 9
- [ ] In Game Summary, check the Scorecard — non-confirmed holes should show "-" (blank)
- [ ] Verify total strokes only sums confirmed holes
- [ ] Download PDF and verify same behavior: blanks for non-confirmed, correct totals

### 15.8 PDF Uses Completion Date
- [ ] Complete a game
- [ ] Download the PDF scorecard
- [ ] **CRITICAL:** Verify the date on the PDF matches when you pressed "Finish" (not when the game was created)

---

## Test Suite 16: Firestore Cloud Storage Integration

### 16.1 Data Persistence Across Reinstall
- [ ] Register a new account or sign in
- [ ] Create a course, add players, play and complete a game
- [ ] Uninstall the app completely
- [ ] Reinstall and sign in with the same account
- [ ] **CRITICAL:** Verify all courses, players, and game history are present
- [ ] Verify game details (scores, holes) are intact

### 16.2 One-Time Migration (Existing Local Data)
- [ ] If you have existing local data from before this update, sign in
- [ ] Verify existing courses appear after login
- [ ] Verify existing players appear after login
- [ ] Verify existing game history appears after login
- [ ] Verify migration only runs once (check console logs on second login)

### 16.3 New User Registration with Firestore
- [ ] Register a brand new account
- [ ] Verify user profile is created (check Firebase console if possible)
- [ ] Create a course and verify it persists after app restart
- [ ] Create a player and verify it persists after app restart

### 16.4 Admin Panel with Firestore
- [ ] Sign in as super admin (User 001)
- [ ] Open Admin Panel / Settings
- [ ] Verify pending users list loads from Firestore
- [ ] Verify all users list loads from Firestore
- [ ] Approve a pending user and verify status updates
- [ ] Reject a pending user and verify status updates
- [ ] Verify user roles and approval statuses persist

### 16.5 Game Flow with Firestore
- [ ] Create a new game (select players, optional course)
- [ ] Score several holes with multipliers
- [ ] Close and reopen the app mid-game
- [ ] **CRITICAL:** Verify active game resumes with all scores intact
- [ ] Complete the game
- [ ] Verify game appears in history
- [ ] Verify 5-game limit still enforced
- [ ] Verify 14-day auto-deletion still works

### 16.6 Guest/Offline Mode Still Works
- [ ] If guest mode is accessible, verify it uses local storage (no Firestore errors)
- [ ] Verify DataService defaults to offline mode when not authenticated
- [ ] Sign out and verify no Firestore-related errors in console

---

## Test Suite 17: Offline Resilience (Dual-Write Sync)

### 17.1 Offline Scoring (Airplane Mode Mid-Game)
- [ ] Sign in with an approved account (ensure data loads)
- [ ] Enable airplane mode
- [ ] Create a new game, select players and course
- [ ] Score all 18 holes offline
- [ ] Complete the game
- [ ] **CRITICAL:** Verify game appears in history (loaded from local storage)
- [ ] Disable airplane mode
- [ ] Wait 5-10 seconds for sync
- [ ] Verify game data appears in Firestore (check Firebase console or reinstall app and sign in)

### 17.2 Mid-Game Connectivity Loss
- [ ] Start a game while online
- [ ] Score holes 1-5 with internet on
- [ ] Enable airplane mode
- [ ] Score holes 6-12 offline
- [ ] Disable airplane mode
- [ ] Score holes 13-18 online
- [ ] Complete the game
- [ ] **CRITICAL:** Verify all 18 holes have correct scores
- [ ] Verify game synced to Firestore completely

### 17.3 App Kill While Offline
- [ ] Sign in, start a game online
- [ ] Score holes 1-9
- [ ] Enable airplane mode
- [ ] Score holes 10-14
- [ ] Force-kill the app (swipe away from app switcher)
- [ ] Reopen the app (still in airplane mode)
- [ ] **CRITICAL:** Verify active game is preserved with all 14 scored holes
- [ ] Resume and score remaining holes
- [ ] Complete the game offline
- [ ] Disable airplane mode
- [ ] **CRITICAL:** Verify game syncs to Firestore after reconnect

### 17.4 Read Fallback (Offline Reads)
- [ ] Sign in while online, load games/players/courses (seeds local cache)
- [ ] Enable airplane mode
- [ ] Navigate to History tab — verify games still load
- [ ] Navigate to Players tab — verify players still load
- [ ] Navigate to Courses tab — verify courses still load
- [ ] Tap on a game in history — verify game details (scores, holes) load
- [ ] **CRITICAL:** Verify no error screens or blank states for existing data

### 17.5 Delete Offline + Sync
- [ ] Sign in, ensure at least one game in history
- [ ] Enable airplane mode
- [ ] Delete a game from history
- [ ] Verify game is removed from history view
- [ ] Disable airplane mode
- [ ] Wait for sync
- [ ] **CRITICAL:** Verify game is removed from Firestore (reinstall and sign in, or check Firebase console)

### 17.6 Sync Queue Persistence (Survives App Kill)
- [ ] Sign in while online
- [ ] Enable airplane mode
- [ ] Create a new game, score a few holes, add a player
- [ ] Force-kill the app
- [ ] Disable airplane mode
- [ ] Reopen the app and sign in
- [ ] **CRITICAL:** Verify pending changes auto-sync to Firestore on app launch

### 17.7 Online Happy Path (No Regression)
- [ ] Sign in with good internet connection
- [ ] Create a course — verify it appears
- [ ] Add a player — verify it appears
- [ ] Create a game, score all holes, complete it — verify in history
- [ ] Delete a game — verify removed
- [ ] **CRITICAL:** Verify everything works exactly as before (no performance degradation)
- [ ] Uninstall and reinstall, sign in — verify all data persists via Firestore

### 17.8 Cache Seeding (New Device / Reinstall)
- [ ] Uninstall the app
- [ ] Reinstall and sign in with an account that has existing Firestore data
- [ ] **CRITICAL:** Verify games, players, courses, and profile are pulled from Firestore into local cache
- [ ] Enable airplane mode immediately after login
- [ ] Navigate through all tabs — verify data is available offline
- [ ] This should only run once (verify by checking console logs on second launch)

## Test Suite 18: Handicap Modal Enhancements

### 18.1 Sort Toggle (Hole vs Index)
- [ ] Open handicap modal from scoring screen
- [ ] Verify **Hole** / **Index** toggle appears in the header area
- [ ] Default sort should be **Hole** (1, 2, 3... 18)
- [ ] Tap **Index** — verify holes reorder by index (hardest first: #1, #2, #3...)
- [ ] Each tile should still show both "Hole X" and "#Y" (index badge)
- [ ] Set some handicap strokes while sorted by Index
- [ ] Toggle back to **Hole** — verify strokes are preserved (not reset)
- [ ] Toggle to **Index** again — verify strokes still match
- [ ] **CRITICAL:** Switching sort modes must NOT clear any existing handicap values

### 18.2 Quick Fill by Index Range
- [ ] Open handicap modal, select an opponent
- [ ] Verify "Give 1 stroke for index 1 to [__] [Apply]" row appears
- [ ] Type "12" into the input and press **Apply**
- [ ] Verify holes with index 1-12 now show handicap value of 1
- [ ] Verify holes with index 13-18 remain at 0
- [ ] Manually increase a hole (e.g., index #3) to 2 strokes
- [ ] Type "12" again and press **Apply** — verify the hole at index #3 stays at 2 (not reduced to 1)
- [ ] Type "18" and press **Apply** — verify all holes now show at least 1
- [ ] Verify Apply button is disabled when input is empty

### 18.3 Head-to-Head Holes Won (Game Summary) — Match-Play "Up" Notation
- [ ] Complete a game with 2+ players
- [ ] On Game Summary screen, verify "Head-to-Head Holes Won" section appears
- [ ] **No draws column:** Verify center only shows a dash separator (no draw count)
- [ ] Each pair shows: [Leader name] [advantage] - 0 [Trailer name]
- [ ] **Leader-first ordering:** The player who is "up" (more net hole wins) is always on the left
- [ ] **Tied pairs:** When net wins are equal (e.g., each won 1 hole), display shows 0 - 0 with original player order
- [ ] Verify the leader's name and advantage number are highlighted in green when advantage > 0
- [ ] **Net advantage, not raw wins:** If A wins 2 holes and B wins 1 hole, display shows A 1 - 0 B (not 2-1)
- [ ] **With handicaps:** Set up A gives B 1 stroke on a hole, verify handicap reduces B's net score in that matchup only
- [ ] Example: A scores 3, B scores 4, A gives B 1 stroke → B net = 3, tie on that hole (no one gains a hole)
- [ ] **Handicap matchup isolation:** Handicap between A-B does NOT affect B's score vs C
- [ ] With 3 players, verify 3 pairs shown; with 4 players, verify 6 pairs; with 5 players, verify 10 pairs
- [ ] **5-player scenario:** Verify all 10 pairs have correct leader ordering and net advantages

### 18.4 Toggle Not Shown Without Index Data
- [ ] Create a course without index data (all indexes blank/0)
- [ ] Start a game with that course
- [ ] Open handicap modal — verify sort toggle does NOT appear
- [ ] Verify quick fill row does NOT appear

---

**End of Testing Checklist**
