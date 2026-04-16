import { create } from "zustand";
import { AuthSlice, createAuthSlice } from "./slices/authSlice";
import { GameSlice, createGameSlice } from "./slices/gameSlice";
import { SettingsSlice, createSettingsSlice } from "./slices/settingsSlice";

export type StoreState = AuthSlice & GameSlice & SettingsSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createGameSlice(...a),
  ...createSettingsSlice(...a),
}));

// Selector hooks to prevent unnecessary re-renders
export const useAuth = () =>
  useStore((state) => ({ user: state.user, isLoading: state.isLoading }));
export const useSettings = () => useStore((state) => state.settings);
export const useCurrentGame = () =>
  useStore((state) => ({
    currentGameId: state.currentGameId,
    currentGame: state.currentGame,
    currentHoleIndex: state.currentHoleIndex,
  }));
