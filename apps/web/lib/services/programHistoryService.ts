import { KipuApiResponse } from '../kipu/service/patient-service';
import { KipuProgramHistory } from '../kipu/service/medical-records-service';

interface ProgramHistoryResponse {
  success: boolean;
  data?: {
    programs: KipuProgramHistory[];
    total: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Client service for program history
 * Handles all API calls to our internal API endpoints
 */
export async function fetchProgramHistory(patientId: string): Promise<ProgramHistoryResponse> {
  console.group('Program History Service - Fetch');
  console.log('Fetching program history for patient:', patientId);
  
  try {
    const url = `/api/kipu/patients/${encodeURIComponent(patientId)}/program_history`;
    console.log('Making request to:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    console.groupEnd();
    return data;
  } catch (error) {
    console.error('Error in fetchProgramHistory service:', error);
    console.groupEnd();
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch program history',
        details: error
      }
    };
  }
} 