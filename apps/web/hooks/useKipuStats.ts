// hooks/useKipuStatistics.ts
import { useState } from 'react';
import { FacilityStatistics } from '@/lib/kipu/stats/types';

export function useKipuStatistics() {
  const [statistics, setStatistics] = useState<FacilityStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async (facilityId: string, dateRange?: { startDate: string, endDate: string }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      if (dateRange?.startDate) queryParams.set('startDate', dateRange.startDate);
      if (dateRange?.endDate) queryParams.set('endDate', dateRange.endDate);
      
      const response = await fetch(`/api/kipu/statistics/${facilityId}?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      
      const data = await response.json();
      setStatistics(data);
      return data;
    } catch (error: any) {
      setError(error.message || 'An error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { statistics, isLoading, error, fetchStatistics };
}