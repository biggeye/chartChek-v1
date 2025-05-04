import { useCallback, useEffect, useMemo } from 'react';
import { useProgramHistoryStore } from '~/store/patient/programHistoryStore';
import { fetchProgramHistory } from '~/lib/services/programHistoryService';
import { KipuProgramHistory } from '~/lib/kipu/service/medical-records-service';
import { isValid, parseISO } from 'date-fns';

// Safe date comparison helper
const compareDates = (dateA: string | undefined, dateB: string | undefined, sortOrder: 'asc' | 'desc'): number => {
  // Handle undefined dates
  if (!dateA && !dateB) return 0;
  if (!dateA) return sortOrder === 'desc' ? 1 : -1;
  if (!dateB) return sortOrder === 'desc' ? -1 : 1;

  // Parse dates
  const parsedA = parseISO(dateA);
  const parsedB = parseISO(dateB);

  // Handle invalid dates
  if (!isValid(parsedA) && !isValid(parsedB)) return 0;
  if (!isValid(parsedA)) return sortOrder === 'desc' ? 1 : -1;
  if (!isValid(parsedB)) return sortOrder === 'desc' ? -1 : 1;

  // Compare valid dates
  const comparison = parsedB.getTime() - parsedA.getTime();
  return sortOrder === 'desc' ? comparison : -comparison;
};

export function useProgramHistory(patientId: string) {
  // Store selectors
  const programs = useProgramHistoryStore(state => state.programs);
  const total = useProgramHistoryStore(state => state.total);
  const isLoading = useProgramHistoryStore(state => state.isLoading);
  const error = useProgramHistoryStore(state => state.error);
  const sortField = useProgramHistoryStore(state => state.sortField);
  const sortOrder = useProgramHistoryStore(state => state.sortOrder);
  const statusFilter = useProgramHistoryStore(state => state.statusFilter);

  // Store actions
  const setPrograms = useProgramHistoryStore(state => state.setPrograms);
  const setIsLoading = useProgramHistoryStore(state => state.setIsLoading);
  const setError = useProgramHistoryStore(state => state.setError);
  const setSortField = useProgramHistoryStore(state => state.setSortField);
  const setSortOrder = useProgramHistoryStore(state => state.setSortOrder);
  const setStatusFilter = useProgramHistoryStore(state => state.setStatusFilter);
  const reset = useProgramHistoryStore(state => state.reset);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!patientId) return;

    setIsLoading(true);
    setError(null);

    console.group('Program History Hook - Fetch Data');
    console.log('Fetching data for patient:', patientId);

    try {
      const response = await fetchProgramHistory(patientId);
      
      console.log('API Response:', response);
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch program history');
      }

      setPrograms(response.data.programs, response.data.total);
      console.log('Programs set in store:', response.data.programs);
      console.log('Total programs:', response.data.total);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while fetching program history';
      console.error('Error in fetchData:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  }, [patientId, setPrograms, setIsLoading, setError]);

  // Filter and sort programs
  const filteredAndSortedPrograms = useMemo(() => {
    console.group('Program History Hook - Filter and Sort');
    console.log('Original programs:', programs);
    console.log('Current status filter:', statusFilter);
    console.log('Current sort field:', sortField);
    console.log('Current sort order:', sortOrder);

    let filtered = [...programs];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(program => program.status === statusFilter);
      console.log('After status filter:', filtered);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortField === 'startDate') {
        return compareDates(a.startDate, b.startDate, sortOrder);
      }
      if (sortField === 'program') {
        return sortOrder === 'desc'
          ? b.program.localeCompare(a.program)
          : a.program.localeCompare(b.program);
      }
      return sortOrder === 'desc'
        ? b.status.localeCompare(a.status)
        : a.status.localeCompare(b.status);
    });
    
    console.log('After sorting:', filtered);
    console.groupEnd();
    return filtered;
  }, [programs, statusFilter, sortField, sortOrder]);

  // Initial fetch
  useEffect(() => {
    fetchData();
    
    // Cleanup
    return () => {
      reset();
    };
  }, [fetchData, reset]);

  // Toggle sort
  const toggleSort = useCallback((field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  }, [sortField, sortOrder, setSortField, setSortOrder]);

  return {
    programs: filteredAndSortedPrograms,
    total,
    isLoading,
    error,
    sortField,
    sortOrder,
    statusFilter,
    toggleSort,
    setSortField,
    setSortOrder,
    setStatusFilter,
    refetch: fetchData
  };
} 