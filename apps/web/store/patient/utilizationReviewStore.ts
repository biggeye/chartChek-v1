import { create } from 'zustand';
import { UtilizationReview } from '../../lib/kipu/service/utilization-review-service';

export interface UtilizationReviewState {
  // Data
  reviews: UtilizationReview[];
  selectedReview: UtilizationReview | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions
  setReviews: (reviews: UtilizationReview[]) => void;
  selectReview: (review: UtilizationReview | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  reviews: [],
  selectedReview: null,
  isLoading: false,
  error: null,
};

export const useUtilizationReviewStore = create<UtilizationReviewState>((set) => ({
  ...initialState,

  // Actions
  setReviews: (reviews) => set({ reviews }),
  selectReview: (review) => set({ selectedReview: review }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
})); 