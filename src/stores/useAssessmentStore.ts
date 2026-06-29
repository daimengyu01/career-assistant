import { create } from 'zustand';
import type { AssessmentResult } from '../types/assessment';

interface AssessmentState {
  results: AssessmentResult[];
  currentResult: AssessmentResult | null;
  setResults: (results: AssessmentResult[]) => void;
  addResult: (result: AssessmentResult) => void;
  setCurrentResult: (result: AssessmentResult | null) => void;
  clearResults: () => void;
}

export const useAssessmentStore = create<AssessmentState>((set) => ({
  results: [],
  currentResult: null,
  setResults: (results) => set({ results }),
  addResult: (result) =>
    set((state) => ({ results: [result, ...state.results] })),
  setCurrentResult: (currentResult) => set({ currentResult }),
  clearResults: () => set({ results: [], currentResult: null }),
}));
