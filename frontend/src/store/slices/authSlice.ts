import { User as FirebaseUser } from "firebase/auth";
import { StateCreator } from "zustand";

export interface AuthSlice {
  user: FirebaseUser | null;
  isLoading: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
});
