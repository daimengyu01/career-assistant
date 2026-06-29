import { create } from 'zustand';
import type { Company, CompanyFilters } from '../types/company';

interface CompanyState {
  companies: Company[];
  filters: CompanyFilters;
  setCompanies: (companies: Company[]) => void;
  addCompany: (company: Company) => void;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  removeCompany: (id: string) => void;
  setFilters: (filters: CompanyFilters) => void;
  clearFilters: () => void;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  companies: [],
  filters: {},
  setCompanies: (companies) => set({ companies }),
  addCompany: (company) =>
    set((state) => ({ companies: [company, ...state.companies] })),
  updateCompany: (id, updates) =>
    set((state) => ({
      companies: state.companies.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeCompany: (id) =>
    set((state) => ({
      companies: state.companies.filter((c) => c.id !== id),
    })),
  setFilters: (filters) => set({ filters }),
  clearFilters: () => set({ filters: {} }),
}));
