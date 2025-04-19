// hooks/usePatientData.ts
import { useEffect } from 'react';
import { usePatientStore, PatientStore } from '@/store/patient/patientStore'; 
import { useEvaluationsStore, KipuEvaluationsState } from '@/store/patient/evaluationsStore'; 
import { fetchEvaluationsByPatientId } from '@/lib/services/evaluationsService';
import type { PatientBasicInfo } from '@/types/kipu/kipuAdapter';

/**
 * Custom hook to manage patient selection and fetching associated evaluations.
 * Orchestrates interactions between patient store, evaluations store, and evaluations service.
 */
export const usePatientData = () => {
  // --- Select state and actions from stores ---

  // Patient Store: Get selected patient and the action to select one
  const { selectedPatient, selectPatient: selectPatientAction } = usePatientStore(
    (state: PatientStore) => ({ 
      selectedPatient: state.selectedPatient,
      selectPatient: state.selectPatient,
    })
  );

  // Evaluations Store: Get actions needed to update evaluation state
  // Select individual actions for stability
  const setPatientEvaluations = useEvaluationsStore((state) => state.setPatientEvaluations);
  const setIsLoadingEvaluations = useEvaluationsStore((state) => state.setIsLoadingEvaluations);
  const setEvaluationError = useEvaluationsStore((state) => state.setError);
  const clearEvaluationsStore = useEvaluationsStore((state) => state.clearEvaluationsStore);

  // --- Effect to fetch evaluations when selectedPatient changes ---
  useEffect(() => {
    // Define the async function inside useEffect
    const loadEvaluations = async (patientId: string) => {
      setIsLoadingEvaluations(true);
      setPatientEvaluations([]); // Clear previous evaluations immediately
      setEvaluationError(null);  // Clear previous errors
      try {
        console.log(`[usePatientData] Fetching evaluations for patient ID: ${patientId}`);
        const evaluations = await fetchEvaluationsByPatientId(patientId);
        console.log(`[usePatientData] Fetched ${evaluations.length} evaluations.`);
        setPatientEvaluations(evaluations);
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load evaluations';
        console.error('[usePatientData] Failed to fetch evaluations:', error);
        setEvaluationError(errorMessage);
        setPatientEvaluations([]); // Ensure evaluations are empty on error
      } finally {
        setIsLoadingEvaluations(false);
      }
    };

    // Check if a patient is selected and has an ID
    if (selectedPatient?.patientId) {
      const id = selectedPatient.patientId.toString();
      loadEvaluations(id);
    } else {
      // If no patient is selected (or patient is null/undefined), clear evaluations
      // Use the dedicated clear action if available and appropriate, otherwise set manually
      clearEvaluationsStore ? clearEvaluationsStore() : (() => {
        // Fallback if clearEvaluationsStore is somehow undefined (shouldn't happen with correct import/type)
        setPatientEvaluations([]);
        setIsLoadingEvaluations(false);
        setEvaluationError(null);
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient, setPatientEvaluations, setIsLoadingEvaluations, setEvaluationError, clearEvaluationsStore]); // Dependencies for the effect

  // --- Return values needed by components ---
  return {
    selectedPatient,          // The currently selected patient object
    selectPatient: selectPatientAction, // The action to select a patient (triggers the effect)
  };
};
