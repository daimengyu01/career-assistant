import { create } from 'zustand';
import type { UserProfile } from '../types/user';

interface UserState {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearProfile: () => void;
  loadFromBackend: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  updateProfile: (updates) => {
    const current = get().profile;
    if (!current) {
      set({ profile: null });
      return;
    }
    const updated: UserProfile = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    set({ profile: updated });
    if (window.electronAPI?.saveProfile) {
      window.electronAPI.saveProfile(updated).catch((e) => {
        console.error('Failed to persist profile to backend:', e);
      });
    }
  },
  clearProfile: () => set({ profile: null }),
  loadFromBackend: async () => {
    try {
      const profile = await window.electronAPI?.getProfile?.();
      if (profile) {
        set({ profile: profile as UserProfile });
      }
    } catch (e) {
      console.error('Failed to load profile from backend:', e);
    }
  },
}));
