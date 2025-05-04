'use client';

import { create } from 'zustand';
import { createClient } from '~/utils/supabase/client'; // Supabase client import
import type { Facility, FacilityStore, Pagination } from 'types/store/patient/facility'; // Assuming correct type paths
import { usePatientStore } from './patientStore'; // Import patient store for interaction
// Removed queryKeys and invalidateFacilityCache as React Query invalidation isn't directly handled here anymore
// If cache invalidation is needed elsewhere, those parts can be reintegrated or handled differently.

// Safe function to get facility ID from localStorage (only on client)
const getStoredFacilityId = (): number => {
  try {
    if (typeof window !== 'undefined') {
      return Number(localStorage.getItem('currentFacilityId')) || 0;
    }
  } catch (e) {
    console.error('Error accessing localStorage:', e);
  }
  return 0; // Default to All Facilities (0) if anything goes wrong
};

export const useFacilityStore = create<FacilityStore>((set, get) => ({
  // --- STATE ---
  facilities: [],
  // Always initialize with 0 for SSR consistency, localStorage will be used after hydration
  currentFacilityId: 0, // Default to 0 (All Facilities) for both server and client initially
  capacity: 0, // Capacity of the currently selected facility
  pagination: null, // Pagination info if fetching facilities supports it
  isLoading: false, // Loading state specifically for fetching the facilities list
  error: null, // Error state for facility fetching or operations

  // --- ACTIONS ---
  
  // Initialize from localStorage (to be called in a useEffect after hydration)
  initializeFromStorage: () => {
    const storedId = getStoredFacilityId();
    if (storedId !== 0) { // Only update if not already the default
      get().changeFacilityWithContext(storedId);
    }
  },

  // Action to fetch the list of facilities
  fetchFacilities: async () => {
    // Prevent fetching if already loading
    if (get().isLoading) return; 
    
    console.log('[FacilityStore] Fetching facilities...');
    set({ isLoading: true, error: null });

    try {
      // Using fetch API to call internal Kipu facilities endpoint
      const response = await fetch(`/api/kipu/facilities`);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Failed to fetch facilities: ${response.status} ${errorText}`);
        // Set empty facilities but don't necessarily set an error if it's expected (e.g., Kipu not configured)
        set({ facilities: [], isLoading: false, error: 'KIPU settings might not be configured.' });
        return; // Exit early
      }

      const data = await response.json();

      // Extract facilities from the nested structure (adjust path if API changes)
      const rawFacilities = data?.data?.data?.locations || [];

      // Transform raw data into the expected Facility type
      const facilities: Facility[] = rawFacilities.map((facility: any) => ({
        id: Number(facility.location_id), // Ensure ID is a number
        name: facility.location_name || 'Unnamed Facility', // Provide fallback name
        enabled: facility.enabled ?? true, // Default to enabled if not specified
      })).filter((f: Facility) => !isNaN(f.id)); // Filter out entries with invalid IDs

      console.log(`[FacilityStore] Fetched ${facilities.length} facilities.`);
      set({
        facilities: facilities,
        isLoading: false,
        error: null, // Clear any previous error on success
        pagination: null // Reset pagination if applicable
      });

      // After fetching, ensure a valid facility is selected
      const currentId = get().currentFacilityId;
      const storedId = getStoredFacilityId(); // Get the ID from localStorage
      const facilityExists = facilities.some(f => f.id === currentId);
      const storedFacilityExists = facilities.some(f => f.id === storedId);

      // Only auto-select first facility if:
      // 1. Current ID is 0 AND
      // 2. No valid stored ID exists AND
      // 3. We have facilities available
      if (currentId === 0 && !storedFacilityExists && facilities.length > 0) {
        console.log('[FacilityStore] No valid facility selected, auto-selecting first available facility.');
        const firstFacility = facilities[0];
        if (firstFacility && firstFacility.id !== undefined) {
          get().changeFacilityWithContext(firstFacility.id);
        }
      } else if (facilityExists) {
        // If the current facility exists, ensure its capacity is fetched/updated
        await get()._fetchAndSetCapacity(currentId);
      }

    } catch (error: any) {
      console.error('Error fetching facilities:', error);
      set({
        error: error?.message || 'An unexpected error occurred while fetching facilities.',
        isLoading: false,
        facilities: [], // Clear facilities on error
      });
    }
  },

  // Internal helper to fetch and set capacity without side effects on patient store etc.
  _fetchAndSetCapacity: async (facilityId: number) => {
      // Skip fetching for "All Facilities" (ID 0)
      if (facilityId === 0) {
          set({ capacity: 0 }); // Or maybe total capacity if needed? For now, 0.
          return;
      }
      
      try {
          const supabase = createClient(); // Create client instance
          const { data, error } = await supabase
              .from('facilities') // Assuming Supabase 'facilities' table holds capacity
              .select('capacity')
              .eq('kipu_id', facilityId) // Match based on Kipu's ID stored in your DB
              .single();

          if (error) {
              // Don't set global error, just log and set capacity to 0
              console.error(`Error fetching capacity for facility ${facilityId}:`, error.message);
              set({ capacity: 0 });
          } else {
              console.log(`[FacilityStore] Capacity for facility ${facilityId}:`, data?.capacity ?? 0);
              set({ capacity: data?.capacity ?? 0 });
          }
      } catch (error: any) {
          console.error(`Unexpected error fetching capacity for ${facilityId}:`, error.message);
          set({ capacity: 0 });
      }
  },

  // Action triggered by UI (e.g., FacilitySelector) to change the current facility
  changeFacilityWithContext: (facilityId: number) => {
    const currentFacilityId = get().currentFacilityId;

    // Only proceed if the facility ID actually changed
    if (currentFacilityId !== facilityId) {
      console.log(`[FacilityStore] Context changing from facility ${currentFacilityId} to ${facilityId}`);
      
      // 1. Update state and localStorage
      set({ currentFacilityId: facilityId, error: null }); // Clear errors on change
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentFacilityId', String(facilityId));
      }

      // 2. Fetch capacity for the new facility
      get()._fetchAndSetCapacity(facilityId);

      // 3. No need to reset patient list here - the hook will handle that
      // Important: We don't access the patientStore directly to avoid circular dependencies
      // The useFetchPatientsOnFacilityChange hook observes currentFacilityId changes
    }
  },
  
  // Helper to get the full facility object for the current ID
  getCurrentFacility: (): Facility | undefined => {
    const { facilities, currentFacilityId } = get();
    // Handle "All Facilities" case explicitly if needed, otherwise return undefined
    if (currentFacilityId === 0) {
        // Return a placeholder or specific object if your UI needs it for "All"
        return { id: 0, name: 'All Facilities', enabled: true /*, other defaults */ }; 
    }
    // Find the facility by ID (ensure type comparison is safe)
    return facilities.find(f => Number(f.id) === Number(currentFacilityId));
  },

  // Simple setters for state slices (if needed externally, often not required)
  // setDocuments: (facilities: Facility[]) => set({ facilities }), // Use fetchFacilities instead
  // setPagination: (pagination: Pagination | null) => set({ pagination }), // If needed
  // setLoading: (isLoading: boolean) => set({ isLoading }), // Handled by fetchFacilities
  // setError: (error: string | null) => set({ error }), // Handled by fetchFacilities
}));

// Standard export of the hook for use in components
// No alias needed