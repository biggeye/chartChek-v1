import { create } from 'zustand';
import { KipuProgramHistory } from '~/lib/kipu/service/medical-records-service';

interface ProgramHistoryState {
  programs: KipuProgramHistory[];
  total: number;
  isLoading: boolean;
  error: string | null;
  sortField: 'startDate' | 'program' | 'status';
  sortOrder: 'asc' | 'desc';
  statusFilter: string;

  // Actions
  setPrograms: (programs: KipuProgramHistory[], total: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSortField: (field: 'startDate' | 'program' | 'status') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setStatusFilter: (status: string) => void;
  reset: () => void;
}

const initialState = {
  programs: [],
  total: 0,
  isLoading: false,
  error: null,
  sortField: 'startDate' as const,
  sortOrder: 'desc' as const,
  statusFilter: 'all'
};

export const useProgramHistoryStore = create<ProgramHistoryState>((set) => ({
  ...initialState,

  // Setters
  setPrograms: (programs, total) => set({ programs, total }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSortField: (sortField) => set({ sortField }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  
  // Reset state
  reset: () => set(initialState)
})); 