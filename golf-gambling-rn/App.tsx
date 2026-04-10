import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  BebasNeue_400Regular,
} from '@expo-google-fonts/bebas-neue';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

import { authService } from './src/services/firebase';
import { localStorageService } from './src/services/storage';
import { dataService } from './src/services/DataService';
import { migrateLocalDataToFirestore, seedLocalCacheFromFirestore } from './src/services/dataMigration';
import { connectivityManager } from './src/services/connectivity';
import { syncService } from './src/services/sync';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { useStore } from './src/store';
import { fontFamilies } from './src/theme';
import { darkColors, lightColors } from './src/theme/colors';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Keep splash screen visible while loading fonts - wrapped in try/catch
// to prevent crash if native module isn't ready
try {
  SplashScreen.preventAutoHideAsync();
} catch (e) {
  // Splash screen native module not available - continue without it
}

// Inner component that has access to theme
const AppContent = ({ user, onReady }: { user: any; onReady: () => void }) => {
  const isDarkMode = useStore((state) => state.settings.darkMode);

  // Use themed colors - dynamically switch based on dark mode
  const themedColors = isDarkMode ? darkColors : lightColors;

  // Custom Paper theme with themed colors and custom fonts
  const baseTheme = isDarkMode ? MD3DarkTheme : MD3LightTheme;
  const paperTheme = {
    ...baseTheme,
    dark: isDarkMode,
    colors: {
      ...baseTheme.colors,
      primary: themedColors.accent.gold,
      primaryContainer: themedColors.primary[700],
      secondary: themedColors.primary[500],
      secondaryContainer: themedColors.primary[800],
      tertiary: themedColors.accent.goldLight,
      surface: themedColors.background.card,
      surfaceVariant: themedColors.surfaces.level2,
      background: themedColors.background.primary,
      error: themedColors.status.error,
      onPrimary: themedColors.text.inverse,
      onPrimaryContainer: themedColors.text.primary,
      onSecondary: themedColors.text.primary,
      onSecondaryContainer: themedColors.text.primary,
      onTertiary: themedColors.text.inverse,
      onSurface: themedColors.text.primary,
      onSurfaceVariant: themedColors.text.secondary,
      onBackground: themedColors.text.primary,
      onError: themedColors.text.primary,
      outline: themedColors.border.medium,
      outlineVariant: themedColors.border.light,
      elevation: {
        level0: themedColors.surfaces.level0,
        level1: themedColors.surfaces.level1,
        level2: themedColors.surfaces.level2,
        level3: themedColors.surfaces.level3,
        level4: themedColors.surfaces.level4,
        level5: themedColors.surfaces.level4,
      },
    },
    fonts: configureFonts({
      config: {
        fontFamily: fontFamilies.body,
      },
    }),
  };

  // Navigation theme to match design
  const navigationTheme = {
    ...DefaultTheme,
    dark: isDarkMode,
    colors: {
      ...DefaultTheme.colors,
      primary: themedColors.accent.gold,
      background: themedColors.background.primary,
      card: themedColors.background.secondary,
      text: themedColors.text.primary,
      border: themedColors.border.light,
      notification: themedColors.accent.gold,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <NavigationContainer theme={navigationTheme} onReady={onReady}>
          {user ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </PaperProvider>
    </GestureHandlerRootView>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setStoreUser = useStore((state) => state.setUser);

  // Load all custom fonts
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize connectivity detection
        await connectivityManager.initialize();
        syncService.initialize();

        // Run migrations first
        await localStorageService.migrateExistingUsers();

        // Initialize super admin (finds user 001 or kp.tey@outlook.com)
        await localStorageService.initializeSuperAdmin();
      } catch (error) {
        console.error('Migration failed:', error);
      }

      // Set up Firebase auth listener
      const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          // Switch DataService to online mode for authenticated users
          dataService.setMode('online', firebaseUser.uid);

          // Run one-time migration from local storage to Firestore
          try {
            await migrateLocalDataToFirestore(firebaseUser.uid);
          } catch (error) {
            console.error('Migration failed:', error);
          }

          // Seed local cache from Firestore for offline reads
          try {
            await seedLocalCacheFromFirestore(firebaseUser.uid);
          } catch (error) {
            console.error('Cache seeding failed:', error);
          }

          // Push any pending local changes to Firestore
          syncService.syncAll();

          // User is authenticated - load their profile from Firestore
          const userProfile = await dataService.getUserProfile(firebaseUser.uid);

          const approvalStatus = userProfile?.approvalStatus || 'approved';

          // Only allow approved users
          if (approvalStatus !== 'approved') {
            await authService.signOut();
            dataService.setMode('offline');
            setUser(null);
            setStoreUser(null as any);
            setIsLoading(false);
            return;
          }

          // Merge Firebase user with profile data
          const fullUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || userProfile?.displayName || 'User',
            photoURL: firebaseUser.photoURL,
            // Add custom fields from profile
            userNumber: userProfile?.userNumber || '000',
            role: userProfile?.role || 'user',
            approvalStatus,
            isOffline: false,
            settings: userProfile?.settings || {
              darkMode: false,
              hapticFeedback: true,
              defaultHandicap: 0,
            },
          };

          setUser(fullUser as any);
          setStoreUser(fullUser as any);

          // Run cleanup for authenticated users
          try {
            await dataService.deleteGamesOlderThan(firebaseUser.uid, 14);
            await dataService.enforceGameLimit(firebaseUser.uid, 5);
          } catch (error) {
            console.error('Failed to run cleanup:', error);
          }
        } else {
          // No authenticated user - switch to offline mode
          dataService.setMode('offline');
          setUser(null);
          setStoreUser(null as any);
        }

        setIsLoading(false);
      });

      return () => {
        unsubscribe();
        connectivityManager.dispose();
        syncService.dispose();
      };
    };

    let cleanup: (() => void) | undefined;
    initializeApp().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [setStoreUser]);

  // Hide splash screen when fonts are loaded
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // Ignore splash screen errors
      }
    }
  }, [fontsLoaded]);

  // Show nothing until fonts are loaded (or font loading fails)
  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: darkColors.background.primary }]} onLayout={onLayoutRootView}>
        <ActivityIndicator size="large" color={darkColors.accent.gold} />
        <Text style={[styles.loadingText, { color: darkColors.text.secondary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent user={user} onReady={onLayoutRootView} />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: fontFamilies.body,
  },
});
