'use client';

import { create } from 'zustand';
import { createClient } from '~/utils/supabase/client';
import { Facility, FacilityStore, Pagination } from 'types/store/patient/facility';
import { queryKeys } from '~/utils/react-query/config';
import { usePatientStore } from './patientStore';
import { useFetchPatients } from '~/hooks/usePatients';

// Initialize Supabase client
const supabase = await createClient();

// Create facility store with Zustand
export const useFacilityStore = create<FacilityStore>((set, get) => ({
  // Initial state
  facilities: [],
  currentFacilityId: typeof window !== 'undefined' 
    ? Number(localStorage.getItem('currentFacilityId')) || 0 
    : 0,
  capacity: 0,
  pagination: null,
  isLoading: false,
  error: null,

  // Set facilities
  setDocuments: (facilities: Facility[]) => set({ facilities }),

  // Set current facility ID
  setCurrentFacilityId: async (facilityId: number) => {
    if (facilityId !== get().currentFacilityId) {
      set({ currentFacilityId: facilityId });
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentFacilityId', String(facilityId));
      }
      // Fetch capacity from Supabase
      const { data, error } = await supabase
        .from('facilities')
        .select('capacity')
        .eq('id', facilityId)
        .single();
      if (error) {
        console.error('Error fetching facility capacity:', error);
        set({ capacity: 0 });
      } else {
        set({ capacity: data?.capacity ?? 0 });
      }
    }
  },

  // In facilityStore.ts, update the changeFacilityWithContext function:
  changeFacilityWithContext: (facilityId: number) => {
    const currentFacilityId = get().currentFacilityId;
  
    // Only proceed if facility actually changed
    if (currentFacilityId !== facilityId) {
      // Store the facilityId as a number in state
      set({ currentFacilityId: facilityId });
      
      // Also update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentFacilityId', String(facilityId));
      }
      
      // Get the patient store and update it
      const patientStore = usePatientStore.getState();
      
      // Reset patient data for the new facility
      patientStore.setPatients([]);
      patientStore.setIsLoadingPatients(true);
      
      // The actual patient fetching will be handled by the useFetchPatients hook
      // in the components that need it
      patientStore.setIsLoadingPatients(false);
    }
  },

  // Set pagination
  setPagination: (pagination: Pagination | null) => set({ pagination }),

  // Set loading state
  setLoading: (isLoading: boolean) => set({ isLoading }),

  // Set error state
  setError: (error: string | null) => set({ error }),

  // Get current facility
  getCurrentFacility: () => {
    const { facilities, currentFacilityId } = get();
    return facilities.find(f => f.id === currentFacilityId);
  },

  // In store/facilityStore.ts
  fetchFacilities: async (page = 1, limit = 20) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/kipu/facilities`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.warn('No facilities found or KIPU not configured');
        return { facilities: [], pagination: null };
      }

      const data = await response.json();
      
      // Extract facilities from the nested structure
      const rawFacilities = data?.data?.data?.locations || [];
      
      // Transform facilities to match expected format
      // Ensure location_id is treated as a number
      const facilities = rawFacilities.map((facility: any) => ({
        id: Number(facility.location_id),
        name: facility.location_name,
        enabled: facility.enabled
      }));
      
      // Update store with transformed facilities
      set({ 
        facilities: facilities, 
        pagination: null,
        isLoading: false 
      });
      
      // Restore selected facility or select first one if none is selected
      if (!get().currentFacilityId && facilities.length > 0) {
        get().setCurrentFacilityId(facilities[0].id);
      }
      
      return { facilities, pagination: null };
    } catch (error) {
      console.error('Error fetching facilities:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch facilities', 
        isLoading: false 
      });
      return null;
    }
  },

  // Invalidate facility cache
  invalidateFacilityCache: async () => {
    try {
      if (typeof window !== 'undefined') {
        const { QueryClient } = await import('@tanstack/react-query');
        const queryClient = new QueryClient();
        
        // Invalidate React Query cache for facilities
        queryClient.invalidateQueries({ queryKey: queryKeys.facilities.all() });
        
        // Call API endpoint to invalidate server-side cache
        await fetch('/api/cache/invalidate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pattern: 'facilities:*'
          }),
        });
      }
    } catch (error) {
      console.error('Error invalidating facility cache:', error);
    }
  }
}));

// Export the store
export const facilityStore = useFacilityStore;