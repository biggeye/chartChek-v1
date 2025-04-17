'use server'
/**
 * Facility Service
 * 
 * This service handles interactions with the KIPU API for facility-related operations.
 * It provides functions for listing facilities, getting facility details, and updating facilities.
 */

import { createKipuRequestConfig } from '~/lib/kipu/auth/signature';
import { getKipuCredentials } from '~/lib/kipu/service/user-settings';
import { createServer } from '~/lib/utils/supabase/server';
import { mapKipuLocationToFacility } from '~/lib/kipu/mapping';
import { kipuServerGet } from '~/lib/kipu/auth/server';

// Defined inline temporarily, will be moved to dedicated types file later.
export interface KipuCredentials {
  accessId: string;
  secretKey: string;
  appId: string;
  baseUrl: string;
}

// Defined inline temporarily
export interface KipuApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Defined inline temporarily - Placeholder structure
export interface Facility {
  id: number | string;
  name: string;
  data?: {
    patients?: {
      total?: number;
      admitted?: number;
      discharged?: number;
    };
    beds?: {
      total?: number;
      occupied?: number;
      available?: number;
    };
  };
  api_settings?: {
    has_api_key_configured?: boolean;
  };
  // TODO: Add other properties mapped from KipuLocation in mapKipuLocationToFacility
}

/**
 * Paginated response for facilities
 */
