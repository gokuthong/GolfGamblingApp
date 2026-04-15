import { StateCreator } from 'zustand';
import { UserSettings } from '../../types';

export interface SettingsSlice {
  settings: UserSettings;
  setSettings: (settings: Partial<UserSettings>) => void;
  toggleDarkMode: () => void;
  toggleHapticFeedback: () => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  settings: {
    darkMode: false,
    hapticFeedback: true,
    defaultHandicap: 0,
  },
  setSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
  toggleDarkMode: () =>
    set((state) => ({
      settings: { ...state.settings, darkMode: !state.settings.darkMode },
    })),
  toggleHapticFeedback: () =>
    set((state) => ({
      settings: { ...state.settings, hapticFeedback: !state.settings.hapticFeedback },
    })),
});
