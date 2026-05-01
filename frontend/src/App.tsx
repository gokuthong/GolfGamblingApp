import { useEffect, useState, useCallback } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { authService } from "./services/firebase";
import { localStorageService } from "./services/storage";
import { dataService } from "./services/DataService";
import {
  migrateLocalDataToFirestore,
  seedLocalCacheFromFirestore,
  backfillHoleConfirmedFlag,
} from "./services/dataMigration";
import { connectivityManager } from "./services/connectivity";
import { syncService } from "./services/sync";
import { useStore } from "./store";
import { darkColors } from "./theme/colors";
import { AppRouter } from "./router";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const setStoreUser = useStore((state) => state.setUser);
  const setStoreLoading = useStore((state) => state.setLoading);

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
        console.error("Migration failed:", error);
      }

      // Set up Firebase auth listener
      const unsubscribe = authService.onAuthStateChanged(
        async (firebaseUser) => {
          if (firebaseUser) {
            // Switch DataService to online mode for authenticated users
            dataService.setMode("online", firebaseUser.uid);

            // Run one-time migration from local storage to Firestore
            try {
              await migrateLocalDataToFirestore(firebaseUser.uid);
            } catch (error) {
              console.error("Migration failed:", error);
            }

            // Seed local cache from Firestore for offline reads
            try {
              await seedLocalCacheFromFirestore(firebaseUser.uid);
            } catch (error) {
              console.error("Cache seeding failed:", error);
            }

            // Push any pending local changes to Firestore
            syncService.syncAll();

            // User is authenticated - load their profile from Firestore
            const userProfile = await dataService.getUserProfile(
              firebaseUser.uid,
            );

            const approvalStatus = userProfile?.approvalStatus || "approved";

            // Only allow approved users
            if (approvalStatus !== "approved") {
              await authService.signOut();
              dataService.setMode("offline");
              setStoreUser(null as any);
              setStoreLoading(false);
              setIsLoading(false);
              return;
            }

            // Merge Firebase user with profile data
            const fullUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName:
                firebaseUser.displayName || userProfile?.displayName || "User",
              photoURL: firebaseUser.photoURL,
              userNumber: userProfile?.userNumber || "000",
              role: userProfile?.role || "user",
              approvalStatus,
              isOffline: false,
              settings: userProfile?.settings || {
                darkMode: false,
                hapticFeedback: true,
                defaultHandicap: 0,
              },
            };

            setStoreUser(fullUser as any);

            // Apply dark mode setting from user profile
            if (userProfile?.settings?.darkMode) {
              useStore.getState().setSettings({ darkMode: true });
            }

            // Run cleanup for authenticated users
            try {
              await dataService.deleteGamesOlderThan(firebaseUser.uid, 14);
              await dataService.enforceGameLimit(firebaseUser.uid, 5);
            } catch (error) {
              console.error("Failed to run cleanup:", error);
            }
          } else {
            // No authenticated user - switch to offline mode
            dataService.setMode("offline");
            setStoreUser(null as any);
          }

          setStoreLoading(false);
          setIsLoading(false);
        },
      );

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
  }, [setStoreUser, setStoreLoading]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100dvh",
          width: "100vw",
          bgcolor: darkColors.background.primary,
        }}
      >
        <CircularProgress sx={{ color: darkColors.accent.gold }} size={40} />
        <Typography
          sx={{
            mt: 2,
            color: darkColors.text.secondary,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16,
          }}
        >
          Loading...
        </Typography>
      </Box>
    );
  }

  return <AppRouter />;
}
