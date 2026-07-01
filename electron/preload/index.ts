import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
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

const electronAPI: ElectronAPI = {
  saveAssessment: (data) => ipcRenderer.invoke('assessment:save', data),
  getAssessments: () => ipcRenderer.invoke('assessment:getAll'),

  saveCompany: (data) => ipcRenderer.invoke('company:save', data),
  getCompanies: (filters) => ipcRenderer.invoke('company:getAll', filters),
  getCompany: (id) => ipcRenderer.invoke('company:get', id),
  deleteCompany: (id) => ipcRenderer.invoke('company:delete', id),
  autoEvaluateCompany: (companyId) => ipcRenderer.invoke('company:autoEvaluate', companyId),

  importData: (format, data) => ipcRenderer.invoke('crawler:import', format, data),
  getDataSources: () => ipcRenderer.invoke('crawler:getSources'),
  saveDataSource: (config) => ipcRenderer.invoke('crawler:saveSource', config),
  deleteDataSource: (sourceId) => ipcRenderer.invoke('crawler:deleteSource', sourceId),
  searchJobs: (query) => ipcRenderer.invoke('crawler:searchJobs', query),
  saveJobs: (jobs) => ipcRenderer.invoke('crawler:saveJobs', jobs),
  getJobListings: () => ipcRenderer.invoke('crawler:getJobs'),
  runCrawler: (config) => ipcRenderer.invoke('crawler:runCrawler', config),

  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  exportSettings: () => ipcRenderer.invoke('settings:export'),
  importSettings: () => ipcRenderer.invoke('settings:import'),

  exportData: () => ipcRenderer.invoke('data:export'),
  importDataBackup: (data) => ipcRenderer.invoke('data:import', data),

  chatWithAI: (messages) => ipcRenderer.invoke('ai:chat', messages),
  getAIProviders: () => ipcRenderer.invoke('ai:getProviders'),
  getAIModels: () => ipcRenderer.invoke('ai:getModels'),
  verifyAIProvider: (provider) => ipcRenderer.invoke('ai:verifyProvider', provider),
  saveAIProviders: (providers, activeProviderId) => ipcRenderer.invoke('ai:saveProviders', providers, activeProviderId),
  getActiveAIProvider: () => ipcRenderer.invoke('ai:getActiveProvider'),

  getProfile: () => ipcRenderer.invoke('user:getProfile'),
  saveProfile: (profile) => ipcRenderer.invoke('user:saveProfile', profile),
  getResume: () => ipcRenderer.invoke('user:getResume'),
  saveResume: (resume) => ipcRenderer.invoke('user:saveResume', resume),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
