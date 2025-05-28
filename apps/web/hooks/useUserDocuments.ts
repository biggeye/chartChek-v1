'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  uploadUserDocument,
  fetchUserDocuments,
  deleteUserDocument,
  chunkUserDocument,
  fetchUserChunks,
  deleteUserChunks,
} from '~/lib/services/userDocumentService';
import { createClient } from '~/utils/supabase/client';
import { UserDocument, DocumentUploadMetadata } from '~/types/store/doc/userDocument';
import * as userDocumentService from '~/lib/services/userDocumentService';

export function useUserDocuments() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isChunking, setIsChunking] = useState(false);
  const [chunkProgress, setChunkProgress] = useState<number | null>(null);

  // Get and maintain user ID
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const documentsQuery = useQuery({
    queryKey: ['user-documents', userId],
    queryFn: () => userDocumentService.fetchUserDocuments(userId!),
    enabled: !!userId
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, metadata }: { file: File; metadata: DocumentUploadMetadata }) => {
      if (!userId) throw new Error('No user ID available');
      return userDocumentService.uploadUserDocument({ file, accountId: userId, metadata });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents', userId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => userDocumentService.deleteUserDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents', userId] });
    }
  });

  const chunkMutation = useMutation({
    mutationFn: ({ documentId, chunkSize, chunkOverlap }: {
      documentId: string;
      chunkSize: number;
      chunkOverlap: number;
    }) => userDocumentService.chunkUserDocument({ documentId, chunkSize, chunkOverlap })
  });

  // Fetch all user documents for the current user
  const {
    data: documents = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-documents', userId],
    queryFn: () => userId ? fetchUserDocuments(userId) : [],
    enabled: !!userId,
  });

  // Fetch chunks for a document
  const getChunks = (documentId: string) => {
    return useQuery({
      queryKey: ['user-chunks', documentId],
      queryFn: () => fetchUserChunks(documentId),
      enabled: !!documentId,
    });
  };

  // Delete all chunks for a document
  const deleteChunksMutation = useMutation({
    mutationFn: deleteUserChunks,
    onSuccess: (_data, documentId) => queryClient.invalidateQueries({ queryKey: ['user-chunks', documentId] }),
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

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    isError: documentsQuery.isError,
    error: documentsQuery.error,
    uploadDocument: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    deleteDocument: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
    chunkDocument: chunkMutation.mutateAsync,
    isChunking: chunkMutation.isPending,
    chunkError: chunkMutation.error,
    refetch,
    getChunks,
    deleteUserChunks: deleteChunksMutation.mutateAsync,
    getDocumentUrl,
  };
}
