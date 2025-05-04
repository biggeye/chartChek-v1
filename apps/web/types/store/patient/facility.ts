/**
 * Type definitions for the Facility Zustand store.
 */

// Define the structure of a single Facility object
export interface Facility {
  id: number;
  name: string;
  enabled: boolean;
  address?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface FacilityStore {
  // --- STATE ---
  facilities: Facility[];
  currentFacilityId: number;
  capacity: number;
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;

  // --- ACTIONS ---
  /**
   * Fetches the list of facilities from the backend API.
   */
  fetchFacilities: () => Promise<void>;

  /**
   * Changes the currently selected facility context.
   * @param facilityId - The numeric ID of the facility to switch to (0 for "All Facilities").
   */
  changeFacilityWithContext: (facilityId: number) => void;
  
  /**
   * Initialize facility selection from localStorage after hydration.
   * This should be called in a useEffect after component mount.
   */
  initializeFromStorage: () => void;

  /**
   * Returns the full Facility object for the current selection.
   */
  getCurrentFacility: () => Facility | undefined;

  /**
   * @internal
   * Internal helper to fetch and set capacity for a facility.
   * While "internal", it needs to be in the type definition for TypeScript.
   */
  _fetchAndSetCapacity: (facilityId: number) => Promise<void>;
}

// Kipu-specific types
export interface KipuFacility {
  id: number;
  name: string;
  enabled: boolean;
  buildings?: any[];
  metadata?: Record<string, any>;
}

export interface KipuFacilityApiSettings {
  kipu_access_id?: string;
  kipu_secret_key?: string;
  kipu_app_id?: string;
  kipu_api_endpoint?: string;
}

export interface FacilityApiSettingsDisplay extends KipuFacilityApiSettings {
  has_api_key_configured?: boolean;
}

export interface FacilityWithApiSettings extends KipuFacility {
  api_settings?: FacilityApiSettingsDisplay;
}