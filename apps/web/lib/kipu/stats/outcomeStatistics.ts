// lib/kipu/stats/outcomeStatistics.ts
import { KipuCredentials } from 'types/kipu/kipuAdapter';
import { 
  KipuApiResponse,
  KipuTreatment,
  TreatmentStatus,
  DateRange
} from './types';
import { kipuServerGet } from '../auth/server';

/**
 * Fetches outcome data from KIPU API
 */
async function fetchOutcomeData(
  credentials: KipuCredentials,
  facilityId: string,
  startDate: string,
  endDate: string
): Promise<KipuApiResponse<KipuTreatment[]> | null> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      location_id: facilityId,
      start_date: startDate,
      end_date: endDate,
      include_outcomes: 'true'
    }).toString();
    
    const endpoint = `/api/treatments?${queryParams}`;
    const response = await kipuServerGet(endpoint, credentials);
    return response as KipuApiResponse<KipuTreatment[]>;
  } catch (error) {
    console.error('Error fetching outcome data:', error);
    return null;
  }
}

/**
 * Calculates completion rate
 */
function calculateCompletionRate(treatments: KipuTreatment[]): number {
  if (treatments.length === 0) return 0;
  
  const completedCount = treatments.filter(t => 
    t.status === TreatmentStatus.Completed
  ).length;
  
  return (completedCount / treatments.length) * 100;
}

/**
 * Calculates early discharge rate
 */
function calculateEarlyDischargeRate(treatments: KipuTreatment[]): number {
  if (treatments.length === 0) return 0;
  
  const earlyDischargeCount = treatments.filter(t => 
    t.status === TreatmentStatus.DischargedEarly
  ).length;
  
  return (earlyDischargeCount / treatments.length) * 100;
}

/**
 * Gets outcome statistics for a facility
 */
export async function getOutcomeStatistics(
  credentials: KipuCredentials,
  facilityId: string,
  dateRange: DateRange
) {
  try {
    // Fetch outcome data for each time period
    const [dailyData, weeklyData, monthlyData] = await Promise.all([
      fetchOutcomeData(credentials, facilityId, dateRange.daily.start, dateRange.daily.end),
      fetchOutcomeData(credentials, facilityId, dateRange.weekly.start, dateRange.weekly.end),
      fetchOutcomeData(credentials, facilityId, dateRange.monthly.start, dateRange.monthly.end)
    ]);

    if (!dailyData?.data || !weeklyData?.data || !monthlyData?.data) {
      throw new Error('Failed to fetch outcome data');
    }

    return {
      daily: {
        completionRate: calculateCompletionRate(dailyData.data),
        earlyDischargeRate: calculateEarlyDischargeRate(dailyData.data)
      },
      weekly: {
        completionRate: calculateCompletionRate(weeklyData.data),
        earlyDischargeRate: calculateEarlyDischargeRate(weeklyData.data)
      },
      monthly: {
        completionRate: calculateCompletionRate(monthlyData.data),
        earlyDischargeRate: calculateEarlyDischargeRate(monthlyData.data)
      }
    };
  } catch (error) {
    console.error('Error calculating outcome statistics:', error);
    throw error;
  }
}

// Commented out complex metrics that require additional data sources or computation
/*
export async function calculateComplexOutcomeMetrics(
  credentials: KipuCredentials,
  facilityId: string,
  dateRange: DateRange
) {
  // Post-discharge outcomes (requires follow-up data)
  // Quality of life improvements (requires assessment data)
  // Symptom reduction scores (requires clinical assessment data)
  // Long-term recovery rates (requires follow-up data)
  // Relapse prevention effectiveness (requires long-term tracking)
  // Patient-reported outcome measures (requires survey data)
}
*/