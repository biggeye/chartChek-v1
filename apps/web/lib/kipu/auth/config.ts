/**
 * Parses a composite patient ID into its components
 * @param patientId - The composite patient ID in format "chartId:patientMasterId"
 * @returns An object containing the chartId and patientMasterId
 */
export function parsePatientId(patientId: string): { chartId: string; patientMasterId: string } {
  if (!patientId) return { chartId: '', patientMasterId: '' };
  
  // Decode the patient ID first in case it's already URL-encoded
  const decodedPatientId = decodeURIComponent(patientId);
  
  // Split the patient ID into its components
  const patientIdParts = decodedPatientId.split(':');
  
  if (patientIdParts.length === 2) {
      return {
      chartId: patientIdParts[0],
      patientMasterId: patientIdParts[1]
    };
  } else {
    // If the format is not as expected, use the whole ID for both
    console.log(`Patient ID format is not as expected. Using the whole ID for both components.`);
    return {
      chartId: decodedPatientId,
      patientMasterId: decodedPatientId
    };
  }
}

