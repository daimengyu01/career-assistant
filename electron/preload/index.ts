import { contextBridge, ipcRenderer } from 'electron';
import type { Company, CompanyFilters } from '../../src/types/company';
import type { UserProfile } from '../../src/types/user';
import type { AssessmentResult } from '../../src/types/assessment';
import type { DataSource } from '../../src/types/crawler';

export interface ElectronAPI {
  // Assessment
  saveAssessment: (data: unknown) => Promise<{ id: string }>;
  getAssessments: () => Promise<AssessmentResult[]>;
  getAssessment: (id: string) => Promise<AssessmentResult | null>;
  deleteAssessment: (id: string) => Promise<void>;

  // Company
  saveCompany: (data: Partial<Company>) => Promise<Company>;
  getCompanies: (filters?: CompanyFilters) => Promise<Company[]>;
  getCompany: (id: string) => Promise<Company | null>;
  deleteCompany: (id: string) => Promise<void>;
  autoEvaluateCompany: (companyId: string) => Promise<{ success: boolean; scores: Record<string, number>; reasons: string[] }>;
  aiAnalyzeCompany: (companyName: string) => Promise<{ success: boolean; data: unknown }>;

  // Crawler / Data sources
  importData: (format: string, data: unknown) => Promise<{ success: boolean; count: number }>;
  getDataSources: () => Promise<DataSource[]>;
  saveDataSource: (config: DataSource) => Promise<void>;
  deleteDataSource: (sourceId: string) => Promise<void>;
  searchJobs: (query: string) => Promise<unknown[]>;
  saveJobs: (jobs: unknown[]) => Promise<{ success: boolean; count: number }>;
  getJobListings: () => Promise<unknown[]>;
  openJobBrowser: (url: string) => Promise<{ success: boolean }>;
  extractJobsFromPage: () => Promise<{ success: boolean; jobs: unknown[]; count: number; source?: string }>;
  closeJobBrowser: () => Promise<{ success: boolean }>;

  // Settings
  getSettings: () => Promise<unknown>;
  saveSettings: (settings: unknown) => Promise<void>;
  exportSettings: () => Promise<{ success: boolean; path?: string }>;
  importSettings: () => Promise<{ success: boolean }>;

  // Backup
  exportData: () => Promise<{ success: boolean; path?: string }>;
  importDataBackup: (data: unknown) => Promise<{ success: boolean; count: number }>;

  // AI
  chatWithAI: (messages: Array<{ role: string; content: string }>) => Promise<string>;
  getAIProviders: () => Promise<Array<{ id: string; name: string; model: string; baseUrl: string }>>;
  getAIModels: () => Promise<string[]>;
  verifyAIProvider: (provider: unknown) => Promise<{ success: boolean; content: string }>;
  saveAIProviders: (providers: unknown[], activeProviderId: string) => Promise<void>;
  getActiveAIProvider: () => Promise<unknown>;

  // User
  getProfile: () => Promise<UserProfile | null>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  getResume: () => Promise<unknown>;
  saveResume: (resume: unknown) => Promise<void>;
  extractPdfText: (filePath: string) => Promise<{ success: boolean; text: string; pageCount: number }>;
}

const electronAPI: ElectronAPI = {
  saveAssessment: (data) => ipcRenderer.invoke('assessment:save', data),
  getAssessments: () => ipcRenderer.invoke('assessment:getAll'),
  getAssessment: (id) => ipcRenderer.invoke('assessment:get', id),
  deleteAssessment: (id) => ipcRenderer.invoke('assessment:delete', id),

  saveCompany: (data) => ipcRenderer.invoke('company:save', data),
  getCompanies: (filters) => ipcRenderer.invoke('company:getAll', filters),
  getCompany: (id) => ipcRenderer.invoke('company:get', id),
  deleteCompany: (id) => ipcRenderer.invoke('company:delete', id),
  autoEvaluateCompany: (companyId) => ipcRenderer.invoke('company:autoEvaluate', companyId),
  aiAnalyzeCompany: (companyName) => ipcRenderer.invoke('company:aiAnalyze', companyName),

  importData: (format, data) => ipcRenderer.invoke('crawler:import', format, data),
  getDataSources: () => ipcRenderer.invoke('crawler:getSources'),
  saveDataSource: (config) => ipcRenderer.invoke('crawler:saveSource', config),
  deleteDataSource: (sourceId) => ipcRenderer.invoke('crawler:deleteSource', sourceId),
  searchJobs: (query) => ipcRenderer.invoke('crawler:searchJobs', query),
  saveJobs: (jobs) => ipcRenderer.invoke('crawler:saveJobs', jobs),
  getJobListings: () => ipcRenderer.invoke('crawler:getJobs'),
  openJobBrowser: (url) => ipcRenderer.invoke('crawler:openBrowser', url),
  extractJobsFromPage: () => ipcRenderer.invoke('crawler:extractJobsFromPage'),
  closeJobBrowser: () => ipcRenderer.invoke('crawler:closeBrowser'),

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
  extractPdfText: (filePath) => ipcRenderer.invoke('user:extractPdfText', filePath),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
