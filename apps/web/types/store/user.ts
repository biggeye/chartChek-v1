/**
 * Type definitions for user-related data structures
 */

/**
 * Interface for user API settings
 * These settings are at the user level, not facility-specific
 */
export interface UserApiSettings {
  kipu_access_id?: string;
  kipu_secret_key?: string;
  kipu_app_id?: string;
  kipu_api_endpoint?: string;
  has_api_key_configured: boolean;
}

/**
 * Interface for user API settings as stored in the database
 */
export interface UserApiSettingsDB {
  id?: number;
  account_id: string;
  kipu_access_id?: string;
  kipu_secret_key?: string;
  kipu_app_id?: string;
  kipu_api_endpoint?: string;
  has_api_key_configured: boolean;
  created_at?: string;
}
