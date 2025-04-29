'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '~/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useFacilityStore } from '~/store/patient/facilityStore';
import { UserDocument, DocumentCategorization } from 'types/userDocument';
import { queryKeys } from '~/utils/react-query/config';

// Initialize Supabase client
const supabase = createClient();

/**
 * Hook for managing user documents with React Query
 */
export function useUserDocuments(options?: {
  facilityId?: string;
  patientId?: string;
  documentType?: string;
  includeDeleted?: boolean;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { currentFacilityId } = useFacilityStore();
  const [facilityUuid, setFacilityUuid] = useState<string | null>(options?.facilityId || null);
  const [isLoadingFacility, setIsLoadingFacility] = useState<boolean>(false);

  // Fetch facility UUID when currentFacilityId changes
  useEffect(() => {
    if (currentFacilityId && !facilityUuid) {
      setIsLoadingFacility(true);
      const fetchFacilityUuid = async () => {
        try {
          const { data, error } = await supabase
            .from('facilities')
            .select('id')
            .eq('kipu_id', currentFacilityId)
            .single();
            
          if (error) {
            console.error('Error fetching facility UUID:', error);
            setIsLoadingFacility(false);
            return;
          }
          
          setFacilityUuid(data.id);
        } catch (error) {
          console.error('Error in fetchFacilityUuid:', error);
        } finally {
          setIsLoadingFacility(false);
        }
      };
      
      fetchFacilityUuid();
    }
  }, [currentFacilityId, facilityUuid]);

  // Fetch document by ID
  const fetchDocumentById = async (documentId: string): Promise<UserDocument | null> => {
    try {
      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('document_id', documentId)
        .single();
      
      if (error) throw error;
      return data as UserDocument;
    } catch (err) {
      console.error('Error fetching document by ID:', err);
      return null;
    }
  };

  // Query for fetching user documents
  const { data: documents = [], isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.userDocuments.list(facilityUuid || undefined, options?.patientId, options?.documentType),
    queryFn: async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        // Build query
        let query = supabase
          .from('user_documents')
          .select('*')
          .eq('account_id', user.id)
          .order('created_at', { ascending: false });
        
        // Apply filters
        if (facilityUuid) {
          query = query.eq('facility_id', facilityUuid);
        }
        
        if (options?.patientId) {
          query = query.eq('patient_id', options.patientId);
        }
        
        if (options?.documentType) {
          query = query.eq('document_type', options.documentType);
        }
        
        if (!options?.includeDeleted) {
          query = query.eq('is_deleted', false);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as UserDocument[];
      } catch (err) {
        console.error('Error fetching documents:', err);
        return [];
      }
    },
    enabled: true,
  });

  // Mutation for uploading documents
  const uploadMutation = useMutation({
    mutationFn: async ({ 
      file, 
      categorization 
    }: { 
      file: File, 
      categorization?: DocumentCategorization 
    }): Promise<UserDocument | null> => {
      try {
        console.log('[useUserDocuments:uploadMutation] Starting upload for file:', file.name);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const userId = user.id;
        
        // Generate a unique file path
        const timestamp = new Date().getTime();
        const file_name = `${timestamp}_${file.name}`;
        
        // Use the user's UUID for the file path for RLS compliance
        const filePath = `${userId}/${file_name}`;

        // Upload file to Supabase storage
        const { data: fileData, error: uploadError } = await supabase.storage
          .from('user-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        
        // Create document record in database
        const { data: documentData, error: documentError } = await supabase
          .from('user_documents')
          .insert([
            {
              file_path: filePath,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              account_id: userId,
              facility_id: facilityUuid || '',
              patient_id: categorization?.patient_id,
              document_type: categorization?.document_type || 'document_page_upload',
              compliance_concern: categorization?.compliance_concern,
              tags: categorization?.tags || [],
              // Remove notes property that doesn't exist on DocumentCategorization
              // Add metadata fields
              metadata: {
                uploaded_at: new Date().toISOString(),
                original_filename: file.name
              },
              is_processed: true, // Mark as processed since we're skipping the processing step
              is_deleted: false
            }
          ])
          .select()
          .single();
        
        if (documentError) throw documentError;
        
        console.log('[useUserDocuments:uploadMutation] Document uploaded successfully:', documentData);
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: [queryKeys.userDocuments] });
        
        return documentData as UserDocument;
      } catch (err) {
        console.error('Error uploading document:', err);
        throw err;
      }
    }
  });

  // Update document categorization mutation
  const updateCategorizationMutation = useMutation({
    mutationFn: async ({ 
      documentId, 
      categorization 
    }: { 
      documentId: string; 
      categorization: DocumentCategorization 
    }): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('user_documents')
          .update({
            facility_id: categorization.facility_id,
            patient_id: categorization.patient_id,
            document_type: categorization.document_type,
            compliance_concern: categorization.compliance_concern,
            tags: categorization.tags || [],
            // Remove notes property that doesn't exist on DocumentCategorization
            updated_at: new Date().toISOString()
          })
          .eq('document_id', documentId);
        
        if (error) throw error;
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: [queryKeys.userDocuments] });
        
        return true;
      } catch (err) {
        console.error('Error updating document categorization:', err);
        throw err;
      }
    }
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string): Promise<boolean> => {
      try {
        // Soft delete - just mark as deleted
        const { error } = await supabase
          .from('user_documents')
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
          })
          .eq('document_id', documentId);
        
        if (error) throw error;

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: [queryKeys.userDocuments] });
        
        return true;
      } catch (err) {
        console.error('Error deleting document:', err);
        throw err;
      }
    }
  });

  // Function to get a signed URL for a document
  const getDocumentUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('user-documents')
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
      
      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  };

  // Simplified function to upload a document - no separate processing step
  const uploadAndProcessDocument = async (
    file: File, 
    categorization?: DocumentCategorization
  ): Promise<UserDocument | null> => {
    try {
      console.log('[useUserDocuments:uploadAndProcessDocument] Starting with file:', file.name);
      
      // Upload the document - this now handles both storage and database indexing
      const document = await uploadMutation.mutateAsync({ file, categorization });
      
      if (!document) {
        console.error('[useUserDocuments:uploadAndProcessDocument] Upload failed: No document returned');
        throw new Error('Failed to upload document');
      }
      
      console.log('[useUserDocuments:uploadAndProcessDocument] Upload successful, document:', document);
      return document;
    } catch (err) {
      console.error('Error in uploadAndProcessDocument:', err);
      throw err;
    }
  };

  return {
    documents,
    isLoading: isLoading || uploadMutation.isPending || updateCategorizationMutation.isPending || isLoadingFacility,
    error: error as Error | null,
    refetch,
    
    fetchDocumentById,
    uploadDocument: (file: File, categorization?: DocumentCategorization) => 
      uploadMutation.mutateAsync({ file, categorization }),
    uploadAndProcessDocument,
    updateDocumentCategorization: (documentId: string, categorization: DocumentCategorization) => 
      updateCategorizationMutation.mutateAsync({ documentId, categorization }),
    deleteDocument: (documentId: string) => 
      deleteMutation.mutateAsync(documentId),
    getDocumentUrl
  };
}
