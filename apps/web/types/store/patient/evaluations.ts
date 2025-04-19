import { KipuPatientEvaluation } from '@/types/kipu/kipuAdapter';

export interface FetchEvaluationsOptions {
  page?: number;
  per?: number;
  startDate?: string;
  endDate?: string;
  completedOnly?: boolean;
}

export interface KipuEvaluationsState {
  // UI State
  isLoadingEvaluations: boolean;
  error: string | null;

  // Patient Evaluations
  patientEvaluations: KipuPatientEvaluation[];
  selectedPatientEvaluation: KipuPatientEvaluation | null;

  // Actions - Patient Evaluations
  setPatientEvaluations: (evaluations: KipuPatientEvaluation[]) => void;
  // Updated signature to accept ID string
  selectPatientEvaluation: (evaluationId: string) => void;
  setIsLoadingEvaluations: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearSelectedPatientEvaluation: () => void;
  clearEvaluationsStore: () => void;
}