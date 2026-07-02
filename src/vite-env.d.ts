/// <reference types="vite/client" />

import type { Company, CompanyFilters } from './types/company';
import type { UserProfile } from './types/user';
import type { AssessmentResult } from './types/assessment';
import type { DataSource } from './types/crawler';

interface ElectronAPI {
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

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
