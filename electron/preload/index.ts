import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  // Assessment
  saveAssessment: (data: unknown) => Promise<unknown>;
  getAssessments: () => Promise<unknown[]>;
  
  // Company
  saveCompany: (data: unknown) => Promise<unknown>;
  getCompanies: (filters?: unknown) => Promise<unknown[]>;
  getCompany: (id: string) => Promise<unknown>;
  deleteCompany: (id: string) => Promise<void>;
  
  // Crawler / Data Import
  importData: (format: string, data: unknown) => Promise<{ success: boolean; count: number }>;
  getDataSources: () => Promise<unknown[]>;
  saveDataSource: (config: unknown) => Promise<void>;
  
  // Settings
  getSettings: () => Promise<unknown>;
  saveSettings: (settings: unknown) => Promise<void>;
  
  // AI
  chatWithAI: (messages: Array<{ role: string; content: string }>) => Promise<string>;
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
  
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  
  chatWithAI: (messages) => ipcRenderer.invoke('ai:chat', messages),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type { ElectronAPI };
