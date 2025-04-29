'use client'
/**
 * API Settings Service
 * 
 * This service handles the storage and retrieval of KIPU API settings for users.
 * It uses Supabase as the primary storage mechanism.
 * 
 * Note: KIPU API credentials are configured at the user level and are valid for
 * accessing multiple facilities/locations that the user has permission to access.
 */

import { createClient } from "../../../utils/supabase/client";

/**
 * Interface for user API settings
 * These settings are at the user level, not facility-specific
 */
export interface UserApiSettings {
  id?: number;
  account_id: string;
  kipu_access_id?: string;  // KIPU API access ID for HMAC authentication
  kipu_secret_key?: string; // KIPU API secret key for HMAC authentication
  kipu_app_id?: string;     // KIPU API app ID (recipient_id)
  kipu_api_endpoint?: string; // KIPU API base URL
  has_api_key_configured: boolean;
  created_at?: string;
}

/**
 * Interface for KIPU Credentials used in API calls
 * Defined inline temporarily, will be moved to a dedicated types file later.
 */
export interface KipuCredentials {
  accessId: string;
  secretKey: string;
  appId: string;
  baseUrl: string;
}

/**
 * Get API settings for a specific user
 * 
 * @param ownerId - The ID of the owner (optional, defaults to current user)
 * @returns Promise resolving to the user API settings or null if not found
 */
export async function getUserApiSettings(ownerId?: string): Promise<UserApiSettings | null> {
  try {
    const supabase = createClient();
    // If ownerId is not provided, try to get the current user
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
       return data as UserApiSettings;
  } catch (error) {
    console.error('Error getting user API settings:', error);
    return null;
  }
}

/**
 * Update user API settings
 * 
 * @param settings - The updated API settings
 * @param ownerId - The ID of the user (optional, defaults to current user)
 * @returns Promise resolving to true if update succeeded, false otherwise
 */
export async function updateUserApiSettings(
  settings: Partial<UserApiSettings>,
  ownerId?: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // If ownerId is not provided, try to get the current user
    if (!ownerId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }
      ownerId = user.id;
    }
    
    // Prepare the data for update
    const updateData = {
      ...settings,
      account_id: ownerId
    };
    
    // Check if the user has existing API settings
    const { data: existingSettings, error: fetchError } = await supabase
      .from('user_api_settings')
      .select('id')
      .eq('account_id', ownerId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error checking existing settings:', fetchError);
      return false;
    }
    
    let error;
    
    if (existingSettings?.id) {
      // Update existing record
      const result = await supabase
        .from('user_api_settings')
        .update(updateData)
        .eq('id', existingSettings.id);
      
      error = result.error;
    } else {
      // Insert new record
      const result = await supabase
        .from('user_api_settings')
        .upsert(updateData);
      
      error = result.error;
    }
    
    if (error) {
      console.error('Error updating user API settings:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user API settings:', error);
    return false;
  }
}

/**
 * Get KIPU credentials for a specific user
 * 
 * @param ownerId - The ID of the owner (optional, defaults to current user)
 * @returns Promise resolving to the KIPU credentials or null if not configured
 */
export async function getUserKipuCredentials(ownerId?: string): Promise<KipuCredentials | null> {
  try {
    // Get the user API settings
    const settings = await getUserApiSettings(ownerId);

    // Check if all required fields are present
    if (!settings || !settings.kipu_access_id || !settings.kipu_secret_key || !settings.kipu_app_id || !settings.kipu_api_endpoint) {
      return null;
    }
    
    // Return the KIPU credentials
    return {
      accessId: settings.kipu_access_id,
      secretKey: settings.kipu_secret_key,
      appId: settings.kipu_app_id,
      baseUrl: settings.kipu_api_endpoint
    };
  } catch (error) {
    console.error('Error getting user KIPU credentials:', error);
    return null;
  }
}

/**
 * Get KIPU credentials for the current user
 * This function is used by the API routes to get the credentials needed for KIPU API calls
 * 
 * @returns Promise resolving to the KIPU credentials or null if not configured
 */
export async function getKipuCredentials(ownerId?: string): Promise<any | null> {
  try {
    const credentials = await getUserKipuCredentials(ownerId);
      // If the user has configured credentials, use those
      if (credentials) {
        console.log('[user-settings] successfully retrieved user API settings')
        return credentials;
      }

    
    // If we're in development mode, use environment variables as fallback
    if (process.env.NODE_ENV === 'development') {
      const accessId = process.env.KIPU_ACCESS_ID || '';
      const secretKey = process.env.KIPU_SECRET_KEY || '';
      const appId = process.env.KIPU_APP_ID || '';
      const baseUrl = process.env.KIPU_API_ENDPOINT || 'https://api.kipuapi.com';
      
      // Check if all required fields are present
      if (accessId && secretKey && appId) {
        console.warn('Using development KIPU credentials from environment variables');
        return {
          accessId,
          secretKey,
          appId,
          baseUrl
        };
      }
    }
    
    // If we get here, no credentials are available
    console.error('No KIPU credentials found');
    return null;
  } catch (error) {
    console.error('Error getting KIPU credentials:', error);
    return null;
  }
}
