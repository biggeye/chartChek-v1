import { KipuApiResponse, KipuCredentials } from './patient-service';
import { kipuServerGet, kipuServerPost, kipuServerPatch } from '~/lib/kipu/auth/server';

export interface KipuContact {
  id: string;
  type: string;
  firstName: string;
  lastName: string;
  organization?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  isReferrer: boolean;
}

export interface KipuContactType {
  id: string;
  name: string;
  description?: string;
}

export async function kipuListContacts(
  credentials: KipuCredentials,
  options: { 
    page?: number; 
    limit?: number;
    referrersOnly?: boolean;
  } = {}
): Promise<KipuApiResponse<{ contacts: KipuContact[]; total: number }>> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      page: (options.page || 1).toString(),
      limit: (options.limit || 20).toString()
    });

    const endpoint = options.referrersOnly
      ? `/api/contacts/referrers?${queryParams.toString()}`
      : `/api/contacts?${queryParams.toString()}`;

    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuListContacts:', error);
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

export async function kipuGetContact(
  contactId: string,
  credentials: KipuCredentials
): Promise<KipuApiResponse<{ contact: KipuContact }>> {
  try {
    const endpoint = `/api/contacts/${contactId}?app_id=${credentials.appId}`;
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetContact for contact ${contactId}:`, error);
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

export async function kipuCreateContact(
  credentials: KipuCredentials,
  contact: Omit<KipuContact, 'id'>
): Promise<KipuApiResponse<{ contact: KipuContact }>> {
  try {
    const endpoint = `/api/contacts?app_id=${credentials.appId}`;
    return await kipuServerPost(endpoint, credentials, contact);
  } catch (error) {
    console.error('Error in kipuCreateContact:', error);
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

export async function kipuUpdateContact(
  credentials: KipuCredentials,
  contactId: string,
  updates: Partial<Omit<KipuContact, 'id'>>
): Promise<KipuApiResponse<{ contact: KipuContact }>> {
  try {
    const endpoint = `/api/contacts/${contactId}?app_id=${credentials.appId}`;
    return await kipuServerPatch(endpoint, credentials, updates);
  } catch (error) {
    console.error(`Error in kipuUpdateContact for contact ${contactId}:`, error);
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

export async function kipuListContactTypes(
  credentials: KipuCredentials
): Promise<KipuApiResponse<{ types: KipuContactType[] }>> {
  try {
    const endpoint = `/api/contact_types?app_id=${credentials.appId}`;
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error('Error in kipuListContactTypes:', error);
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