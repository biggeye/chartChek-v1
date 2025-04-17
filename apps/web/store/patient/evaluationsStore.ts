// store/patient/evaluationsStore.ts
import { create } from 'zustand';
import { KipuPatientEvaluation } from '~/types/kipu/kipuAdapter';
import type { KipuEvaluationsState } from '~/types/store/patient/evaluations'; // <-- IMPORT the type
export type { KipuEvaluationsState }; // <-- RE-EXPORT using 'export type'

export const useEvaluationsStore = create<KipuEvaluationsState>((set, get) => ({
  // Initial state
  patientEvaluations: [],
  selectedPatientEvaluation: null,
  isLoadingEvaluations: false,
  error: null,

  // Setter actions
  setPatientEvaluations: (evaluations: KipuPatientEvaluation[]) => set({ patientEvaluations: evaluations }),
  // Action now accepts an ID and finds the evaluation in the existing list
  selectPatientEvaluation: (evaluationId: string) => {
    const evaluations = get().patientEvaluations;
    const selected = evaluations.find((e: KipuPatientEvaluation) => e.id?.toString() === evaluationId) || null; // Type 'e' and ensure comparison handles potential type differences
    set({ selectedPatientEvaluation: selected });
    // Optionally set error if not found?
    // if (!selected) {
    //   set({ error: `Evaluation with ID ${evaluationId} not found in the current list.` });
    // }
  },
  setIsLoadingEvaluations: (isLoading: boolean) => set({ isLoadingEvaluations: isLoading }),
  setError: (error: string | null) => set({ error: error, isLoadingEvaluations: false }), // Also set loading false on error
  clearSelectedPatientEvaluation: () => set({ selectedPatientEvaluation: null }),
  clearEvaluationsStore: () => set({
    patientEvaluations: [],
    selectedPatientEvaluation: null,
    isLoadingEvaluations: false,
    error: null,
  }),
}));