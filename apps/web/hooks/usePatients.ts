import { useEffect, useCallback, useMemo } from 'react';
import { usePatientStore } from '~/store/patient/patientStore';
import { fetchPatients, fetchPatientById, fetchPatientOccupancy } from '~/lib/services/patientService';
import { useFacilityStore } from '~/store/patient/facilityStore';
import { PatientBasicInfo, KipuOccupancy } from '~/types/kipu/kipuAdapter';
// Remove Patient type import if not used directly in this file
// import { Patient } from '~/types/kipu/kipuAdapter';

/**
 * Hook to fetch patients based on the globally selected facility ID from useFacilityStore.
 * This hook should be called from a component high in the tree (e.g., Layout or Page)
 * to ensure patient data stays in sync with facility selection application-wide.
 */
export const useFetchPatientsOnFacilityChange = () => {
  // Use primitive selectors to avoid creating new objects
  const setPatients = usePatientStore(useCallback(state => state.setPatients, []));
  const setIsLoadingPatients = usePatientStore(useCallback(state => state.setIsLoadingPatients, []));
  const setError = usePatientStore(useCallback(state => state.setError, []));
  
  // Use primitive selector for currentFacilityId
  const currentFacilityId = useFacilityStore(useCallback(state => state.currentFacilityId, []));

  // Memoize the fetch function so it's stable across renders
  const fetchPatientsForFacility = useCallback(async (facilityId: number) => {
    console.log('[useFetchPatientsOnFacilityChange] Fetching patients for:', facilityId);
    setIsLoadingPatients(true);
    setError(null);
    
    try {
      const patients = await fetchPatients(facilityId);
      if (Array.isArray(patients)) {
        setPatients(patients);
      } else {
        console.warn('fetchPatients did not return an array:', patients);
        setPatients([]);
        setError('Received invalid patient data format.');
      }
    } catch (error: any) {
      console.error("Failed to fetch patients:", error);
      setError(error?.message || 'An unknown error occurred while fetching patients.');
      setPatients([]);
    } finally {
      setIsLoadingPatients(false);
    }
  }, [setPatients, setIsLoadingPatients, setError]);

  // Effect to trigger fetch when facility changes
  useEffect(() => {
    fetchPatientsForFacility(currentFacilityId);
  }, [currentFacilityId, fetchPatientsForFacility]);
};

/**
 * Hook to fetch details for a single patient by their ID.
 */
export const useFetchPatient = (patientId: string) => {
  // Use individual selectors to avoid creating objects on each render
  const selectPatient = usePatientStore(useCallback(state => state.selectPatient, []));
  const setIsLoadingPatients = usePatientStore(useCallback(state => state.setIsLoadingPatients, []));
  const setError = usePatientStore(useCallback(state => state.setError, []));

  // Memoize fetch function
  const fetchPatientDetails = useCallback(async (id: string) => {
    if (!id) return;
    
    setIsLoadingPatients(true);
    setError(null);
    
    try {
      const patient = await fetchPatientById(id);
      selectPatient(patient);
    } catch (error: any) {
      console.error(`Failed to fetch patient ${id}:`, error);
      setError(error?.message || `Failed to fetch patient ${id}.`);
      selectPatient({} as PatientBasicInfo);
    } finally {
      setIsLoadingPatients(false);
    }
  }, [selectPatient, setIsLoadingPatients, setError]);

  // Effect to fetch patient when ID changes
  useEffect(() => {
    fetchPatientDetails(patientId);
  }, [patientId, fetchPatientDetails]);
};

/**
 * Hook to fetch patient occupancy data from the KIPU occupancy endpoint.
 * Returns: { occupancy, isLoading, error, fetchOccupancy }
 */
export const useFetchFacilityOccupancy = () => {
  const setIsLoading = useFacilityStore(useCallback(state => state.setIsLoading, []));
  const setError = useFacilityStore(useCallback(state => state.setError, []));
  const setOccupancy = useFacilityStore(useCallback(state => state.setOccupancy, []));
  const occupancy = useFacilityStore(state => state.occupancy);

  const fetchOccupancy = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: KipuOccupancy = await fetchPatientOccupancy();
      setOccupancy(data);
    } catch (error: any) {
      setError(error?.message || 'Failed to fetch occupancy data.');
      setOccupancy(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setError, setOccupancy]);

  return {
    occupancy,
    isLoading: useFacilityStore(state => state.isLoading),
    error: useFacilityStore(state => state.error),
    fetchOccupancy,
  };
};


