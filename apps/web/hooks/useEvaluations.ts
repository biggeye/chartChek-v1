import { useCallback } from 'react';
import { useEvaluationsStore } from '~/store/patient/evaluationsStore';
import { fetchPatientEvaluations as fetchEvaluationsService } from '~/lib/services/evaluationsService';
import { KipuPatientEvaluation } from '~/types/kipu/kipuAdapter';

/**
 * Custom hook for managing patient evaluations state and fetching.
 *
 * @returns An object containing evaluations state and actions.
 */
export const usePatientEvaluations = () => {
  // Selectors to get state from the store
  const patientEvaluations = useEvaluationsStore((state) => state.patientEvaluations);
  const selectedPatientEvaluation = useEvaluationsStore((state) => state.selectedPatientEvaluation);
  const isLoadingEvaluations = useEvaluationsStore((state) => state.isLoadingEvaluations);
  const error = useEvaluationsStore((state) => state.error);

  // Actions from the store
  const { 
    setPatientEvaluations, 
    setIsLoadingEvaluations, 
    setError, 
    selectPatientEvaluation, 
    clearSelectedPatientEvaluation 
  } = useEvaluationsStore();

  /**
   * Fetches patient evaluations for a given patient ID and updates the store.
   * @param patientId The ID of the patient whose evaluations are to be fetched.
   */
  const fetchEvaluations = useCallback(async (patientId: string) => {
    if (!patientId) {
      console.warn('fetchEvaluations called without patientId');
      setError('Patient ID is required to fetch evaluations.');
      return;
    }

    setIsLoadingEvaluations(true);
    setError(null); // Clear previous errors

    try {
      // Rename variable for clarity, it holds the full API response object
      const apiResponse = await fetchEvaluationsService(patientId);
      console.log('[useEvaluations] API Response: ', apiResponse); 
      
      // Extract the 'evaluations' array before setting the state
      // Also check if the structure is as expected
      if (apiResponse && Array.isArray(apiResponse.evaluations)) {
        setPatientEvaluations(apiResponse.evaluations);
      } else {
        // Handle cases where the structure might be different (e.g., error format changed)
        console.error('Unexpected API response structure in useEvaluations:', apiResponse);
        throw new Error('Received unexpected data structure for evaluations.');
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching evaluations.';
      console.error('Error fetching evaluations:', err);
      setError(errorMessage);
      setPatientEvaluations([]); // Clear evaluations on error
    } finally {
      setIsLoadingEvaluations(false);
    }
  }, [setIsLoadingEvaluations, setError, setPatientEvaluations]);

  // Return state slices and actions needed by components
  return {
    patientEvaluations,
    selectedPatientEvaluation,
    isLoadingEvaluations,
    error,
    fetchEvaluations, // Expose the function to trigger fetching
    selectPatientEvaluation,
    clearSelectedPatientEvaluation,
    setIsLoadingEvaluations,
    // You might not need to expose setIsLoading, setError, setPatientEvaluations directly
    // if components only trigger fetches via fetchEvaluations
  };
};
