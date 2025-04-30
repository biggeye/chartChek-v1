import { useEffect } from 'react';
import { usePatientStore } from '~/store/patient/patientStore';
import { fetchPatients, fetchPatientById } from '~/lib/services/patientService';
import { useFacilityStore } from '~/store/patient/facilityStore';
export const useFetchPatients = (facilityId?: number) => {
  const { setPatients, setIsLoadingPatients, setError } = usePatientStore();
  const { currentFacilityId } = useFacilityStore();
  console.log("usePatients] currentFacilityId: ", currentFacilityId)
  useEffect(() => {
    setIsLoadingPatients(true);
    fetchPatients(currentFacilityId || facilityId)
      .then(setPatients)
      .catch(error => setError(error.message))
      .finally(() => setIsLoadingPatients(false));
  }, [facilityId, setPatients, setIsLoadingPatients, setError]);
};

export const useFetchPatient = (patientId: string) => {
  const { selectPatient, setIsLoadingPatients, setError } = usePatientStore();

  useEffect(() => {
    if (!patientId) return;

    setIsLoadingPatients(true);
    fetchPatientById(patientId)
      .then(selectPatient)
      .catch(error => setError(error.message))
      .finally(() => setIsLoadingPatients(false));
  }, [patientId, selectPatient, setIsLoadingPatients, setError]);
};