export interface PaginatedFacilitiesResponse {
  facilities: Facility[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Default pagination values
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * Lists all facilities available to the authenticated user
 * 
 * @param page - Page number for pagination (default: 1)
 * @param limit - Number of facilities per page (default: 20)
 * @param status - Filter facilities by status (default: 'active')
 * @param sort - Sort order for facilities (default: 'name_asc')
 * @returns Promise resolving to a paginated list of facilities
 */
export async function listFacilities(
  page: number = DEFAULT_PAGE,
  limit: number = DEFAULT_LIMIT,
  status: 'active' | 'inactive' | 'all' = 'active',
  sort: 'name_asc' | 'name_desc' | 'created_at_asc' | 'created_at_desc' = 'name_asc'
): Promise<PaginatedFacilitiesResponse> {
  try {
    // Call the API endpoint for listing facilities
    const response = await fetch(`/api/kipu/facilities`);
    console.log('[facility-service] listFacilities: ', response);
    if (!response.ok) {
      let errorMessage = 'Failed to fetch facilities';
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
  
    // Map KIPU locations to our Facility type
    const facilities = data.facilities ? data.facilities : [];
    
    return {
      facilities,
      pagination: {
        total: data.pagination?.total || 0,
        page,
        limit,
        pages: data.pagination?.pages || 0
      }
    };
  } catch (error) {
    console.error('Error in listFacilities:', error);
    // Return empty response with pagination
    return {
      facilities: [],
      pagination: {
        total: 0,
        page,
        limit,
        pages: 0
      }
    };
  }
}



/**
 * Direct KIPU API call to list facilities (server-side function)
 * This function is used internally by the API routes
 * 
 * @param credentials - KIPU API credentials
 * @param includeBuildings - Whether to include buildings in the response
 * @returns Promise resolving to the KIPU API response
 */
export async function kipuListFacilities(
  credentials: KipuCredentials
): Promise<any> {

    // Construct the endpoint with query parameters
    const endpoint = `/api/locations`;

    const response = await kipuServerGet<Location[]>(endpoint, credentials);
    

      const data = await response;
    if (data) {
      return {
        success: true,
        data: data
      }};
    
    }
/**
 * Direct KIPU API call to get a facility (server-side function)
 * This function is used internally by the API routes
 * 
 * @param facilityId - The KIPU location ID
 * @param credentials - KIPU API credentials
 * @returns Promise resolving to the KIPU API response
 */
export async function kipuGetFacility(
  facilityId: number,
  credentials: KipuCredentials
): Promise<KipuApiResponse> {
  try {
    // Construct the endpoint with query parameters
    const endpoint = `/locations/${facilityId}?app_id=${credentials.appId}`;
    
    // Create request configuration with authentication headers
    const requestConfig = createKipuRequestConfig('GET', endpoint, credentials);
    
    // Make the API call
    const response = await fetch(`${credentials.baseUrl}${endpoint}`, requestConfig);
    const data = await response.json();
     return {
      success: response.ok,
      data: response.ok ? data : undefined,
      error: !response.ok ? {
        code: response.status.toString(),
        message: data.error || 'Failed to get facility from KIPU API'
      } : undefined
    };
  } catch (error) {
    console.error(`Error in kipuGetFacility for facility ${facilityId}:`, error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error occurred'
      }
    };
  }
}

/**
 * Tests the connection to the KIPU API for a specific facility
 * This function is used by the test-connection API endpoint
 * 
 * @param facilityId - The ID of the facility to test
 * @returns Promise resolving to a success/failure result with message
 */
export async function testKipuConnection(
  facilityId: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Get the KIPU credentials for the facility
    const credentials = await getKipuCredentials();
    
    if (!credentials) {
      return {
        success: false,
        message: 'No KIPU API credentials configured for this facility'
      };
    }
    
    // Try to list facilities as a test
    const result = await kipuListFacilities(credentials);
    
    if (result.success) {
      return {
        success: true,
        message: 'Successfully connected to KIPU API'
      };
    } else {
      return {
        success: false,
        message: result.error?.message || 'Failed to connect to KIPU API'
      };
    }
  } catch (error) {
    console.error(`Error testing KIPU connection for facility ${facilityId}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while testing the connection'
    };
  }
}

/**
 * Enriches a facility with additional data from other KIPU API endpoints
 * This function is used to add patient counts, document counts, etc.
 * 
 * @param facility - The base facility object
 * @param credentials - KIPU API credentials
 * @returns Promise resolving to the enriched facility
 */
export async function enrichFacilityWithData(
  facility: Facility,
  credentials: KipuCredentials
): Promise<Facility> {
  try {
    // Get patient census data
    const patientCensusEndpoint = `/patients/census?app_id=${credentials.appId}&location_id=${facility.id}`;
    const patientCensusConfig = createKipuRequestConfig('GET', patientCensusEndpoint, credentials);
    const patientCensusResponse = await fetch(`${credentials.baseUrl}${patientCensusEndpoint}`, patientCensusConfig);
    
    if (patientCensusResponse.ok) {
      const patientCensusData = await patientCensusResponse.json();
      
      // Update facility data with patient counts
      if (facility.data && facility.data.patients) {
        facility.data.patients.total = patientCensusData.total || 0;
        facility.data.patients.admitted = patientCensusData.admitted || 0;
        facility.data.patients.discharged = patientCensusData.discharged || 0;
      }
      
      // Update occupancy data if available
      if (facility.data && facility.data.beds && patientCensusData.occupancy) {
        facility.data.beds.total = patientCensusData.occupancy.total_beds || 0;
        facility.data.beds.occupied = patientCensusData.occupancy.occupied_beds || 0;
        facility.data.beds.available = patientCensusData.occupancy.available_beds || 0;
      }
    }
    
    // Check if API settings are configured for this facility
    const supabase = await createServer();
    const user = await supabase.auth.getUser();
    const ownerId = user.data?.user?.id;
    const { data: apiSettings } = await supabase
      .from('user_api_settings')
      .select('has_api_key_configured')
      .eq('user_id', ownerId)
      .eq('has_api_key_configured', true)
      .limit(1)
      .single();
    
    if (apiSettings) {
      facility.api_settings = {
        has_api_key_configured: apiSettings.has_api_key_configured,
      };
    }
    
    return facility;
  } catch (error) {
    console.error(`Error enriching facility ${facility.id} with data:`, error);
    // Return the original facility if enrichment fails
    return facility;
  }
}

/**
 * Fetches facilities directly from KIPU API and updates the facility store
 * This function is used when saving API credentials to immediately populate the facility list
 * 
 * @param credentials - KIPU API credentials
 * @returns Promise resolving to the list of facilities
 */
export async function fetchAndStoreFacilities(
  credentials: KipuCredentials
): Promise<Facility[]> {
  try {
    // Use the server-side API route to avoid CORS issues
    const response = await fetch('/api/kipu/facilities/fetch-with-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ credentials })
    });
    
    const result = await response.json();
 
    if (!result.success || !result.data) {
      console.error('Failed to fetch facilities from KIPU API:', result.error || 'Unknown error');
      return [];
    }
    
    // Ensure locations is an array
    if (!result.data.locations || !Array.isArray(result.data.locations)) {
      console.error('Invalid response format from KIPU API - locations is not an array');
      return [];
    }
    
    // Map KIPU locations to our Facility type
    const facilities = result.data.locations.map((location: any) => mapKipuLocationToFacility(location));
    
    
    return facilities;
  } catch (error) {
    console.error('Error fetching and storing facilities:', error);
    return [];
  } 
}
