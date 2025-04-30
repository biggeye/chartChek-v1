
export const fetchPatients = async (facilityId?: number) => {
    const endpoint = 
    facilityId === 0
      ? '/api/kipu/patients/admissions'
      : facilityId
        ? `/api/kipu/patients/census?facilityId=${facilityId}`
        :'/api/kipu/patients/admissions';
  
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`Failed to fetch patients: ${response.statusText}`);
    const result = await response.json();
    return result.data.patients;
  };
  
  
  export const fetchPatientById = async (patientId: string) => {
    const encodedId = encodeURIComponent(patientId);
    const response = await fetch(`/api/kipu/patients/${encodedId}`);
    if (!response.ok) throw new Error(`Failed to fetch patient: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  };
  