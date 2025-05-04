import { useEffect, useCallback } from 'react';
import { useMedicalRecordsStore, MedicalRecordsStore, RecordType } from '../store/patient/medicalRecordsStore';
import { fetchAllMedicalRecords } from '../lib/services/medicalRecordsService';

/**
 * Hook to fetch and manage medical records for a patient
 */
export const useMedicalRecords = (patientId: string) => {
  // Store actions
  const setConsentForms = useMedicalRecordsStore(useCallback((state: MedicalRecordsStore) => state.setConsentForms, []));
  const setConsentFormRecords = useMedicalRecordsStore(useCallback((state: MedicalRecordsStore) => state.setConsentFormRecords, []));
  const setDiagnosisHistory = useMedicalRecordsStore(useCallback((state: MedicalRecordsStore) => state.setDiagnosisHistory, []));
  const setProgramHistory = useMedicalRecordsStore(useCallback((state: MedicalRecordsStore) => state.setProgramHistory, []));
  const setLoadingState = useMedicalRecordsStore(useCallback((state: MedicalRecordsStore) => state.setLoadingState, []));
  const setErrorState = useMedicalRecordsStore(useCallback((state: MedicalRecordsStore) => state.setErrorState, []));
  const setIsLoading = useMedicalRecordsStore(useCallback((state: MedicalRecordsStore) => state.setIsLoading, []));
  const setError = useMedicalRecordsStore(useCallback((state: MedicalRecordsStore) => state.setError, []));
  const setPagination = useMedicalRecordsStore(useCallback((state: MedicalRecordsStore) => state.setPagination, []));

  // Store state
  const filters = useMedicalRecordsStore(useCallback((state: MedicalRecordsStore) => state.filters, []));
  const sortConfig = useMedicalRecordsStore(useCallback((state: MedicalRecordsStore) => state.sortConfig, []));
  const pagination = useMedicalRecordsStore(useCallback((state: MedicalRecordsStore) => state.pagination, []));
  const expandedSections = useMedicalRecordsStore(useCallback((state: MedicalRecordsStore) => state.expandedSections, []));

  // Section management
  const toggleSection = useMedicalRecordsStore(useCallback((state: MedicalRecordsStore) => state.toggleSection, []));
  const expandAllSections = useMedicalRecordsStore(useCallback((state: MedicalRecordsStore) => state.expandAllSections, []));
  const collapseAllSections = useMedicalRecordsStore(useCallback((state: MedicalRecordsStore) => state.collapseAllSections, []));

  // Memoize the fetch function
  const fetchRecords = useCallback(async () => {
    if (!patientId) return;

    // Set global loading state
    setIsLoading(true);
    setError(null);

    // Set individual loading states
    const recordTypes: RecordType[] = ['consentForms', 'consentRecords', 'diagnosisHistory', 'programHistory'];
    recordTypes.forEach(type => setLoadingState(type, true));

    try {
      const {
        consentForms,
        consentRecords,
        diagnosisHistory,
        programHistory
      } = await fetchAllMedicalRecords(patientId);

      // Update store with responses and handle errors for each type
      if (consentForms.success) {
        setConsentForms(consentForms.data?.forms || []);
        setErrorState('consentForms', null);
      } else {
        setErrorState('consentForms', consentForms.error?.message || 'Failed to load consent forms');
      }

      if (consentRecords.success) {
        setConsentFormRecords(consentRecords.data?.records || []);
        setErrorState('consentRecords', null);
      } else {
        setErrorState('consentRecords', consentRecords.error?.message || 'Failed to load consent records');
      }

      if (diagnosisHistory.success) {
        setDiagnosisHistory(diagnosisHistory.data?.diagnoses || []);
        setErrorState('diagnosisHistory', null);
      } else {
        setErrorState('diagnosisHistory', diagnosisHistory.error?.message || 'Failed to load diagnosis history');
      }

      if (programHistory.success) {
        setProgramHistory(programHistory.data?.programs || []);
        setErrorState('programHistory', null);
      } else {
        setErrorState('programHistory', programHistory.error?.message || 'Failed to load program history');
      }

      // Update pagination if any of the responses include it
      const totalRecords = Math.max(
        consentForms.data?.total || 0,
        consentRecords.data?.total || 0,
        diagnosisHistory.data?.total || 0,
        programHistory.data?.total || 0
      );

      if (totalRecords > 0) {
        setPagination({
          totalPages: Math.ceil(totalRecords / pagination.recordsPerPage)
        });
      }

      // Check for any errors
      const errors = [
        consentForms,
        consentRecords,
        diagnosisHistory,
        programHistory
      ].filter(response => !response.success).map(response => response.error?.message);

      if (errors.length > 0) {
        setError(`Some medical records failed to load: ${errors.join(', ')}`);
      }
    } catch (error: any) {
      console.error('Failed to fetch medical records:', error);
      setError(error?.message || 'An unknown error occurred while fetching medical records.');
      recordTypes.forEach(type => setErrorState(type, 'Failed to load records'));
    } finally {
      setIsLoading(false);
      recordTypes.forEach(type => setLoadingState(type, false));
    }
  }, [
    patientId,
    pagination.recordsPerPage,
    setConsentForms,
    setConsentFormRecords,
    setDiagnosisHistory,
    setProgramHistory,
    setIsLoading,
    setError,
    setLoadingState,
    setErrorState,
    setPagination
  ]);

  // Effect to fetch records when patientId changes
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Effect to refetch when pagination, filters, or sort changes
  useEffect(() => {
    if (patientId) {
      fetchRecords();
    }
  }, [patientId, pagination.currentPage, filters, sortConfig, fetchRecords]);

  return {
    // Data fetching
    refetch: fetchRecords,
    
    // Section management
    toggleSection,
    expandAllSections,
    collapseAllSections,
    expandedSections,
    
    // State access
    filters,
    sortConfig,
    pagination,
    
    // Loading and error states
    isLoading: useMedicalRecordsStore((state: MedicalRecordsStore) => state.isLoading),
    loadingState: useMedicalRecordsStore((state: MedicalRecordsStore) => state.loadingState),
    error: useMedicalRecordsStore((state: MedicalRecordsStore) => state.error),
    errorState: useMedicalRecordsStore((state: MedicalRecordsStore) => state.errorState),
    
    // Data access
    consentForms: useMedicalRecordsStore((state: MedicalRecordsStore) => state.consentForms),
    consentFormRecords: useMedicalRecordsStore((state: MedicalRecordsStore) => state.consentFormRecords),
    diagnosisHistory: useMedicalRecordsStore((state: MedicalRecordsStore) => state.diagnosisHistory),
    programHistory: useMedicalRecordsStore((state: MedicalRecordsStore) => state.programHistory)
  };
}; 