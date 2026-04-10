# Golf Gambling Tracker - React Native

A modern React Native application for tracking golf gambling games using match play scoring with multipliers.

## Features

- **User Authentication**: Sign in with email/password using Firebase Auth
- **Game Management**: Create and track golf games with multiple players
- **Score Tracking**: 18-hole scoring with real-time calculations
- **Multipliers**: Support for Up (2x), Burn (3x), Birdie (2x), and Eagle (3x) multipliers
- **Match Play Scoring**: Round-robin player vs player scoring
- **Real-time Sync**: Firebase Firestore real-time database
- **Professional UI**: Modern Material Design 3 themed interface

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Zustand
- **Backend**: Firebase (Auth + Firestore)
- **Navigation**: React Navigation v6
- **UI Components**: Custom components with Material Design 3 theme

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (optional, npx can be used)

## Installation

1. Navigate to the project directory:
```bash
cd golf-gambling-rn
```

2. Install dependencies:
```bash
npm install
```

## Running the App

### Development Mode

**Web:**
```bash
npm run web
```

**Android:**
```bash
npm run android
```

**iOS (Mac only):**
```bash
npm run ios
```

### Using Expo Go

1. Install Expo Go on your mobile device
2. Run:
```bash
npx expo start
```
3. Scan the QR code with Expo Go (Android) or Camera app (iOS)

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── common/      # Base components (Button, Card, Input, Badge)
│   ├── scoring/     # Scoring-specific components
│   └── players/     # Player-related components
├── screens/         # Screen components
│   ├── auth/        # Login/Register screens
│   ├── home/        # Home dashboard
│   ├── game/        # Game Setup, Scoring, Summary
│   ├── history/     # Game History
│   ├── players/     # Player management
│   └── settings/    # App settings
├── services/        # External service integrations
│   └── firebase/    # Firebase configuration and services
├── store/           # Zustand state management
│   └── slices/      # Store slices (auth, game, settings)
├── types/           # TypeScript type definitions
├── theme/           # Theme configuration (colors, typography, spacing)
├── utils/           # Utility functions
│   └── scoreCalculator.ts  # Baccarat scoring algorithm
└── navigation/      # Navigation configuration
```

## Firebase Setup

The app is currently configured to use an existing Firebase project. To use your own:

1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Update `src/services/firebase/config.ts` with your Firebase configuration

## Authentication

The app requires authentication to use. For testing:

1. Run the app
2. On the login screen, click "Create Account" (coming soon)
3. Or create a user manually in Firebase Console

**Temporary Testing**: You can modify the Firebase Security Rules to allow anonymous access for testing.

## Key Features Explained

### Scoring Algorithm

The app uses a match play scoring system:
- Each player competes against every other player on each hole
- Lower net score (strokes - handicap) wins
- Winner gets +1 point, loser gets -1 point
- Multipliers stack: Up (2x) × Burn (3x) × Birdie (2x) × Eagle (3x)

### Real-time Updates

- All game data syncs in real-time across devices
- Firestore listeners update the UI automatically
- Scores, holes, and player data are reactive

## Development Notes

### Completed Features
- ✅ User authentication
- ✅ Game creation and setup
- ✅ Player management
- ✅ 18-hole scoring interface
- ✅ Real-time score calculations
- ✅ Multiplier support
- ✅ Basic navigation

### Coming Soon
- Game history with detailed statistics
- Player statistics and leaderboards
- Enhanced game summary screen
- Dark mode
- Haptic feedback
- Share functionality
- Offline support

## Troubleshooting

### Common Issues

**"Module not found"**: Run `npm install` again

**Firebase errors**: Check that Firebase configuration is correct in `src/services/firebase/config.ts`

**Navigation errors**: Make sure all screens are properly registered in `src/navigation/AppNavigator.tsx`

## Contributing

This is a migration from Flutter to React Native. See `REACT_NATIVE_MIGRATION_PLAN.md` for detailed implementation plans.

## License

Private project
