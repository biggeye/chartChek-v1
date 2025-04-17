'use client';

import { initUserDocumentStoreSubscriptions } from '~/store/doc/userDocumentStore';
// Import the patient store subscriptions if the file exists and is working
// import { initPatientStoreSubscriptions } from './patientStore';

// This function initializes all cross-store subscriptions
// It should be called in a client component after all stores are loaded
export function initializeStoreSubscriptions() {
  // Initialize document store subscriptions to facility changes
   // Initialize user document store subscriptions
  const unsubscribeUserDocumentStore = initUserDocumentStoreSubscriptions();
  
  // Initialize patient store subscriptions if the function exists
  // const unsubscribePatientStore = initPatientStoreSubscriptions();

  // Return cleanup function
  return () => {
    // Clean up subscriptions when needed

    unsubscribeUserDocumentStore();
    // unsubscribePatientStore();
  };
}

// Helper function to initialize facility-related data
export async function initializeFacilityData() {
  if (typeof window !== 'undefined') {
    // Dynamically import to avoid circular dependencies
    const { useFacilityStore } = await import('./patient/facilityStore');
    
    // Fetch facilities if not already loaded
    const { facilities, fetchFacilities } = useFacilityStore.getState();
    
    if (!facilities || facilities.length === 0) {
      await fetchFacilities();
    }
  }
}