// In a new file: lib/react-query/config.ts
import { QueryClient } from '@tanstack/react-query';

/**
 * Global React Query client configuration
 * 
 * - staleTime: How long data remains fresh (in ms)
 * - gcTime: How long inactive data remains in cache (in ms)
 * - refetchOnWindowFocus: Whether to refetch when window regains focus
 * - retry: Number of retry attempts for failed queries
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
      refetchOnMount: true
    }
  }
});

/**
 * Query key factory to ensure consistent key structure across the application
 */
export const queryKeys = {
  facilities: {
    all: () => ['facilities'],
    list: (page?: number, limit?: number, status?: string, sort?: string) => 
      ['facilities', 'list', { page, limit, status, sort }],
    detail: (facilityId: number) => ['facilities', 'detail', facilityId]
  },
  patients: {
    all: () => ['patients'],
    list: (facilityId: number) => ['patients', 'list', facilityId],
    detail: (facilityId: number, patientId: string) => ['patients', 'detail', facilityId, patientId],
    evaluations: (facilityId: number, patientId: string) => 
      ['patients', 'evaluations', facilityId, patientId],
    vitalSigns: (facilityId: number, patientId: string) => 
      ['patients', 'vitalSigns', facilityId, patientId],
    appointments: (facilityId: number, patientId: string) => 
      ['patients', 'appointments', facilityId, patientId]
  },
  documents: {
    all: () => ['documents'],
    list: (facilityId?: string) => ['documents', 'list', facilityId],
    detail: (documentId: string) => ['documents', 'detail', documentId]
  },
  userDocuments: {
    all: () => ['userDocuments'],
    list: (facilityId?: string, patientId?: string, documentType?: string) => 
      ['userDocuments', 'list', { facilityId, patientId, documentType }],
    detail: (documentId: string) => ['userDocuments', 'detail', documentId]
  },
  dashboard: {
    metrics: (facilityId: number) => ['dashboard', 'metrics', facilityId],
    patientStats: (facilityId: number) => ['dashboard', 'patientStats', facilityId],
    documentInsights: (facilityId: number) => ['dashboard', 'documentInsights', facilityId]
  }
};