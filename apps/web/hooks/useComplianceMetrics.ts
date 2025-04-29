'use client'

import { useState, useEffect } from 'react';
import { ComplianceMetricsResponse, ComplianceMetricsQueryParams } from '~/types/database';

export function useComplianceMetrics(queryParams?: ComplianceMetricsQueryParams) {
  const [data, setData] = useState<ComplianceMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build query string from params
        const queryString = new URLSearchParams();
        if (queryParams?.startDate) queryString.append('startDate', queryParams.startDate);
        if (queryParams?.endDate) queryString.append('endDate', queryParams.endDate);
        if (queryParams?.protocolId) queryString.append('protocolId', queryParams.protocolId);
        if (queryParams?.patientId) queryString.append('patientId', queryParams.patientId);
        if (queryParams?.status) queryString.append('status', queryParams.status);

        const response = await fetch(`/api/compliance/metrics?${queryString.toString()}`);
        const result: ComplianceMetricsResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch compliance metrics');
        }

        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [queryParams]);

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      setData(null);
      setIsLoading(true);
      setError(null);
    }
  };
} 