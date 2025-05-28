// lib/kipu/stats/statisticsService.ts

import { KipuCredentials } from 'types/kipu/kipuAdapter';
import { DateRange } from './types';
import { getTreatmentStatistics } from './treatmentStatistics';
import { getOutcomeStatistics } from './outcomeStatistics';
import { getOperationalStatistics } from './operationalStatistics';

/**
 * Gets all statistics for a facility
 */
export async function getFacilityStatistics(
  credentials: KipuCredentials,
  facilityId: string,
  dateRange: DateRange
) {
  try {
    // Fetch all statistics in parallel
    const [treatmentStats, outcomeStats, operationalStats] = await Promise.all([
      getTreatmentStatistics(credentials, facilityId, dateRange),
      getOutcomeStatistics(credentials, facilityId, dateRange),
      getOperationalStatistics(credentials, facilityId, dateRange)
    ]);

    return {
      treatment: treatmentStats,
      outcomes: outcomeStats,
      operational: operationalStats
    };
  } catch (error) {
    console.error('Error fetching facility statistics:', error);
    throw error;
  }
}

/**
 * Helper function to generate date ranges for different time periods
 */
export function generateDateRanges(): DateRange {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    daily: {
      start: startOfDay.toISOString(),
      end: now.toISOString()
    },
    weekly: {
      start: startOfWeek.toISOString(),
      end: now.toISOString()
    },
    monthly: {
      start: startOfMonth.toISOString(),
      end: now.toISOString()
    }
  };
}

// Export individual statistics functions for granular access
export {
  getTreatmentStatistics,
  getOutcomeStatistics,
  getOperationalStatistics
};