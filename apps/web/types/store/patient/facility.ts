// Extend the existing facility types to include API key management
import { Facility as KipuFacility, FacilityApiSettings as KipuFacilityApiSettings, FacilityApiSettingsDisplay } from '~/types/kipu/kipuAdapter';

// Re-export the Facility and FacilityApiSettings interfaces from KIPU types to maintain backward compatibility
export type Facility = KipuFacility;
export type FacilityApiSettings = KipuFacilityApiSettings;

export interface FacilityWithApiSettings extends Facility {
  api_settings?: FacilityApiSettingsDisplay;
}

// Pagination interface for facility listings
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Update the FacilityStore interface to include caching and memoization
export interface FacilityStore {
  // State
  facilities: Facility[];
  currentFacilityId: number;
  capacity: number;
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setDocuments: (facilities: Facility[]) => void;
  setCurrentFacilityId: (facilityId: number) => void;
  setPagination: (pagination: Pagination | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  changeFacilityWithContext: (facilityId: number) => void;
  
  // Data fetching with caching
  fetchFacilities: (page?: number, limit?: number) => Promise<any>;
  
  // Utilities
  getCurrentFacility: () => Facility | undefined;
  invalidateFacilityCache: () => Promise<void>;
  
  // Legacy methods for backward compatibility
  updateFacilityApiSettings?: (facilityId: number, settings: FacilityApiSettings) => Promise<boolean>;
  getFacilityApiSettings?: (facilityId: number) => Promise<FacilityApiSettings | null>;
}
