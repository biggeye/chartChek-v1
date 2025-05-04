import { useCallback } from 'react';
import { useUtilizationReviewStore } from '../store/patient/utilizationReviewStore';
import { UtilizationReviewService } from '../lib/services/utilizationReviewService';
import type { UtilizationReviewState } from '../store/patient/utilizationReviewStore';

export const useUtilizationReviews = (patientId: string) => {
  // Store selectors
  const reviews = useUtilizationReviewStore((state: UtilizationReviewState) => state.reviews);
  const selectedReview = useUtilizationReviewStore((state: UtilizationReviewState) => state.selectedReview);
  const isLoading = useUtilizationReviewStore((state: UtilizationReviewState) => state.isLoading);
  const error = useUtilizationReviewStore((state: UtilizationReviewState) => state.error);

  // Store actions
  const setReviews = useUtilizationReviewStore((state: UtilizationReviewState) => state.setReviews);
  const selectReview = useUtilizationReviewStore((state: UtilizationReviewState) => state.selectReview);
  const setIsLoading = useUtilizationReviewStore((state: UtilizationReviewState) => state.setIsLoading);
  const setError = useUtilizationReviewStore((state: UtilizationReviewState) => state.setError);
  const reset = useUtilizationReviewStore((state: UtilizationReviewState) => state.reset);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await UtilizationReviewService.listUtilizationReviews(patientId);
      setReviews(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch utilization reviews');
    } finally {
      setIsLoading(false);
    }
  }, [patientId, setReviews, setIsLoading, setError]);

  return {
    // State
    reviews,
    selectedReview,
    isLoading,
    error,

    // Actions
    fetchReviews,
    selectReview,
    reset,
  };
}; 