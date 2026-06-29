import { create } from 'zustand';
import type { UserProfile } from '../types/user';

interface UserState {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  updateProfile: (updates) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates, updatedAt: new Date().toISOString() } : null,
    })),
  clearProfile: () => set({ profile: null }),
}));
