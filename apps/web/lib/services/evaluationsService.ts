import type { KipuPatientEvaluation } from '~/types/kipu/kipuAdapter'; // <-- ADD THIS IMPORT

export const fetchPatientEvaluations = async (patientId: string) => {
  const endpoint = `/api/kipu/patients/${patientId}/evaluations`;
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`Failed to fetch evaluations: ${response.statusText}`);
  const result = await response.json();
  // Return the entire result object as returned by the API route
  return result;
};

/**
 * Fetches the full details for a single patient evaluation by its ID.
 * @param evaluationId The ID of the evaluation to fetch.
 * @returns The detailed evaluation data.
 * @throws Error if the fetch fails or the response is not ok.
 */
export const fetchEvaluationDetails = async (evaluationId: string | number) => {
  // Ensure evaluationId is a string for the URL
  const idString = typeof evaluationId === 'number' ? evaluationId.toString() : evaluationId;
  
  if (!idString) {
    throw new Error('Evaluation ID is required to fetch details.');
  }

  const endpoint = `/api/kipu/patient_evaluations/${idString}`;

  const response = await fetch(endpoint);

  if (!response.ok) {
    // Attempt to get error message from response body
    let errorBody = 'Unknown error';
    try {
      errorBody = await response.text(); // Use text() first in case it's not JSON
      const jsonError = JSON.parse(errorBody);
      errorBody = jsonError.error || errorBody; // Prefer specific 'error' property if available
    } catch (parseError) {
      // Ignore parsing error, use the raw text or default message
    }
    throw new Error(`Failed to fetch evaluation details (${response.status} ${response.statusText}): ${errorBody}`);
  }

  // Assuming the API returns the evaluation data directly as JSON
  const result = await response.json();
  return result; // Return the full evaluation details object
};

/**
 * Fetches all evaluations for a specific patient.
 * @param patientId The ID of the patient.
 * @returns A promise that resolves to an array of KipuPatientEvaluation objects.
 * @throws Error if the API call fails.
 */
export const fetchEvaluationsByPatientId = async (
  patientId: string
): Promise<KipuPatientEvaluation[]> => {
  if (!patientId) {
    throw new Error("Patient ID is required to fetch evaluations.");
  }
  const encodedPatientId = encodeURIComponent(patientId);
  const endpoint = `/api/kipu/patients/${encodedPatientId}/evaluations`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      const errorBody = await response.text(); // Or response.json() if API returns JSON errors
      throw new Error(`API Error (${response.status}): Failed to fetch evaluations for patient ${patientId}. ${errorBody}`);
    }
    const result = await response.json();
    // Assuming the API returns { data: KipuPatientEvaluation[] }
    if (!result.data || !Array.isArray(result.data)) {
        console.error("Unexpected API response structure for evaluations:", result);
        throw new Error("Invalid data structure received from evaluations API.");
    }
    return result.data as KipuPatientEvaluation[];
  } catch (error) {
    console.error(`[fetchEvaluationsByPatientId] Error fetching evaluations for patient ${patientId}:`, error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

// Fetches evaluation templates from /api/kipu/evaluations
export const fetchEvaluationTemplates = async () => {
  const endpoint = '/api/kipu/evaluations';
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`Failed to fetch evaluation templates: ${response.statusText}`);
  const result = await response.json();
  return result;
};
