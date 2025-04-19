// lib/kipu/service/evaluation-template-service.ts
import { KipuCredentials, KipuApiResponse } from 'types/kipu/kipuAdapter';
import { KipuEvaluation, KipuEvaluationResponse } from 'types/kipu/kipuAdapter';
import { kipuServerGet } from '../auth/server';

/**
 * List all evaluation templates
 * 
 * @param credentials - KIPU API credentials
 * @param options - Optional parameters for filtering and pagination
 * @returns Promise resolving to the API response with evaluation templates list
 */
export async function kipuListEvaluationTemplates(
  credentials: KipuCredentials,
  options: {
    page?: number;
    per?: number;
  } = {}
): Promise<KipuApiResponse<KipuEvaluationResponse>> {
  try {
    // Build the query parameters
    const queryParams = new URLSearchParams({
      app_id: credentials.appId
    });
    
    // Add optional parameters if provided
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.per) queryParams.append('per', options.per.toString());

    const endpoint = `/api/evaluations?${queryParams.toString()}`;
    
    return await kipuServerGet<KipuEvaluationResponse>(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuListEvaluationTemplates:', error);
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
export async function kipuGetEvaluationTemplate(
  evaluationId: string | number,
  credentials: KipuCredentials
): Promise<KipuApiResponse<{ evaluation: KipuEvaluation }>> {
  try {
    // Ensure the evaluation ID is properly encoded for the URL
    const encodedEvaluationId = encodeURIComponent(evaluationId.toString());
    
    // Build the query parameters
    const queryParams = new URLSearchParams({
      app_id: credentials.appId
    });

    const endpoint = `/api/evaluations/${encodedEvaluationId}?${queryParams.toString()}`;
    
    return await kipuServerGet<{ evaluation: KipuEvaluation }>(endpoint, credentials);
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