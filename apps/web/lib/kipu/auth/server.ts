export const runtime = 'nodejs';
/**
 * KIPU API Authentication Utilities
 * 
 * This module provides utilities for authenticating with the KIPU API.
 * It can be used in both client and server components.
 */

import { KipuCredentials, KipuApiResponse } from 'types/kipu/kipuAdapter';
import { generateKipuAuthHeaders } from './signature';
import { createServer } from '~/utils/supabase/server';
import crypto from 'crypto';

// Flag to indicate if we're running on the server
const isServer = typeof window === 'undefined';

/**
 * Interface for KIPU signature generation parameters
 */
interface KipuSignatureParams {
  method: 'GET' | 'POST';
  url: string;
  date: string;
  accessId: string;
  secretKey: string;
  contentType?: string;
  contentMD5?: string;
}

/**
 * Builds a KIPU API signature using HMAC SHA-1
 * 
 * @param params - Parameters for signature generation
 * @returns HMAC SHA-1 signature for KIPU API authentication
 */
export function buildKipuSignature(params: KipuSignatureParams): string {
  const { method, url, date, accessId, secretKey, contentType = '', contentMD5 = '' } = params;
  
  // Build the canonical string for signature generation
  // For GET requests: ,,<url>,<date>
  // For POST requests: <contentType>,<contentMD5>,<url>,<date>
  let canonicalString = '';
  
  if (method === 'GET') {
    canonicalString = `,,${url},${date}`;
  } else if (method === 'POST') {
    canonicalString = `${contentType},${contentMD5},${url},${date}`;
  }
  
  // Generate the HMAC SHA-1 signature
  const hmac = crypto.createHmac('sha1', secretKey);
  hmac.update(canonicalString);
  const signature = hmac.digest('base64');
  
  return signature;
}

/**
 * Makes a GET request to the KIPU API
 * @param endpoint - API endpoint (without base URL)
 * @param customCredentials - Optional custom credentials (defaults to environment variables)
 * @returns Promise resolving to the API response
 */
export async function kipuServerGet<T>(
  endpoint: string,
  customCredentials?: KipuCredentials
): Promise<KipuApiResponse<T>> {
  try {
    const credentials = customCredentials!;
    // Ensure endpoint starts with a slash
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Add app_id parameter to the endpoint if it doesn't already have it
    const separator = formattedEndpoint.includes('?') ? '&' : '?';
    const endpointWithAppId = formattedEndpoint.includes('app_id=') 
      ? formattedEndpoint 
      : `${formattedEndpoint}${separator}app_id=${credentials.appId}`;
    
    // Generate authentication headers
    const headers = generateKipuAuthHeaders('GET', endpointWithAppId, credentials);
    
      
    // Make the request
    const response = await fetch(`${credentials.baseUrl}${endpointWithAppId}`, {
      method: 'GET',
      headers,
    });
    
    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`KIPU API error (${response.status}):`, errorText);
      
      let errorMessage = `KIPU API error: ${response.statusText}`;
      let errorDetails = undefined;
      
      try {
        // Try to parse error as JSON if possible
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
        errorDetails = errorJson;
      } catch (e) {
        // If not JSON, use the raw text
        errorDetails = { raw: errorText };
      }
      
      return {
        success: false,
        error: {
          code: response.status.toString(),
          message: errorMessage,
          details: errorDetails
        }
      };
    }
    
    // Check content type to ensure it's JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.warn('KIPU API returned non-JSON response:', text);
      
      return {
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: `Expected JSON but got ${contentType || 'unknown content type'}`,
          details: { raw: text }
        }
      };
    }
    
    // Parse the response
    try {
      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (parseError) {
      console.error('Error parsing response as JSON:', parseError);
      
      // Try to get the raw text to help with debugging
      let rawText = '';
      try {
        rawText = await response.text();
      } catch (e) {
        rawText = 'Could not retrieve raw response text';
      }
      
      return {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Failed to parse KIPU API response as JSON',
          details: { error: parseError instanceof Error ? parseError.message : String(parseError), raw: rawText }
        }
      };
    }
  } catch (error) {
    console.error('Error in kipuServerGet:', error);
    return {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error in kipuServerGet',
        details: error
      }
    };
  }
}

