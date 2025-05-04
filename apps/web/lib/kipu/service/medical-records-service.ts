import { KipuApiResponse, KipuCredentials } from './patient-service';
import { kipuServerGet } from '~/lib/kipu/auth/server';
import { parsePatientId } from '../auth/config';

// Wrapper function to log KIPU API responses
async function loggedKipuGet<T>(endpoint: string, credentials: KipuCredentials): Promise<KipuApiResponse<T>> {
  const response = await kipuServerGet<T>(endpoint, credentials);
  console.log(`KIPU API Response for ${endpoint}:`, response);
  return response;
}

export interface KipuConsentForm {
  id: string;
  name: string;
  description?: string;
  version: string;
  isActive: boolean;
}

export interface KipuConsentFormRecord {
  id: string;
  formId: string;
  patientId: string;
  signedAt: string;
  signedBy: {
    id: string;
    name: string;
    role: string;
  };
  content: string;
  status: 'signed' | 'pending' | 'expired';
}

export interface KipuDiagnosisHistory {
  id: string;
  patientId: string;
  diagnosis: string;
  diagnosedAt: string;
  diagnosedBy: {
    id: string;
    name: string;
    role: string;
  };
  status: 'active' | 'resolved' | 'chronic';
  notes?: string;
}

export interface KipuProgramHistory {
  id: string;
  patientId: string;
  program: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'discontinued';
  level: string;
  notes?: string;
}

// Add these interfaces at the top of the file with the other interfaces
interface KipuConsentFormResponse {
  pagination: {
    current_page: number;
    total_pages: string;
    records_per_page: string;
    total_records: string;
  };
  consent_form_records: KipuConsentFormRecord[];
}

interface KipuProgramHistoryResponse {
  patient: {
    casefile_id: string;
    first_name: string;
    last_name: string;
    dob: string;
    program_history: KipuProgramHistory[];
  };
}

// Server-side only functions that communicate with KIPU
export async function kipuFetchConsentForms(
  credentials: KipuCredentials,
  options: { page?: number; limit?: number } = {}
): Promise<KipuApiResponse<{ forms: KipuConsentForm[]; total: number }>> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      page: (options.page || 1).toString(),
      limit: (options.limit || 20).toString()
    });

    const endpoint = `/api/consent_forms?${queryParams.toString()}`;
    return await loggedKipuGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuFetchConsentForms:', error);
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

export async function kipuFetchConsentFormRecords(
  credentials: KipuCredentials,
  patientId: string,
  options: { page?: number; limit?: number } = {}
): Promise<KipuApiResponse<{ records: KipuConsentFormRecord[]; total: number }>> {
  try {
    const { chartId, patientMasterId } = parsePatientId(patientId);
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      patient_master_id: patientMasterId,
    });

    const endpoint = `/api/patients/${chartId}/consent_form_records?${queryParams.toString()}`;
    const response = await kipuServerGet<KipuConsentFormResponse>(endpoint, credentials);
    
    // Detailed logging of the response structure
    if (response.success && response.data) {
      const { pagination, consent_form_records } = response.data;
      console.log('=== Consent Form Records Response Structure ===');
      console.log('Pagination:', JSON.stringify(pagination, null, 2));
      console.log('First consent form record sample:', JSON.stringify(consent_form_records[0], null, 2));
      console.log(`Total records: ${consent_form_records.length}`);
    }
    
    // Transform the response to match the expected return type
    return {
      success: response.success,
      data: response.success && response.data ? {
        records: response.data.consent_form_records,
        total: parseInt(response.data.pagination.total_records)
      } : undefined,
      error: response.error
    };
  } catch (error) {
    console.error('Error in kipuFetchConsentFormRecords:', error);
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

export async function kipuFetchDiagnosisHistory(
  credentials: KipuCredentials,
  patientId: string
): Promise<KipuApiResponse<{ diagnoses: KipuDiagnosisHistory[]; total: number }>> {
  try {
    const { chartId, patientMasterId } = parsePatientId(patientId);
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      patient_master_id: patientMasterId,
    });

    const endpoint = `/api/patients/${chartId}/diagnosis_history?${queryParams.toString()}`;
    return await loggedKipuGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuFetchDiagnosisHistory:', error);
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

export async function kipuFetchProgramHistory(
  credentials: KipuCredentials,
  patientId: string
): Promise<KipuApiResponse<{ programs: KipuProgramHistory[]; total: number }>> {
  try {
    const { chartId, patientMasterId } = parsePatientId(patientId);
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      patient_master_id: patientMasterId,
    });

    const endpoint = `/api/patients/${chartId}/program_history?${queryParams.toString()}`;
    const response = await kipuServerGet<KipuProgramHistoryResponse>(endpoint, credentials);
    
    return {
      success: response.success,
      data: response.success && response.data ? {
        programs: response.data.patient.program_history,
        total: response.data.patient.program_history.length
      } : undefined,
      error: response.error
    };
  } catch (error) {
    console.error('Error in kipuFetchProgramHistory:', error);
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

// Helper function to fetch all medical records for a patient
export async function kipuFetchAllMedicalRecords(
  credentials: KipuCredentials,
  patientId: string
): Promise<{
  consentForms: KipuApiResponse<{ forms: KipuConsentForm[]; total: number }>;
  consentRecords: KipuApiResponse<{ records: KipuConsentFormRecord[]; total: number }>;
  diagnosisHistory: KipuApiResponse<{ diagnoses: KipuDiagnosisHistory[]; total: number }>;
  programHistory: KipuApiResponse<{ programs: KipuProgramHistory[]; total: number }>;
}> {
  const [consentForms, consentRecords, diagnosisHistory, programHistory] = await Promise.all([
    kipuFetchConsentForms(credentials),
    kipuFetchConsentFormRecords(credentials, patientId),
    kipuFetchDiagnosisHistory(credentials, patientId),
    kipuFetchProgramHistory(credentials, patientId)
  ]);

  return {
    consentForms,
    consentRecords,
    diagnosisHistory,
    programHistory
  };
} 