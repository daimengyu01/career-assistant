/// <reference types="vite/client" />

interface ElectronAPI {
  saveAssessment: (data: unknown) => Promise<unknown>;
  getAssessments: () => Promise<unknown[]>;
  saveCompany: (data: unknown) => Promise<unknown>;
  getCompanies: (filters?: unknown) => Promise<unknown[]>;
  getCompany: (id: string) => Promise<unknown>;
  deleteCompany: (id: string) => Promise<void>;
  importData: (format: string, data: unknown) => Promise<{ success: boolean; count: number }>;
  getDataSources: () => Promise<unknown[]>;
  saveDataSource: (config: unknown) => Promise<void>;
  getSettings: () => Promise<unknown>;
  saveSettings: (settings: unknown) => Promise<void>;
  chatWithAI: (messages: Array<{ role: string; content: string }>) => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