/**
 * Makes a POST request to the KIPU API
 * @param endpoint - API endpoint (without base URL)
 * @param body - Request body
 * @param customCredentials - Optional custom credentials (defaults to environment variables)
 * @returns Promise resolving to the API response
 */
export async function kipuServerPost<T>(
  endpoint: string,
  body: any,
  customCredentials?: KipuCredentials
): Promise<KipuApiResponse<T>> {
  try {
    const credentials = customCredentials!;
    
    // Ensure endpoint starts with a slash
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Add app_id parameter to the endpoint if it doesn't already have it
    const separator = formattedEndpoint.includes('?') ? '&' : '?';
    const endpointWithAppId = formattedEndpoint.includes('app_id=') 
      ? formattedEndpoint 
      : `${formattedEndpoint}${separator}app_id=${credentials.appId}`;
    
    // Convert body to JSON string
    const bodyString = JSON.stringify(body);
    
    // Generate authentication headers with body content
    const headers = generateKipuAuthHeaders('POST', endpointWithAppId, credentials, bodyString);
    
    // Add content-type header
    headers['Content-Type'] = 'application/json';
    
    // Make the request
    const response = await fetch(`${credentials.baseUrl}${endpointWithAppId}`, {
      method: 'POST',
      headers,
      body: bodyString
    });
    
    // Parse the response
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: {
          code: response.status.toString(),
          message: data.message || response.statusText,
          details: data
        }
      };
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in kipuServerPost:', error);
    return {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error in kipuServerPost',
        details: error
      }
    };
  }
}

export async function kipuServerPatch(endpoint: string, credentials: KipuCredentials, body: any) {
  const { accessId, secretKey, baseUrl } = credentials;
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Id': accessId,
        'X-Secret-Key': secretKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('KIPU PATCH request failed:', error);
    throw error;
  }
}

export async function serverLoadKipuCredentialsFromSupabase(ownerId?: string): Promise<KipuCredentials | null> {
    const supabase = await createServer();
    if (!ownerId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return null;
      }
      ownerId = user.id;
    }
 // Query the user_api_settings table
 const { data, error } = await supabase
 .from('user_api_settings')
 .select('*')
 .eq('account_id', ownerId)
 .single();
 if (error) {
  console.warn('Error fetching user API settings:', error);
  return null;
}
return {
  accessId: data.kipu_access_id,
  secretKey: data.kipu_secret_key,
  appId: data.kipu_app_id,
  baseUrl: data.kipu_api_endpoint
} }


export async function serverSaveKipuCredentialsToSupabase(credentials: KipuCredentials): Promise<boolean> {
  try {
    const supabase = await createServer();
    
    // Check if a record already exists
    const { data: existingData } = await supabase
      .from('user_api_settings')
      .select('id')
      .eq('api_name', 'kipu')
      .single();
    
    const credentialsRecord = {
      kipu_access_id: credentials.accessId,
      kipu_secret_key: credentials.secretKey,
      kipu_app_id: credentials.appId,
      kpu_api_endpoint: credentials.baseUrl,
    };
    
    let result;
    
    if (existingData) {
      // Update existing record
      result = await supabase
        .from('user_api_settings')
        .update(credentialsRecord)
        .eq('id', existingData.id);
    } else {
      // Insert new record
      result = await supabase
        .from('user_api_settings')
        .insert({
          ...credentialsRecord,
          created_at: new Date().toISOString()
        });
    }
    
    if (result.error) {
      console.error('Failed to save KIPU credentials to Supabase:', result.error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving KIPU credentials to Supabase:', error);
    return false;
  }
}