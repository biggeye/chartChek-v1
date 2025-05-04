// Patient store types
import {
  PatientBasicInfo,
  KipuPatientEvaluation,
  PatientVitalSign,
} from '../../kipu/kipuAdapter';

// types/store/chat.ts

export interface PatientContext {
  patientId: string | null;
  patientName: string | null;
  facilityId?: string | null;
}
// components/chat/GlobalChatInput.tsx

export type PatientContextOption = {
  id: string;
  label: string;
  value: string;
  category: 'basic' | 'evaluation' | 'vitalSigns' | 'appointments';
}

// Patient context options for filtering and display
export interface PatientContextOptions {
  showInactive: boolean;
  sortBy: 'name' | 'date' | 'status';
  sortOrder: 'asc' | 'desc';
  filterBy: string;
}

// Default patient context options
export const DEFAULT_PATIENT_CONTEXT_OPTIONS: PatientContextOptions = {
  showInactive: false,
  sortBy: 'name',
  sortOrder: 'asc',
  filterBy: ''
};

// Response type for patient with all details
export interface PatientWithDetails {
  patient: PatientBasicInfo;
  evaluations: KipuPatientEvaluation[];
  vitalSigns?: PatientVitalSign[];
}

// Patient store state interface
// Patient store state interface
export interface PatientStore {
  // State
  patients: PatientBasicInfo[];
  selectedPatient: PatientBasicInfo | null;
  isLoadingPatients: boolean; // Added
  error: string | null;

  fetchPatients: (facilityId?: number) => Promise<PatientBasicInfo[]>;
  fetchPatientsAdmissionsByFacility: (facilityId: number, page?: number, limit?: number, startDate?: string, endDate?: string) => Promise<PatientBasicInfo[]>;
  fetchPatientsCensusByFacility: (facilityId: number, page?: number, limit?: number) => Promise<PatientBasicInfo[]>;
  fetchPatientById: (patientId: string) => Promise<PatientBasicInfo | null>;

  // Actions
  selectPatient: (patient: PatientBasicInfo) => void;
  setPatients: (patients: PatientBasicInfo[]) => void;

  setIsLoadingPatients: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  clearPatientStore: () => void;
}