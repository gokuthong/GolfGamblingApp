import { create } from 'zustand';
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createGameSlice, GameSlice } from './slices/gameSlice';
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice';

type StoreState = AuthSlice & GameSlice & SettingsSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createGameSlice(...a),
  ...createSettingsSlice(...a),
}));

// Individual selectors to prevent unnecessary re-renders
export const useUser = () => useStore((state) => state.user);
export const useIsLoading = () => useStore((state) => state.isLoading);
export const useSetUser = () => useStore((state) => state.setUser);
export const useSetLoading = () => useStore((state) => state.setLoading);

// Combined hook for auth (still simple)
export const useAuth = () => ({
  user: useUser(),
  isLoading: useIsLoading(),
  setUser: useSetUser(),
  setLoading: useSetLoading(),
});

export const useCurrentGame = () =>
  useStore((state) => ({
    currentGameId: state.currentGameId,
    currentGame: state.currentGame,
    currentHoleIndex: state.currentHoleIndex,
    setCurrentGameId: state.setCurrentGameId,
    setCurrentGame: state.setCurrentGame,
    setCurrentHoleIndex: state.setCurrentHoleIndex,
    clearGame: state.clearGame,
  }));

export const useSettings = () =>
  useStore((state) => ({
    settings: state.settings,
    setSettings: state.setSettings,
    toggleDarkMode: state.toggleDarkMode,
    toggleHapticFeedback: state.toggleHapticFeedback,
  }));
