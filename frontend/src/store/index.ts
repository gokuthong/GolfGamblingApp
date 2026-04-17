import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { AuthSlice, createAuthSlice } from "./slices/authSlice";
import { GameSlice, createGameSlice } from "./slices/gameSlice";
import { SettingsSlice, createSettingsSlice } from "./slices/settingsSlice";

export type StoreState = AuthSlice & GameSlice & SettingsSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createGameSlice(...a),
  ...createSettingsSlice(...a),
}));

// Object-returning selectors must use useShallow to avoid infinite re-renders
// (Zustand's default Object.is equality treats each new {} as different).
export const useAuth = () =>
  useStore(
    useShallow((state) => ({ user: state.user, isLoading: state.isLoading })),
  );
export const useSettings = () => useStore((state) => state.settings);
export const useCurrentGame = () =>
  useStore(
    useShallow((state) => ({
      currentGameId: state.currentGameId,
      currentGame: state.currentGame,
      currentHoleIndex: state.currentHoleIndex,
    })),
  );
