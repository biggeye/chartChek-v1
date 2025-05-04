import { create } from 'zustand';
import { 
    KipuConsentForm, 
    KipuConsentFormRecord, 
    KipuDiagnosisHistory, 
    KipuProgramHistory 
} from '../../lib/kipu/service/medical-records-service';

export type RecordType = 'consentForms' | 'consentRecords' | 'diagnosisHistory' | 'programHistory';

export interface LoadingState {
  consentForms: boolean;
  consentRecords: boolean;
  diagnosisHistory: boolean;
  programHistory: boolean;
}

export interface ErrorState {
  consentForms: string | null;
  consentRecords: string | null;
  diagnosisHistory: string | null;
  programHistory: string | null;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  recordsPerPage: number;
}

export interface FilterState {
  searchTerm: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  status: string[];
}

export interface MedicalRecordsStore {
  // Data
  consentForms: KipuConsentForm[];
  consentFormRecords: KipuConsentFormRecord[];
  diagnosisHistory: KipuDiagnosisHistory[];
  programHistory: KipuProgramHistory[];
  
  // UI State
  selectedConsentForm: KipuConsentForm | null;
  selectedConsentRecord: KipuConsentFormRecord | null;
  expandedSections: RecordType[];
  isLoading: boolean;
  loadingState: LoadingState;
  error: string | null;
  errorState: ErrorState;
  pagination: PaginationState;
  filters: FilterState;
  sortConfig: {
    field: string | null;
    direction: 'asc' | 'desc' | null;
  };

  // Setters for medical records
  setConsentForms: (forms: KipuConsentForm[]) => void;
  setConsentFormRecords: (records: KipuConsentFormRecord[]) => void;
  setDiagnosisHistory: (diagnoses: KipuDiagnosisHistory[]) => void;
  setProgramHistory: (programs: KipuProgramHistory[]) => void;
  
  // Selection management
  selectConsentForm: (form: KipuConsentForm | null) => void;
  selectConsentRecord: (record: KipuConsentFormRecord | null) => void;
  
  // Section expansion
  toggleSection: (section: RecordType) => void;
  expandSection: (section: RecordType) => void;
  collapseSection: (section: RecordType) => void;
  expandAllSections: () => void;
  collapseAllSections: () => void;
  
  // Loading state management
  setIsLoading: (isLoading: boolean) => void;
  setLoadingState: (type: RecordType, isLoading: boolean) => void;
  
  // Error state management
  setError: (error: string | null) => void;
  setErrorState: (type: RecordType, error: string | null) => void;
  
  // Pagination
  setPagination: (pagination: Partial<PaginationState>) => void;
  nextPage: () => void;
  previousPage: () => void;
  
  // Filtering and Sorting
  setFilters: (filters: Partial<FilterState>) => void;
  setSortConfig: (field: string, direction: 'asc' | 'desc') => void;
  clearFilters: () => void;
  
  // Store reset
  clearStore: () => void;
}

const initialLoadingState: LoadingState = {
  consentForms: false,
  consentRecords: false,
  diagnosisHistory: false,
  programHistory: false
};

const initialErrorState: ErrorState = {
  consentForms: null,
  consentRecords: null,
  diagnosisHistory: null,
  programHistory: null
};

const initialPaginationState: PaginationState = {
  currentPage: 1,
  totalPages: 1,
  recordsPerPage: 10
};

const initialFilterState: FilterState = {
  searchTerm: '',
  dateRange: {
    start: null,
    end: null
  },
  status: []
};

export const useMedicalRecordsStore = create<MedicalRecordsStore>((set) => ({
  // Initial Data State
  consentForms: [],
  consentFormRecords: [],
  diagnosisHistory: [],
  programHistory: [],
  
  // Initial UI State
  selectedConsentForm: null,
  selectedConsentRecord: null,
  expandedSections: ['consentForms'],
  isLoading: false,
  loadingState: initialLoadingState,
  error: null,
  errorState: initialErrorState,
  pagination: initialPaginationState,
  filters: initialFilterState,
  sortConfig: {
    field: null,
    direction: null
  },

  // Data Setters
  setConsentForms: (forms) => set({ consentForms: forms }),
  setConsentFormRecords: (records) => set({ consentFormRecords: records }),
  setDiagnosisHistory: (diagnoses) => set({ diagnosisHistory: diagnoses }),
  setProgramHistory: (programs) => set({ programHistory: programs }),
  
  // Selection Management
  selectConsentForm: (form) => set({ selectedConsentForm: form }),
  selectConsentRecord: (record) => set({ selectedConsentRecord: record }),
  
  // Section Expansion
  toggleSection: (section) => set((state) => ({
    expandedSections: state.expandedSections.includes(section)
      ? state.expandedSections.filter(s => s !== section)
      : [...state.expandedSections, section]
  })),
  expandSection: (section) => set((state) => ({
    expandedSections: state.expandedSections.includes(section)
      ? state.expandedSections
      : [...state.expandedSections, section]
  })),
  collapseSection: (section) => set((state) => ({
    expandedSections: state.expandedSections.filter(s => s !== section)
  })),
  expandAllSections: () => set({
    expandedSections: ['consentForms', 'consentRecords', 'diagnosisHistory', 'programHistory']
  }),
  collapseAllSections: () => set({ expandedSections: [] }),
  
  // Loading State Management
  setIsLoading: (isLoading) => set({ isLoading }),
  setLoadingState: (type, isLoading) => set((state) => ({
    loadingState: { ...state.loadingState, [type]: isLoading }
  })),
  
  // Error State Management
  setError: (error) => set({ error }),
  setErrorState: (type, error) => set((state) => ({
    errorState: { ...state.errorState, [type]: error }
  })),
  
  // Pagination Management
  setPagination: (pagination) => set((state) => ({
    pagination: { ...state.pagination, ...pagination }
  })),
  nextPage: () => set((state) => ({
    pagination: {
      ...state.pagination,
      currentPage: Math.min(state.pagination.currentPage + 1, state.pagination.totalPages)
    }
  })),
  previousPage: () => set((state) => ({
    pagination: {
      ...state.pagination,
      currentPage: Math.max(state.pagination.currentPage - 1, 1)
    }
  })),
  
  // Filter and Sort Management
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  setSortConfig: (field, direction) => set({
    sortConfig: { field, direction }
  }),
  clearFilters: () => set({
    filters: initialFilterState,
    sortConfig: { field: null, direction: null }
  }),
  
  // Store Reset
  clearStore: () => set({
    consentForms: [],
    consentFormRecords: [],
    diagnosisHistory: [],
    programHistory: [],
    selectedConsentForm: null,
    selectedConsentRecord: null,
    expandedSections: ['consentForms'],
    isLoading: false,
    loadingState: initialLoadingState,
    error: null,
    errorState: initialErrorState,
    pagination: initialPaginationState,
    filters: initialFilterState,
    sortConfig: { field: null, direction: null }
  }),
})); 