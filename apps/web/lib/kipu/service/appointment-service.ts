import { KipuApiResponse, KipuCredentials } from './patient-service';
import { kipuServerGet } from '~/lib/kipu/auth/server';

export interface KipuAppointment {
  id: string;
  type: string;
  status: string;
  startTime: string;
  endTime: string;
  providerId: string;
  patientId: string;
  location: string;
  notes?: string;
}

export interface KipuAppointmentType {
  id: string;
  name: string;
  duration: number;
  color: string;
}

export interface KipuAppointmentStatus {
  id: string;
  name: string;
  color: string;
}

export async function kipuGetAppointment(
  appointmentId: string,
  credentials: KipuCredentials
): Promise<KipuApiResponse<KipuAppointment>> {
  try {
    const endpoint = `/api/scheduler/appointments/${appointmentId}?app_id=${credentials.appId}`;
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetAppointment for appointment ${appointmentId}:`, error);
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

export async function kipuListAppointments(
  credentials: KipuCredentials,
  options: {
    patientId?: string;
    providerId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<KipuApiResponse<{ appointments: KipuAppointment[]; total: number }>> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      page: (options.page || 1).toString(),
      limit: (options.limit || 20).toString()
    });

    if (options.startDate) queryParams.append('start_date', options.startDate);
    if (options.endDate) queryParams.append('end_date', options.endDate);

    let endpoint = '/api/scheduler/appointments';
    
    // Handle scoped endpoints
    if (options.patientId) {
      endpoint = `/api/patients/${options.patientId}/appointments`;
    } else if (options.providerId) {
      endpoint = `/api/providers/${options.providerId}/appointments`;
    } else if (options.userId) {
      endpoint = `/api/users/${options.userId}/appointments`;
    }

    endpoint += `?${queryParams.toString()}`;
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuListAppointments:', error);
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

export async function kipuListAppointmentTypes(
  credentials: KipuCredentials
): Promise<KipuApiResponse<{ types: KipuAppointmentType[] }>> {
  try {
    const endpoint = `/api/scheduler/appointment_types?app_id=${credentials.appId}`;
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuListAppointmentTypes:', error);
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

export async function kipuListAppointmentStatuses(
  credentials: KipuCredentials
): Promise<KipuApiResponse<{ statuses: KipuAppointmentStatus[] }>> {
  try {
    const endpoint = `/api/scheduler/appointment_statuses?app_id=${credentials.appId}`;
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuListAppointmentStatuses:', error);
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