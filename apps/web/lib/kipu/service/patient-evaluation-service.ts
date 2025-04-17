import { KipuCredentials, KipuApiResponse, KipuPatientOrdersResponse, KipuEvaluation, KipuPatientEvaluation } from '~/types/kipu/kipuAdapter';
import { kipuServerGet, kipuServerPost } from '../auth/server';
import { parsePatientId } from '../auth/config';

/**
 * List all evaluations (evaluation templates)
 * 
 * @param credentials - KIPU API credentials
 * @param page - Page number for pagination
 * @param per - Records per page
 * @returns Promise resolving to the API response with evaluations list
 */
export async function kipuListEvaluations<T>(
  credentials: KipuCredentials,
  page: number = 1,
  per: number = 20
): Promise<KipuApiResponse<T>> {
  try {
    // Build the query parameters
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      page: page.toString(),
      per: per.toString()
    });

    const endpoint = `/api/evaluations?${queryParams.toString()}`;
    
    return await kipuServerGet<T>(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuListEvaluations:`, error);
    return {
      success: false,
      error: {
        code: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }
    };
  }
}

/**
 * Fetch details for a specific evaluation template
 * 
 * @param evaluationId - The ID of the evaluation template
 * @param credentials - KIPU API credentials
 * @returns Promise resolving to the API response with evaluation details
 */
export async function kipuGetEvaluationTemplate<T>(
  evaluationId: string | number,
  credentials: KipuCredentials
): Promise<KipuApiResponse<T>> {
  try {
    // Ensure the evaluation ID is properly encoded for the URL
    const encodedEvaluationId = encodeURIComponent(evaluationId.toString());
    
    // Build the query parameters
    const queryParams = new URLSearchParams({
      app_id: credentials.appId
    });

    const endpoint = `/api/evaluations/${encodedEvaluationId}?${queryParams.toString()}`;
    
    return await kipuServerGet<T>(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetEvaluationTemplate for evaluation ${evaluationId}:`, error);
    return {
      success: false,
      error: {
        code: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }
    };
  }
}

/**
 * List all patient evaluations
 * 
 * @param credentials - KIPU API credentials
 * @param options - Optional parameters for filtering and pagination
 * @returns Promise resolving to the API response with patient evaluations list
 */
export async function kipuListPatientEvaluations<T>(
  credentials: KipuCredentials,
  options: {
    evaluationId?: number;
    completedOnly?: boolean;
    currentCensusOnly?: boolean;
    startDate?: string;
    endDate?: string;
    includeStranded?: boolean;
    page?: number;
    per?: number;
    patientProcessId?: number;
    evaluationContent?: 'standard' | 'notes' | 'treatment_plan';
  } = {}
): Promise<KipuApiResponse<T>> {
  try {
    // Build the query parameters
    const queryParams = new URLSearchParams({
      app_id: credentials.appId
    });
    
    // Add optional parameters if provided
    if (options.evaluationId) queryParams.append('evaluation_id', options.evaluationId.toString());
    if (options.completedOnly !== undefined) queryParams.append('completed_only', options.completedOnly.toString());
    if (options.currentCensusOnly !== undefined) queryParams.append('current_census_only', options.currentCensusOnly.toString());
    if (options.startDate) queryParams.append('start_date', options.startDate);
    if (options.endDate) queryParams.append('end_date', options.endDate);
    if (options.includeStranded !== undefined) queryParams.append('include_stranded', options.includeStranded.toString());
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.per) queryParams.append('per', options.per.toString());
    if (options.patientProcessId) queryParams.append('patient_process_id', options.patientProcessId.toString());
    if (options.evaluationContent) queryParams.append('evaluation_content', options.evaluationContent);

    const endpoint = `/api/patient_evaluations?${queryParams.toString()}`;
    
    return await kipuServerGet<T>(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuListPatientEvaluations:`, error);
    return {
      success: false,
      error: {
        code: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }
    };
  }
}

/**
 * Fetch details for a specific patient evaluation
 * 
 * @param KipuPatientEvaluationId - The ID of the patient evaluation
 * @param credentials - KIPU API credentials
 * @param includeSettings - Whether to include more details of the patient evaluation
 * @returns Promise resolving to the API response with patient evaluation details
 */
export async function kipuGetPatientEvaluation<T>(
  patientEvaluationId: string | number,
  credentials: KipuCredentials,
  includeSettings: boolean = false
): Promise<KipuApiResponse<T>> {
  try {
    // Ensure the patient evaluation ID is properly encoded for the URL
    const encodedPatientEvaluationId = encodeURIComponent(patientEvaluationId.toString());
    
    // Build the query parameters
    const queryParams = new URLSearchParams({
      app_id: credentials.appId
    });
    
    // Add optional parameters
    if (includeSettings) {
      queryParams.append('include_settings', 'true');
    }

    const endpoint = `/api/patient_evaluations/${encodedPatientEvaluationId}?${queryParams.toString()}`;
    
    return await kipuServerGet<T>(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetPatientEvaluation for patient evaluation ${patientEvaluationId}:`, error);
    return {
      success: false,
      error: {
        code: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }
    };
  }
}

export async function kipuGetPatientEvaluations<T>(
  patientId: string,
  credentials: KipuCredentials,
  options: {
    evaluationId?: number;
    completedOnly?: boolean;
    currentCensusOnly?: boolean;
    startDate?: string;
    endDate?: string;
    includeStranded?: boolean;
    page?: number;
    per?: number;
    patientProcessId?: number;
    evaluationContent?: 'standard' | 'notes' | 'treatment_plan';
  } = {}
): Promise<KipuApiResponse<T>> {
  try {
    const { patientMasterId, chartId } = parsePatientId(patientId);

    // Build the query parameters
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      patient_master_id: patientMasterId
    });

    // Add optional parameters if provided
    if (options.evaluationId) queryParams.append('evaluation_id', options.evaluationId.toString());
    if (options.completedOnly !== undefined) queryParams.append('completed_only', options.completedOnly.toString());
    if (options.currentCensusOnly !== undefined) queryParams.append('current_census_only', options.currentCensusOnly.toString());
    if (options.startDate) queryParams.append('start_date', options.startDate);
    if (options.endDate) queryParams.append('end_date', options.endDate);
    if (options.includeStranded !== undefined) queryParams.append('include_stranded', options.includeStranded.toString());
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.per) queryParams.append('per', options.per.toString());
    if (options.patientProcessId) queryParams.append('patient_process_id', options.patientProcessId.toString());
    if (options.evaluationContent) queryParams.append('evaluation_content', options.evaluationContent);

    const endpoint = `/api/patients/${chartId}/patient_evaluations?${queryParams.toString()}`;

    // Use kipuServerGet directly as in the API route
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetPatientEvaluations for patient ${patientId}:`, error);
    return {
      success: false,
      error: {
        code: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }
    };
  }
}

