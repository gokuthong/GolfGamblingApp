# Getting Started with Golf Gambling Tracker (React Native)

## Quick Start

### 1. Navigate to the Project
```bash
cd golf-gambling-rn
```

### 2. Install Dependencies (if not already done)
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run web
```

This will open the app in your web browser at `http://localhost:8081` (or similar).

## Testing the App

### Authentication

The app requires Firebase Authentication. You have two options:

**Option A: Create a Test User**
1. Go to [Firebase Console](https://console.firebase.google.com/u/0/project/golfgamblingapp/authentication/users)
2. Click "Add User"
3. Enter an email and password (e.g., `test@test.com` / `password123`)
4. Use these credentials to sign in

**Option B: Temporarily Disable Auth (Development Only)**

Edit `App.tsx` and replace the auth check:

```typescript
// Temporary: Always show app without auth
return (
  <>
    <StatusBar style="auto" />
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  </>
);
```

### Using the App

Once signed in, you'll see the **Home Screen** with two main options:

#### 1. Create a New Game

1. Click **"New Game"**
2. You'll see the Game Setup screen
3. **Add Players:**
   - Type a name in the "Player name" field
   - Click "Add" button
   - The player will be auto-selected
4. **Select Players:**
   - Click on player cards to select/deselect
   - Must select at least 2 players
5. Click **"Start Game"** when ready
6. The app will:
   - Create a game in Firestore
   - Initialize 18 holes with standard par values
   - Navigate to the Scoring screen

#### 2. Score a Game

The **Scoring Screen** shows:
- **Current hole** (1-18)
- **Par** for the hole
- **Multiplier toggles**: Up (2x) and Burn (3x)
- **Player cards** with stroke/handicap counters
- **Live standings** at the bottom
- **Navigation** buttons (Previous/Next/Finish)

**How to Score:**
1. For each player:
   - Use + / - buttons to set **Strokes** (gross score)
   - Use + / - buttons to set **Handicap** (0-2)
   - Net score = Strokes - Handicap (shown below)

2. Toggle multipliers if needed:
   - **Up**: Doubles the point value
   - **Burn**: Triples the point value
   - **Birdie/Eagle**: Auto-detected and applied

3. Navigate between holes:
   - Click **"Next →"** to move forward
   - Click **"← Previous"** to go back
   - On hole 18, click **"Finish"** to complete the game

4. Watch the **Current Standings** panel:
   - Shows running point totals
   - Green = positive (winning)
   - Red = negative (losing)
   - Updates in real-time as you score

## Understanding the Scoring

### Match Play System
- Each player competes against **every other player** on each hole
- Lower **net score** wins the matchup
- Winner: +1 point
- Loser: -1 point
- Tie: 0 points each

### Example (3 players, Hole 1, Par 4):
- Alice: 4 strokes, 0 handicap = 4 net
- Bob: 5 strokes, 1 handicap = 4 net
- Charlie: 6 strokes, 0 handicap = 6 net

**Matchups:**
- Alice vs Bob: Tie (4 vs 4) → 0 points each
- Alice vs Charlie: Alice wins (4 vs 6) → Alice +1, Charlie -1
- Bob vs Charlie: Bob wins (4 vs 6) → Bob +1, Charlie -1

**Hole 1 Results:**
- Alice: +1
- Bob: +1
- Charlie: -2

### Multipliers (All Stack!)

Base points get multiplied by:
- **Up**: ×2
- **Burn**: ×3
- **Birdie**: ×2 (gross strokes = par - 1)
- **Eagle**: ×3 (gross strokes ≤ par - 2)

**Example:** Hole with Up + Birdie = ×2 × ×2 = ×4
- Instead of ±1 point, it's ±4 points!

## Firestore Data Structure

Your data is stored in Firebase Firestore:

### Collections:
1. **games**
   - id, date, status, playerIds

2. **holes**
   - gameId, holeNumber (1-18), par, isUp, isBurn

3. **scores**
   - holeId, playerId, gameId, strokes, handicap

4. **players**
   - name, createdBy

### Real-time Updates
- All changes sync instantly across devices
- Multiple people can score the same game simultaneously
- Firestore listeners update the UI automatically

## Common Issues

### "No players yet. Add one above!"
→ You need to add at least one player first

### "Please select at least 2 players"
→ Select 2+ players before starting a game

### Stuck on loading screen
→ Check Firebase console for authentication status

### Scores not updating
→ Check browser console for Firestore errors

## Development Tips

### View Firestore Data
1. Go to [Firestore Console](https://console.firebase.google.com/u/0/project/golfgamblingapp/firestore)
2. You'll see collections: games, holes, scores, players
3. Click to view/edit documents

### Clear Test Data
To start fresh, delete all documents in Firestore collections.

### Hot Reload
Changes to code will hot-reload automatically in the browser.

## Next Steps

### For Users
1. Create an account
2. Add your regular golf group as players
3. Start tracking your games!
4. View the leaderboard after each round

### For Developers
See `REACT_NATIVE_MIGRATION_PLAN.md` for:
- Complete architecture details
- UI/UX design specifications
- Future feature roadmap
- Implementation guidelines

See `IMPLEMENTATION_SUMMARY.md` for:
- What's been built
- Technical details
- File structure
- Next features to implement

## Support

- Check `README.md` for installation instructions
- Review `REACT_NATIVE_MIGRATION_PLAN.md` for architecture
- Examine `IMPLEMENTATION_SUMMARY.md` for implementation details

---

**Enjoy tracking your golf gambling games!** ⛳🏆
