import { create } from 'zustand';

interface SettingsState {
  apiKeys: Record<string, string>;
  aiProvider: string;
  aiModel: string;
  setApiKeys: (keys: Record<string, string>) => void;
  setAiProvider: (provider: string) => void;
  setAiModel: (model: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  apiKeys: {},
  aiProvider: 'deepseek',
  aiModel: 'deepseek-chat',
  setApiKeys: (apiKeys) => set({ apiKeys }),
  setAiProvider: (aiProvider) => set({ aiProvider }),
  setAiModel: (aiModel) => set({ aiModel }),
}));
