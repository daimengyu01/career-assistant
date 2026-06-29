import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  saveAssessment: (data: unknown) => Promise<unknown>;
  getAssessments: () => Promise<unknown[]>;

  saveCompany: (data: unknown) => Promise<unknown>;
  getCompanies: (filters?: unknown) => Promise<unknown[]>;
  getCompany: (id: string) => Promise<unknown>;
  deleteCompany: (id: string) => Promise<void>;

  importData: (format: string, data: unknown) => Promise<{ success: boolean; count: number }>;
  getDataSources: () => Promise<unknown[]>;
  saveDataSource: (config: unknown) => Promise<void>;
  searchJobs: (query: string) => Promise<unknown[]>;

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
}

const electronAPI: ElectronAPI = {
  saveAssessment: (data) => ipcRenderer.invoke('assessment:save', data),
  getAssessments: () => ipcRenderer.invoke('assessment:getAll'),

  saveCompany: (data) => ipcRenderer.invoke('company:save', data),
  getCompanies: (filters) => ipcRenderer.invoke('company:getAll', filters),
  getCompany: (id) => ipcRenderer.invoke('company:get', id),
  deleteCompany: (id) => ipcRenderer.invoke('company:delete', id),

  importData: (format, data) => ipcRenderer.invoke('crawler:import', format, data),
  getDataSources: () => ipcRenderer.invoke('crawler:getSources'),
  saveDataSource: (config) => ipcRenderer.invoke('crawler:saveSource', config),
  searchJobs: (query) => ipcRenderer.invoke('crawler:searchJobs', query),

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
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type { ElectronAPI };
