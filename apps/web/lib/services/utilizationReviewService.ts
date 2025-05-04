import { UtilizationReview } from '../kipu/service/utilization-review-service';
import type { KipuApiResponse } from '../kipu/service/patient-service';

export class UtilizationReviewService {
  static async listUtilizationReviews(patientId: string): Promise<KipuApiResponse<UtilizationReview[]>> {
    console.log('UtilizationReviewService - Fetching reviews for patientId:', patientId);
    
    try {
      const response = await fetch(`/api/kipu/patients/${patientId}/ur`);
      console.log('UtilizationReviewService - Raw response:', response);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('UtilizationReviewService - Error response:', error);
        throw new Error(error.message || 'Failed to fetch utilization reviews');
      }

      const data = await response.json();
      console.log('UtilizationReviewService - Parsed response data:', data);
      return data;
    } catch (error) {
      console.error('UtilizationReviewService - Caught error:', error);
      throw error;
    }
  }

  // Add other methods as needed:
  // - deleteUtilizationReview
} 