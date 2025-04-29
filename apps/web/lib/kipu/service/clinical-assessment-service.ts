import { KipuApiResponse, KipuCredentials } from './patient-service';
import { kipuServerGet, kipuServerPost } from '~/lib/kipu/auth/server';
import { parsePatientId } from '~/lib/kipu/auth/config';

export interface KipuCiwaAr {
  id: string;
  patientId: string;
  assessmentDate: string;
  score: number;
  symptoms: Record<string, number>;
  notes?: string;
}

export interface KipuCiwaB {
  id: string;
  patientId: string;
  assessmentDate: string;
  score: number;
  symptoms: Record<string, number>;
  notes?: string;
}

export interface KipuCows {
  id: string;
  patientId: string;
  assessmentDate: string;
  score: number;
  symptoms: Record<string, number>;
  notes?: string;
}

export interface KipuVitalSigns {
  id: string;
  patientId: string;
  recordedAt: string;
  temperature: number;
  pulse: number;
  respiratoryRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  oxygenSaturation?: number;
  notes?: string;
}

export interface KipuOrthostaticVitalSigns extends KipuVitalSigns {
  position: 'lying' | 'sitting' | 'standing';
  timingMinutes: number;
}

// CIWA-Ar Endpoints
export async function kipuListCiwaArs(
  credentials: KipuCredentials,
  patientId?: string,
  options: { page?: number; limit?: number } = {}
): Promise<KipuApiResponse<{ ciwaArs: KipuCiwaAr[]; total: number }>> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      page: (options.page || 1).toString(),
      limit: (options.limit || 20).toString()
    });

    const endpoint = patientId 
      ? `/api/patients/${parsePatientId(patientId).chartId}/ciwa_ars?${queryParams.toString()}`
      : `/api/ciwa_ars?${queryParams.toString()}`;

    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuListCiwaArs:', error);
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

// CIWA-B Endpoints
export async function kipuListCiwaBs(
  credentials: KipuCredentials,
  patientId?: string,
  options: { page?: number; limit?: number } = {}
): Promise<KipuApiResponse<{ ciwaBs: KipuCiwaB[]; total: number }>> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      page: (options.page || 1).toString(),
      limit: (options.limit || 20).toString()
    });

    const endpoint = patientId 
      ? `/api/patients/${parsePatientId(patientId).chartId}/ciwa_bs?${queryParams.toString()}`
      : `/api/ciwa_bs?${queryParams.toString()}`;

    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuListCiwaBs:', error);
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

// COWS Endpoints
export async function kipuListCows(
  credentials: KipuCredentials,
  patientId?: string,
  options: { page?: number; limit?: number } = {}
): Promise<KipuApiResponse<{ cows: KipuCows[]; total: number }>> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      page: (options.page || 1).toString(),
      limit: (options.limit || 20).toString()
    });

    const endpoint = patientId 
      ? `/api/patients/${parsePatientId(patientId).chartId}/cows?${queryParams.toString()}`
      : `/api/cows?${queryParams.toString()}`;

    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuListCows:', error);
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

// Vital Signs Endpoints
export async function kipuListVitalSigns(
  credentials: KipuCredentials,
  patientId?: string,
  options: { page?: number; limit?: number } = {}
): Promise<KipuApiResponse<{ vitalSigns: KipuVitalSigns[]; total: number }>> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      page: (options.page || 1).toString(),
      limit: (options.limit || 20).toString()
    });

    const endpoint = patientId 
      ? `/api/patients/${parsePatientId(patientId).chartId}/vital_signs?${queryParams.toString()}`
      : `/api/vital_signs?${queryParams.toString()}`;

    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuListVitalSigns:', error);
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

export async function kipuCreateVitalSigns(
  credentials: KipuCredentials,
  patientId: string,
  vitalSigns: Omit<KipuVitalSigns, 'id' | 'patientId'>
): Promise<KipuApiResponse<{ vitalSign: KipuVitalSigns }>> {
  try {
    const { chartId } = parsePatientId(patientId);
    const endpoint = `/api/patients/${chartId}/vital_signs?app_id=${credentials.appId}`;
    const body = {
      ...vitalSigns,
      patient_id: chartId // Use the chartId as the patient_id in the request body
    };
    return await kipuServerPost(endpoint, body, credentials);
  } catch (error) {
    console.error('Error in kipuCreateVitalSigns:', error);
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

// Orthostatic Vital Signs Endpoints
export async function kipuListOrthostaticVitalSigns(
  credentials: KipuCredentials,
  patientId?: string,
  options: { page?: number; limit?: number } = {}
): Promise<KipuApiResponse<{ orthostaticVitalSigns: KipuOrthostaticVitalSigns[]; total: number }>> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      page: (options.page || 1).toString(),
      limit: (options.limit || 20).toString()
    });

    const endpoint = patientId 
      ? `/api/patients/${patientId}/orthostatic_vital_signs?${queryParams.toString()}`
      : `/api/orthostatic_vital_signs?${queryParams.toString()}`;

    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuListOrthostaticVitalSigns:', error);
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