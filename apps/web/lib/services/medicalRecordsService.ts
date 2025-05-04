import { KipuApiResponse } from '../kipu/service/patient-service';
import { 
  KipuConsentForm, 
  KipuConsentFormRecord, 
  KipuDiagnosisHistory, 
  KipuProgramHistory 
} from '../kipu/service/medical-records-service';

/**
 * Client service for medical records
 * Handles all API calls to our internal API endpoints
 */

export async function fetchAllMedicalRecords(patientId: string): Promise<{
  consentForms: KipuApiResponse<{ forms: KipuConsentForm[]; total: number }>;
  consentRecords: KipuApiResponse<{ records: KipuConsentFormRecord[]; total: number }>;
  diagnosisHistory: KipuApiResponse<{ diagnoses: KipuDiagnosisHistory[]; total: number }>;
  programHistory: KipuApiResponse<{ programs: KipuProgramHistory[]; total: number }>;
}> {
  const [
    consentFormsResponse,
    consentRecordsResponse,
    diagnosisHistoryResponse,
    programHistoryResponse
  ] = await Promise.all([
    fetchConsentForms(),
    fetchConsentFormRecords(patientId),
    fetchDiagnosisHistory(patientId),
    fetchProgramHistory(patientId)
  ]);

  return {
    consentForms: consentFormsResponse,
    consentRecords: consentRecordsResponse,
    diagnosisHistory: diagnosisHistoryResponse,
    programHistory: programHistoryResponse
  };
}

export async function fetchConsentForms(): Promise<KipuApiResponse<{ forms: KipuConsentForm[]; total: number }>> {
  try {
    const response = await fetch('/api/kipu/consent_forms');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching consent forms:', error);
    return {
      success: false,
      error: {
        code: 'fetch_error',
        message: error instanceof Error ? error.message : 'Failed to fetch consent forms',
        details: error
      }
    };
  }
}

export async function fetchConsentFormRecords(patientId: string): Promise<KipuApiResponse<{ records: KipuConsentFormRecord[]; total: number }>> {
  try {
    const response = await fetch(`/api/kipu/patients/${encodeURIComponent(patientId)}/consent_forms`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching consent form records:', error);
    return {
      success: false,
      error: {
        code: 'fetch_error',
        message: error instanceof Error ? error.message : 'Failed to fetch consent form records',
        details: error
      }
    };
  }
}

export async function fetchDiagnosisHistory(patientId: string): Promise<KipuApiResponse<{ diagnoses: KipuDiagnosisHistory[]; total: number }>> {
  try {
    const response = await fetch(`/api/kipu/patients/${encodeURIComponent(patientId)}/diagnosis_history`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching diagnosis history:', error);
    return {
      success: false,
      error: {
        code: 'fetch_error',
        message: error instanceof Error ? error.message : 'Failed to fetch diagnosis history',
        details: error
      }
    };
  }
}

export async function fetchProgramHistory(patientId: string): Promise<KipuApiResponse<{ programs: KipuProgramHistory[]; total: number }>> {
  try {
    const response = await fetch(`/api/kipu/patients/${encodeURIComponent(patientId)}/program_history`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching program history:', error);
    return {
      success: false,
      error: {
        code: 'fetch_error',
        message: error instanceof Error ? error.message : 'Failed to fetch program history',
        details: error
      }
    };
  }
} 