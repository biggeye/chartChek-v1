'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserDocument, DocumentCategorization } from '~/types/store/doc/userDocument';
import { useFacilityStore } from '../patient/facilityStore';

// Define the user document store state
export interface UserDocumentStoreState {
  // State
  userDocuments: UserDocument[];
  isLoadingUserDocuments: boolean;
  error: string | null;
  
  // State setters
  setUserDocuments: (userDocuments: UserDocument[]) => void;
  setIsLoadingUserDocuments: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Async operations
  fetchUserDocuments: (facilityId?: string) => Promise<UserDocument[]>;
  fetchUserDocumentsForCurrentFacility: () => Promise<UserDocument[]>;
  uploadUserDocument: (file: File, categorization?: DocumentCategorization) => Promise<UserDocument | null>;
  updateUserDocumentCategorization: (documentId: string, categorization: DocumentCategorization) => Promise<boolean>;
  fetchTrainingData: (metadataId: string) => Promise<string>;
}

// Create the user document store with Zustand
export const useUserDocumentStore = create<UserDocumentStoreState>()(
  persist(
    (set, get) => ({
      userDocuments: [],
      isLoadingUserDocuments: false,
      error: null,
      
      // State setters
      setUserDocuments: (userDocuments: UserDocument[]) => set({ userDocuments }),
      setIsLoadingUserDocuments: (isLoading: boolean) => set({ isLoadingUserDocuments: isLoading }),
      setError: (error: string | null) => set({ error }),
      
      // Async operations
      fetchUserDocuments: async (facilityId?: string): Promise<UserDocument[]> => {
        // This is a stub - the actual implementation would use the useUserDocuments hook
        // or a service layer to fetch documents
        set({ isLoadingUserDocuments: true, error: null });
        try {
          // Placeholder for actual API call
          // In a real implementation, this would call a service function
          set({ isLoadingUserDocuments: false });
          return get().userDocuments;
        } catch (error) {
          console.error('Error fetching user documents:', error);
          set({ error: (error as Error).message, isLoadingUserDocuments: false });
          return [];
        }
      },
      
      fetchUserDocumentsForCurrentFacility: async (): Promise<UserDocument[]> => {
        const { currentFacilityId } = useFacilityStore.getState();
        // This would need to convert the numeric facility ID to a UUID
        // For now, we'll just pass it through as a placeholder
        return get().fetchUserDocuments(currentFacilityId?.toString());
      },
      
      uploadUserDocument: async (file: File, categorization?: DocumentCategorization): Promise<UserDocument | null> => {
        // Placeholder for actual upload implementation
        try {
          // In a real implementation, this would call a service function
          return null;
        } catch (error) {
          console.error('Error uploading user document:', error);
          set({ error: (error as Error).message });
          return null;
        }
      },
      
      updateUserDocumentCategorization: async (documentId: string, categorization: DocumentCategorization): Promise<boolean> => {
        // Placeholder for actual categorization update
        try {
          // In a real implementation, this would call a service function
          return true;
        } catch (error) {
          console.error('Error updating user document categorization:', error);
          set({ error: (error as Error).message });
          return false;
        }
      },
      
      fetchTrainingData: async (metadataId: string): Promise<string> => {
        // Placeholder for actual training data fetch
        try {
          // In a real implementation, this would call a service function
          return '';
        } catch (error) {
          console.error('Error fetching training data:', error);
          set({ error: (error as Error).message });
          return '';
        }
      }
    }),
    {
      name: 'userDocumentStore',
      storage: createJSONStorage(() => localStorage)
    }
  )
);

// Export the subscription initialization function
export function initUserDocumentStoreSubscriptions() {
  // Subscribe to facility changes to reload documents when facility changes
  const unsubscribeFacility = useFacilityStore.subscribe(
    (state, prevState) => {
      // Only trigger if the facility ID actually changed
      if (state.currentFacilityId !== prevState.currentFacilityId) {
        // Fetch documents for the new facility
        const { fetchUserDocumentsForCurrentFacility } = useUserDocumentStore.getState();
        fetchUserDocumentsForCurrentFacility();
      }
    }
  );
  
  // Return a function to unsubscribe all subscriptions
  return () => {
    unsubscribeFacility();
  };
}

export default useUserDocumentStore;
