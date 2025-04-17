// lib/kipu/stats/statisticsService.ts

import { KipuCredentials } from '~/types/kipu/kipuAdapter';
import { calculatePatientStatistics } from './patientStatistics';
import { calculateOperationalStatistics } from './operationalStatistics';
// import { calculateStaffStatistics } from './staffStatistics';
import { calculateTreatmentStatistics } from './treatmentStatistics';
import { calculateOutcomeStatistics } from './outcomeStatistics';
import { FacilityStatistics, StatisticsFilter } from './types';

/**
 * Service for retrieving and calculating KIPU statistics
 */
export class KipuStatisticsService {
  private credentials: KipuCredentials;

  /**
   * Creates a new instance of the KIPU statistics service
   * @param credentials KIPU API credentials
   */
  constructor(credentials: KipuCredentials) {
    this.credentials = credentials;
  }

  /**
   * Gets all statistics for a facility
   * @param facilityId Facility ID to get statistics for
   * @param filter Optional filter parameters
   * @returns Promise resolving to facility statistics
   */
  async getFacilityStatistics(
    facilityId: string,
    dateRange: any,
    filter?: StatisticsFilter,
 
  ): Promise<FacilityStatistics> {
    try {
      // Validate credentials
    if (!this.credentials.appId || !this.credentials.accessId) {
  throw new Error('Invalid KIPU credentials');
}

      // Fetch all statistics in parallel
      const [
        patientStats,
        operationalStats,
        treatmentStats,
        outcomeStats
      ] = await Promise.all([
        calculatePatientStatistics(this.credentials, facilityId, dateRange),
        calculateOperationalStatistics(this.credentials, facilityId),
     //   calculateStaffStatistics(this.credentials, facilityId),
        calculateTreatmentStatistics(this.credentials, facilityId),
        calculateOutcomeStatistics(this.credentials, facilityId)
      ]);

      // Combine all statistics
      return {
        patient: patientStats,
        operational: operationalStats,
        treatment: treatmentStats,
        outcomes: outcomeStats,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching facility statistics:', error);
      throw error;
    }
  }

  /**
   * Gets patient statistics for a facility
   * @param facilityId Facility ID to get statistics for
   * @param filter Optional filter parameters
   * @returns Promise resolving to patient statistics
   */
  async getPatientStatistics(
    facilityId: string,
    dateRange: any,
    filter?: StatisticsFilter
  ) {
    try {
      return await calculatePatientStatistics(this.credentials, facilityId, dateRange);
    } catch (error) {
      console.error('Error fetching patient statistics:', error);
      throw error;
    }
  }

  /**
   * Gets operational statistics for a facility
   * @param facilityId Facility ID to get statistics for
   * @returns Promise resolving to operational statistics
   */
  async getOperationalStatistics(facilityId: string) {
    try {
      return await calculateOperationalStatistics(this.credentials, facilityId);
    } catch (error) {
      console.error('Error fetching operational statistics:', error);
      throw error;
    }
  }

  /**
   * Gets staff statistics for a facility
   * @param facilityId Facility ID to get statistics for
   * @returns Promise resolving to staff statistics
   */ /*()
  async getStaffStatistics(facilityId: string) {
    try {
      return await calculateStaffStatistics(this.credentials, facilityId);
    } catch (error) {
      console.error('Error fetching staff statistics:', error);
      throw error;
    }
  }

  /**
   * Gets treatment statistics for a facility
   * @param facilityId Facility ID to get statistics for
   * @returns Promise resolving to treatment statistics
   */ 
  async getTreatmentStatistics(facilityId: string) {
    try {
      return await calculateTreatmentStatistics(this.credentials, facilityId);
    } catch (error) {
      console.error('Error fetching treatment statistics:', error);
      throw error;
    }
  }

  /**
   * Gets outcome statistics for a facility
   * @param facilityId Facility ID to get statistics for
   * @returns Promise resolving to outcome statistics
   */
  async getOutcomeStatistics(facilityId: string) {
    try {
      return await calculateOutcomeStatistics(this.credentials, facilityId);
    } catch (error) {
      console.error('Error fetching outcome statistics:', error);
      throw error;
    }
  }
}