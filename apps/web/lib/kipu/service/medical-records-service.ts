import { KipuApiResponse, KipuCredentials } from './patient-service';
import { kipuServerGet } from '~/lib/kipu/auth/server';

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

// Consent Forms
export async function kipuListConsentForms(
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
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuListConsentForms:', error);
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

// Consent Form Records
export async function kipuListConsentFormRecords(
  credentials: KipuCredentials,
  patientId?: string,
  options: { page?: number; limit?: number } = {}
): Promise<KipuApiResponse<{ records: KipuConsentFormRecord[]; total: number }>> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      page: (options.page || 1).toString(),
      limit: (options.limit || 20).toString()
    });

    const endpoint = patientId
      ? `/api/patients/${patientId}/consent_form_records?${queryParams.toString()}`
      : `/api/consent_form_records?${queryParams.toString()}`;

    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuListConsentFormRecords:', error);
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

export async function kipuGetConsentFormRecord(
  recordId: string,
  credentials: KipuCredentials
): Promise<KipuApiResponse<{ record: KipuConsentFormRecord }>> {
  try {
    const endpoint = `/api/consent_form_records/${recordId}?app_id=${credentials.appId}`;
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetConsentFormRecord for record ${recordId}:`, error);
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

// Patient History
export async function kipuGetPatientDiagnosisHistory(
  patientId: string,
  credentials: KipuCredentials
): Promise<KipuApiResponse<{ diagnoses: KipuDiagnosisHistory[]; total: number }>> {
  try {
    const endpoint = `/api/patients/${patientId}/diagnosis_history?app_id=${credentials.appId}`;
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetPatientDiagnosisHistory for patient ${patientId}:`, error);
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

export async function kipuGetPatientProgramHistory(
  patientId: string,
  credentials: KipuCredentials
): Promise<KipuApiResponse<{ programs: KipuProgramHistory[]; total: number }>> {
  try {
    const endpoint = `/api/patients/${patientId}/program_history?app_id=${credentials.appId}`;
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetPatientProgramHistory for patient ${patientId}:`, error);
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