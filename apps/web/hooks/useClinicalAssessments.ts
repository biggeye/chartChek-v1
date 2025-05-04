import { useEffect, useCallback } from 'react';
import {
    useClinicalAssessmentStore,
    ClinicalAssessmentStore
} from '../store/patient/clinicalAssessmentStore';
import {
    kipuListCiwaArs,
    kipuListCiwaBs,
    kipuListCows,
    kipuListVitalSigns,
    kipuListOrthostaticVitalSigns,
} from '../lib/kipu/service/clinical-assessment-service';

/**
 * Hook to fetch all clinical assessments for a patient
 */
export const useFetchClinicalAssessments = (patientId: string, credentials: KipuCredentials) => {
    // Use primitive selectors to avoid creating new objects
    const setCiwaArs = useClinicalAssessmentStore(useCallback((state: ClinicalAssessmentStore) => state.setCiwaArs, []));
    const setCiwaBs = useClinicalAssessmentStore(useCallback((state: ClinicalAssessmentStore) => state.setCiwaBs, []));
    const setCows = useClinicalAssessmentStore(useCallback((state: ClinicalAssessmentStore) => state.setCows, []));
    const setVitalSigns = useClinicalAssessmentStore(useCallback((state: ClinicalAssessmentStore) => state.setVitalSigns, []));
    const setOrthostaticVitalSigns = useClinicalAssessmentStore(useCallback((state: ClinicalAssessmentStore) => state.setOrthostaticVitalSigns, []));
    const setIsLoading = useClinicalAssessmentStore(useCallback((state: ClinicalAssessmentStore) => state.setIsLoading, []));
    const setError = useClinicalAssessmentStore(useCallback((state: ClinicalAssessmentStore) => state.setError, []));

    // Memoize the fetch function
    const fetchAllAssessments = useCallback(async () => {
        if (!patientId || !credentials) return;

        setIsLoading(true);
        setError(null);

        try {
            const [
                ciwaArResponse,
                ciwaBResponse,
                cowsResponse,
                vitalSignsResponse,
                orthostaticResponse
            ] = await Promise.all([
                kipuListCiwaArs(credentials, patientId),
                kipuListCiwaBs(credentials, patientId),
                kipuListCows(credentials, patientId),
                kipuListVitalSigns(credentials, patientId),
                kipuListOrthostaticVitalSigns(credentials, patientId)
            ]);

            // Update store with responses
            if (ciwaArResponse.success) setCiwaArs(ciwaArResponse.ciwaArs || []);
            if (ciwaBResponse.success) setCiwaBs(ciwaBResponse.ciwaBs || []);
            if (cowsResponse.success) setCows(cowsResponse.cows || []);
            if (vitalSignsResponse.success) setVitalSigns(vitalSignsResponse.vitalSigns || []);
            if (orthostaticResponse.success) setOrthostaticVitalSigns(orthostaticResponse.orthostaticVitalSigns || []);

            // Check for any errors
            const errors = [
                ciwaArResponse,
                ciwaBResponse,
                cowsResponse,
                vitalSignsResponse,
                orthostaticResponse
            ].filter(response => !response.success).map(response => response.error?.message);

            if (errors.length > 0) {
                setError(`Some assessments failed to load: ${errors.join(', ')}`);
            }
        } catch (error: any) {
            console.error('Failed to fetch clinical assessments:', error);
            setError(error?.message || 'An unknown error occurred while fetching clinical assessments.');
        } finally {
            setIsLoading(false);
        }
    }, [patientId, credentials, setCiwaArs, setCiwaBs, setCows, setVitalSigns, setOrthostaticVitalSigns, setIsLoading, setError]);

    // Effect to fetch assessments when patientId or credentials change
    useEffect(() => {
        fetchAllAssessments();
    }, [fetchAllAssessments]);
}; 