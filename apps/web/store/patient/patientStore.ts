// store/patient/patientStore.ts
import { create } from 'zustand';
import { PatientBasicInfo } from '~/types/kipu/kipuAdapter';

export interface PatientStore {
  patients: PatientBasicInfo[];
  selectedPatient: PatientBasicInfo | null;
  isLoadingPatients: boolean;
  error: string | null;

  setPatients: (patients: PatientBasicInfo[]) => void;
  selectPatient: (patient: PatientBasicInfo) => void;
  setIsLoadingPatients: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearPatientStore: () => void;
}

export const usePatientStore = create<PatientStore>((set) => ({
  patients: [],
  selectedPatient: null,
  isLoadingPatients: false,
  error: null,

  setPatients: (patients) => set({ patients }),
  selectPatient: (patient) => set({ selectedPatient: patient }),
  setIsLoadingPatients: (isLoadingPatients) => set({ isLoadingPatients }),
  setError: (error) => set({ error }),
  clearPatientStore: () => set({
    patients: [],
    selectedPatient: null,
    isLoadingPatients: false,
    error: null
  }),
}));
