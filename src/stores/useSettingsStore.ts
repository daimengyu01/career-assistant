import { create } from 'zustand';

interface AiProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface SettingsState {
  aiProviders: AiProvider[];
  activeProviderId: string | null;
  setAiProviders: (providers: AiProvider[]) => void;
  setActiveProviderId: (id: string) => void;
  loadFromBackend: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  aiProviders: [],
  activeProviderId: null,
  setAiProviders: (aiProviders) => set({ aiProviders }),
  setActiveProviderId: (activeProviderId) => set({ activeProviderId }),
  loadFromBackend: async () => {
    try {
      const settings = await window.electronAPI?.getSettings();
      if (settings && typeof settings === 'object') {
        const s = settings as Record<string, unknown>;
        if (Array.isArray(s.aiProviders)) {
          set({ aiProviders: s.aiProviders as AiProvider[] });
        }
        if (typeof s.activeProviderId === 'string') {
          set({ activeProviderId: s.activeProviderId });
        }
      }
    } catch (e) {
      console.error('Failed to load settings from backend:', e);
    }
  },
}));
