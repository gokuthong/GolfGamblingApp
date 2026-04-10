# Golf Baccarat Tracker

A Flutter application for tracking golf scores and calculating complex gambling debts between players using "Match Play" style scoring with multipliers.

## Features

- **18-Hole Score Tracking**: Track strokes and handicaps for up to 4 players across 18 holes
- **Real-time Point Calculation**: Automatic calculation based on the Baccarat algorithm
- **Match Play Scoring**: Every player competes against every other player on each hole
- **Dynamic Multipliers**:
  - "Up" status (2x multiplier)
  - "Burn" status (3x multiplier)
  - Birdie bonus (2x multiplier)
  - Eagle bonus (3x multiplier)
- **Firebase Integration**: All data persists to Firestore in real-time
- **Spreadsheet-style UI**: Easy data entry with PlutoGrid

## The Baccarat Algorithm

### Base Logic (Per Hole, Per Pair)
1. Calculate Net Score: `PlayerStrokes - PlayerHoleHandicap`
2. Winner gets **1 Base Point** from the Loser
3. Draws result in 0 points

### Multipliers (Cumulative)
Multipliers apply to the entire hole's point value and multiply together:

1. **"Up" Status**: If toggled, points x2
2. **"Burn" Status**: If toggled, points x3
3. **Birdie Rule**: If ANY player scores exactly 1 stroke under Par (Gross), points x2
4. **Eagle Rule**: If ANY player scores 2+ strokes under Par (Gross), points x3

**Example:**
- Hole Status: "Up" (x2)
- One player hits a Birdie (x2)
- Base Point for a win: 1
- **Final Value:** 1 × 2 (Up) × 2 (Birdie) = **4 points per win on this hole**

## Setup Instructions

### 1. Firebase Configuration

You need to configure Firebase for your project:

1. Go to your Firebase Console: https://console.firebase.google.com/u/0/project/golfgamblingapp/overview

2. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

3. Login to Firebase:
   ```bash
   firebase login
   ```

4. Install FlutterFire CLI:
   ```bash
   dart pub global activate flutterfire_cli
   ```

5. Configure Firebase for your Flutter project:
   ```bash
   cd golf_baccarat_tracker
   flutterfire configure --project=golfgamblingapp
   ```

   This will:
   - Create platform-specific Firebase config files
   - Update `lib/firebase_options.dart` with your actual Firebase credentials

### 2. Install Dependencies

```bash
cd golf_baccarat_tracker
flutter pub get
```

### 3. Run the Application

```bash
flutter run
```

Or select your target device in VS Code/Android Studio and run.

## Firestore Data Structure

### Collections

#### `games`
```json
{
  "id": "auto-generated",
  "date": "Timestamp",
  "status": "active|completed",
  "playerIds": ["player1Id", "player2Id", ...]
}
```

#### `holes`
```json
{
  "id": "auto-generated",
  "gameId": "reference-to-game",
  "holeNumber": 1-18,
  "par": 3|4|5,
  "isUp": false,
  "isBurn": false
}
```

#### `scores`
```json
{
  "id": "auto-generated",
  "holeId": "reference-to-hole",
  "playerId": "reference-to-player",
  "strokes": 0-15,
  "handicap": 0-2
}
```

#### `players`
```json
{
  "id": "auto-generated",
  "name": "Player Name"
}
```

## Usage Guide

### Creating a Game

1. **Launch the app** - You'll see the Game Setup screen
2. **Add Players**:
   - Enter a player name in the text field
   - Click "Add" to create the player
   - Newly added players are auto-selected
3. **Select Players** - Check/uncheck players from the list (minimum 2 required)
4. **Create Game** - Click "Create Game" button
   - This initializes 18 holes with standard par values
   - Navigates to the scoring screen

### Entering Scores

The main scoring screen displays a spreadsheet-style table with:

- **Rows**: 18 holes + 1 total row
- **Columns**:
  - Hole # (read-only)
  - Par (editable)
  - Up toggle (clickable)
  - Burn toggle (clickable)
  - For each player: Strokes, Handicap, Points

#### How to Use:

1. **Edit Par**: Click on a Par cell and enter the value (3, 4, or 5)
2. **Toggle Up/Burn**: Click on the Up or Burn cells to toggle multipliers
3. **Enter Strokes**: Click on a player's Strokes cell and enter their gross score
4. **Enter Handicap**: Click on a player's Handicap cell and enter their hole handicap (0-2)
5. **View Points**: The Points column updates automatically based on the Baccarat algorithm

### Understanding Points Display

- **Green background**: Player is winning (positive points)
- **Red background**: Player is losing (negative points)
- **Blue background**: Neutral (zero points)
- Points are accumulated running totals from holes 1 through the current hole

## Project Structure

```
lib/
├── main.dart                          # App entry point
├── firebase_options.dart              # Firebase configuration
├── models/
│   ├── game.dart                      # Game data model
│   ├── hole.dart                      # Hole data model
│   ├── score.dart                     # Score data model
│   └── player.dart                    # Player data model
├── services/
│   ├── firestore_service.dart         # Firestore CRUD operations
│   └── score_calculator.dart          # Baccarat algorithm implementation
├── providers/
│   └── game_providers.dart            # Riverpod state providers
└── screens/
    ├── game_setup_screen.dart         # Initial setup screen
    └── scoring_screen.dart            # Main scoring table
```

## Tech Stack

- **Framework**: Flutter (Latest Stable)
- **State Management**: Riverpod
- **Backend**: Firebase Firestore
- **UI Components**: PlutoGrid for data table

## Key Classes

### `ScoreCalculator`
Located in `lib/services/score_calculator.dart`

Main methods:
- `calculateHolePoints()` - Calculates points for all players on a single hole
- `calculateTotalPoints()` - Calculates accumulated points across all holes
- `getDetailedHoleResults()` - Returns detailed results including multipliers

### `FirestoreService`
Located in `lib/services/firestore_service.dart`

Handles all Firebase operations:
- Game CRUD
- Hole CRUD
- Score upsert
- Player management
- Batch operations

## Troubleshooting

### Firebase Connection Issues

If you see Firebase errors:
1. Ensure you've run `flutterfire configure`
2. Check that `lib/firebase_options.dart` has your actual credentials
3. Verify your Firebase project ID is `golfgamblingapp`

### PlutoGrid Not Displaying

If the table doesn't show:
1. Ensure you have at least 2 players selected
2. Check that holes were initialized (18 holes should exist)
3. Verify Firestore security rules allow read/write

### Developer Mode Warning (Windows)

If you see "Building with plugins requires symlink support":
1. Run `start ms-settings:developers`
2. Enable Developer Mode
3. Restart your terminal

## Future Enhancements

- Export game results to PDF/CSV
- Historical game tracking
- Player statistics dashboard
- Custom par configurations
- Side bet tracking
- Multi-round tournaments

## License

This project is private and not licensed for public use.
