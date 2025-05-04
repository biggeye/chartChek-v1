import { usePatientStore } from "~/store/patient/patientStore";
export const fetchPatients = async (facilityId?: number) => {
  const { setIsLoadingPatients } = usePatientStore.getState();
  setIsLoadingPatients(true);
  if (facilityId === 0) {
    const endpoint = '/api/kipu/patients/admissions';
    const admissions = await fetch(endpoint);
    const admissionsData = await admissions.json();
    setIsLoadingPatients(false);
    return admissionsData.data.patients;
  } else {
    const endpoint: string | null = // Endpoint can now be null
      `/api/kipu/patients/census?facilityId=${facilityId}`; // Otherwise (non-zero number), use census

    if (!endpoint) {
      throw new Error('No Facility ID provideds');
    }

    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`Failed to fetch patients: ${response.statusText}`);
    const result = await response.json();
    setIsLoadingPatients(false);
    return result.data.patients;

  }
};

export const fetchPatientById = async (patientId: string) => {
  const encodedId = encodeURIComponent(patientId);
  const response = await fetch(`/api/kipu/patients/${encodedId}`);
  if (!response.ok) throw new Error(`Failed to fetch patient: ${response.statusText}`);
  const result = await response.json();
  return result.data;
};
