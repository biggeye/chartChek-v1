import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  uploadKnowledgeDocument,
  fetchKnowledgeDocuments,
  deleteKnowledgeDocument,
  chunkKnowledgeDocument,
  fetchKnowledgeChunks,
  deleteKnowledgeChunks,
} from '~/lib/services/knowledgeDocumentService';

export function useKnowledgeDocuments() {
  const queryClient = useQueryClient();
  const [isChunking, setIsChunking] = useState(false);
  const [chunkProgress, setChunkProgress] = useState<number | null>(null);

  // Fetch all knowledge documents
  const {
    data: documents = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['knowledge-documents'],
    queryFn: fetchKnowledgeDocuments,
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: uploadKnowledgeDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] }),
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: deleteKnowledgeDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] }),
  });

  // Chunk document mutation
  const chunkMutation = useMutation({
    mutationFn: async ({ documentId, chunkSize, chunkOverlap }: { documentId: string; chunkSize: number; chunkOverlap: number }) => {
      setIsChunking(true);
      setChunkProgress(null);
      const result = await chunkKnowledgeDocument({ documentId, chunkSize, chunkOverlap });
      setIsChunking(false);
      setChunkProgress(100);
      queryClient.invalidateQueries({ queryKey: ['knowledge-chunks', documentId] });
      return result;
    },
  });

  // Fetch chunks for a document
  const getChunks = (documentId: string) => {
    return useQuery({
      queryKey: ['knowledge-chunks', documentId],
      queryFn: () => fetchKnowledgeChunks(documentId),
      enabled: !!documentId,
    });
  };

  // Delete all chunks for a document
  const deleteChunksMutation = useMutation({
    mutationFn: deleteKnowledgeChunks,
    onSuccess: (_data, documentId) => queryClient.invalidateQueries({ queryKey: ['knowledge-chunks', documentId] }),
  });

  return {
    documents,
    isLoading,
    error,
    refetch,
    uploadKnowledgeDocument: uploadMutation.mutateAsync,
    deleteKnowledgeDocument: deleteMutation.mutateAsync,
    chunkKnowledgeDocument: chunkMutation.mutateAsync,
    isChunking,
    chunkProgress,
    getChunks,
    deleteKnowledgeChunks: deleteChunksMutation.mutateAsync,
  };
} 