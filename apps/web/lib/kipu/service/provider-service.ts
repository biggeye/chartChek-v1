import { KipuApiResponse, KipuCredentials } from './patient-service';
import { kipuServerGet } from '~/lib/kipu/auth/server';

export interface KipuProvider {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  specialties?: string[];
  npi?: string;
  roles: string[];
  status: 'active' | 'inactive';
}

export interface KipuUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  roles: string[];
  status: 'active' | 'inactive';
}

export interface KipuRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

export interface KipuUserTitle {
  id: string;
  name: string;
  category?: string;
}

// Provider Endpoints
export async function kipuListProviders(
  credentials: KipuCredentials,
  options: { page?: number; limit?: number } = {}
): Promise<KipuApiResponse<{ providers: KipuProvider[]; total: number }>> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      page: (options.page || 1).toString(),
      limit: (options.limit || 20).toString()
    });

    const endpoint = `/api/providers?${queryParams.toString()}`;
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuListProviders:', error);
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

export async function kipuGetProvider(
  providerId: string,
  credentials: KipuCredentials
): Promise<KipuApiResponse<{ provider: KipuProvider }>> {
  try {
    const endpoint = `/api/providers/${providerId}?app_id=${credentials.appId}`;
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetProvider for provider ${providerId}:`, error);
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

// User Endpoints
export async function kipuListUsers(
  credentials: KipuCredentials,
  options: { 
    page?: number; 
    limit?: number;
    roleId?: string;
  } = {}
): Promise<KipuApiResponse<{ users: KipuUser[]; total: number }>> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      page: (options.page || 1).toString(),
      limit: (options.limit || 20).toString()
    });

    const endpoint = options.roleId
      ? `/api/roles/${options.roleId}/users?${queryParams.toString()}`
      : `/api/users?${queryParams.toString()}`;

    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuListUsers:', error);
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

export async function kipuGetUser(
  userId: string,
  credentials: KipuCredentials
): Promise<KipuApiResponse<{ user: KipuUser }>> {
  try {
    const endpoint = `/api/users/${userId}?app_id=${credentials.appId}`;
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetUser for user ${userId}:`, error);
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

// Role Endpoints
export async function kipuListRoles(
  credentials: KipuCredentials,
  options: { 
    providerId?: string;
    userId?: string;
  } = {}
): Promise<KipuApiResponse<{ roles: KipuRole[]; total: number }>> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId
    });

    let endpoint = '/api/roles';
    if (options.providerId) {
      endpoint = `/api/providers/${options.providerId}/roles`;
    } else if (options.userId) {
      endpoint = `/api/users/${options.userId}/roles`;
    }

    endpoint += `?${queryParams.toString()}`;
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuListRoles:', error);
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

// User Titles
export async function kipuListUserTitles(
  credentials: KipuCredentials
): Promise<KipuApiResponse<{ titles: KipuUserTitle[]; total: number }>> {
  try {
    const endpoint = `/api/user_titles?app_id=${credentials.appId}`;
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuListUserTitles:', error);
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