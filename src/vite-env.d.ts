/// <reference types="vite/client" />

interface ElectronAPI {
  saveAssessment: (data: unknown) => Promise<unknown>;
  getAssessments: () => Promise<unknown[]>;

  saveCompany: (data: unknown) => Promise<unknown>;
  getCompanies: (filters?: unknown) => Promise<unknown[]>;
  getCompany: (id: string) => Promise<unknown>;
  deleteCompany: (id: string) => Promise<void>;
  autoEvaluateCompany: (companyId: string) => Promise<unknown>;

  importData: (format: string, data: unknown) => Promise<{ success: boolean; count: number }>;
  getDataSources: () => Promise<unknown[]>;
  saveDataSource: (config: unknown) => Promise<void>;
  deleteDataSource: (sourceId: string) => Promise<void>;
  searchJobs: (query: string) => Promise<unknown[]>;
  saveJobs: (jobs: unknown[]) => Promise<{ success: boolean; count: number }>;
  getJobListings: () => Promise<unknown[]>;
  runCrawler: (config: unknown) => Promise<{ success: boolean; count: number; jobs?: unknown[] }>;

  getSettings: () => Promise<unknown>;
  saveSettings: (settings: unknown) => Promise<void>;
  exportSettings: () => Promise<{ success: boolean; path?: string }>;
  importSettings: () => Promise<{ success: boolean }>;

  exportData: () => Promise<{ success: boolean; path?: string }>;
  importDataBackup: (data: unknown) => Promise<{ success: boolean; count: number }>;

  chatWithAI: (messages: Array<{ role: string; content: string }>) => Promise<string>;
  getAIProviders: () => Promise<Array<{ id: string; name: string; model: string; baseUrl: string }>>;
  getAIModels: () => Promise<string[]>;
  verifyAIProvider: (provider: unknown) => Promise<{ success: boolean; content: string }>;
  saveAIProviders: (providers: unknown[], activeProviderId: string) => Promise<void>;
  getActiveAIProvider: () => Promise<unknown>;

  getProfile: () => Promise<unknown>;
  saveProfile: (profile: unknown) => Promise<void>;
  getResume: () => Promise<unknown>;
  saveResume: (resume: unknown) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
